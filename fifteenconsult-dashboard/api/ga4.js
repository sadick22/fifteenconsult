/**
 * /api/ga4.js
 * GA4 Data API proxy using Google service account JWT auth
 * No external npm packages needed — uses fetch with manual JWT
 */

import { createSign } from "crypto";

async function getAccessToken() {
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  const privateKey  = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) throw new Error("GA4 credentials not configured");

  const now = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss:   clientEmail,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud:   "https://oauth2.googleapis.com/token",
    exp:   now + 3600,
    iat:   now,
  })).toString("base64url");

  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(privateKey, "base64url");
  const jwt = `${header}.${payload}.${sig}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion:  jwt,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || "Failed to get access token");
  return data.access_token;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId || !process.env.GA4_CLIENT_EMAIL || !process.env.GA4_PRIVATE_KEY) {
    return res.status(500).json({ error: "GA4 not configured. Add GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY to Vercel." });
  }

  try {
    const token = await getAccessToken();
    const BASE  = `https://analyticsdata.googleapis.com/v1beta/${propertyId}`;
    const HEADERS = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const body = {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [
        { name: "sessions" },
        { name: "activeUsers" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
    };

    const [sessRes, pagesRes, srcRes] = await Promise.all([
      fetch(`${BASE}:runReport`, { method:"POST", headers:HEADERS, body:JSON.stringify(body) }),
      fetch(`${BASE}:runReport`, { method:"POST", headers:HEADERS, body:JSON.stringify({
        dateRanges: [{ startDate:"30daysAgo", endDate:"today" }],
        dimensions: [{ name:"pagePath" }],
        metrics: [{ name:"screenPageViews" }],
        orderBys: [{ metric:{ metricName:"screenPageViews" }, desc:true }],
        limit: 5,
      })}),
      fetch(`${BASE}:runReport`, { method:"POST", headers:HEADERS, body:JSON.stringify({
        dateRanges: [{ startDate:"30daysAgo", endDate:"today" }],
        dimensions: [{ name:"sessionDefaultChannelGroup" }],
        metrics: [{ name:"sessions" }],
        orderBys: [{ metric:{ metricName:"sessions" }, desc:true }],
        limit: 5,
      })}),
    ]);

    if (!sessRes.ok) {
      const err = await sessRes.json();
      return res.status(sessRes.status).json({ error: err.error?.message || "GA4 API error" });
    }

    const sess  = await sessRes.json();
    const pages = await pagesRes.json();
    const src   = await srcRes.json();

    const row = sess.rows?.[0];
    const sessions     = parseInt(row?.metricValues?.[0]?.value || "0");
    const users        = parseInt(row?.metricValues?.[1]?.value || "0");
    const bounceRate   = parseFloat(row?.metricValues?.[2]?.value || "0");
    const avgDuration  = parseFloat(row?.metricValues?.[3]?.value || "0");

    return res.status(200).json({
      sessions,
      users,
      bounceRate:  `${(bounceRate * 100).toFixed(1)}%`,
      avgDuration: `${Math.floor(avgDuration / 60)}m ${Math.floor(avgDuration % 60)}s`,
      topPages: (pages.rows || []).map(r => ({
        path:  r.dimensionValues?.[0]?.value,
        views: parseInt(r.metricValues?.[0]?.value || "0"),
      })),
      sources: (src.rows || []).map(r => ({
        channel:  r.dimensionValues?.[0]?.value,
        sessions: parseInt(r.metricValues?.[0]?.value || "0"),
      })),
    });

  } catch (err) {
    console.error("GA4 error:", err);
    return res.status(500).json({ error: err.message });
  }
}
