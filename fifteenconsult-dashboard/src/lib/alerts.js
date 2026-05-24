/**
 * alerts.js
 * KPI alert engine for FifteenConsult.
 *
 * FifteenConsult is a marketing consultancy seeking clients.
 * Alerts are framed around: winning new business, staying visible,
 * nurturing pipeline, and producing enough content to attract
 * Real Estate, SaaS, Hospitality, and SME clients in GCC.
 */

// ── ALERT LEVELS ─────────────────────────────────────────────────────────────
export const ALERT = {
  RED:    "red",    // Critical — action needed today
  AMBER:  "amber",  // Warning — needs attention this week
  GREEN:  "green",  // On track
  BLUE:   "blue",   // Informational / milestone
};

// ── ALERT COLOURS ─────────────────────────────────────────────────────────────
export const ALERT_COLORS = {
  red:   "#f87171",
  amber: "#fbbf24",
  green: "#4ade80",
  blue:  "#60a5fa",
};

/**
 * Evaluate ALL KPI alerts across the entire department.
 * Returns an array of alert objects sorted by severity.
 *
 * @param {object} kpiData - live KPI values keyed by agent id
 * @param {object} taskStates - task completion states
 * @param {object} outputs - latest briefing outputs
 * @returns {Alert[]}
 */
