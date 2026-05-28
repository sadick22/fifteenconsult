/**
 * /api/analytics.js
 * Consolidated analytics proxy — merges clarity, hotjar, utm, ga4
 * Use ?tool=clarity|hotjar|utm|ga4&action=...
 */

// ── CLARITY ───────────────────────────────────────────────────────────────────
async function handleClarity(req, res) {
  const token     = process.env.CLARITY_API_TOKEN;
  const projectId = process.env.CLARITY_PROJECT_ID;

  if (!token || !projectId) return res.status(200).json({
    configured: false,
    setup: "Add CLARITY_API_TOKEN and CLARITY_PROJECT_ID to Vercel.",
  });

  const r = await fetch("https://www.clarity.ms/export-data/api/v1/project-live-insights?numOfDays=3", {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });

  if (!r.ok) {
    const errText = await r.text();
    let errMsg = "Clarity API error";
    try { errMsg = JSON.parse(errText)?.message || `${r.status}: ${errMsg}`; } catch { errMsg = `${r.status}: ${errText.slice(0,100)}`; }
    return res.status(200).json({ error: errMsg, configured: true, clarityDashboard: `https://clarity.microsoft.com/projects/view/${projectId}` });
  }

  const data    = await r.json();
  const summary = data?.summary || data || {};
  return res.status(200).json({
    configured: true, period: "Last 3 days",
    sessions:        summary.totalSessions    || summary.sessions        || 0,
    pagesPerSession: summary.pagesPerSession?.toFixed?.(1) || "—",
    avgScrollDepth:  summary.avgScrollDepth ? `${Math.round(summary.avgScrollDepth*100)}%` : summary.scrollDepth || "—",
    rageClicks:      summary.rageClickCount  || summary.rageClicks       || 0,
    deadClicks:      summary.deadClickCount  || summary.deadClicks       || 0,
    quickBacks:      summary.quickBackCount  || summary.quickBacks       || 0,
    topPages: (summary.topUrls||summary.topPages||[]).slice(0,5).map(p=>({
      page: (p.url||p.page||"/").replace("https://fifteenconsult.com",""),
      sessions: p.sessions||p.totalSessions||0,
      scrollDepth: p.avgScrollDepth?`${Math.round(p.avgScrollDepth*100)}%`:"—",
    })),
    clarityDashboard: `https://clarity.microsoft.com/projects/view/${projectId}`,
  });
}

// ── HOTJAR ────────────────────────────────────────────────────────────────────
async function handleHotjar(req, res) {
  const apiKey = process.env.HOTJAR_API_KEY;
  const siteId = process.env.HOTJAR_SITE_ID;
  if (!apiKey || !siteId) return res.status(200).json({ configured: false, setup: "Add HOTJAR_API_KEY and HOTJAR_SITE_ID to Vercel." });
  return res.status(200).json({ configured: true, hotjarDashboard: `https://insights.hotjar.com/sites/${siteId}/dashboard`, note: "Visit Hotjar dashboard for heatmaps and recordings." });
}

// ── UTM ───────────────────────────────────────────────────────────────────────
async function handleUTM(req, res) {
  const { action } = req.query;
  if (action === "build") {
    const { baseUrl, source, medium, campaign, content, term } = req.body || {};
    if (!baseUrl||!source||!medium||!campaign) return res.status(400).json({ error: "baseUrl, source, medium, campaign required" });
    const params = new URLSearchParams({ utm_source:source.toLowerCase().replace(/\s+/g,"-"), utm_medium:medium.toLowerCase().replace(/\s+/g,"-"), utm_campaign:campaign.toLowerCase().replace(/\s+/g,"-"), ...(content&&{utm_content:content.toLowerCase().replace(/\s+/g,"-")}), ...(term&&{utm_term:term.toLowerCase().replace(/\s+/g,"-")}) });
    return res.status(200).json({ utmUrl:`${baseUrl}?${params.toString()}` });
  }
  return res.status(200).json({ templates:[
    { campaign:"LinkedIn Paid",    source:"linkedin",   medium:"paid",    example:"https://fifteenconsult.com?utm_source=linkedin&utm_medium=paid&utm_campaign=linkedin-leadgen" },
    { campaign:"Email Newsletter", source:"mailerlite", medium:"email",   example:"https://fifteenconsult.com?utm_source=mailerlite&utm_medium=email&utm_campaign=weekly-newsletter" },
    { campaign:"Meta Ads",         source:"facebook",   medium:"paid",    example:"https://fifteenconsult.com?utm_source=facebook&utm_medium=paid&utm_campaign=meta-awareness-qatar" },
    { campaign:"Instagram Organic",source:"instagram",  medium:"organic", example:"https://fifteenconsult.com?utm_source=instagram&utm_medium=organic&utm_campaign=instagram-organic" },
    { campaign:"Google Ads",       source:"google",     medium:"cpc",     example:"https://fifteenconsult.com?utm_source=google&utm_medium=cpc&utm_campaign=google-search-qatar" },
  ]});
}

// ── GA4 ───────────────────────────────────────────────────────────────────────
async function handleGA4(req, res) {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!process.env.GA4_REFRESH_TOKEN) return res.status(200).json({ error: "GA4_REFRESH_TOKEN not configured." });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body: new URLSearchParams({ client_id:process.env.GA4_CLIENT_ID, client_secret:process.env.GA4_CLIENT_SECRET, refresh_token:process.env.GA4_REFRESH_TOKEN, grant_type:"refresh_token" }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return res.status(200).json({ error: tokenData.error_description || "GA4 auth failed" });

  const BASE    = `https://analyticsdata.googleapis.com/v1beta/${propertyId}`;
  const HEADERS = { Authorization:`Bearer ${tokenData.access_token}`, "Content-Type":"application/json" };
  const dateRange = { startDate:"30daysAgo", endDate:"today" };

  const r = await fetch(`${BASE}:runReport`, { method:"POST", headers:HEADERS, body:JSON.stringify({ dateRanges:[dateRange], metrics:[{name:"sessions"},{name:"activeUsers"},{name:"bounceRate"},{name:"averageSessionDuration"}] }) });
  if (!r.ok) { const e = await r.json(); return res.status(r.status).json({ error: e.error?.message || "GA4 error" }); }
  const d   = await r.json();
  const row = d.rows?.[0];
  return res.status(200).json({
    sessions:    parseInt(row?.metricValues?.[0]?.value||"0"),
    users:       parseInt(row?.metricValues?.[1]?.value||"0"),
    bounceRate:  `${(parseFloat(row?.metricValues?.[2]?.value||"0")*100).toFixed(1)}%`,
    avgDuration: (dur => `${Math.floor(dur/60)}m ${Math.floor(dur%60)}s`)(parseFloat(row?.metricValues?.[3]?.value||"0")),
  });
}

// ── ROUTER ────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  const { tool } = req.query;
  try {
    if (tool === "clarity") return handleClarity(req, res);
    if (tool === "hotjar")  return handleHotjar(req, res);
    if (tool === "utm")     return handleUTM(req, res);
    if (tool === "ga4")     return handleGA4(req, res);
    return res.status(400).json({ error: "Unknown tool. Use ?tool=clarity|hotjar|utm|ga4" });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}
