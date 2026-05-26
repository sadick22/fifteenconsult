/**
 * /api/trends.js
 * Google Trends API proxy — free alpha API
 * Also falls back to trends.google.com web fetch for specific queries
 * 
 * Google Trends API (alpha): trends.google.com/trends/api
 * No API key required for basic usage
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { keywords = "marketing consultancy Qatar,marketing agency Doha", geo = "QA", period = "today 3-m" } = req.query;

  try {
    // Use Google Trends API alpha endpoint
    const kwList = keywords.split(",").map(k => ({
      keyword: k.trim(),
      geo: geo,
      time: period,
    }));

    const req_param = JSON.stringify({
      comparisonItem: kwList,
      category: 0,
      property: "",
    });

    const exploreUrl = `https://trends.google.com/trends/api/explore?hl=en-US&tz=-180&req=${encodeURIComponent(req_param)}&uts=${Date.now()}&source=lp`;

    const response = await fetch(exploreUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FifteenConsult-Dashboard/1.0)",
        "Accept": "application/json, text/plain, */*",
      },
    });

    if (!response.ok) {
      throw new Error(`Google Trends returned ${response.status}`);
    }

    const text = await response.text();
    // Google Trends prepends ")]}',\n" to prevent JSON hijacking
    const cleaned = text.replace(/^\)\]\}',\n/, "");

    try {
      const data = JSON.parse(cleaned);
      // Extract widgets
      const widgets = data.widgets || [];
      const timelineWidget = widgets.find(w => w.id === "TIMESERIES");
      const geoWidget     = widgets.find(w => w.id === "GEO_MAP");

      return res.status(200).json({
        keywords: kwList.map(k => k.keyword),
        geo,
        period,
        hasData: widgets.length > 0,
        timelineToken: timelineWidget?.token || null,
        geoToken:      geoWidget?.token || null,
        summary: `Trends data available for: ${kwList.map(k=>k.keyword).join(", ")} in ${geo}`,
        note: "Use Semrush or Google Trends website for detailed trend charts. This endpoint confirms keyword trend availability.",
      });
    } catch {
      return res.status(200).json({
        keywords: kwList.map(k => k.keyword),
        geo,
        period,
        hasData: false,
        note: "Google Trends data parsing failed — use trends.google.com directly for visual trend data.",
        suggestion: "Ask Tariq to analyse specific keywords using Semrush trend data instead.",
      });
    }

  } catch (err) {
    return res.status(200).json({
      error: err.message,
      fallback: "Google Trends is best accessed directly at trends.google.com — no API key needed for manual use.",
      keywords: keywords.split(",").map(k => k.trim()),
    });
  }
}
