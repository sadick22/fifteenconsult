/**
 * /api/searchconsole.js
 * Google Search Console API proxy — real keyword rankings and click data
 * Uses same OAuth credentials as GA4
 * Requires: GSC_REFRESH_TOKEN, GSC_CLIENT_ID, GSC_CLIENT_SECRET
 * Site property: https://fifteenconsult.com/
 */

const SITE_URL = "https://fifteenconsult.com/";

async function getAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GSC_CLIENT_ID     || process.env.GA4_CLIENT_ID,
      client_secret: process.env.GSC_CLIENT_SECRET || process.env.GA4_CLIENT_SECRET,
      refresh_token: process.env.GSC_REFRESH_TOKEN || process.env.GA4_REFRESH_TOKEN,
      grant_type:    "refresh_token",
    }),
  });
  const d = await res.json();
  if (!res.ok || !d.access_token) throw new Error(d.error_description || "GSC auth failed");
  return d.access_token;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const hasAuth = !!(
    (process.env.GSC_REFRESH_TOKEN || process.env.GA4_REFRESH_TOKEN) &&
    (process.env.GSC_CLIENT_ID     || process.env.GA4_CLIENT_ID) &&
    (process.env.GSC_CLIENT_SECRET || process.env.GA4_CLIENT_SECRET)
  );

  if (!hasAuth) {
    return res.status(500).json({
      error: "GSC not configured. Add GSC_REFRESH_TOKEN, GSC_CLIENT_ID, GSC_CLIENT_SECRET to Vercel (or reuse GA4 credentials if same Google account)."
    });
  }

  const { action = "overview" } = req.query;

  try {
    const token   = await getAccessToken();
    const BASE    = "https://searchconsole.googleapis.com/webmasters/v3";
    const HEADERS = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const endDate   = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 28 * 86400 * 1000).toISOString().split("T")[0];

    if (action === "overview") {
      // Top queries, pages, countries
      const [queriesRes, pagesRes] = await Promise.all([
        fetch(`${BASE}/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`, {
          method: "POST", headers: HEADERS,
          body: JSON.stringify({
            startDate, endDate,
            dimensions: ["query"],
            rowLimit: 10,
            dimensionFilterGroups: [],
          }),
        }),
        fetch(`${BASE}/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`, {
          method: "POST", headers: HEADERS,
          body: JSON.stringify({
            startDate, endDate,
            dimensions: ["page"],
            rowLimit: 5,
          }),
        }),
      ]);

      const queries = await queriesRes.json();
      const pages   = await pagesRes.json();

      if (queries.error) return res.status(400).json({ error: queries.error.message });

      return res.status(200).json({
        period: `${startDate} to ${endDate}`,
        topQueries: (queries.rows || []).map(r => ({
          query:       r.keys[0],
          clicks:      r.clicks,
          impressions: r.impressions,
          ctr:         `${(r.ctr * 100).toFixed(1)}%`,
          position:    parseFloat(r.position.toFixed(1)),
        })),
        topPages: (pages.rows || []).map(r => ({
          page:        r.keys[0].replace(SITE_URL, "/"),
          clicks:      r.clicks,
          impressions: r.impressions,
          position:    parseFloat(r.position.toFixed(1)),
        })),
      });
    }

    if (action === "keywords") {
      // Target keywords specifically
      const targetKeywords = [
        "marketing consultancy qatar",
        "marketing agency doha",
        "brand strategy qatar",
        "real estate marketing gcc",
        "digital marketing consultant qatar",
        "fifteen framework",
        "fifteenconsult",
      ];

      const r = await fetch(`${BASE}/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`, {
        method: "POST", headers: HEADERS,
        body: JSON.stringify({
          startDate, endDate,
          dimensions: ["query"],
          rowLimit: 100,
        }),
      });

      const d = await r.json();
      if (d.error) return res.status(400).json({ error: d.error.message });

      const allRows = d.rows || [];
      const targeted = targetKeywords.map(kw => {
        const row = allRows.find(r => r.keys[0].toLowerCase().includes(kw));
        return {
          keyword:     kw,
          clicks:      row?.clicks || 0,
          impressions: row?.impressions || 0,
          position:    row ? parseFloat(row.position.toFixed(1)) : "Not ranking",
          ctr:         row ? `${(row.ctr * 100).toFixed(1)}%` : "—",
        };
      });

      return res.status(200).json({ period: `${startDate} to ${endDate}`, keywords: targeted });
    }

    if (action === "issues") {
      // Index coverage issues
      const r = await fetch(
        `${BASE}/sites/${encodeURIComponent(SITE_URL)}/urlInspection/index:inspect`,
        {
          method: "POST", headers: HEADERS,
          body: JSON.stringify({ inspectionUrl: SITE_URL, siteUrl: SITE_URL }),
        }
      );
      const d = await r.json();
      if (d.error) return res.status(400).json({ error: d.error.message });
      return res.status(200).json(d);
    }

    return res.status(400).json({ error: "Unknown action. Use: overview, keywords, issues" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
