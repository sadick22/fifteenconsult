/**
 * prompts.js
 * Preset focus directives and smart suggestions for each agent.
 *
 * FifteenConsult is a marketing consultancy seeking clients in Qatar/GCC.
 * All directives are framed around: winning new business, staying visible,
 * producing content that attracts Real Estate, SaaS, Hospitality, and SME
 * clients, and building the FifteenConsult brand.
 */

// ── PRESET DIRECTIVES PER AGENT ───────────────────────────────────────────────
// Each preset has: id, label, prompt, icon, category
export const AGENT_PRESETS = {

  nadia: [
    {
      id: "re_content",
      icon: "🏗",
      label: "Real Estate focus",
      category: "Industry",
      prompt: "Focus entirely on Real Estate content today. Write a LinkedIn post targeting property developers and real estate agencies in Qatar — lead with a market insight, not a pitch. Reference current Qatar real estate market conditions.",
    },
    {
      id: "saas_content",
      icon: "💻",
      label: "SaaS/Tech focus",
      category: "Industry",
      prompt: "Focus on SaaS and tech companies entering the GCC market. Write a LinkedIn post about a common marketing mistake B2B tech companies make when launching in Qatar/UAE.",
    },
    {
      id: "hospitality_content",
      icon: "🏨",
      label: "Hospitality focus",
      category: "Industry",
      prompt: "Focus on hospitality and tourism content. Qatar is a major destination post-World Cup. Write content targeting hotel and tourism brand marketing decision makers.",
    },
    {
      id: "case_study",
      icon: "📋",
      label: "Case study update",
      category: "Content Type",
      prompt: "Draft an update or new case study for one of our existing clients: Coreo Real Estate, Nappy Qatar, Elite Escape Tourism, Base Intelligent Communities, or African Languages Lab. Choose the one most likely to attract similar clients.",
    },
    {
      id: "fifteen_framework",
      icon: "15",
      label: "Fifteen Framework",
      category: "Content Type",
      prompt: "Create content specifically about The Fifteen Framework — FifteenConsult's proprietary approach built around 15 minutes of executive attention, 15 key metrics, and 15 strategic pillars. This is our primary differentiator and needs more visibility.",
    },
    {
      id: "newsletter",
      icon: "📧",
      label: "Write newsletter",
      category: "Content Type",
      prompt: "Draft this week's email newsletter for FifteenConsult. Angle: one actionable marketing insight for GCC businesses. Keep it under 400 words. Strong subject line. Clear CTA to book a strategy call.",
    },
    {
      id: "thought_leadership",
      icon: "💡",
      label: "Thought leadership",
      category: "Content Type",
      prompt: "Write a bold, opinionated LinkedIn post from FifteenConsult's POV — something that challenges conventional marketing wisdom in the GCC market. Challenger brand tone. No fluff.",
    },
    {
      id: "end_of_month",
      icon: "📅",
      label: "End of month push",
      category: "Timing",
      prompt: "End of month is approaching. Create content that drives urgency — position FifteenConsult as the partner businesses need to hit their Q targets. Focus on lead generation messaging.",
    },
  ],

  tariq: [
    {
      id: "technical_audit",
      icon: "🔧",
      label: "Technical audit",
      category: "Task",
      prompt: "Run a full technical SEO audit focus today. Identify the top 5 technical issues on fifteenconsult.com that are hurting our ability to rank for 'marketing consultancy Qatar'. Give specific fix instructions for each.",
    },
    {
      id: "keyword_research",
      icon: "🔑",
      label: "Keyword research",
      category: "Task",
      prompt: "Focus on keyword research for FifteenConsult. Find the 10 highest-opportunity keywords we're not currently ranking for — specifically terms that Real Estate developers, SaaS companies, and hospitality brands in Qatar would search when looking for a marketing partner.",
    },
    {
      id: "competitor_seo",
      icon: "🕵️",
      label: "Competitor analysis",
      category: "Task",
      prompt: "Research what marketing consultancies in Qatar and GCC are ranking for that we aren't. Identify the top 3 competitors' SEO strategies and what FifteenConsult needs to do to outrank them.",
    },
    {
      id: "blog_brief",
      icon: "📝",
      label: "Blog brief for Nadia",
      category: "Output",
      prompt: "Write a detailed SEO blog brief for Nadia. The article must target a high-value keyword for 'marketing consultancy Qatar' or related terms. Include: target keyword, search intent, outline with H2s, internal link suggestions, and word count.",
    },
    {
      id: "ai_seo",
      icon: "🤖",
      label: "AI search visibility",
      category: "Task",
      prompt: "Focus on AI search visibility. How do we make FifteenConsult appear when someone asks ChatGPT or Perplexity 'who are the best marketing consultancies in Qatar?' Give specific actions to improve our AI search presence.",
    },
    {
      id: "backlinks",
      icon: "🔗",
      label: "Backlink opportunities",
      category: "Task",
      prompt: "Focus on finding backlink opportunities for fifteenconsult.com. Identify 5 GCC-based business publications, directories, or websites where we could get listed or contribute guest content. Include contact approach.",
    },
  ],

  sara: [
    {
      id: "linkedin_growth",
      icon: "📈",
      label: "LinkedIn growth sprint",
      category: "Platform",
      prompt: "Focus entirely on LinkedIn growth today. Our follower count needs to grow faster to build credibility with target clients. Plan: who to engage, what to comment on, who to connect with, and what to post — all targeting CMOs, founders, and marketing directors in Qatar/GCC.",
    },
    {
      id: "instagram_push",
      icon: "📸",
      label: "Instagram content push",
      category: "Platform",
      prompt: "Focus on Instagram today. Plan 3 pieces of Instagram content that showcase FifteenConsult's work and expertise — reels, carousels, or stories. Target: brand awareness among Qatar business community and potential talent.",
    },
    {
      id: "engagement_campaign",
      icon: "💬",
      label: "Engagement campaign",
      category: "Strategy",
      prompt: "Plan a targeted engagement campaign for this week. Identify the top 20 Qatar/GCC business accounts we should be commenting on meaningfully. Draft 5 high-quality comments we can use. Goal: get noticed by decision makers who could hire FifteenConsult.",
    },
    {
      id: "re_sector_social",
      icon: "🏗",
      label: "Real Estate sector push",
      category: "Industry",
      prompt: "Focus all social activity today on the Real Estate sector. Identify Real Estate developers and property companies in Qatar we should be engaging with on LinkedIn. Draft content specifically for this audience.",
    },
    {
      id: "content_calendar",
      icon: "📅",
      label: "Build content calendar",
      category: "Planning",
      prompt: "Build FifteenConsult's complete social media content calendar for the next 2 weeks. Include: platform, content type, topic, and target audience for each post. Mix of LinkedIn, Instagram, and Facebook. Ensure variety across our 4 target industries.",
    },
    {
      id: "viral_post",
      icon: "🔥",
      label: "High-engagement post",
      category: "Content",
      prompt: "Write one high-potential LinkedIn post designed to go viral within the Qatar/GCC business community. Use our challenger brand voice. Strong hook, opinionated take, clear engagement driver. Topic: a marketing truth that most GCC businesses ignore.",
    },
  ],

  kwame: [
    {
      id: "re_prospecting",
      icon: "🏗",
      label: "Real Estate prospects",
      category: "Sector",
      prompt: "Focus entirely on Real Estate prospecting today. Research 10 property developers, real estate agencies, or property management firms in Qatar that need marketing support. For each: company name, key decision maker, their likely marketing challenge, and a personalised outreach angle.",
    },
    {
      id: "saas_prospecting",
      icon: "💻",
      label: "SaaS/Tech prospects",
      category: "Sector",
      prompt: "Focus on SaaS and B2B tech companies entering or operating in the GCC market. Research 10 prospects. Prioritise companies that have recently launched in Qatar/UAE or are expanding into the region — they urgently need local marketing expertise.",
    },
    {
      id: "hospitality_prospecting",
      icon: "🏨",
      label: "Hospitality prospects",
      category: "Sector",
      prompt: "Focus on hospitality sector prospecting. Qatar has a major tourism push underway. Research 10 hotels, tourism operators, or F&B groups in Qatar that would benefit from FifteenConsult's marketing expertise.",
    },
    {
      id: "follow_up",
      icon: "🔄",
      label: "Follow-up queue",
      category: "Pipeline",
      prompt: "Focus entirely on the follow-up queue today. Draft touch-2 and touch-3 follow-up messages for all leads in the 'Contacted' stage. Use the challenger approach — each message should add new value, not just chase a reply.",
    },
    {
      id: "cold_email_sequence",
      icon: "📧",
      label: "Build outreach sequence",
      category: "Output",
      prompt: "Write a full 3-touch cold outreach email sequence for FifteenConsult targeting Real Estate developers in Qatar. Touch 1: challenger insight. Touch 2: relevant case study or proof. Touch 3: direct ask for a call. Each email under 150 words.",
    },
    {
      id: "competitor_intel",
      icon: "🕵️",
      label: "Competitor intelligence",
      category: "Research",
      prompt: "Compile a competitive intelligence report on marketing consultancies and agencies operating in Qatar and GCC. Who are the main competitors to FifteenConsult? What are their positioning, pricing signals, and weaknesses we can exploit?",
    },
    {
      id: "book_calls",
      icon: "📞",
      label: "Book calls — urgent",
      category: "Pipeline",
      prompt: "Pipeline is thin — we need discovery calls booked urgently. Focus all energy on moving leads from 'Contacted' to 'Call Booked'. Draft specific, personalised messages for the 5 most promising leads. Make asking for a call the only goal today.",
    },
  ],

  amara: [
    {
      id: "linkedin_templates",
      icon: "📐",
      label: "LinkedIn templates",
      category: "Asset",
      prompt: "Create detailed design briefs for 3 LinkedIn post templates for FifteenConsult. Each should work for a different content type: (1) insight/stat post, (2) case study highlight, (3) thought leadership opinion. Include exact layout, colour usage, typography specs.",
    },
    {
      id: "pitch_deck",
      icon: "📊",
      label: "Pitch deck update",
      category: "Asset",
      prompt: "Focus on the FifteenConsult pitch deck design. We use this to pitch to potential clients — Real Estate developers, SaaS companies, hospitality brands. Brief the design for a premium, challenger consultancy feel. Key slides: problem, The Fifteen Framework, case studies, team, pricing.",
    },
    {
      id: "fifteen_framework_visual",
      icon: "15",
      label: "Fifteen Framework visual",
      category: "Asset",
      prompt: "Design brief for a visual explainer of The Fifteen Framework. This is FifteenConsult's primary differentiator — 15 minutes of executive attention, 15 key metrics, 15 strategic pillars. Should work as both a standalone asset and within presentations.",
    },
    {
      id: "case_study_design",
      icon: "📋",
      label: "Case study visual",
      category: "Asset",
      prompt: "Create a design brief for a case study visual template. FifteenConsult needs to showcase client work — Coreo Real Estate, Nappy Qatar, Elite Escape Tourism — in a premium format. Should work on LinkedIn, in proposals, and on the website.",
    },
    {
      id: "brand_audit",
      icon: "🔍",
      label: "Brand audit",
      category: "Review",
      prompt: "Conduct a full brand consistency audit of FifteenConsult's recent social media posts and website. Flag anything off-brand. Check: colour usage, typography, tone, photography style, logo usage. Give specific corrections.",
    },
    {
      id: "ad_creative",
      icon: "📣",
      label: "Ad creative for Hassan",
      category: "Asset",
      prompt: "Create design briefs for 3 ad creative variants for Hassan to A/B test. One for LinkedIn, one for Meta. Each should communicate FifteenConsult's value proposition to Real Estate or SaaS decision makers in Qatar. Include copy direction too.",
    },
  ],

  hassan: [
    {
      id: "linkedin_campaign",
      icon: "💼",
      label: "LinkedIn campaign setup",
      category: "Platform",
      prompt: "Focus on setting up FifteenConsult's LinkedIn Lead Gen campaign. Target: Marketing Directors, CMOs, and Founders at Real Estate developers and SaaS companies in Qatar and UAE. Offer: free marketing audit. Write the full campaign brief including targeting, format, budget, and ad copy.",
    },
    {
      id: "meta_retargeting",
      icon: "🎯",
      label: "Meta retargeting",
      category: "Platform",
      prompt: "Set up Meta retargeting for fifteenconsult.com visitors. Anyone who has visited the site should see FifteenConsult case studies and social proof in their Facebook/Instagram feed. Brief the full campaign: audience, creative direction, budget allocation.",
    },
    {
      id: "google_search",
      icon: "🔍",
      label: "Google Search campaign",
      category: "Platform",
      prompt: "Optimise FifteenConsult's Google Search campaign. We need to appear when people search 'marketing consultancy Qatar', 'marketing agency Doha', 'brand strategy Qatar'. Review keywords, ad copy, bidding strategy, and landing page alignment.",
    },
    {
      id: "reduce_cpl",
      icon: "📉",
      label: "Reduce CPL",
      category: "Optimisation",
      prompt: "CPL needs to come down. Audit all active campaigns and identify exactly why cost per lead is high. Give specific, actionable fixes — not generic advice. Which audiences to cut, which creatives to pause, which bids to adjust.",
    },
    {
      id: "ab_test",
      icon: "⚗️",
      label: "A/B test — new creative",
      category: "Optimisation",
      prompt: "Design an A/B test for this week. Write 2 completely different ad copy approaches for the same audience — one leading with a pain point, one leading with a result/outcome. We want to find what messaging resonates most with Qatar business decision makers.",
    },
    {
      id: "re_campaign",
      icon: "🏗",
      label: "Real Estate campaign",
      category: "Sector",
      prompt: "Build a campaign specifically targeting Real Estate decision makers in Qatar — developers, property management firms, and agencies. This is our primary target sector. LinkedIn + Meta. Full campaign brief: targeting, creative, offer, budget.",
    },
  ],

  zara: [
    {
      id: "full_report",
      icon: "📊",
      label: "Full weekly report",
      category: "Report",
      prompt: "Generate a comprehensive weekly performance report for FifteenConsult. Cover all channels: website, social, leads, email, paid ads. Rate each channel green/amber/red. Give 3 specific recommended actions for next week based on the data.",
    },
    {
      id: "pipeline_report",
      icon: "🎯",
      label: "Pipeline report",
      category: "Report",
      prompt: "Focus on the lead pipeline report. How many leads did FifteenConsult generate this week? From which sources? What's the conversion rate from lead to discovery call? What's the biggest bottleneck in our sales funnel right now?",
    },
    {
      id: "content_performance",
      icon: "✍️",
      label: "Content performance",
      category: "Report",
      prompt: "Analyse FifteenConsult's content performance across LinkedIn, Instagram, and blog. What's working? What's not? Which content types and topics are driving the most engagement with our target audience? What should Nadia focus on next week?",
    },
    {
      id: "ad_performance",
      icon: "📣",
      label: "Ad performance deep dive",
      category: "Report",
      prompt: "Deep dive into paid ads performance. Break down CPL, ROAS, and conversion rates by platform (LinkedIn, Meta, Google). Which campaigns are profitable? Which should be cut? Give Hassan specific instructions based on the data.",
    },
    {
      id: "monthly_review",
      icon: "📅",
      label: "Month-end review",
      category: "Report",
      prompt: "Generate FifteenConsult's month-end performance review. How did we perform against all targets this month? Pipeline, content, social growth, SEO, paid ads. What do we need to do differently next month to hit our new business goals?",
    },
    {
      id: "ga4_setup",
      icon: "⚙️",
      label: "GA4 + HubSpot setup",
      category: "Setup",
      prompt: "Focus on completing the analytics infrastructure. What's still missing? Give step-by-step instructions for connecting GA4, HubSpot, MailerLite, and social analytics into a unified view. Prioritise what will give us the most insight fastest.",
    },
  ],
};

