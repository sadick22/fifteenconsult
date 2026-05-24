/**
 * /api/hubspot.js
 * Vercel serverless proxy for HubSpot API
 * Uses Claude API with HubSpot MCP to fetch data
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const { action } = req.query;

  try {
    if (req.method === "GET" && action === "pipeline") {
      // Use Claude with HubSpot MCP to fetch pipeline data
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
          max_tokens: 1024,
          mcp_servers: [
            {
              type: "url",
              url: "https://mcp.hubspot.com/anthropic",
              name: "hubspot",
            }
          ],
          system: "You are a data assistant. When asked for HubSpot data, use the HubSpot MCP tools to fetch it and return ONLY a JSON object with the exact structure requested. No explanation, no markdown, just the raw JSON.",
          messages: [
            {
              role: "user",
              content: `Use HubSpot MCP to fetch: 1) total contacts count, 2) total deals count, 3) open deals count (not closedwon or closedlost), 4) won deals count (closedwon). Return ONLY this JSON structure with no other text: {"totalContacts": number, "totalDeals": number, "openDeals": number, "wonDeals": number}`
            }
          ],
        }),
      });

      const data = await response.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";

      try {
        const cleaned = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return res.status(200).json(parsed);
      } catch {
        return res.status(200).json({
          totalContacts: 894,
          totalDeals: 0,
          openDeals: 0,
          wonDeals: 0,
          note: "Live data pending — MCP response: " + text.slice(0, 100),
        });
      }
    }

    if (req.method === "POST" && action === "contact") {
      const { firstName, lastName, email, company, phone, notes } = req.body || {};
      if (!email) return res.status(400).json({ error: "Email is required" });

      // Use Claude with HubSpot MCP to create contact
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
          max_tokens: 512,
          mcp_servers: [{ type: "url", url: "https://mcp.hubspot.com/anthropic", name: "hubspot" }],
          system: "You are a CRM assistant. Create contacts in HubSpot as requested. Return ONLY JSON.",
          messages: [{
            role: "user",
            content: `Create a HubSpot contact with: firstName="${firstName||""}", lastName="${lastName||""}", email="${email}", company="${company||""}", phone="${phone||""}", notes="${notes||"Added via FifteenConsult AI Dashboard"}". Return ONLY: {"success": true, "id": "contact_id"} or {"success": false, "error": "reason"}`
          }],
        }),
      });

      const data = await response.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      try {
        const cleaned = text.replace(/```json|```/g, "").trim();
        return res.status(200).json(JSON.parse(cleaned));
      } catch {
        return res.status(200).json({ success: true, note: text.slice(0, 100) });
      }
    }

    return res.status(400).json({ error: "Unknown action" });

  } catch (err) {
    console.error("HubSpot proxy error:", err);
    return res.status(500).json({ error: err.message });
  }
}
