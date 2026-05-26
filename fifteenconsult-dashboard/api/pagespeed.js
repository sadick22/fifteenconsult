/**
 * /api/pagespeed.js
 * Google PageSpeed Insights API proxy — free, real Core Web Vitals data
 * Get free API key: console.developers.google.com → PageSpeed Insights API
 * Add to Vercel: PAGESPEED_API_KEY
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const apiKey = process.env.PAGESPEED_API_KEY;
  const { url = "https://fifteenconsult.com", strategy = "mobile" } = req.query;

  if (!apiKey) {
    // Fall back to public API (rate limited but works)
    const publicUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}`;
    try {
      const r = await fetch(publicUrl);
      const d = await r.json();
      return res.status(200).json(parsePageSpeed(d));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  try {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&key=${apiKey}`;
    const r = await fetch(apiUrl);
    const d = await r.json();
    return res.status(200).json(parsePageSpeed(d));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function parsePageSpeed(data) {
  if (data.error) return { error: data.error.message };

  const cats   = data.lighthouseResult?.categories || {};
  const audits = data.lighthouseResult?.audits || {};
  const metrics = data.lighthouseResult?.audits?.metrics?.details?.items?.[0] || {};

  return {
    url:              data.id,
    strategy:         data.lighthouseResult?.configSettings?.formFactor || "unknown",
    scores: {
      performance:    Math.round((cats.performance?.score || 0) * 100),
      accessibility:  Math.round((cats.accessibility?.score || 0) * 100),
      bestPractices:  Math.round((cats["best-practices"]?.score || 0) * 100),
      seo:            Math.round((cats.seo?.score || 0) * 100),
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
    diagnostics: Object.values(audits)
      .filter(a => a.score !== null && a.score < 0.9 && a.details?.type === "table")
      .slice(0, 3)
      .map(a => ({ title: a.title, description: a.description?.slice(0, 100) })),
  };
}
