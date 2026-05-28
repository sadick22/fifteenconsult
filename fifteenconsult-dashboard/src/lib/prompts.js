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
      id: "weekly_report",
      icon: "📊",
      label: "Friday weekly report",
      category: "Report",
      prompt: "Generate the full Friday weekly performance report using all live data injected into your context. Use the exact Friday report format: Executive Summary, Website, Email, Pipeline, Social, Paid Ads, Alerts, Wins, and Top 3 Recommendations. Flag every data source that is pending as unavailable — never invent numbers.",
    },
    {
      id: "hubspot_analysis",
      icon: "🎯",
      label: "HubSpot pipeline analysis",
      category: "Analysis",
      prompt: "Analyse our HubSpot pipeline data in detail. What does the contact growth tell us? What is our lead velocity? Where are deals getting stuck? What does the pipeline health look like for Q2 close? Give 3 specific recommendations to improve pipeline performance based on the live data.",
    },
    {
      id: "email_performance",
      icon: "📧",
      label: "Email performance deep dive",
      category: "Analysis",
      prompt: "Analyse our MailerLite email performance in detail. How do our open rates and click rates compare to GCC benchmarks (25% open, 3% CTR)? What should we do differently? Which subscriber segments should we target? Give specific recommendations for the next campaign based on live data.",
    },
    {
      id: "website_health",
      icon: "🌐",
      label: "Website health report",
      category: "Report",
      prompt: "Using the PageSpeed and Schema data injected, give a complete website health assessment for fifteenconsult.com. What are the most critical performance issues? What is the SEO health score? What specific fixes should Sadick make in Webflow this week? Prioritise by impact.",
    },
    {
      id: "utm_strategy",
      icon: "🔗",
      label: "UTM tracking strategy",
      category: "Strategy",
      prompt: "Build a complete UTM tracking strategy for FifteenConsult. For each channel we use (LinkedIn, Instagram, TikTok, MailerLite, Meta Ads, Google Ads), define the exact UTM parameters to use. Create a naming convention we'll follow consistently. Explain how to use this data in GA4 to measure channel ROI.",
    },
    {
      id: "kpi_dashboard",
      icon: "📈",
      label: "Build KPI dashboard brief",
      category: "Strategy",
      prompt: "Design FifteenConsult's master KPI dashboard. What are the 15 most important metrics to track weekly? How should they be organised? What benchmarks should each metric be measured against? What alerts should fire automatically? This brief will guide how we set up Looker Studio.",
    },
    {
      id: "clarity_analysis",
      icon: "👁",
      label: "Clarity behaviour analysis",
      category: "Analysis",
      prompt: "Analyse the Microsoft Clarity behavioural data from the live feed. What do the rage clicks, dead clicks, and scroll depth tell us about how users experience fifteenconsult.com? Which pages need UX fixes? What specific changes should Sadick make in Webflow to improve user behaviour metrics?",
    },
  ],

  malik: [
    {
      id: "gccc_campaign_plan",
      icon: "📢",
      label: "GCC campaign plan",
      category: "Strategy",
      prompt: "Build a full advertising campaign plan for FifteenConsult targeting GCC decision makers. Include platform mix (LinkedIn, Meta, Snapchat), budget allocation, audience targeting, and ad formats. Focus on generating qualified leads from Real Estate and SaaS sectors in Qatar and UAE.",
    },
    {
      id: "west_africa_ads",
      icon: "🌍",
      label: "West Africa ad strategy",
      category: "Strategy",
      prompt: "Develop an advertising strategy for FifteenConsult's West Africa expansion. Focus on Nigeria (Lagos) and Ghana (Accra). Which platforms dominate? What messaging resonates? What budget makes sense for market entry? Give a specific 90-day paid media plan.",
    },
    {
      id: "snapchat_strategy",
      icon: "👻",
      label: "Snapchat for B2B Qatar",
      category: "Platform",
      prompt: "Snapchat has massive penetration in Qatar and UAE. Most B2B consultancies ignore it. Build a Snapchat advertising strategy for FifteenConsult targeting business decision makers in GCC. Is there a real opportunity here? If yes, exactly how should we use it?",
    },
    {
      id: "creative_brief",
      icon: "🎨",
      label: "Write 3 ad creative briefs",
      category: "Output",
      prompt: "Write 3 complete ad creative briefs for Hassan to execute. One for LinkedIn Sponsored Content, one for Meta (Facebook/Instagram), one for Google Display. Each brief: headline, body copy, CTA, visual direction, target audience, and success metric. All for FifteenConsult lead generation.",
    },
    {
      id: "competitor_ads",
      icon: "🕵️",
      label: "Competitor ad analysis",
      category: "Research",
      prompt: "Analyse what our competitors in the GCC marketing consultancy space are doing with their advertising. What messages are they leading with? What platforms? Where are the gaps FifteenConsult can own? Give specific recommendations to differentiate our advertising.",
    },
    {
      id: "roas_optimisation",
      icon: "📈",
      label: "ROAS optimisation plan",
      category: "Optimisation",
      prompt: "Our target ROAS is 5x. Build a step-by-step plan to hit it. Cover: which metrics to track, what ROAS benchmarks to expect by platform, how to structure campaigns for profitability, and when to scale vs when to cut. Make it specific to FifteenConsult's consultancy business model.",
    },
  ],

  amani: [
    {
      id: "morning_brief",
      icon: "☀️",
      label: "Morning CMO brief",
      category: "Daily",
      prompt: "Run your full morning CMO briefing. Review the entire department's status. Deliver the executive brief covering: urgent items, items to watch, wins to double down on, yesterday's key numbers, today's single priority, and one strategic insight about our market position.",
    },
    {
      id: "department_review",
      icon: "🔍",
      label: "Full department review",
      category: "Review",
      prompt: "Conduct a thorough review of all 8 agents' recent work. For each agent: rate their output quality, flag anything off-brand or strategically misaligned, and give one specific piece of feedback to improve. Be direct and constructive — no sugarcoating.",
    },
    {
      id: "strategy_challenge",
      icon: "⚡",
      label: "Challenge our strategy",
      category: "Strategic",
      prompt: "Challenge FifteenConsult's current marketing strategy. What assumptions are we making that could be wrong? What are we not doing that we should be? What are the 3 biggest strategic risks to FifteenConsult's growth in the next 6 months? Be a critical friend.",
    },
    {
      id: "framework_alignment",
      icon: "15",
      label: "Fifteen Framework check",
      category: "Review",
      prompt: "Audit whether the team's current activities align with the Fifteen Framework. Are we operating on 15 minutes of executive attention? Tracking the right 15 metrics? Following the 15 strategic pillars? What's missing or misaligned? Give specific corrections.",
    },
    {
      id: "monthly_roadmap",
      icon: "🗺",
      label: "30-day strategic roadmap",
      category: "Planning",
      prompt: "Build FifteenConsult's strategic marketing roadmap for the next 30 days. Prioritise activities by revenue impact. Assign clear ownership to each agent. Set measurable targets. What must happen this month to move FifteenConsult meaningfully closer to its growth targets?",
    },
    {
      id: "west_africa_plan",
      icon: "🌍",
      label: "West Africa expansion plan",
      category: "Strategic",
      prompt: "Build FifteenConsult's West Africa market entry strategy. Which country first? What's our positioning? Who are the ideal clients? What marketing approach works in Lagos or Accra vs Doha? What are the risks? Give a clear 90-day action plan.",
    },
  ],

  david: [
    {
      id: "opportunity_scan",
      icon: "🔭",
      label: "GCC opportunity scan",
      category: "Research",
      prompt: "Scan the GCC market for the top 5 business opportunities for FifteenConsult right now. Consider: companies that recently launched in Qatar, brands expanding regionally, sectors seeing increased marketing spend, and companies with obvious marketing gaps. For each opportunity: company type, revenue potential, and outreach angle.",
    },
    {
      id: "west_africa_opportunity",
      icon: "🌍",
      label: "West Africa BD analysis",
      category: "Research",
      prompt: "Identify the top 3 business development opportunities in West Africa for FifteenConsult. Which country should we enter first? Who are the ideal first clients? What's the revenue potential? What partnerships would accelerate market entry? Give a clear go/no-go recommendation with reasoning.",
    },
    {
      id: "revenue_model",
      icon: "💰",
      label: "Revenue model — next quarter",
      category: "Analysis",
      prompt: "Build FifteenConsult's revenue model for next quarter. Model 3 scenarios: conservative (1-2 new clients), base (3-4 new clients), optimistic (5+ new clients). For each scenario: expected MRR, ARR, and what needs to happen to achieve it. Include retainer vs project revenue mix.",
    },
    {
      id: "competitor_analysis",
      icon: "🕵️",
      label: "Competitive analysis",
      category: "Analysis",
      prompt: "Using the competitor intelligence available, conduct a full competitive analysis. For our direct competitors: where are we stronger? Where are we weaker? What's our most defensible differentiation? Where should we avoid competing head-to-head? Give a clear competitive positioning recommendation.",
    },
    {
      id: "partnership_strategy",
      icon: "🤝",
      label: "Partnership opportunities",
      category: "BD",
      prompt: "Identify 5 strategic partnership opportunities for FifteenConsult in GCC and West Africa. Think: tech companies who need a marketing partner, creative agencies who need strategic depth, real estate associations, business councils. For each: the partnership value, how to approach them, and expected revenue impact.",
    },
    {
      id: "document_analysis",
      icon: "📄",
      label: "Analyse uploaded documents",
      category: "Analysis",
      prompt: "Analyse all uploaded documents in your library. For each document: provide a structured assessment covering strengths, weaknesses, opportunities, and risks. Identify the top 3 actionable recommendations from each document. Cross-reference insights across all documents and identify common themes.",
    },
    {
      id: "client_expansion",
      icon: "📈",
      label: "Client expansion plan",
      category: "BD",
      prompt: "Build an expansion plan for our 5 existing clients: Coreo Real Estate, Nappy Qatar, Elite Escape Tourism, Base Intelligent Communities, and African Languages Lab. For each: what additional services could we offer? What's the upsell revenue potential? Draft a specific expansion proposal angle for the most promising one.",
    },
  ],

  sofia: [
    {
      id: "morning_personal_brief",
      icon: "☀️",
      label: "My morning briefing",
      category: "Daily",
      prompt: "Give me my complete personal morning briefing. Top 3 news items in marketing and consulting that I need to know. One insight of the day. My skill focus for today. One resource to consume. A competitor spotlight. My action items. And one founder mindset tip.",
    },
    {
      id: "skill_assessment",
      icon: "📊",
      label: "Skills assessment",
      category: "Development",
      prompt: "Give me an honest assessment of my current skill levels as a marketing consultancy founder. Rate me on: marketing strategy, brand positioning, paid advertising, business development, client management, financial literacy, and leadership. Where are my biggest gaps? What should I focus on first?",
    },
    {
      id: "industry_deep_dive",
      icon: "📰",
      label: "Industry deep dive",
      category: "Intelligence",
      prompt: "Give me a deep dive into the current state of the marketing consultancy and advertising industry. What are the 5 biggest trends shaping the industry right now? Which trends specifically affect FifteenConsult's positioning in GCC and West Africa? What do I need to know to stay ahead?",
    },
    {
      id: "founder_development",
      icon: "🚀",
      label: "Founder development plan",
      category: "Development",
      prompt: "Build my personal development roadmap for the next 30 days as a marketing consultancy founder. What specific skills, knowledge, and habits should I be building? What should I be reading, watching, or practising? Make it practical and specific to running FifteenConsult.",
    },
    {
      id: "meeting_prep",
      icon: "🤝",
      label: "Meeting prep",
      category: "Preparation",
      prompt: "Help me prepare for an important client or prospect meeting. Ask me: who am I meeting, what's the context, and what's my desired outcome? Then give me: key talking points, likely objections and responses, questions to ask, and how to close toward my desired outcome.",
    },
    {
      id: "competitor_learning",
      icon: "🎓",
      label: "Learn from competitors",
      category: "Intelligence",
      prompt: "Using the competitor intelligence available, help me learn from both our direct competitors and aspirational benchmarks. What specific tactics, positioning strategies, or client approaches can I adopt or adapt for FifteenConsult? Give me 3 concrete things to implement this week.",
    },
    {
      id: "weekly_reflection",
      icon: "🪞",
      label: "Weekly reflection",
      category: "Review",
      prompt: "Run my weekly personal reflection. Ask me: what were my 3 biggest wins this week? What didn't go well? What did I learn? What's my single most important priority next week? Then give me your honest assessment of how I'm progressing as a founder and what I need to focus on.",
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
    if (agentId === "amani")  suggestions.push({ text: "Monday — run full department review and set weekly priorities", icon: "👑" });
    if (agentId === "david")  suggestions.push({ text: "Monday — scan for new business opportunities this week", icon: "🚀" });
    if (agentId === "sofia")  suggestions.push({ text: "Monday — set your personal development focus for the week", icon: "🌟" });
    if (agentId === "malik")  suggestions.push({ text: "Monday — review all campaign performance and set weekly ad targets", icon: "📢" });
    if (agentId === "amani")  suggestions.push({ text: "Monday — run full department review and set weekly priorities", icon: "👑" });
    if (agentId === "david")  suggestions.push({ text: "Monday — scan for new business opportunities this week", icon: "🚀" });
    if (agentId === "sofia")  suggestions.push({ text: "Monday — set your personal development focus for the week", icon: "🌟" });
    if (agentId === "malik")  suggestions.push({ text: "Monday — review all campaign performance and set weekly ad targets", icon: "📢" });
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
