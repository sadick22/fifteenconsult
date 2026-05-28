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
      id: "linkedin_insight",
      icon: "💡",
      label: "Write LinkedIn insight post",
      category: "LinkedIn",
      prompt: "Write a high-performing LinkedIn post for FifteenConsult using the challenger approach. Lead with a bold, counterintuitive insight about marketing in GCC or West Africa. Include a specific data point. Use the format: Hook (1-2 lines) → Insight (3-5 lines) → Proof or example (2-3 lines) → Question CTA. 150-250 words. No generic phrases. Start with something other than 'I'.",
    },
    {
      id: "linkedin_framework",
      icon: "15",
      label: "Fifteen Framework LinkedIn post",
      category: "LinkedIn",
      prompt: "Write a LinkedIn post explaining one specific aspect of The Fifteen Framework. Make it educational and actionable — show how 15 minutes of executive attention, or one of the 15 key metrics, or one of the 15 strategic pillars can transform a company's marketing. Use a real-world GCC example. End with a question about their current marketing measurement.",
    },
    {
      id: "linkedin_west_africa",
      icon: "🌍",
      label: "West Africa market post",
      category: "LinkedIn",
      prompt: "Write a LinkedIn post about a marketing opportunity or insight specific to West Africa — focusing on Nigeria, Ghana, or pan-African trends. Position FifteenConsult as a consultancy that understands both GCC and African markets. This should differentiate us from typical Qatar/GCC agencies. Use the news headlines from today's feed if relevant.",
    },
    {
      id: "newsletter_draft",
      icon: "📧",
      label: "Draft weekly newsletter",
      category: "Email",
      prompt: "Draft this week's FifteenConsult email newsletter for our MailerLite subscribers. Use the email performance data to understand what our audience engages with. Include: one strong marketing insight relevant to GCC/West Africa, one tip from The Fifteen Framework, one piece of FifteenConsult news or client win, and one clear CTA. Subject line under 50 chars. Total length: 300-400 words.",
    },
    {
      id: "blog_brief",
      icon: "📝",
      label: "Write SEO blog article",
      category: "Blog",
      prompt: "Write a full SEO-optimised blog article for fifteenconsult.com (800-1200 words). Target keyword: 'marketing consultancy Qatar' or 'real estate marketing GCC'. Structure: compelling intro, 4-5 key sections with subheadings, practical takeaways, and CTA to book a strategy call. Include The Fifteen Framework naturally. Use the news feed headlines for a topical angle if relevant.",
    },
    {
      id: "case_study",
      icon: "🏆",
      label: "Write client case study",
      category: "Case Study",
      prompt: "Write a case study for one of our clients: Coreo Real Estate, Nappy Qatar, Elite Escape Tourism, Base Intelligent Communities, or African Languages Lab. Format: Challenge (what problem did they face) → Approach (how FifteenConsult applied the Fifteen Framework) → Results (specific metrics and outcomes) → Key Lesson (what other brands can learn). 400-600 words. Professional but engaging tone.",
    },
    {
      id: "instagram_carousel",
      icon: "📱",
      label: "Instagram carousel content",
      category: "Instagram",
      prompt: "Create content for a 6-slide Instagram carousel for FifteenConsult. Topic: a practical marketing tip relevant to GCC SMEs or startups. Slide 1: Bold hook/problem statement. Slides 2-5: One tip per slide with brief explanation. Slide 6: CTA to book a strategy call. Keep each slide to 15-20 words max. Make it visually structured with clear hierarchy.",
    },
    {
      id: "news_content",
      icon: "📰",
      label: "News-inspired content",
      category: "LinkedIn",
      prompt: "Using the latest news headlines from the live feed, identify the most relevant story for FifteenConsult's audience and write a LinkedIn post that connects it to a marketing lesson for GCC or West Africa businesses. Position FifteenConsult as the expert voice on this topic. Be specific and add genuine insight beyond what the headline says.",
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
      id: "pipeline_review",
      icon: "🎯",
      label: "Pipeline status review",
      category: "Pipeline",
      prompt: "Using the live HubSpot data injected, give me a full pipeline review. What is the current pipeline health? Who needs follow-up today? What stage are we at vs our weekly targets? Flag any deals that have gone cold. Give me 3 specific actions to move the pipeline forward today.",
    },
    {
      id: "prospect_research",
      icon: "🔍",
      label: "Research 5 new prospects",
      category: "Research",
      prompt: "Research and present 5 high-quality prospects for FifteenConsult using the news feed intelligence and your knowledge of the GCC and West Africa markets. For each prospect include: company name, sector, why they need FifteenConsult now (specific trigger), decision maker name and title, and a personalised outreach angle. Focus on companies with recent funding, expansion announcements, or visible marketing gaps.",
    },
    {
      id: "outreach_email",
      icon: "📧",
      label: "Write cold outreach email",
      category: "Outreach",
      prompt: "Write a challenger cold email for a prospect in [specify: Real Estate / SaaS / Hospitality / West Africa Tech]. Use the framework: specific company observation → problem they likely have → social proof from our clients → simple 15-minute call CTA. Under 100 words. Subject line must be specific to their situation. No generic phrases.",
    },
    {
      id: "linkedin_outreach",
      icon: "💼",
      label: "Write LinkedIn message",
      category: "Outreach",
      prompt: "Write a LinkedIn connection request note and follow-up message for a prospect. Connection note: 1 sentence, specific insight about their company, under 300 characters. Follow-up message (sent after connection accepted): challenger framework, under 75 words. Target: Marketing Director or CMO at a GCC real estate or tech company.",
    },
    {
      id: "follow_up_sequence",
      icon: "🔄",
      label: "Write follow-up sequence",
      category: "Outreach",
      prompt: "Write a complete 3-touch follow-up sequence for a prospect who hasn't responded. Touch 1 (Day 0): Problem-led cold outreach. Touch 2 (Day 4): New angle with a relevant insight or mini case study. Touch 3 (Day 9): Final value-add with soft close. Each touch under 100 words. Different angle each time — never just 'following up'.",
    },
    {
      id: "nigeria_prospects",
      icon: "🌍",
      label: "West Africa prospect scan",
      category: "Research",
      prompt: "Scan the news feed for West Africa market intelligence. Identify companies in Nigeria, Ghana, or broader West Africa that have recently raised funding, announced expansion, or show signs of needing sophisticated marketing strategy. For each opportunity: company name, funding or trigger event, why they need FifteenConsult, best outreach channel (LinkedIn vs WhatsApp vs email), and suggested message angle.",
    },
    {
      id: "competitor_intelligence",
      icon: "🕵️",
      label: "Competitor intelligence report",
      category: "Intelligence",
      prompt: "Produce a competitive intelligence report on FifteenConsult's main competitors in the GCC market: BPG Group, MCN Middle East, Elixirr, and any other marketing consultancies active in Qatar and UAE. What are they winning? Where are they weak? What client types are they targeting? Where is the gap FifteenConsult can exploit? Use any news feed intelligence available.",
    },
    {
      id: "discovery_prep",
      icon: "📋",
      label: "Discovery call preparation",
      category: "Sales",
      prompt: "Prepare a discovery call brief for an upcoming call with a prospect. Give me: 5 smart questions to ask that demonstrate FifteenConsult's expertise, 3 potential objections and how to handle them, the key points to make about The Fifteen Framework, and how to close the call with a clear next step. Tailor to [specify: Real Estate / SaaS / Hospitality / West Africa Tech].",
    },
  ],

  amara: [
    {
      id: "linkedin_post_design",
      icon: "🎨",
      label: "Create LinkedIn post design",
      category: "Canva",
      prompt: "Create a LinkedIn post design in Canva (1200x1200px). Use FifteenConsult brand guidelines: #151c33 dark background, #C8A96E gold accent, white body text, Cormorant Garamond for headlines. The post should feel premium and challenger brand. Topic: [specify topic or I'll choose a relevant marketing insight]. Include the FifteenConsult name and make the hierarchy bold and editorial.",
    },
    {
      id: "instagram_carousel",
      icon: "📱",
      label: "Create Instagram carousel",
      category: "Canva",
      prompt: "Create a 6-slide Instagram carousel in Canva (1080x1350px per slide). FifteenConsult brand: dark background, gold headlines, white body text. Slide 1: Bold hook. Slides 2-5: one insight per slide. Slide 6: CTA. Topic: [specify or I'll choose]. Consistent header with FifteenConsult branding across all slides. Export-ready design.",
    },
    {
      id: "pitch_deck_slide",
      icon: "📊",
      label: "Design pitch deck slide",
      category: "Canva",
      prompt: "Design a pitch deck slide in Canva (1920x1080px, 16:9). FifteenConsult dark theme: #151c33 background, #C8A96E gold for key data points, clean white text. Slide type: [specify: title, problem, solution, results, case study, pricing, or CTA]. Make data and numbers visually prominent. Premium consultancy feel — not a startup pitch.",
    },
    {
      id: "brand_audit",
      icon: "🔍",
      label: "Competitor brand audit",
      category: "Research",
      prompt: "Audit the visual brand identity of our main competitors: BPG Group (bpggroup.com), MCN Middle East (mcnme.com), and Elixirr (elixirr.com). Fetch each website and analyse: colour palette, typography choices, visual tone, template patterns, and overall brand positioning. Where does FifteenConsult look more premium? Where do we need to improve? Give specific recommendations.",
    },
    {
      id: "social_template_set",
      icon: "✨",
      label: "Design social template set",
      category: "Canva",
      prompt: "Create a cohesive set of 3 social media templates in Canva for FifteenConsult: 1) LinkedIn thought leadership post (1200x1200px), 2) Instagram carousel cover (1080x1350px), 3) Instagram story (1080x1920px). All three must feel like a family — consistent use of #151c33, #C8A96E, Cormorant Garamond, DM Mono. These become our reusable template system.",
    },
    {
      id: "case_study_design",
      icon: "🏆",
      label: "Design case study layout",
      category: "Canva",
      prompt: "Design a case study layout in Canva for one of our clients: Coreo Real Estate, Nappy Qatar, Elite Escape Tourism, Base Intelligent Communities, or African Languages Lab. Format: cover page + 3 content pages. Include: challenge, approach, results (numbers prominent in gold), and FifteenConsult branding. Professional enough to send to prospects as social proof.",
    },
    {
      id: "website_section_brief",
      icon: "🌐",
      label: "Website section design brief",
      category: "Figma",
      prompt: "Create a detailed design brief for a new section of fifteenconsult.com. Specify: exact layout, element positions, colours (using FifteenConsult brand tokens), typography sizes, spacing values, mobile considerations, and interaction notes. Format as a Figma-ready specification that Sadick can implement in Webflow. Section options: Fifteen Framework page, case study grid, services detail, or team section.",
    },
    {
      id: "fifteen_framework_visual",
      icon: "⚡",
      label: "Fifteen Framework visual",
      category: "Canva",
      prompt: "Design a visual representation of The Fifteen Framework in Canva. Show the three pillars: 15 minutes of executive attention, 15 key metrics, 15 strategic pillars. Create a diagram or infographic that makes the framework immediately clear and memorable. Use FifteenConsult brand guidelines. This should be usable as a LinkedIn post, website section, and proposal page.",
    },
  ],

  hassan: [
    {
      id: "ads_report",
      icon: "📊",
      label: "Daily ads performance report",
      category: "Reporting",
      prompt: "Pull live Meta Ads performance data using the Meta Ads MCP. Report on all active campaigns: spend, impressions, clicks, CPL, and ROAS. Compare against our targets (CPL below QAR 150, CTR above 0.5% on LinkedIn, 1.0% on Meta). Flag any campaigns exceeding CPL threshold. Give 3 specific optimisation actions for today.",
    },
    {
      id: "ad_copy",
      icon: "✍️",
      label: "Write ad copy variations",
      category: "Creative",
      prompt: "Write 3 ad copy variations for FifteenConsult using the Challenger approach. Each variation must have: a pattern-interrupt headline (under 70 chars), problem-led body copy (under 150 words), and a clear CTA (Book Free Strategy Call or Get Your Marketing Audit). Write one for Real Estate Qatar, one for SaaS/Tech GCC, and one for West Africa (Nigeria). Dark background with gold accents visual direction.",
    },
    {
      id: "campaign_setup",
      icon: "🚀",
      label: "Set up new campaign",
      category: "Campaigns",
      prompt: "Help me set up a new LinkedIn or Meta campaign for FifteenConsult. Define: campaign objective, target audience (job titles, industries, geos), budget allocation, ad format, offer, and success metrics. Use the Meta Ads MCP to check current audience performance before recommending targeting. Start with the channel that has the lowest current CPL.",
    },
    {
      id: "competitor_ads",
      icon: "🕵️",
      label: "Scan competitor ads",
      category: "Intelligence",
      prompt: "Check the Meta Ad Library (facebook.com/ads/library) for active ads from our GCC competitors: BPG Group, MCN Middle East, and Elixirr. Also search for 'marketing consultancy Qatar' and 'marketing agency Doha' to see what any agency is running. Report: what angles they're using, what offers they're promoting, what creatives are running, and what gaps FifteenConsult can exploit.",
    },
    {
      id: "landing_page_audit",
      icon: "🌐",
      label: "Landing page audit",
      category: "Optimisation",
      prompt: "Using the PageSpeed data injected, audit fifteenconsult.com as a paid ads landing page. What is the mobile performance score? Is it above 70 — the minimum for running paid campaigns? What specific fixes would improve conversion rate? Check: headline clarity, CTA visibility, social proof above the fold, form simplicity, and page load speed. Give Sadick a prioritised fix list for Webflow.",
    },
    {
      id: "ab_test",
      icon: "🧪",
      label: "Design A/B test",
      category: "Testing",
      prompt: "Design an A/B test for one of our active campaigns. Choose the single variable most likely to improve performance: headline, CTA, audience, ad format, or offer. Define: hypothesis, control vs variant, success metric, minimum sample size, and test duration (minimum 7 days). Use current Meta Ads MCP data to identify which campaign needs testing most urgently.",
    },
    {
      id: "west_africa_campaign",
      icon: "🌍",
      label: "West Africa campaign strategy",
      category: "Strategy",
      prompt: "Design a paid campaign strategy for West Africa (Nigeria primary, Ghana secondary). Consider: Facebook dominance vs LinkedIn for B2B, mobile-first creative requirements, local business culture, lower CPCs, and different buying triggers vs GCC. What budget allocation, targeting, ad formats, and offers would work best? How should creative differ from our GCC campaigns?",
    },
    {
      id: "budget_optimisation",
      icon: "💰",
      label: "Optimise ad budget",
      category: "Optimisation",
      prompt: "Using Meta Ads MCP data, analyse our current budget allocation across all campaigns. Which campaigns are generating the lowest CPL? Which are above target? Recommend a budget reallocation to maximise leads within our total monthly budget. Show the expected impact on total lead volume if we shift budget from underperformers to top performers.",
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
      id: "strategy_brief",
      icon: "🎯",
      label: "Weekly advertising strategy brief",
      category: "Strategy",
      prompt: "Produce this week's advertising strategy brief. Using Meta Ads MCP data and news feed intelligence, give me: overall campaign performance vs strategy goals, competitive landscape update (what are BPG, MCN, Elixirr running?), strategic recommendation for this week's focus, one new campaign concept to test, and budget allocation recommendation. Think as Advertising Director, not just campaign manager.",
    },
    {
      id: "campaign_concept",
      icon: "💡",
      label: "New campaign concept",
      category: "Creative Strategy",
      prompt: "Develop a new campaign concept for FifteenConsult. It should simultaneously build brand awareness AND generate leads. Include: campaign theme and big idea, target audience and insight, key message and proof point, recommended channels and formats, creative direction (dark/gold brand aesthetic), offer, and success metrics. The Fifteen Framework should be the strategic anchor.",
    },
    {
      id: "competitor_intelligence",
      icon: "🕵️",
      label: "Competitor advertising intelligence",
      category: "Intelligence",
      prompt: "Run a full competitor advertising intelligence report. Check Meta Ad Library and LinkedIn Ad Library for BPG Group, MCN Middle East, and Elixirr. Also scan for any new marketing agencies appearing in Qatar/UAE ads. Analyse: their positioning angle, offers, creative style, apparent budget level, and target audience. Where is FifteenConsult's competitive advantage in the paid media landscape?",
    },
    {
      id: "west_africa_strategy",
      icon: "🌍",
      label: "West Africa advertising strategy",
      category: "Strategy",
      prompt: "Develop FifteenConsult's West Africa advertising strategy. Define: which markets to enter first (Nigeria, Ghana, or pan-African), what channels to use (Facebook vs LinkedIn vs Google), what message resonates with Nigerian and Ghanaian business decision makers, how to position FifteenConsult as a premium consultancy in these markets, and what budget to allocate. Use news intelligence to assess market timing.",
    },
    {
      id: "creative_brief",
      icon: "🎨",
      label: "Write creative brief for Hassan",
      category: "Creative Direction",
      prompt: "Write a detailed creative brief for Hassan to execute. Include: campaign objective, target audience insight, key message (one sentence), tone of voice, visual direction (dark background, gold accents, specific imagery guidance), copy guidelines, format specifications for LinkedIn and Meta, and what success looks like. Make it specific enough that Hassan can execute without further questions.",
    },
    {
      id: "gccc_calendar",
      icon: "📅",
      label: "GCC advertising calendar",
      category: "Planning",
      prompt: "Build FifteenConsult's GCC advertising calendar for the next 90 days. Account for: Ramadan periods (reduced direct response, more brand), Eid (high engagement window), summer slowdown (shift to West Africa), and Q4 budget season (ROI messaging). For each period: recommended campaign type, message angle, budget allocation, and key performance indicator. Align with the GCC working week (Sunday-Thursday).",
    },
    {
      id: "fifteen_framework_campaign",
      icon: "⚡",
      label: "Fifteen Framework campaign",
      category: "Brand Campaign",
      prompt: "Design a campaign specifically built around The Fifteen Framework. This should educate the GCC market about what The Fifteen Framework is and why it matters, while positioning FifteenConsult as the only consultancy that delivers it. Include: awareness phase (what is it?), consideration phase (how does it work?), and conversion phase (book a call to see it applied). Multi-channel approach across LinkedIn, Meta, and Google.",
    },
    {
      id: "performance_review",
      icon: "📈",
      label: "Strategic performance review",
      category: "Reporting",
      prompt: "Pull Meta Ads MCP data and conduct a strategic performance review — not just numbers, but what the numbers mean. Are we building the right brand in the right markets? Is our CPL sustainable for FifteenConsult's growth stage? Are we acquiring the right types of leads? What should we stop, start, and continue? Give me a director-level view, not an analyst report.",
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
      id: "bd_briefing",
      icon: "🚀",
      label: "BD morning briefing",
      category: "Pipeline",
      prompt: "Run my BD morning briefing. Check Gmail for any prospect replies. Check Google Calendar for today's calls and BD activities. Review the HubSpot pipeline status from the injected data. Show me: 1) Any prospect replies needing response today, 2) Today's scheduled calls, 3) Pipeline health and what needs attention, 4) Top 3 BD priorities for today.",
    },
    {
      id: "pipeline_update",
      icon: "📊",
      label: "Update HubSpot pipeline",
      category: "Pipeline",
      prompt: "Review the current HubSpot pipeline and help me update it. Using the live pipeline data, identify: which deals have gone stale (no activity in 7+ days), which contacts need moving to the next stage, and what follow-up tasks need to be created. Then use HubSpot MCP to make the updates directly.",
    },
    {
      id: "prospect_outreach",
      icon: "📧",
      label: "Draft BD outreach email",
      category: "Outreach",
      prompt: "Draft a BD outreach email for a prospect. Use the news feed to identify a relevant trigger event or insight. Write using the Challenger approach: teach them something specific about their situation, tailor it to their business, and take control with a clear ask for a 15-minute call. Under 100 words. Subject line must be specific.",
    },
    {
      id: "proposal_draft",
      icon: "📋",
      label: "Draft proposal",
      category: "Proposals",
      prompt: "Draft a FifteenConsult proposal for a prospect. Include: their specific problem statement, The Fifteen Framework as the solution, 3 specific deliverables with timelines, a relevant case study result (from our existing clients), monthly retainer investment, and a 30-day pilot option as risk reversal. Make it compelling and specific — not a template.",
    },
    {
      id: "discovery_prep",
      icon: "🎯",
      label: "Prepare for discovery call",
      category: "Sales",
      prompt: "Prepare me for an upcoming discovery call. Give me: 5 smart questions that demonstrate FifteenConsult's expertise, the key points about The Fifteen Framework to make in 3 minutes, 3 likely objections and how to handle them, and how to close with a clear next step. Target: [specify prospect type or I'll use Real Estate Qatar].",
    },
    {
      id: "west_africa_bd",
      icon: "🌍",
      label: "West Africa BD scan",
      category: "Research",
      prompt: "Scan the news feed for West Africa BD opportunities. Look for: recent funding announcements in Nigeria or Ghana, companies expanding into GCC, new product launches needing marketing, or businesses showing signs of growth. For each opportunity: company, trigger event, why they need FifteenConsult, best approach channel, and suggested outreach angle. Flag anything needing verification.",
    },
    {
      id: "competitor_watch",
      icon: "🕵️",
      label: "Competitor intelligence",
      category: "Intelligence",
      prompt: "Run a competitor intelligence scan. Using the news feed and web fetch, check for: any announcements from BPG Group, MCN Middle East, or Elixirr, new agencies opening in Qatar or UAE, any major client wins or losses in the GCC market, and pricing or positioning changes. What should FifteenConsult do differently based on this intelligence?",
    },
    {
      id: "follow_up_drafts",
      icon: "🔄",
      label: "Draft follow-up emails",
      category: "Outreach",
      prompt: "Check Gmail for any prospects I've been in contact with who haven't replied in the last 5-7 days. For each one, draft a follow-up email using a fresh angle — not 'just following up'. Touch 2 should bring new value (insight, case study, relevant news). Touch 3 should be a soft close. Use the Challenger framework throughout.",
    },
  ],

  sofia: [
    {
      id: "morning_briefing",
      icon: "🌅",
      label: "Morning briefing",
      category: "Daily",
      prompt: "Run my full morning briefing for today. Pull today's schedule from Google Calendar. Check Gmail for any urgent or priority emails needing attention. Select the 3 most relevant news items from the feed for FifteenConsult. Give me the insight of the day, skill focus, and my single priority action. Format it cleanly with the standard morning briefing structure.",
    },
    {
      id: "email_triage",
      icon: "📧",
      label: "Triage my inbox",
      category: "Gmail",
      prompt: "Check my Gmail inbox and triage it for me. Categorise emails into: Urgent (reply today), Important (this week), FYI (no action needed), and Waiting (I sent something, waiting for response). For any urgent items, draft a short reply in my voice — direct, confident, no fluff. Flag anything from clients or hot prospects immediately.",
    },
    {
      id: "calendar_review",
      icon: "📅",
      label: "Review my calendar",
      category: "Calendar",
      prompt: "Check my Google Calendar for this week. Show me: all meetings and calls with times (Doha timezone), any scheduling conflicts, gaps I should protect for deep work (Webflow, strategy, content), and suggested time blocks for discovery calls. Flag anything I might have forgotten to prepare for.",
    },
    {
      id: "week_plan",
      icon: "🗓",
      label: "Plan my week",
      category: "Planning",
      prompt: "Help me plan this week for FifteenConsult. Check my Google Calendar for existing commitments. Based on the pipeline status and news intelligence, suggest: 3 key priorities for the week, optimal time blocks for different types of work (client delivery, BD, content review, Webflow implementation), and one thing I should stop doing this week to free up focus.",
    },
    {
      id: "news_digest",
      icon: "📰",
      label: "News digest",
      category: "Intelligence",
      prompt: "Give me a curated news digest from today's feed. Focus on: GCC business and marketing news, West Africa tech and startup news, AI and marketing technology developments, and anything affecting FifteenConsult's clients or target markets. For each item, give me the headline, why it matters to FifteenConsult, and one actionable takeaway.",
    },
    {
      id: "skill_session",
      icon: "🎯",
      label: "Skill development session",
      category: "Development",
      prompt: "Run a 10-minute skill development session for me. Choose the most relevant skill for FifteenConsult's growth right now — could be The Fifteen Framework depth, GCC market knowledge, West Africa business culture, AI in marketing, or BD techniques. Teach me one specific, actionable concept I can apply today. Keep it practical, not theoretical.",
    },
    {
      id: "draft_reply",
      icon: "✉️",
      label: "Draft email reply",
      category: "Gmail",
      prompt: "Check Gmail for an email I need to reply to. Show me the email and draft a reply in my voice: direct, confident, short, clear next step. No corporate fluff. Under 100 words unless it's a formal proposal response. Make sure the reply advances the relationship or closes the loop clearly.",
    },
    {
      id: "end_of_day",
      icon: "🌙",
      label: "End of day review",
      category: "Daily",
      prompt: "Run my end-of-day review. Check my calendar for what I completed today. Check Gmail for anything urgent that came in today that I might have missed. Give me: what I achieved today, what I didn't finish and whether it needs to move to tomorrow, 3 priorities for tomorrow morning, and one thing I should be proud of today.",
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
      id: "bd_briefing",
      icon: "🚀",
      label: "BD morning briefing",
      category: "Pipeline",
      prompt: "Run my BD morning briefing. Check Gmail for any prospect replies. Check Google Calendar for today's calls and BD activities. Review the HubSpot pipeline status from the injected data. Show me: 1) Any prospect replies needing response today, 2) Today's scheduled calls, 3) Pipeline health and what needs attention, 4) Top 3 BD priorities for today.",
    },
    {
      id: "pipeline_update",
      icon: "📊",
      label: "Update HubSpot pipeline",
      category: "Pipeline",
      prompt: "Review the current HubSpot pipeline and help me update it. Using the live pipeline data, identify: which deals have gone stale (no activity in 7+ days), which contacts need moving to the next stage, and what follow-up tasks need to be created. Then use HubSpot MCP to make the updates directly.",
    },
    {
      id: "prospect_outreach",
      icon: "📧",
      label: "Draft BD outreach email",
      category: "Outreach",
      prompt: "Draft a BD outreach email for a prospect. Use the news feed to identify a relevant trigger event or insight. Write using the Challenger approach: teach them something specific about their situation, tailor it to their business, and take control with a clear ask for a 15-minute call. Under 100 words. Subject line must be specific.",
    },
    {
      id: "proposal_draft",
      icon: "📋",
      label: "Draft proposal",
      category: "Proposals",
      prompt: "Draft a FifteenConsult proposal for a prospect. Include: their specific problem statement, The Fifteen Framework as the solution, 3 specific deliverables with timelines, a relevant case study result (from our existing clients), monthly retainer investment, and a 30-day pilot option as risk reversal. Make it compelling and specific — not a template.",
    },
    {
      id: "discovery_prep",
      icon: "🎯",
      label: "Prepare for discovery call",
      category: "Sales",
      prompt: "Prepare me for an upcoming discovery call. Give me: 5 smart questions that demonstrate FifteenConsult's expertise, the key points about The Fifteen Framework to make in 3 minutes, 3 likely objections and how to handle them, and how to close with a clear next step. Target: [specify prospect type or I'll use Real Estate Qatar].",
    },
    {
      id: "west_africa_bd",
      icon: "🌍",
      label: "West Africa BD scan",
      category: "Research",
      prompt: "Scan the news feed for West Africa BD opportunities. Look for: recent funding announcements in Nigeria or Ghana, companies expanding into GCC, new product launches needing marketing, or businesses showing signs of growth. For each opportunity: company, trigger event, why they need FifteenConsult, best approach channel, and suggested outreach angle. Flag anything needing verification.",
    },
    {
      id: "competitor_watch",
      icon: "🕵️",
      label: "Competitor intelligence",
      category: "Intelligence",
      prompt: "Run a competitor intelligence scan. Using the news feed and web fetch, check for: any announcements from BPG Group, MCN Middle East, or Elixirr, new agencies opening in Qatar or UAE, any major client wins or losses in the GCC market, and pricing or positioning changes. What should FifteenConsult do differently based on this intelligence?",
    },
    {
      id: "follow_up_drafts",
      icon: "🔄",
      label: "Draft follow-up emails",
      category: "Outreach",
      prompt: "Check Gmail for any prospects I've been in contact with who haven't replied in the last 5-7 days. For each one, draft a follow-up email using a fresh angle — not 'just following up'. Touch 2 should bring new value (insight, case study, relevant news). Touch 3 should be a soft close. Use the Challenger framework throughout.",
    },
  ],

  sofia: [
    {
      id: "morning_briefing",
      icon: "🌅",
      label: "Morning briefing",
      category: "Daily",
      prompt: "Run my full morning briefing for today. Pull today's schedule from Google Calendar. Check Gmail for any urgent or priority emails needing attention. Select the 3 most relevant news items from the feed for FifteenConsult. Give me the insight of the day, skill focus, and my single priority action. Format it cleanly with the standard morning briefing structure.",
    },
    {
      id: "email_triage",
      icon: "📧",
      label: "Triage my inbox",
      category: "Gmail",
      prompt: "Check my Gmail inbox and triage it for me. Categorise emails into: Urgent (reply today), Important (this week), FYI (no action needed), and Waiting (I sent something, waiting for response). For any urgent items, draft a short reply in my voice — direct, confident, no fluff. Flag anything from clients or hot prospects immediately.",
    },
    {
      id: "calendar_review",
      icon: "📅",
      label: "Review my calendar",
      category: "Calendar",
      prompt: "Check my Google Calendar for this week. Show me: all meetings and calls with times (Doha timezone), any scheduling conflicts, gaps I should protect for deep work (Webflow, strategy, content), and suggested time blocks for discovery calls. Flag anything I might have forgotten to prepare for.",
    },
    {
      id: "week_plan",
      icon: "🗓",
      label: "Plan my week",
      category: "Planning",
      prompt: "Help me plan this week for FifteenConsult. Check my Google Calendar for existing commitments. Based on the pipeline status and news intelligence, suggest: 3 key priorities for the week, optimal time blocks for different types of work (client delivery, BD, content review, Webflow implementation), and one thing I should stop doing this week to free up focus.",
    },
    {
      id: "news_digest",
      icon: "📰",
      label: "News digest",
      category: "Intelligence",
      prompt: "Give me a curated news digest from today's feed. Focus on: GCC business and marketing news, West Africa tech and startup news, AI and marketing technology developments, and anything affecting FifteenConsult's clients or target markets. For each item, give me the headline, why it matters to FifteenConsult, and one actionable takeaway.",
    },
    {
      id: "skill_session",
      icon: "🎯",
      label: "Skill development session",
      category: "Development",
      prompt: "Run a 10-minute skill development session for me. Choose the most relevant skill for FifteenConsult's growth right now — could be The Fifteen Framework depth, GCC market knowledge, West Africa business culture, AI in marketing, or BD techniques. Teach me one specific, actionable concept I can apply today. Keep it practical, not theoretical.",
    },
    {
      id: "draft_reply",
      icon: "✉️",
      label: "Draft email reply",
      category: "Gmail",
      prompt: "Check Gmail for an email I need to reply to. Show me the email and draft a reply in my voice: direct, confident, short, clear next step. No corporate fluff. Under 100 words unless it's a formal proposal response. Make sure the reply advances the relationship or closes the loop clearly.",
    },
    {
      id: "end_of_day",
      icon: "🌙",
      label: "End of day review",
      category: "Daily",
      prompt: "Run my end-of-day review. Check my calendar for what I completed today. Check Gmail for anything urgent that came in today that I might have missed. Give me: what I achieved today, what I didn't finish and whether it needs to move to tomorrow, 3 priorities for tomorrow morning, and one thing I should be proud of today.",
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
      id: "bd_briefing",
      icon: "🚀",
      label: "BD morning briefing",
      category: "Pipeline",
      prompt: "Run my BD morning briefing. Check Gmail for any prospect replies. Check Google Calendar for today's calls and BD activities. Review the HubSpot pipeline status from the injected data. Show me: 1) Any prospect replies needing response today, 2) Today's scheduled calls, 3) Pipeline health and what needs attention, 4) Top 3 BD priorities for today.",
    },
    {
      id: "pipeline_update",
      icon: "📊",
      label: "Update HubSpot pipeline",
      category: "Pipeline",
      prompt: "Review the current HubSpot pipeline and help me update it. Using the live pipeline data, identify: which deals have gone stale (no activity in 7+ days), which contacts need moving to the next stage, and what follow-up tasks need to be created. Then use HubSpot MCP to make the updates directly.",
    },
    {
      id: "prospect_outreach",
      icon: "📧",
      label: "Draft BD outreach email",
      category: "Outreach",
      prompt: "Draft a BD outreach email for a prospect. Use the news feed to identify a relevant trigger event or insight. Write using the Challenger approach: teach them something specific about their situation, tailor it to their business, and take control with a clear ask for a 15-minute call. Under 100 words. Subject line must be specific.",
    },
    {
      id: "proposal_draft",
      icon: "📋",
      label: "Draft proposal",
      category: "Proposals",
      prompt: "Draft a FifteenConsult proposal for a prospect. Include: their specific problem statement, The Fifteen Framework as the solution, 3 specific deliverables with timelines, a relevant case study result (from our existing clients), monthly retainer investment, and a 30-day pilot option as risk reversal. Make it compelling and specific — not a template.",
    },
    {
      id: "discovery_prep",
      icon: "🎯",
      label: "Prepare for discovery call",
      category: "Sales",
      prompt: "Prepare me for an upcoming discovery call. Give me: 5 smart questions that demonstrate FifteenConsult's expertise, the key points about The Fifteen Framework to make in 3 minutes, 3 likely objections and how to handle them, and how to close with a clear next step. Target: [specify prospect type or I'll use Real Estate Qatar].",
    },
    {
      id: "west_africa_bd",
      icon: "🌍",
      label: "West Africa BD scan",
      category: "Research",
      prompt: "Scan the news feed for West Africa BD opportunities. Look for: recent funding announcements in Nigeria or Ghana, companies expanding into GCC, new product launches needing marketing, or businesses showing signs of growth. For each opportunity: company, trigger event, why they need FifteenConsult, best approach channel, and suggested outreach angle. Flag anything needing verification.",
    },
    {
      id: "competitor_watch",
      icon: "🕵️",
      label: "Competitor intelligence",
      category: "Intelligence",
      prompt: "Run a competitor intelligence scan. Using the news feed and web fetch, check for: any announcements from BPG Group, MCN Middle East, or Elixirr, new agencies opening in Qatar or UAE, any major client wins or losses in the GCC market, and pricing or positioning changes. What should FifteenConsult do differently based on this intelligence?",
    },
    {
      id: "follow_up_drafts",
      icon: "🔄",
      label: "Draft follow-up emails",
      category: "Outreach",
      prompt: "Check Gmail for any prospects I've been in contact with who haven't replied in the last 5-7 days. For each one, draft a follow-up email using a fresh angle — not 'just following up'. Touch 2 should bring new value (insight, case study, relevant news). Touch 3 should be a soft close. Use the Challenger framework throughout.",
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
