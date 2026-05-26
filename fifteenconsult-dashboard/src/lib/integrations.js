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

// ── HUBSPOT (via Vercel serverless proxy — fixes CORS) ────────────────────────
// API key stored as HUBSPOT_API_KEY (no VITE_ prefix) in Vercel env vars
// Proxy endpoint: /api/hubspot

export async function fetchHubSpotPipeline() {
  try {
    const res = await fetch("/api/hubspot?action=pipeline");
    const data = await res.json();
    if (!res.ok) return { error: data.error || "HubSpot fetch failed" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

export async function pushContactToHubSpot({ firstName, lastName, email, company, phone, notes }) {
  try {
    const res = await fetch("/api/hubspot?action=contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, company, phone, notes }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Failed to create contact" };
    return { success: true, id: data.id };
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

// ── INSTAGRAM ────────────────────────────────────────────────────────────────────

export async function fetchInstagramProfile() {
  try {
    const r = await fetch("/api/instagram?action=profile");
    const d = await r.json();
    if (!r.ok) return { error: d.error };
    return {
      username:      d.username,
      followers:     d.followers_count || 0,
      following:     d.follows_count   || 0,
      posts:         d.media_count     || 0,
      connected:     true,
    };
  } catch (err) { return { error: err.message }; }
}

export async function fetchInstagramPosts() {
  try {
    const r = await fetch("/api/instagram?action=posts");
    const d = await r.json();
    if (!r.ok) return { error: d.error };
    const posts = (d.data || []).slice(0, 5);
    const totalLikes    = posts.reduce((s,p) => s + (p.like_count||0), 0);
    const totalComments = posts.reduce((s,p) => s + (p.comments_count||0), 0);
    const avgEngagement = posts.length > 0
      ? ((totalLikes + totalComments) / posts.length).toFixed(1)
      : 0;
    return { posts, avgEngagement, totalLikes, totalComments };
  } catch (err) { return { error: err.message }; }
}

// ── TIKTOK ────────────────────────────────────────────────────────────────────

export async function fetchTikTokInsights() {
  try {
    const r = await fetch("/api/tiktok?action=insights");
    const d = await r.json();
    if (!r.ok) return { error: d.error };
    const rows = d.list || [];
    const totalSpend       = rows.reduce((s,r) => s + parseFloat(r.metrics?.spend||0), 0);
    const totalImpressions = rows.reduce((s,r) => s + parseInt(r.metrics?.impressions||0), 0);
    const totalClicks      = rows.reduce((s,r) => s + parseInt(r.metrics?.clicks||0), 0);
    return {
      totalSpend:       totalSpend.toFixed(2),
      totalImpressions,
      totalClicks,
      avgCTR:           totalImpressions > 0
        ? ((totalClicks/totalImpressions)*100).toFixed(2) + "%"
        : "—",
      connected: true,
    };
  } catch (err) { return { error: err.message }; }
}

// ── PAGESPEED ─────────────────────────────────────────────────────────────────────

export async function fetchPageSpeed(strategy = "mobile") {
  try {
    const r = await fetch(`/api/pagespeed?url=https://fifteenconsult.com&strategy=${strategy}`);
    const d = await r.json();
    if (!r.ok) return { error: d.error };
    return d;
  } catch (err) { return { error: err.message }; }
}

// ── GOOGLE SEARCH CONSOLE ─────────────────────────────────────────────────────

export async function fetchGSCOverview() {
  try {
    const r = await fetch("/api/searchconsole?action=overview");
    const d = await r.json();
    if (!r.ok) return { error: d.error };
    return d;
  } catch (err) { return { error: err.message }; }
}

export async function fetchGSCKeywords() {
  try {
    const r = await fetch("/api/searchconsole?action=keywords");
    const d = await r.json();
    if (!r.ok) return { error: d.error };
    return d;
  } catch (err) { return { error: err.message }; }
}

// ── META ADS (Official MCP) ──────────────────────────────────────────────────────

export async function fetchMetaAdsPerformance() {
  try {
    const r = await fetch("/api/metaads?action=performance");
    const d = await r.json();
    if (d.pending) return { pending: true, message: d.message };
    if (!r.ok) return { error: d.error };
    return d;
  } catch (err) { return { error: err.message }; }
}

export async function fetchMetaAdsAnomalies() {
  try {
    const r = await fetch("/api/metaads?action=anomalies");
    const d = await r.json();
    if (d.pending) return { pending: true, message: d.message };
    if (!r.ok) return { error: d.error };
    return d;
  } catch (err) { return { error: err.message }; }
}

// ── ADADVISOR ────────────────────────────────────────────────────────────────────

export async function fetchAdAdvisorPerformance() {
  try {
    const r = await fetch("/api/adadvisor?action=performance");
    const d = await r.json();
    if (!r.ok) return { error: d.error };
    return d;
  } catch (err) { return { error: err.message }; }
}

export async function fetchAdAdvisorInsights() {
  try {
    const r = await fetch("/api/adadvisor?action=insights");
    const d = await r.json();
    if (!r.ok) return { error: d.error };
    return d;
  } catch (err) { return { error: err.message }; }
}

// ── CONNECTION STATUS ─────────────────────────────────────────────────────────

export function getConnectionStatuses() {
  return {
    hubspot:    true,
    mailerlite: !!import.meta.env.VITE_MAILERLITE_API_KEY,
    linkedin:   !!(import.meta.env.VITE_LINKEDIN_ACCESS_TOKEN && import.meta.env.VITE_LINKEDIN_ORG_ID),
    ga4:        !!import.meta.env.VITE_GA4_MEASUREMENT_ID,
    meta:       true,
    pagespeed:  true, // Free — no key needed for basic usage
    gsc:        !!(import.meta.env.VITE_GSC_CONFIGURED || import.meta.env.GA4_REFRESH_TOKEN),
    semrush:    true, // Via Claude MCP
    schema:     true, // Free — scans page directly, no key needed
    trends:     true, // Free — Google Trends web fetch, no key needed
    make:       !!import.meta.env.VITE_MAKE_WEBHOOK_URL,
    instagram:  !!import.meta.env.VITE_INSTAGRAM_CONNECTED,
    tiktok:     !!import.meta.env.VITE_TIKTOK_CONNECTED,
    adadvisor:  !!import.meta.env.VITE_ADADVISOR_CONNECTED,
  };
}

// ── LINKEDIN ──────────────────────────────────────────────────────────────────
// Uses LinkedIn Pages API to pull follower count + recent post engagement
// Requires: VITE_LINKEDIN_ACCESS_TOKEN + VITE_LINKEDIN_ORG_ID

const LI_BASE = "https://api.linkedin.com/v2";
const LI_KEY  = () => import.meta.env.VITE_LINKEDIN_ACCESS_TOKEN;
const LI_ORG  = () => import.meta.env.VITE_LINKEDIN_ORG_ID;

export async function fetchLinkedInStats() {
  const key = LI_KEY();
  const org = LI_ORG();
  if (!key || !org) return { error: "Add VITE_LINKEDIN_ACCESS_TOKEN and VITE_LINKEDIN_ORG_ID to Vercel." };

  try {
    // Follower count
    const followersRes = await fetch(
      `${LI_BASE}/networkSizes/urn:li:organization:${org}?edgeType=CompanyFollowedByMember`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    const followersData = await followersRes.json();

    // Recent posts (last 5)
    const postsRes = await fetch(
      `${LI_BASE}/shares?q=owners&owners=urn:li:organization:${org}&count=5`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    const postsData = await postsRes.json();

    const totalFollowers = followersData.firstDegreeSize || 0;
    const posts = postsData.elements || [];

    return {
      totalFollowers,
      postsCount: posts.length,
      latestPost: posts[0]?.text?.text?.slice(0, 100) || null,
      connected:  true,
    };
  } catch (err) {
    return { error: err.message };
  }
}

// ── GA4 SETUP GUIDE ───────────────────────────────────────────────────────────
// GA4 requires a backend proxy (no direct browser API access).
// This returns setup instructions and a status check.

export function getGA4SetupSteps() {
  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;
  return {
    connected: !!measurementId,
    measurementId,
    steps: [
      {
        step: 1,
        title: "Create GA4 Property",
        detail: "Go to analytics.google.com → Admin → Create Property → Select 'Web' → Enter fifteenconsult.com",
        done: false,
      },
      {
        step: 2,
        title: "Install on Webflow",
        detail: "In Webflow: Site Settings → Custom Code → Head Code → Paste your GA4 tracking snippet (G-XXXXXXXXXX)",
        done: false,
      },
      {
        step: 3,
        title: "Add Measurement ID to Vercel",
        detail: "Vercel → Environment Variables → Add VITE_GA4_MEASUREMENT_ID = G-XXXXXXXXXX",
        done: !!measurementId,
      },
      {
        step: 4,
        title: "Create GA4 API Credentials",
        detail: "Google Cloud Console → Enable Analytics Data API → Create Service Account → Download JSON key",
        done: false,
      },
      {
        step: 5,
        title: "Add API Key to Vercel",
        detail: "Vercel → Environment Variables → Add VITE_GA4_API_SECRET from your service account JSON",
        done: false,
      },
    ],
  };
}

// ── GA4 LIVE DATA ────────────────────────────────────────────────────────────

export async function fetchGA4Stats() {
  try {
    const res = await fetch("/api/ga4");
    const data = await res.json();
    if (!res.ok) return { error: data.error || "GA4 fetch failed" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

// ── META ADS SETUP GUIDE ──────────────────────────────────────────────────────
export function getMetaSetupSteps() {
  const token = import.meta.env.VITE_META_ACCESS_TOKEN;
  return {
    connected: !!token,
    steps: [
      {
        step: 1,
        title: "Create Meta Business Account",
        detail: "Go to business.facebook.com → Create account for FifteenConsult if not already done",
        done: false,
      },
      {
        step: 2,
        title: "Get Access Token",
        detail: "Meta for Developers → My Apps → Create App → Marketing API → Generate long-lived token with ads_read permission",
        done: false,
      },
      {
        step: 3,
        title: "Add to Vercel",
        detail: "Vercel → Environment Variables → Add VITE_META_ACCESS_TOKEN and VITE_META_AD_ACCOUNT_ID",
        done: !!token,
      },
      {
        step: 4,
        title: "Launch First Campaign",
        detail: "Once ads are running, the dashboard will show live spend, CPL, and ROAS per campaign",
        done: false,
      },
    ],
  };
}
