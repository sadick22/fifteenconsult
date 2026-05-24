/**
 * /api/instagram.js
 * Free Instagram Graph API proxy
 * Requires: INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_ACCOUNT_ID
 * 
 * Setup:
 * 1. Go to developers.facebook.com → My Apps → Create App → Business
 * 2. Add Instagram Graph API product
 * 3. Generate a long-lived access token
 * 4. Get your Instagram Business Account ID
 */

const BASE = "https://graph.instagram.com/v21.0";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const token     = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

  if (!token || !accountId) {
    return res.status(500).json({
      error: "Instagram not configured. Add INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID to Vercel.",
      setup: "Go to developers.facebook.com → Create App → Instagram Graph API → Generate token"
    });
  }

  try {
    const { action } = req.query;

    if (action === "profile") {
      // Fetch account profile + follower count
      const r = await fetch(
        `${BASE}/${accountId}?fields=id,username,followers_count,follows_count,media_count,profile_picture_url,biography&access_token=${token}`
      );
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "Instagram API error" });
      return res.status(200).json(data);
    }

    if (action === "insights") {
      // Fetch account-level insights (impressions, reach, profile views)
      const r = await fetch(
        `${BASE}/${accountId}/insights?metric=impressions,reach,profile_views,follower_count&period=day&since=${Math.floor(Date.now()/1000) - 7*86400}&until=${Math.floor(Date.now()/1000)}&access_token=${token}`
      );
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "Instagram insights error" });
      return res.status(200).json(data);
    }

    if (action === "posts") {
      // Fetch recent posts with engagement data
      const r = await fetch(
        `${BASE}/${accountId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count,impressions,reach,engagement&limit=10&access_token=${token}`
      );
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "Instagram posts error" });
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: "Unknown action. Use: profile, insights, posts" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
