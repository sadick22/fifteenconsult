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
    // Clarity Data Export API — correct endpoint from Microsoft docs
    // numOfDays: 1, 2, or 3 (max 3 days per request)
    const EXPORT_BASE = "https://www.clarity.ms/export-data/api/v1";
    
    const r = await fetch(
      `${EXPORT_BASE}/project-live-insights?numOfDays=3`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!r.ok) {
      const errText = await r.text();
      let errMsg = "Clarity API error";
      try { errMsg = JSON.parse(errText)?.message || errMsg; } catch {}
      return res.status(200).json({ 
        error: `${r.status}: ${errMsg}`, 
        configured: true,
        clarityDashboard: `https://clarity.microsoft.com/projects/view/${projectId}`,
      });
    }

    const data = await r.json();
    const summary = data?.summary || data || {};

    return res.status(200).json({
      configured: true,
      period: "Last 3 days",
      sessions:        summary.totalSessions       || summary.sessions        || 0,
      pagesPerSession: summary.pagesPerSession?.toFixed?.(1) || "—",
      avgScrollDepth:  summary.avgScrollDepth 
        ? `${Math.round(summary.avgScrollDepth * 100)}%` 
        : summary.scrollDepth || "—",
      engagedSessions: summary.engagedSessions     || 0,
      rageClicks:      summary.rageClickCount      || summary.rageClicks      || 0,
      deadClicks:      summary.deadClickCount      || summary.deadClicks      || 0,
      quickBacks:      summary.quickBackCount      || summary.quickBacks      || 0,
      topPages: (summary.topUrls || summary.topPages || []).slice(0, 5).map(p => ({
        page:        (p.url || p.page || "/").replace("https://fifteenconsult.com", ""),
        sessions:    p.sessions || p.totalSessions || 0,
        scrollDepth: p.avgScrollDepth 
          ? `${Math.round(p.avgScrollDepth * 100)}%` 
          : "—",
      })),
      clarityDashboard: `https://clarity.microsoft.com/projects/view/${projectId}`,
      rawData: Object.keys(summary).slice(0, 10), // debug: show available fields
    });

  } catch (err) {
    return res.status(500).json({ error: err.message, configured: true });
  }
}
