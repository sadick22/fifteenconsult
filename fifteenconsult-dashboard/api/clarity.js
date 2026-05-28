/**
 * /api/clarity.js
 * Microsoft Clarity API proxy — free behavioral analytics
 * Requires: CLARITY_API_TOKEN, CLARITY_PROJECT_ID
 * 
 * Setup (5 minutes):
 * 1. Go to clarity.microsoft.com → Sign in → New project
 * 2. Name: "FifteenConsult" → Website: fifteenconsult.com
 * 3. Copy the tracking code → add to Webflow site settings → Custom Code → Head
 * 4. Go to Settings → API → Generate token
 * 5. Add CLARITY_API_TOKEN and CLARITY_PROJECT_ID to Vercel
 */

const BASE = "https://www.clarity.ms/api/v1";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const token     = process.env.CLARITY_API_TOKEN;
  const projectId = process.env.CLARITY_PROJECT_ID;

  if (!token || !projectId) {
    return res.status(200).json({
      configured: false,
      setup: "Go to clarity.microsoft.com → New project → fifteenconsult.com → Settings → API → Generate token. Add CLARITY_API_TOKEN and CLARITY_PROJECT_ID to Vercel.",
      clarityDashboard: "https://clarity.microsoft.com",
    });
  }

  try {
    const endDate   = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 30 * 86400 * 1000).toISOString().split("T")[0];

    const r = await fetch(`${BASE}/projects/${projectId}/traffic?startDate=${startDate}&endDate=${endDate}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!r.ok) {
      const err = await r.json();
      return res.status(200).json({ error: err.message || "Clarity API error", configured: true });
    }

    const data = await r.json();

    return res.status(200).json({
      configured: true,
      period: `${startDate} to ${endDate}`,
      sessions:       data.totalSessions || 0,
      pagesPerSession: data.pagesPerSession?.toFixed(1) || "—",
      avgScrollDepth: data.avgScrollDepth ? `${Math.round(data.avgScrollDepth * 100)}%` : "—",
      engagedSessions: data.engagedSessions || 0,
      rageClicks:     data.rageClicks || 0,
      deadClicks:     data.deadClicks || 0,
      quickBacks:     data.quickBacks || 0,
      topPages: (data.topPages || []).slice(0, 5).map(p => ({
        page:     p.url?.replace("https://fifteenconsult.com", "") || "/",
        sessions: p.sessions || 0,
        scrollDepth: p.avgScrollDepth ? `${Math.round(p.avgScrollDepth * 100)}%` : "—",
      })),
      clarityDashboard: `https://clarity.microsoft.com/projects/view/${projectId}`,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message, configured: true });
  }
}
