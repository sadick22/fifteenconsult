/**
 * /api/seo.js
 * Consolidated SEO proxy — merges pagespeed, schematest, searchconsole, trends
 * Use ?tool=pagespeed|schema|gsc|trends&action=...
 */

// ── PAGESPEED ─────────────────────────────────────────────────────────────────
async function handlePageSpeed(req, res) {
  const { url = "https://fifteenconsult.com", strategy = "mobile" } = req.query;
  const apiKey = process.env.PAGESPEED_API_KEY;
  const apiUrl = apiKey
    ? `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&key=${apiKey}`
    : `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}`;

  const r = await fetch(apiUrl);
  const d = await r.json();
  if (d.error) return res.status(400).json({ error: d.error.message });

  const cats   = d.lighthouseResult?.categories || {};
  const audits = d.lighthouseResult?.audits || {};

  return res.status(200).json({
    url, strategy,
    scores: {
      performance:   Math.round((cats.performance?.score || 0) * 100),
      accessibility: Math.round((cats.accessibility?.score || 0) * 100),
      bestPractices: Math.round((cats["best-practices"]?.score || 0) * 100),
      seo:           Math.round((cats.seo?.score || 0) * 100),
    },
    coreWebVitals: {
      lcp:  audits["largest-contentful-paint"]?.displayValue || "—",
      fid:  audits["total-blocking-time"]?.displayValue || "—",
      cls:  audits["cumulative-layout-shift"]?.displayValue || "—",
      fcp:  audits["first-contentful-paint"]?.displayValue || "—",
      ttfb: audits["server-response-time"]?.displayValue || "—",
      si:   audits["speed-index"]?.displayValue || "—",
    },
    opportunities: Object.values(audits)
      .filter(a => a.details?.type === "opportunity" && a.score < 0.9)
      .slice(0, 5)
      .map(a => ({ title: a.title, savings: a.displayValue || "", impact: a.score < 0.5 ? "high" : "medium" })),
  });
}

// ── SCHEMA TEST ───────────────────────────────────────────────────────────────
async function handleSchema(req, res) {
  const { url = "https://fifteenconsult.com" } = req.query;
  const pageRes = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; FifteenConsult-Dashboard/1.0)",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
  });
  if (!pageRes.ok) return res.status(200).json({ error: `Could not fetch ${url}: ${pageRes.status} ${pageRes.statusText}` });
  const html = await pageRes.text();
  if (!html.includes("<html") && !html.includes("<!DOCTYPE")) return res.status(200).json({ error: "Response does not appear to be an HTML page." });

  const schemaMatches = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
  const schemas = schemaMatches.map(s => {
    try { return JSON.parse(s.replace(/<script[^>]*>/, "").replace(/<\/script>/, "").trim()); }
    catch { return null; }
  }).filter(Boolean);

  const hasLocalBusiness = schemas.some(s => s["@type"] === "LocalBusiness" || s["@type"] === "Organization");
  const hasOG            = html.includes('property="og:');
  const hasCanonical     = html.includes('rel="canonical"');
  const hasMetaDesc      = html.includes('name="description"');
  const titleMatch       = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch        = html.match(/name="description"[^>]*content="([^"]+)"/i) || html.match(/content="([^"]+)"[^>]*name="description"/i);

  return res.status(200).json({
    url,
    schemas: {
      count: schemas.length, hasLocalBusiness,
      types: schemas.map(s => s["@type"]).filter(Boolean),
      missing: [
        !hasLocalBusiness && "LocalBusiness (critical for local SEO)",
        !hasOG            && "Open Graph tags",
      ].filter(Boolean),
    },
    meta: {
      title:       titleMatch?.[1] || "Not found",
      titleLength: titleMatch?.[1]?.length || 0,
      description: descMatch?.[1] || "MISSING",
      hasCanonical, hasOG, hasMetaDesc,
    },
    score: Math.round((hasLocalBusiness?20:0)+(hasMetaDesc?20:0)+(hasCanonical?15:0)+(hasOG?15:0)+(schemas.length>0?15:0)),
    recommendations: [
      !hasLocalBusiness && "🔴 Add LocalBusiness schema with Doha address",
      !hasMetaDesc      && "🔴 Missing meta description — add immediately",
      !hasCanonical     && "🟡 Add canonical tags",
      !hasOG            && "🟡 Add Open Graph tags",
    ].filter(Boolean),
  });
}

