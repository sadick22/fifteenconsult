/**
 * /api/ga4.js
 * Vercel serverless proxy for Google Analytics 4 Data API
 * Uses service account credentials stored as env vars
 */

import { GoogleAuth } from "google-auth-library";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

const PROPERTY_ID = process.env.GA4_PROPERTY_ID; // e.g. "properties/123456789"

async function getClient() {
  const credentials = {
    client_email: process.env.GA4_CLIENT_EMAIL,
    private_key:  process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };

  return new BetaAnalyticsDataClient({
    credentials,
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (!PROPERTY_ID || !process.env.GA4_CLIENT_EMAIL || !process.env.GA4_PRIVATE_KEY) {
    return res.status(500).json({
      error: "GA4 not configured. Add GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, and GA4_PRIVATE_KEY to Vercel environment variables."
    });
  }

  try {
    const client = await getClient();

    // Run multiple reports in parallel
    const [sessionsRes, pagesRes, sourcesRes] = await Promise.all([
      // Sessions + users (last 30 days)
      client.runReport({
        property: PROPERTY_ID,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [
          { name: "sessions" },
          { name: "activeUsers" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
        ],
      }),

      // Top pages (last 30 days)
      client.runReport({
        property: PROPERTY_ID,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 5,
      }),

      // Traffic sources (last 30 days)
      client.runReport({
        property: PROPERTY_ID,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 5,
      }),
    ]);

    // Parse sessions report
    const sessionRow = sessionsRes[0]?.rows?.[0];
    const sessions  = parseInt(sessionRow?.metricValues?.[0]?.value || "0");
    const users     = parseInt(sessionRow?.metricValues?.[1]?.value || "0");
    const bounceRate = parseFloat(sessionRow?.metricValues?.[2]?.value || "0");
    const avgDuration = parseFloat(sessionRow?.metricValues?.[3]?.value || "0");

    // Parse top pages
    const topPages = (pagesRes[0]?.rows || []).map(row => ({
      path:  row.dimensionValues?.[0]?.value || "/",
      views: parseInt(row.metricValues?.[0]?.value || "0"),
    }));

    // Parse traffic sources
    const sources = (sourcesRes[0]?.rows || []).map(row => ({
      channel:  row.dimensionValues?.[0]?.value || "Unknown",
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
    }));

    return res.status(200).json({
      sessions,
      users,
      bounceRate:   `${(bounceRate * 100).toFixed(1)}%`,
      avgDuration:  `${Math.floor(avgDuration / 60)}m ${Math.floor(avgDuration % 60)}s`,
      topPages,
      sources,
    });

  } catch (err) {
    console.error("GA4 API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
