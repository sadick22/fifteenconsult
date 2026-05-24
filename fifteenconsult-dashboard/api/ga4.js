/**
 * /api/ga4.js
 * GA4 Data API proxy using OAuth refresh token
 * Uses the account owner's credentials — full access to GA4 property
 */

async function getAccessToken() {
  const refreshToken = process.env.GA4_REFRESH_TOKEN;
  
  if (!refreshToken) throw new Error("GA4_REFRESH_TOKEN not configured in Vercel");

  // Use Google's OAuth playground client (public) or your own
  const clientId     = process.env.GA4_CLIENT_ID     || "407408718192.apps.googleusercontent.com";
  const clientSecret = process.env.GA4_CLIENT_SECRET || "GOCSPX-placeholder";

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type:    "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Failed to get access token");
  }
  return data.access_token;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) {
    return res.status(500).json({ error: "GA4_PROPERTY_ID not configured. Should be: properties/538720845" });
  }
  if (!process.env.GA4_REFRESH_TOKEN) {
    return res.status(500).json({ error: "GA4_REFRESH_TOKEN not configured in Vercel environment variables." });
  }

  try {
    const token   = await getAccessToken();
    const BASE    = `https://analyticsdata.googleapis.com/v1beta/${propertyId}`;
    const HEADERS = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const dateRange = { startDate: "30daysAgo", endDate: "today" };

    const [sessRes, pagesRes, srcRes] = await Promise.all([
      fetch(`${BASE}:runReport`, {
        method: "POST", headers: HEADERS,
        body: JSON.stringify({
          dateRanges: [dateRange],
          metrics: [
            { name: "sessions" },
            { name: "activeUsers" },
            { name: "bounceRate" },
            { name: "averageSessionDuration" },
          ],
        }),
      }),
      fetch(`${BASE}:runReport`, {
        method: "POST", headers: HEADERS,
        body: JSON.stringify({
          dateRanges: [dateRange],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 5,
        }),
      }),
      fetch(`${BASE}:runReport`, {
        method: "POST", headers: HEADERS,
        body: JSON.stringify({
          dateRanges: [dateRange],
          dimensions: [{ name: "sessionDefaultChannelGroup" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: 5,
        }),
      }),
    ]);

    if (!sessRes.ok) {
      const err = await sessRes.json();
      return res.status(sessRes.status).json({ error: err.error?.message || "GA4 API error" });
    }

    const sess  = await sessRes.json();
    const pages = await pagesRes.json();
    const src   = await srcRes.json();

    const row         = sess.rows?.[0];
    const sessions    = parseInt(row?.metricValues?.[0]?.value || "0");
    const users       = parseInt(row?.metricValues?.[1]?.value || "0");
    const bounceRate  = parseFloat(row?.metricValues?.[2]?.value || "0");
    const avgDuration = parseFloat(row?.metricValues?.[3]?.value || "0");

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
