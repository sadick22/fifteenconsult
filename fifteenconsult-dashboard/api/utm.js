/**
 * /api/utm.js
 * UTM Campaign URL builder and tracker
 * No API key needed — generates and stores UTM parameters
 * Zara uses this to track campaign performance across all channels
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET" && req.query.action === "templates") {
    // Return UTM templates for FifteenConsult campaigns
    return res.status(200).json({
      templates: [
        {
          campaign: "LinkedIn Lead Gen",
          source: "linkedin", medium: "paid", campaign_name: "linkedin-leadgen",
          example: "https://fifteenconsult.com?utm_source=linkedin&utm_medium=paid&utm_campaign=linkedin-leadgen&utm_content=ad-variant-a",
        },
        {
          campaign: "Email Newsletter",
          source: "mailerlite", medium: "email", campaign_name: "weekly-newsletter",
          example: "https://fifteenconsult.com?utm_source=mailerlite&utm_medium=email&utm_campaign=weekly-newsletter",
        },
        {
          campaign: "Meta Ads",
          source: "facebook", medium: "paid", campaign_name: "meta-awareness-qatar",
          example: "https://fifteenconsult.com?utm_source=facebook&utm_medium=paid&utm_campaign=meta-awareness-qatar",
        },
        {
          campaign: "LinkedIn Organic",
          source: "linkedin", medium: "organic", campaign_name: "linkedin-organic",
          example: "https://fifteenconsult.com?utm_source=linkedin&utm_medium=organic&utm_campaign=linkedin-organic",
        },
        {
          campaign: "Instagram Organic",
          source: "instagram", medium: "organic", campaign_name: "instagram-organic",
          example: "https://fifteenconsult.com?utm_source=instagram&utm_medium=organic&utm_campaign=instagram-organic",
        },
        {
          campaign: "Google Ads",
          source: "google", medium: "cpc", campaign_name: "google-search-qatar",
          example: "https://fifteenconsult.com?utm_source=google&utm_medium=cpc&utm_campaign=google-search-qatar",
        },
        {
          campaign: "TikTok Organic",
          source: "tiktok", medium: "organic", campaign_name: "tiktok-organic",
          example: "https://fifteenconsult.com?utm_source=tiktok&utm_medium=organic&utm_campaign=tiktok-organic",
        },
        {
          campaign: "Referral / Partner",
          source: "referral", medium: "referral", campaign_name: "partner-referral",
          example: "https://fifteenconsult.com?utm_source=referral&utm_medium=referral&utm_campaign=partner-referral&utm_term=partner-name",
        },
      ],
      guidelines: [
        "Always use lowercase for all UTM values",
        "Use hyphens not underscores or spaces",
        "utm_source = platform (linkedin, google, mailerlite, instagram)",
        "utm_medium = channel type (paid, organic, email, referral, social)",
        "utm_campaign = specific campaign name (keep consistent)",
        "utm_content = ad variant or post type (optional but useful for A/B)",
        "utm_term = keyword for search campaigns (optional)",
      ],
    });
  }

  if (req.method === "POST" && req.query.action === "build") {
    const { baseUrl, source, medium, campaign, content, term } = req.body || {};

    if (!baseUrl || !source || !medium || !campaign) {
      return res.status(400).json({ error: "baseUrl, source, medium, and campaign are required" });
    }

    const params = new URLSearchParams({
      utm_source:   source.toLowerCase().replace(/\s+/g, "-"),
      utm_medium:   medium.toLowerCase().replace(/\s+/g, "-"),
      utm_campaign: campaign.toLowerCase().replace(/\s+/g, "-"),
      ...(content && { utm_content: content.toLowerCase().replace(/\s+/g, "-") }),
      ...(term    && { utm_term:    term.toLowerCase().replace(/\s+/g, "-") }),
    });

    const utmUrl = `${baseUrl}?${params.toString()}`;

    return res.status(200).json({
      utmUrl,
      components: { source, medium, campaign, content, term },
      preview: utmUrl,
    });
  }

  return res.status(400).json({ error: "Unknown action. Use GET?action=templates or POST?action=build" });
}