// ── SMART SUGGESTIONS ─────────────────────────────────────────────────────────
// Context-aware suggestions based on day of week, time of month, alerts
export function getSmartSuggestions(agentId, dateContext, alerts) {
  const suggestions = [];
  const agentAlerts = alerts.filter(a => a.agent === agentId);

  // Day-of-week suggestions
  const dow = new Date().getDay();
  const isMonday    = dow === 1;
  const isFriday    = dow === 5;
  const isThursday  = dow === 4;
  const isEndOfMonth = dateContext.daysLeftInMonth <= 5;
  const isEndOfWeek  = dow === 4 || dow === 5;

  if (isMonday) {
    if (agentId === "nadia")  suggestions.push({ text: "Monday — plan the full week's content calendar first", icon: "📅" });
    if (agentId === "kwame")  suggestions.push({ text: "Monday — research new prospects to fill this week's outreach quota", icon: "🔍" });
    if (agentId === "hassan") suggestions.push({ text: "Monday — review weekend ad performance and set this week's targets", icon: "📊" });
  }

  if (isThursday || isFriday) {
    if (agentId === "zara")   suggestions.push({ text: "End of GCC working week — generate weekly performance report", icon: "📋" });
    if (agentId === "kwame")  suggestions.push({ text: "End of week — follow up all leads before the weekend", icon: "🔄" });
    if (agentId === "hassan") suggestions.push({ text: "End of week — pause underperforming ads before weekend spend", icon: "⏸" });
  }

  if (isEndOfMonth) {
    suggestions.push({ text: `${dateContext.daysLeftInMonth} days left in month — end of month push`, icon: "🚨" });
  }

  // Alert-based suggestions
  agentAlerts.forEach(alert => {
    if (alert.level === "red") {
      suggestions.push({ text: `Critical: ${alert.title}`, icon: "🚨" });
    }
  });

  // GCC seasonal
  if (dateContext.month === "March" || dateContext.month === "April") {
    if (agentId === "nadia") suggestions.push({ text: "Post-Ramadan/Eid — strong engagement period in GCC", icon: "🌙" });
    if (agentId === "hassan") suggestions.push({ text: "Post-Eid — high ad engagement window in Qatar", icon: "📈" });
  }

  return suggestions.slice(0, 3);
}

// ── SAVED CUSTOM PROMPTS ──────────────────────────────────────────────────────
const SAVED_PROMPTS_KEY = "fc_saved_prompts";

export function getSavedPrompts(agentId) {
  try {
    const all = JSON.parse(localStorage.getItem(SAVED_PROMPTS_KEY) || "{}");
    return all[agentId] || [];
  } catch { return []; }
}

export function saveCustomPrompt(agentId, prompt) {
  try {
    const all = JSON.parse(localStorage.getItem(SAVED_PROMPTS_KEY) || "{}");
    if (!all[agentId]) all[agentId] = [];
    // Avoid duplicates
    if (!all[agentId].includes(prompt)) {
      all[agentId] = [prompt, ...all[agentId]].slice(0, 10);
    }
    localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(all));
  } catch {}
}

export function deleteSavedPrompt(agentId, prompt) {
  try {
    const all = JSON.parse(localStorage.getItem(SAVED_PROMPTS_KEY) || "{}");
    if (all[agentId]) {
      all[agentId] = all[agentId].filter(p => p !== prompt);
    }
    localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(all));
  } catch {}
}