export function evaluateAlerts(kpiData, taskStates, outputs) {
  const alerts = [];
  const today  = new Date();
  const dow    = today.getDay(); // 0=Sun, 5=Fri, 6=Sat
  const dayOfMonth = today.getDate();
  const lastDay    = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
  const daysLeft   = lastDay - dayOfMonth;
  const isEndOfMonth = daysLeft <= 5;
  const isEndOfWeek  = dow === 4 || dow === 5; // Thu/Fri GCC end of week

  // ── PIPELINE & LEAD GEN (Kwame) ───────────────────────────────────────────
  const kwame = kpiData.kwame || {};

  if ((kwame.meetingsBooked || 0) === 0) {
    alerts.push({
      id: "no_meetings",
      level: ALERT.RED,
      agent: "kwame",
      agentName: "Kwame Asante",
      emoji: "🎯",
      title: "Zero discovery calls booked",
      detail: "No strategy calls booked this week. FifteenConsult cannot win clients without conversations. Kwame must prioritise outreach and follow-ups today.",
      action: "Run Kwame's briefing and instruct: 'Focus entirely on booking calls — follow up all touch-2 and touch-3 leads today.'",
    });
  } else if ((kwame.meetingsBooked || 0) < 2) {
    alerts.push({
      id: "low_meetings",
      level: ALERT.AMBER,
      agent: "kwame",
      agentName: "Kwame Asante",
      emoji: "🎯",
      title: `Only ${kwame.meetingsBooked} discovery call booked — target is 3`,
      detail: "Pipeline is thin. Below 3 calls/week means FifteenConsult won't hit its client acquisition targets.",
      action: "Ask Kwame to draft follow-up messages for all leads in 'Contacted' stage.",
    });
  }

  if ((kwame.responseRate || 0) < 10) {
    alerts.push({
      id: "low_response_rate",
      level: ALERT.AMBER,
      agent: "kwame",
      agentName: "Kwame Asante",
      emoji: "🎯",
      title: `Outreach response rate at ${kwame.responseRate || 0}% — below 10%`,
      detail: "Response rate is weak. Messaging likely not hitting the right pain points for GCC Real Estate / SaaS decision makers.",
      action: "Ask Kwame to rewrite the outreach sequence using stronger challenger-style hooks.",
    });
  }

  if ((kwame.leadsResearched || 0) < 25) {
    alerts.push({
      id: "low_prospects",
      level: ALERT.AMBER,
      agent: "kwame",
      agentName: "Kwame Asante",
      emoji: "🎯",
      title: "Prospect research behind target",
      detail: `Only ${kwame.leadsResearched || 0} of 50 prospects researched this week. Thin top-of-funnel means fewer conversations next week.`,
      action: "Run Kwame with directive: 'Research 10 Real Estate and 10 Hospitality prospects in Qatar today.'",
    });
  }

  // ── CONTENT PRODUCTION (Nadia) ─────────────────────────────────────────────
  const nadia = kpiData.nadia || {};

  if ((nadia.postsPerWeek || 0) < 2) {
    alerts.push({
      id: "low_content",
      level: ALERT.RED,
      agent: "nadia",
      agentName: "Nadia Al-Hassan",
      emoji: "✍️",
      title: `Only ${nadia.postsPerWeek || 0} LinkedIn posts published — target 4`,
      detail: "FifteenConsult's visibility to potential clients is critically low. Decision makers in Qatar/GCC won't know we exist without consistent content.",
      action: "Run Nadia immediately. Ask her to produce 2 LinkedIn posts: one Real Estate insight, one SaaS marketing tip.",
    });
  }

  if ((nadia.newsletterDrafts || 0) === 0) {
    alerts.push({
      id: "no_newsletter",
      level: ALERT.AMBER,
      agent: "nadia",
      agentName: "Nadia Al-Hassan",
      emoji: "✍️",
      title: "No email newsletter drafted this week",
      detail: "The newsletter nurtures warm leads who have heard of FifteenConsult but haven't hired us yet. Missing it weakens the pipeline.",
      action: "Ask Nadia to draft this week's newsletter — angle: 'One marketing mistake GCC businesses make in Q2.'",
    });
  }

  if ((nadia.engagementRate || 0) < 3) {
    alerts.push({
      id: "low_engagement",
      level: ALERT.AMBER,
      agent: "nadia",
      agentName: "Nadia Al-Hassan",
      emoji: "✍️",
      title: `Content engagement at ${nadia.engagementRate || 0}% — below 3%`,
      detail: "Low engagement means content isn't resonating with target clients. Posts need stronger hooks and more specific GCC market insight.",
      action: "Ask Nadia to review top-performing posts and adjust the content angle for the next 3 posts.",
    });
  }

  // ── SEO (Tariq) ────────────────────────────────────────────────────────────
  const tariq = kpiData.tariq || {};

  if ((tariq.organicVisits || 0) < 100) {
    alerts.push({
      id: "critical_seo_traffic",
      level: ALERT.RED,
      agent: "tariq",
      agentName: "Tariq Osman",
      emoji: "🔍",
      title: "Website organic traffic critically low",
      detail: `Only ${tariq.organicVisits || 0} organic visits this month. Prospects searching 'marketing agency Qatar' are not finding FifteenConsult.`,
      action: "Ask Tariq to audit the homepage and top 2 service pages for keyword gaps today.",
    });
  } else if ((tariq.organicVisits || 0) < 250) {
    alerts.push({
      id: "low_seo_traffic",
      level: ALERT.AMBER,
      agent: "tariq",
      agentName: "Tariq Osman",
      emoji: "🔍",
      title: "Organic traffic below halfway to monthly target",
      detail: `${tariq.organicVisits || 0} of 500 target visits. FifteenConsult needs stronger search visibility to attract inbound client enquiries.`,
      action: "Ask Tariq for the top 3 quick-win SEO actions for fifteenconsult.com this week.",
    });
  }

  if ((tariq.backlinksBuilt || 0) < 2) {
    alerts.push({
      id: "no_backlinks",
      level: ALERT.AMBER,
      agent: "tariq",
      agentName: "Tariq Osman",
      emoji: "🔍",
      title: "No backlinks built this week",
      detail: "Domain authority stays low without backlinks. Less authority = harder to rank for 'marketing consultancy Qatar'.",
      action: "Ask Tariq to identify 3 GCC business publications for guest post outreach.",
    });
  }

  // ── SOCIAL MEDIA (Sara) ────────────────────────────────────────────────────
  const sara = kpiData.sara || {};

  if ((sara.linkedinFollowers || 347) < 300) {
    alerts.push({
      id: "low_linkedin",
      level: ALERT.RED,
      agent: "sara",
      agentName: "Sara Mensah",
      emoji: "📱",
      title: "LinkedIn following too low to attract clients",
      detail: "Target clients (CMOs, founders, marketing directors in Qatar) need to see FifteenConsult as established. Under 300 followers undermines credibility.",
      action: "Ask Sara to run a LinkedIn growth sprint: engage 20 target accounts today + invite connections.",
    });
  }

  if ((sara.avgEngagement || 0) < 2) {
    alerts.push({
      id: "low_social_engagement",
      level: ALERT.AMBER,
      agent: "sara",
      agentName: "Sara Mensah",
      emoji: "📱",
      title: `Social engagement at ${sara.avgEngagement || 0}% — too low to generate inbound`,
      detail: "Posts aren't driving enough interaction. Low engagement = LinkedIn algorithm won't show posts to target clients.",
      action: "Ask Sara to audit the last 5 posts and identify what's underperforming. Shift to more opinionated, GCC-specific content.",
    });
  }

  // ── PAID ADS (Hassan) ──────────────────────────────────────────────────────
  const hassan = kpiData.hassan || {};

  if ((hassan.costPerLead || 0) > 150) {
    alerts.push({
      id: "high_cpl",
      level: ALERT.RED,
      agent: "hassan",
      agentName: "Hassan Al-Amin",
      emoji: "📊",
      title: `CPL at QAR ${hassan.costPerLead} — above QAR 150 threshold`,
      detail: "Paid acquisition is too expensive. At this rate, ad spend won't generate profitable client enquiries for FifteenConsult.",
      action: "Run Hassan immediately. Ask him to audit targeting, pause underperformers, and tighten audience segments.",
    });
  }

  if ((hassan.campaignsActive || 0) < 2) {
    alerts.push({
      id: "low_campaigns",
      level: ALERT.AMBER,
      agent: "hassan",
      agentName: "Hassan Al-Amin",
      emoji: "📊",
      title: `Only ${hassan.campaignsActive || 0} campaigns active — target is 4`,
      detail: "FifteenConsult isn't running enough paid activity to fill the pipeline. More campaigns = more touchpoints with potential clients.",
      action: "Ask Hassan to set up the LinkedIn Lead Gen campaign and Meta retargeting campaign this week.",
    });
  }

  if ((hassan.roas || 0) < 2 && (hassan.campaignsActive || 0) > 0) {
    alerts.push({
      id: "low_roas",
      level: ALERT.AMBER,
      agent: "hassan",
      agentName: "Hassan Al-Amin",
      emoji: "📊",
      title: `ROAS at ${hassan.roas}x — below 2x minimum`,
      detail: "Ad spend is not generating enough return. Creative or targeting needs immediate review.",
      action: "Ask Hassan to A/B test new ad creative this week and review audience segments.",
    });
  }

  // ── ANALYTICS (Zara) ───────────────────────────────────────────────────────
  const zara = kpiData.zara || {};

  if ((zara.dataSourcesConnected || 0) < 4) {
    alerts.push({
      id: "data_gaps",
      level: ALERT.AMBER,
      agent: "zara",
      agentName: "Zara Nkosi",
      emoji: "📈",
      title: "Data sources incomplete — blind spots in reporting",
      detail: `Only ${zara.dataSourcesConnected || 0} of 6 data sources connected. FifteenConsult can't make confident decisions without full visibility.`,
      action: "Ask Zara to prioritise connecting HubSpot and MailerLite to the reporting dashboard.",
    });
  }

  // ── END OF MONTH WARNINGS ─────────────────────────────────────────────────
  if (isEndOfMonth) {
    const totalLeads  = kwame.outreachSent || 0;
    const totalPosts  = nadia.postsPerWeek || 0;
    if (totalLeads < 15 || totalPosts < 3) {
      alerts.push({
        id: "end_of_month",
        level: ALERT.AMBER,
        agent: null,
        agentName: "All Agents",
        emoji: "📅",
        title: `End of month in ${daysLeft} days — pipeline targets at risk`,
        detail: "FifteenConsult is approaching end of month with gaps in both content output and lead generation. This affects next month's pipeline.",
        action: "Run all agents with end-of-month directive. Focus on: booking calls, publishing content, and sending final outreach.",
      });
    }
  }

  // ── BRIEFING FRESHNESS ────────────────────────────────────────────────────
  const briefingsRun = Object.keys(outputs).length;
  if (briefingsRun === 0) {
    alerts.push({
      id: "no_briefings",
      level: ALERT.AMBER,
      agent: null,
      agentName: "All Agents",
      emoji: "🔔",
      title: "No briefings run this week",
      detail: "End of GCC working week with no agent briefings run. The team has no direction and no outputs to show for this week.",
      action: "Run all agents now using the 'Run All Agents' button.",
    });
  }

  // ── POSITIVE ALERTS ───────────────────────────────────────────────────────
  if ((kwame.meetingsBooked || 0) >= 3) {
    alerts.push({
      id: "meetings_target_hit",
      level: ALERT.GREEN,
      agent: "kwame",
      agentName: "Kwame Asante",
      emoji: "🎯",
      title: "Discovery call target hit ✓",
      detail: `${kwame.meetingsBooked} discovery calls booked this week. Pipeline is healthy.`,
      action: "Ask Kwame to prepare briefing notes for each call.",
    });
  }

  if ((nadia.postsPerWeek || 0) >= 4) {
    alerts.push({
      id: "content_target_hit",
      level: ALERT.GREEN,
      agent: "nadia",
      agentName: "Nadia Al-Hassan",
      emoji: "✍️",
      title: "Content target hit ✓",
      detail: `${nadia.postsPerWeek} LinkedIn posts published. FifteenConsult is visible to potential clients.`,
      action: null,
    });
  }

  // Malik — no active campaigns
  const malikMember = kpiData.malik;
  if (!malikMember || (malikMember.activeCampaigns || 0) === 0) {
    alerts.push({ id:"malik-no-campaigns", agent:"malik", level:ALERT.AMBER, emoji:"📢",
      title:"No active ad campaigns",
      detail:"FifteenConsult has no paid campaigns running across GCC or West Africa.",
      action:"Ask Malik to build a starter campaign plan for LinkedIn lead generation." });
  }

  // Amani — no brief sent
  const amaniMember = kpiData.amani;
  if (!amaniMember || (amaniMember.weeklyBriefsSent || 0) === 0) {
    alerts.push({ id:"amani-no-brief", agent:"amani", level:ALERT.AMBER, emoji:"👑",
      title:"No CMO brief this week",
      detail:"Amani hasn't produced a consolidated executive brief yet this week.",
      action:"Activate Amani for your morning CMO briefing — she reviews all 8 agents." });
  }

  // Sort: RED first, then AMBER, then GREEN, then BLUE
  const order = { red:0, amber:1, green:2, blue:3 };
  return alerts.sort((a,b) => order[a.level] - order[b.level]);
}

/**
 * Get a summary count of alerts by level.
 */
// ── MALIK + AMANI alerts injected into evaluateAlerts ──────────────────────────
// These are checked inline with the main team data

export function getAlertSummary(alerts) {
  return {
    red:   alerts.filter(a=>a.level===ALERT.RED).length,
    amber: alerts.filter(a=>a.level===ALERT.AMBER).length,
    green: alerts.filter(a=>a.level===ALERT.GREEN).length,
    blue:  alerts.filter(a=>a.level===ALERT.BLUE).length,
    total: alerts.length,
  };
}

/**
 * Get the worst alert level across all alerts.
 * Used to colour the notification badge.
 */
export function getWorstLevel(alerts) {
  if (alerts.some(a=>a.level===ALERT.RED))   return ALERT.RED;
  if (alerts.some(a=>a.level===ALERT.AMBER)) return ALERT.AMBER;
  if (alerts.some(a=>a.level===ALERT.GREEN)) return ALERT.GREEN;
  return null;
}