// ── GOOGLE SEARCH CONSOLE ─────────────────────────────────────────────────────
async function handleGSC(req, res) {
  const SITE_URL = "https://fifteenconsult.com/";
  const { action = "overview" } = req.query;

  const hasAuth = !!(process.env.GSC_REFRESH_TOKEN && process.env.GSC_CLIENT_ID && process.env.GSC_CLIENT_SECRET);
  if (!hasAuth) return res.status(200).json({ error: "GSC not configured. Add GSC_REFRESH_TOKEN, GSC_CLIENT_ID, GSC_CLIENT_SECRET to Vercel." });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GSC_CLIENT_ID, client_secret: process.env.GSC_CLIENT_SECRET, refresh_token: process.env.GSC_REFRESH_TOKEN, grant_type: "refresh_token" }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return res.status(200).json({ error: tokenData.error_description || "GSC auth failed" });

  const endDate   = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 28*86400*1000).toISOString().split("T")[0];
  const BASE = "https://searchconsole.googleapis.com/webmasters/v3";
  const HEADERS = { Authorization: `Bearer ${tokenData.access_token}`, "Content-Type": "application/json" };

  if (action === "keywords") {
    const r = await fetch(`${BASE}/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`, {
      method: "POST", headers: HEADERS,
      body: JSON.stringify({ startDate, endDate, dimensions: ["query"], rowLimit: 100 }),
    });
    const d = await r.json();
    if (d.error) return res.status(200).json({ error: d.error.message });
    const targets = ["marketing consultancy qatar","marketing agency doha","brand strategy qatar","real estate marketing gcc","digital marketing consultant qatar","fifteen framework","fifteenconsult","marketing consultancy west africa"];
    const allRows = d.rows || [];
    return res.status(200).json({ period:`${startDate} to ${endDate}`, keywords: targets.map(kw => {
      const row = allRows.find(r => r.keys[0].toLowerCase().includes(kw));
      return { keyword:kw, clicks:row?.clicks||0, impressions:row?.impressions||0, position:row?parseFloat(row.position.toFixed(1)):"Not ranking", ctr:row?`${(row.ctr*100).toFixed(1)}%`:"—" };
    })});
  }

  const r = await fetch(`${BASE}/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`, {
    method: "POST", headers: HEADERS,
    body: JSON.stringify({ startDate, endDate, dimensions: ["page"], rowLimit: 5 }),
  });
  const d = await r.json();
  if (d.error) return res.status(200).json({ error: d.error.message });
  return res.status(200).json({ period:`${startDate} to ${endDate}`, topPages:(d.rows||[]).map(r=>({ page:r.keys[0].replace(SITE_URL,"/"), clicks:r.clicks, impressions:r.impressions, position:parseFloat(r.position.toFixed(1)) })) });
}

// ── TRENDS ────────────────────────────────────────────────────────────────────
async function handleTrends(req, res) {
  const { keywords = "marketing Qatar,digital marketing Qatar", geo = "QA" } = req.query;
  return res.status(200).json({
    keywords: keywords.split(",").map(k=>k.trim()),
    geo,
    message: "Use the Trends panel links for visual data — Google Trends doesn't provide a public JSON API.",
    quickLinks: [
      { label:"GCC Broad", url:`https://trends.google.com/trends/explore?geo=QA&q=marketing+Qatar,digital+marketing+Qatar` },
      { label:"West Africa", url:`https://trends.google.com/trends/explore?geo=NG&q=marketing+agency+Nigeria,digital+marketing+Lagos` },
    ],
  });
}

// ── ROUTER ────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { tool } = req.query;

  try {
    if (tool === "pagespeed") return handlePageSpeed(req, res);
    if (tool === "schema")    return handleSchema(req, res);
    if (tool === "gsc")       return handleGSC(req, res);
    if (tool === "trends")    return handleTrends(req, res);
    return res.status(400).json({ error: "Unknown tool. Use ?tool=pagespeed|schema|gsc|trends" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
