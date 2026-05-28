/**
 * /api/hotjar.js
 * Hotjar API proxy — heatmaps and session recordings
 * Requires: HOTJAR_API_KEY, HOTJAR_SITE_ID
 * 
 * Setup:
 * 1. Go to hotjar.com → Sign up free → Add site: fifteenconsult.com
 * 2. Copy tracking code → add to Webflow Custom Code → Head
 * 3. Go to Account → API → Generate Personal API Key
 * 4. Add HOTJAR_API_KEY and HOTJAR_SITE_ID to Vercel
 * 
 * Free tier: 35 daily sessions, heatmaps, recordings
 */

const BASE = "https://api.hotjar.com/v1";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const apiKey = process.env.HOTJAR_API_KEY;
  const siteId = process.env.HOTJAR_SITE_ID;

  if (!apiKey || !siteId) {
    return res.status(200).json({
      configured: false,
      setup: "Go to hotjar.com → Free account → Add fifteenconsult.com → Account → API → Generate key. Add HOTJAR_API_KEY and HOTJAR_SITE_ID to Vercel.",
      hotjarDashboard: "https://insights.hotjar.com",
    });
  }

  try {
    const HEADERS = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

    // Get site stats
    const r = await fetch(`${BASE}/sites/${siteId}`, { headers: HEADERS });

    if (!r.ok) {
      const err = await r.json();
      return res.status(200).json({ error: err.message || "Hotjar API error", configured: true });
    }

    const site = await r.json();

    return res.status(200).json({
      configured: true,
      siteName:   site.name || "fifteenconsult.com",
      status:     site.status || "active",
      hotjarDashboard: `https://insights.hotjar.com/sites/${siteId}/dashboard`,
      note: "Visit Hotjar dashboard for heatmaps, recordings, and funnel analysis. Screenshot and share with Zara for analysis.",
    });

  } catch (err) {
    return res.status(500).json({ error: err.message, configured: true });
  }
}
