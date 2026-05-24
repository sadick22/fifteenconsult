/**
 * /api/adadvisor.js
 * AdAdvisor MCP proxy — gives Hassan and Malik live Meta Ads data
 * Uses Claude API with AdAdvisor MCP (already connected to your account)
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const { action } = req.query;

  try {
    let prompt = "";

    if (action === "performance") {
      prompt = `Use AdAdvisor MCP tools to fetch the latest Meta Ads performance data. Get: total spend last 30 days, impressions, clicks, CTR, CPL (cost per lead), and ROAS. Return ONLY this JSON: {"spend": number, "impressions": number, "clicks": number, "ctr": "X%", "cpl": number, "roas": number, "currency": "QAR", "period": "last 30 days"}`;
    } else if (action === "campaigns") {
      prompt = `Use AdAdvisor MCP tools to list active Meta Ads campaigns with their performance. Return ONLY a JSON array: [{"name": "campaign name", "status": "active/paused", "spend": number, "roas": number, "leads": number}]`;
    } else if (action === "insights") {
      prompt = `Use AdAdvisor MCP tools to get the top 3 actionable insights about the current Meta Ads account performance. Return ONLY JSON: {"insights": ["insight 1", "insight 2", "insight 3"], "topWinningAd": "brief description", "topRecommendation": "specific action to take"}`;
    } else {
      return res.status(400).json({ error: "Unknown action. Use: performance, campaigns, insights" });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "mcp-client-2025-04-04",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        mcp_servers: [{
          type: "url",
          url:  "https://api.adadvisor.ai/mcp",
          name: "adadvisor",
        }],
        system: "You are a data assistant. Use AdAdvisor MCP tools to fetch live Meta Ads data. Return ONLY valid JSON, no explanation, no markdown.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.find(b => b.type === "text")?.text || "";

    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      return res.status(200).json(JSON.parse(cleaned));
    } catch {
      return res.status(200).json({ raw: text, note: "Could not parse JSON — raw response returned" });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
