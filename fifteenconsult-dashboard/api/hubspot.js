/**
 * /api/hubspot.js
 * Vercel serverless function — proxies HubSpot API calls.
 * Runs server-side so CORS is never an issue.
 * The HUBSPOT_API_KEY env var is read server-side (no VITE_ prefix needed).
 */

export default async function handler(req, res) {
  // CORS headers so the dashboard can call this endpoint
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Try both env var names for compatibility
  const apiKey = process.env.HUBSPOT_API_KEY || process.env.VITE_HUBSPOT_API_KEY;
  
  // HubSpot EU base URL
  const HS_BASE = "https://api.hubapi.com";
  if (!apiKey) {
    return res.status(500).json({ error: "HUBSPOT_API_KEY not configured. Add it to Vercel Environment Variables (no VITE_ prefix)." });
  }

  const { action } = req.query;

  try {
    if (req.method === "GET" && action === "pipeline") {
      // ── FETCH PIPELINE DATA ──────────────────────────────────────────────
      const [contactsRes, dealsRes] = await Promise.all([
        fetch(`${HS_BASE}/crm/v3/objects/contacts?limit=1`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
        fetch(`${HS_BASE}/crm/v3/objects/deals?limit=100&properties=dealstage,dealname,amount,closedate`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
      ]);

      const contacts = await contactsRes.json();
      const deals    = await dealsRes.json();

      if (!contactsRes.ok) return res.status(contactsRes.status).json({ error: contacts.message || "HubSpot contacts error" });
      if (!dealsRes.ok)    return res.status(dealsRes.status).json({ error: deals.message || "HubSpot deals error" });

      const stageMap = {};
      (deals.results || []).forEach(d => {
        const stage = d.properties?.dealstage || "unknown";
        stageMap[stage] = (stageMap[stage] || 0) + 1;
      });

      return res.status(200).json({
        totalContacts: contacts.total || 0,
        totalDeals:    (deals.results || []).length,
        dealsByStage:  stageMap,
        openDeals:     (deals.results || []).filter(d => !["closedwon","closedlost"].includes(d.properties?.dealstage)).length,
        wonDeals:      (deals.results || []).filter(d => d.properties?.dealstage === "closedwon").length,
      });
    }

    if (req.method === "POST" && action === "contact") {
      // ── PUSH NEW CONTACT ─────────────────────────────────────────────────
      const { firstName, lastName, email, company, phone, notes } = req.body;

      if (!email) return res.status(400).json({ error: "Email is required" });

      const hubRes = await fetch(`${HS_BASE}/crm/v3/objects/contacts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            firstname:      firstName || "",
            lastname:       lastName  || "",
            email:          email,
            company:        company   || "",
            phone:          phone     || "",
            description:    notes     || "Added via FifteenConsult AI Dashboard",
            hs_lead_status: "NEW",
            lifecyclestage: "lead",
          },
        }),
      });

      const data = await hubRes.json();
      if (!hubRes.ok) return res.status(hubRes.status).json({ error: data.message || "Failed to create contact" });
      return res.status(200).json({ success: true, id: data.id });
    }

    return res.status(400).json({ error: "Unknown action" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
