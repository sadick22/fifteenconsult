/**
 * /api/hubspot.js
 * Vercel serverless proxy for HubSpot API (EU region)
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const apiKey = process.env.HUBSPOT_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "HUBSPOT_API_KEY not set in Vercel environment variables." });
  }

  // EU HubSpot endpoint
  const BASE = "https://api.hubapi.com";
  const HEADERS = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const { action } = req.query;

  try {
    // ── GET PIPELINE ────────────────────────────────────────────────────────
    if (req.method === "GET" && action === "pipeline") {
      const [cRes, dRes] = await Promise.all([
        fetch(`${BASE}/crm/v3/objects/contacts?limit=1`, { headers: HEADERS }),
        fetch(`${BASE}/crm/v3/objects/deals?limit=100&properties=dealstage,amount`, { headers: HEADERS }),
      ]);

      // Log response status for debugging
      if (!cRes.ok) {
        const err = await cRes.json();
        console.error("HubSpot contacts error:", cRes.status, err);
        return res.status(cRes.status).json({ error: err.message || `HubSpot error ${cRes.status}` });
      }
      if (!dRes.ok) {
        const err = await dRes.json();
        console.error("HubSpot deals error:", dRes.status, err);
        return res.status(dRes.status).json({ error: err.message || `HubSpot error ${dRes.status}` });
      }

      const contacts = await cRes.json();
      const deals    = await dRes.json();
      const results  = deals.results || [];

      return res.status(200).json({
        totalContacts: contacts.total || 0,
        totalDeals:    results.length,
        openDeals:     results.filter(d => !["closedwon","closedlost"].includes(d.properties?.dealstage)).length,
        wonDeals:      results.filter(d => d.properties?.dealstage === "closedwon").length,
        dealsByStage:  results.reduce((acc, d) => {
          const s = d.properties?.dealstage || "unknown";
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        }, {}),
      });
    }

    // ── POST CONTACT ────────────────────────────────────────────────────────
    if (req.method === "POST" && action === "contact") {
      const { firstName, lastName, email, company, phone, notes } = req.body || {};
      if (!email) return res.status(400).json({ error: "Email is required" });

      const r = await fetch(`${BASE}/crm/v3/objects/contacts`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({
          properties: {
            firstname:      firstName || "",
            lastname:       lastName  || "",
            email,
            company:        company   || "",
            phone:          phone     || "",
            description:    notes     || "Added via FifteenConsult AI Dashboard",
            hs_lead_status: "NEW",
            lifecyclestage: "lead",
          },
        }),
      });

      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data.message || "Failed to create contact" });
      return res.status(200).json({ success: true, id: data.id });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: err.message });
  }
}
