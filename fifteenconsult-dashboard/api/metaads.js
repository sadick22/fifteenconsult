/**
 * /api/metaads.js
 * Meta Ads MCP proxy for Hassan and Malik
 * Uses Claude API with official Meta Ads MCP (mcp.facebook.com/ads)
 * 
 * Status: Active once Meta enables your account for MCP access
 * Your ad account: 932655362719996
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID || "932655362719996";
  const { action } = req.query;

  const prompts = {
    performance: `Use the Meta Ads MCP tools to get performance trends for ad account ${AD_ACCOUNT_ID}. 
      Get CPC, CPM, ROAS, CTR and spend trends for the last 30 days.
      Return ONLY this JSON: {"spend": number, "impressions": number, "clicks": number, "ctr": "X%", "cpm": number, "roas": number, "period": "last 30 days", "currency": "USD"}`,
    
    anomalies: `Use the Meta Ads MCP ads_insights_anomaly_signal tool for ad account ${AD_ACCOUNT_ID}.
      Identify any unusual patterns or performance deviations.
      Return ONLY this JSON: {"anomalies": ["description1", "description2"], "severity": "low/medium/high", "recommendation": "what to do"}`,
    
    benchmark: `Use the Meta Ads MCP ads_insights_industry_benchmark tool for ad account ${AD_ACCOUNT_ID}.
      Compare performance against industry benchmarks for the last 30 days.
      Return ONLY this JSON: {"ourCPL": number, "benchmarkCPL": number, "ourCTR": "X%", "benchmarkCTR": "X%", "performance": "above/below/at benchmark", "insight": "brief explanation"}`,
    
    errors: `Use the Meta Ads MCP ads_get_errors tool for ad account ${AD_ACCOUNT_ID}.
      Find any delivery-blocking errors on campaigns.
      Return ONLY this JSON: {"errors": [{"entity": "name", "issue": "description", "fix": "how to fix"}], "total": number}`,
  };

  if (!prompts[action]) {
    return res.status(400).json({ error: `Unknown action. Use: performance, anomalies, benchmark, errors` });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "mcp-client-2025-11-20",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        mcp_servers: [{
          type: "url",
          url:  "https://mcp.facebook.com/ads",
          name: "meta-ads",
        }],
        system: "You are a Meta Ads analyst. Use the Meta Ads MCP tools to fetch live data. Return ONLY valid JSON, no explanation, no markdown backticks.",
        messages: [{ role: "user", content: prompts[action] }],
      }),
    });

    const data = await response.json();

    // Check for MCP not enabled error
    if (data.error || data.type === "error") {
      const msg = data.error?.message || JSON.stringify(data);
      if (msg.includes("not enabled") || msg.includes("gradually rolled out")) {
        return res.status(200).json({
          pending: true,
          message: "Meta Ads MCP is connected but not yet enabled for this ad account. Meta is rolling this out gradually — check back in a few days.",
          adAccountId: AD_ACCOUNT_ID,
        });
      }
      return res.status(500).json({ error: msg });
    }

    const text = data.content?.find(b => b.type === "text")?.text || "";

    // Check for not enabled in response text
    if (text.includes("not enabled") || text.includes("gradually rolled out")) {
      return res.status(200).json({
        pending: true,
        message: "Meta Ads MCP is connected but pending activation for your account.",
        adAccountId: AD_ACCOUNT_ID,
      });
    }

    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      return res.status(200).json(JSON.parse(cleaned));
    } catch {
      return res.status(200).json({ raw: text });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
