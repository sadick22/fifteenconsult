/**
 * /api/tiktok.js
 * TikTok Business API proxy
 * Requires: TIKTOK_ACCESS_TOKEN, TIKTOK_ADVERTISER_ID
 *
 * Setup:
 * 1. Go to business.tiktok.com → Developer Tools → App Management
 * 2. Create an app → Request TikTok for Business API access
 * 3. Generate access token with analytics permissions
 */

const BASE = "https://business-api.tiktok.com/open_api/v1.3";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const token      = process.env.TIKTOK_ACCESS_TOKEN;
  const advertiserId = process.env.TIKTOK_ADVERTISER_ID;

  if (!token) {
    return res.status(500).json({
      error: "TikTok not configured. Add TIKTOK_ACCESS_TOKEN to Vercel.",
      setup: "Go to business.tiktok.com → Developer Tools → Create App → Generate access token"
    });
  }

  try {
    const { action } = req.query;

    if (action === "profile") {
      // TikTok Business account info
      const r = await fetch(`${BASE}/bc/advertiser/get/`, {
        method: "GET",
        headers: {
          "Access-Token": token,
          "Content-Type": "application/json",
        },
      });
      const data = await r.json();
      if (data.code !== 0) return res.status(400).json({ error: data.message || "TikTok API error" });
      return res.status(200).json(data.data);
    }

    if (action === "insights" && advertiserId) {
      // Campaign performance data
      const endDate   = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 30*86400*1000).toISOString().split("T")[0];

      const r = await fetch(`${BASE}/report/integrated/get/`, {
        method: "POST",
        headers: {
          "Access-Token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          advertiser_id:  advertiserId,
          report_type:    "BASIC",
          dimensions:     ["stat_time_day"],
          metrics:        ["spend","impressions","clicks","ctr","cpm","reach","conversion"],
          start_date:     startDate,
          end_date:       endDate,
          page:           1,
          page_size:      30,
        }),
      });
      const data = await r.json();
      if (data.code !== 0) return res.status(400).json({ error: data.message || "TikTok insights error" });
      return res.status(200).json(data.data);
    }

    return res.status(400).json({ error: "Unknown action. Use: profile, insights" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
