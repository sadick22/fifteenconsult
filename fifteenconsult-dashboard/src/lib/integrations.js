/**
 * integrations.js
 * External platform connections for FifteenConsult dashboard.
 *
 * Each integration fetches live data via the platform's API.
 * API keys stored as Vercel environment variables.
 *
 * HubSpot:  VITE_HUBSPOT_API_KEY
 * MailerLite: VITE_MAILERLITE_API_KEY
 */

// ── HUBSPOT ───────────────────────────────────────────────────────────────────

const HS_BASE = "https://api.hubapi.com";
const HS_KEY  = () => import.meta.env.VITE_HUBSPOT_API_KEY;

export async function fetchHubSpotPipeline() {
  const key = HS_KEY();
  if (!key) return { error: "No HubSpot API key. Add VITE_HUBSPOT_API_KEY to Vercel." };

  try {
    // Fetch contacts count
    const contactsRes = await fetch(
      `${HS_BASE}/crm/v3/objects/contacts?limit=1&properties=hs_lead_status`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    const contacts = await contactsRes.json();

    // Fetch deals
    const dealsRes = await fetch(
      `${HS_BASE}/crm/v3/objects/deals?limit=100&properties=dealstage,dealname,amount,closedate`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    const deals = await dealsRes.json();

    // Count deals by stage
    const stageMap = {};
    (deals.results || []).forEach(d => {
      const stage = d.properties?.dealstage || "unknown";
      stageMap[stage] = (stageMap[stage] || 0) + 1;
    });

    return {
      totalContacts: contacts.total || 0,
      totalDeals:    (deals.results || []).length,
      dealsByStage:  stageMap,
      openDeals:     (deals.results || []).filter(d => !["closedwon","closedlost"].includes(d.properties?.dealstage)).length,
      wonDeals:      (deals.results || []).filter(d => d.properties?.dealstage === "closedwon").length,
    };
  } catch (err) {
    return { error: err.message };
  }
}

export async function pushContactToHubSpot({ firstName, lastName, email, company, phone, notes }) {
  const key = HS_KEY();
  if (!key) return { error: "No HubSpot API key." };

  try {
    const res = await fetch(`${HS_BASE}/crm/v3/objects/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          firstname:   firstName || "",
          lastname:    lastName  || "",
          email:       email     || "",
          company:     company   || "",
          phone:       phone     || "",
          description: notes     || "Added via FifteenConsult AI Dashboard",
          hs_lead_status: "NEW",
          lifecyclestage:  "lead",
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) return { error: data.message || "Failed to create contact" };
    return { success: true, id: data.id, contact: data };
  } catch (err) {
    return { error: err.message };
  }
}

// ── MAILERLITE ────────────────────────────────────────────────────────────────

const ML_BASE = "https://connect.mailerlite.com/api";
const ML_KEY  = () => import.meta.env.VITE_MAILERLITE_API_KEY;

export async function fetchMailerLiteStats() {
  const key = ML_KEY();
  if (!key) return { error: "No MailerLite API key. Add VITE_MAILERLITE_API_KEY to Vercel." };

  try {
    // Fetch subscriber count
    const subsRes = await fetch(`${ML_BASE}/subscribers?limit=1`, {
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    });
    const subs = await subsRes.json();

    // Fetch recent campaigns
    const campRes = await fetch(`${ML_BASE}/campaigns?limit=5&sort=-created_at`, {
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    });
    const camps = await campRes.json();

    const lastCampaign = camps.data?.[0];
    const openRate = lastCampaign?.stats?.open_rate?.float
      ? (lastCampaign.stats.open_rate.float * 100).toFixed(1)
      : null;
    const clickRate = lastCampaign?.stats?.click_rate?.float
      ? (lastCampaign.stats.click_rate.float * 100).toFixed(1)
      : null;

    return {
      totalSubscribers: subs.meta?.total || subs.total || 0,
      lastCampaignName: lastCampaign?.name || null,
      lastCampaignSent: lastCampaign?.sent_at || null,
      openRate:         openRate ? `${openRate}%` : null,
      clickRate:        clickRate ? `${clickRate}%` : null,
    };
  } catch (err) {
    return { error: err.message };
  }
}

export async function createMailerLiteDraft({ subject, content }) {
  const key = ML_KEY();
  if (!key) return { error: "No MailerLite API key." };

  try {
    // Get first active group to associate campaign with
    const groupsRes = await fetch(`${ML_BASE}/groups?limit=1`, {
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    });
    const groups = await groupsRes.json();
    const groupId = groups.data?.[0]?.id;

    const body = {
      name:    `FC Newsletter — ${new Date().toLocaleDateString("en-GB")}`,
      type:    "regular",
      status:  "draft",
      subject: subject || "FifteenConsult Newsletter",
      emails: [{
        subject: subject || "FifteenConsult Newsletter",
        from_name:  "FifteenConsult",
        from:       "fifteenconsult@gmail.com",
        content:    content || "",
        type:       "regular",
      }],
      ...(groupId ? { groups: [{ id: groupId }] } : {}),
    };

    const res = await fetch(`${ML_BASE}/campaigns`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) return { error: data.message || "Failed to create draft" };
    return { success: true, id: data.data?.id, url: `https://app.mailerlite.com/campaigns/${data.data?.id}` };
  } catch (err) {
    return { error: err.message };
  }
}

// ── CONNECTION STATUS ─────────────────────────────────────────────────────────

export function getConnectionStatuses() {
  return {
    hubspot:     !!import.meta.env.VITE_HUBSPOT_API_KEY,
    mailerlite:  !!import.meta.env.VITE_MAILERLITE_API_KEY,
    ga4:         !!import.meta.env.VITE_GA4_MEASUREMENT_ID,
    linkedin:    !!import.meta.env.VITE_LINKEDIN_ACCESS_TOKEN,
    meta:        !!import.meta.env.VITE_META_ACCESS_TOKEN,
  };
}
