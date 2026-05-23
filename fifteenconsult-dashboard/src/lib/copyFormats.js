/**
 * copyFormats.js
 * Transforms raw agent briefing output into platform-ready formats.
 *
 * FifteenConsult is a marketing consultancy — outputs are used to:
 * - Post directly to LinkedIn / Instagram
 * - Send as emails to prospects or clients
 * - Brief the team on what to execute
 * - Share as internal reports
 */

// ── FORMAT DEFINITIONS PER AGENT ─────────────────────────────────────────────
export const COPY_FORMATS = {

  nadia: [
    {
      id: "linkedin_post",
      label: "LinkedIn Post",
      icon: "💼",
      description: "Ready to paste into LinkedIn",
      transform: (text) => extractAndFormatLinkedIn(text, "content"),
    },
    {
      id: "instagram_caption",
      label: "Instagram Caption",
      icon: "📸",
      description: "With hashtags for GCC audience",
      transform: (text) => extractInstagramCaption(text),
    },
    {
      id: "email_newsletter",
      label: "Email Newsletter",
      icon: "📧",
      description: "Ready for MailerLite",
      transform: (text) => extractNewsletter(text),
    },
    {
      id: "raw",
      label: "Full Output",
      icon: "📋",
      description: "Complete briefing text",
      transform: (text) => text,
    },
  ],

  tariq: [
    {
      id: "seo_brief",
      label: "SEO Brief for Nadia",
      icon: "📝",
      description: "Blog topic + keywords + outline",
      transform: (text) => extractSeoBrief(text),
    },
    {
      id: "action_items",
      label: "Action Items",
      icon: "✅",
      description: "Numbered task list only",
      transform: (text) => extractActionItems(text),
    },
    {
      id: "raw",
      label: "Full Report",
      icon: "📋",
      description: "Complete SEO report",
      transform: (text) => text,
    },
  ],

  sara: [
    {
      id: "linkedin_post",
      label: "LinkedIn Post",
      icon: "💼",
      description: "Ready to post on LinkedIn",
      transform: (text) => extractAndFormatLinkedIn(text, "social"),
    },
    {
      id: "instagram_caption",
      label: "Instagram Caption",
      icon: "📸",
      description: "With GCC hashtags",
      transform: (text) => extractInstagramCaption(text),
    },
    {
      id: "content_calendar",
      label: "Content Calendar",
      icon: "📅",
      description: "Scheduled posts list",
      transform: (text) => extractContentCalendar(text),
    },
    {
      id: "raw",
      label: "Full Brief",
      icon: "📋",
      description: "Complete social brief",
      transform: (text) => text,
    },
  ],

  kwame: [
    {
      id: "outreach_message",
      label: "Outreach Message",
      icon: "✉️",
      description: "Ready to send on LinkedIn/email",
      transform: (text) => extractOutreachMessage(text),
    },
    {
      id: "prospect_list",
      label: "Prospect List",
      icon: "🎯",
      description: "Names, companies, contacts",
      transform: (text) => extractProspectList(text),
    },
    {
      id: "pipeline_update",
      label: "Pipeline Update",
      icon: "📊",
      description: "HubSpot-ready status summary",
      transform: (text) => extractPipelineUpdate(text),
    },
    {
      id: "raw",
      label: "Full Report",
      icon: "📋",
      description: "Complete lead gen update",
      transform: (text) => text,
    },
  ],

  amara: [
    {
      id: "design_brief",
      label: "Design Brief",
      icon: "🎨",
      description: "Ready for Canva/Figma designer",
      transform: (text) => extractDesignBrief(text),
    },
    {
      id: "brand_feedback",
      label: "Brand Feedback",
      icon: "🔍",
      description: "Consistency audit notes",
      transform: (text) => extractBrandFeedback(text),
    },
    {
      id: "raw",
      label: "Full Brief",
      icon: "📋",
      description: "Complete design brief",
      transform: (text) => text,
    },
  ],

  hassan: [
    {
      id: "ad_copy",
      label: "Ad Copy",
      icon: "📣",
      description: "Ready for LinkedIn/Meta Ads",
      transform: (text) => extractAdCopy(text),
    },
    {
      id: "campaign_report",
      label: "Campaign Report",
      icon: "📊",
      description: "Performance summary",
      transform: (text) => extractCampaignReport(text),
    },
    {
      id: "optimisation_actions",
      label: "Optimisation Actions",
      icon: "⚡",
      description: "Numbered actions to take now",
      transform: (text) => extractActionItems(text),
    },
    {
      id: "raw",
      label: "Full Report",
      icon: "📋",
      description: "Complete ads report",
      transform: (text) => text,
    },
  ],

  zara: [
    {
      id: "executive_summary",
      label: "Executive Summary",
      icon: "📊",
      description: "3-sentence overview for leadership",
      transform: (text) => extractExecutiveSummary(text),
    },
    {
      id: "slack_update",
      label: "Slack/WhatsApp Update",
      icon: "💬",
      description: "Short team update format",
      transform: (text) => extractSlackUpdate(text),
    },
    {
      id: "action_items",
      label: "Action Items",
      icon: "✅",
      description: "Next week's priorities only",
      transform: (text) => extractActionItems(text),
    },
    {
      id: "raw",
      label: "Full Report",
      icon: "📋",
      description: "Complete analytics report",
      transform: (text) => text,
    },
  ],
};

// ── TRANSFORM FUNCTIONS ───────────────────────────────────────────────────────

function extractAndFormatLinkedIn(text, type) {
  // Look for LinkedIn post section in the output
  const postMatch = text.match(/(?:LinkedIn post|Post[:\s]*\n)([\s\S]{100,800})(?:\n\n|\n---|\nInstagram|$)/i);
  if (postMatch) return cleanForLinkedIn(postMatch[1]);

  // If no specific section found, format the key insight as a post
  const lines = text.split('\n').filter(l => l.trim().length > 20);
  const insight = lines.slice(0, 8).join('\n');
  return cleanForLinkedIn(insight);
}

function cleanForLinkedIn(text) {
  // Clean up and format for LinkedIn
  const cleaned = text
    .replace(/^[-•*]\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/#{1,3}\s/g, '')
    .trim();

  return `${cleaned}

---
Posted via FifteenConsult AI Marketing Department`;
}

function extractInstagramCaption(text) {
  const captionMatch = text.match(/(?:Instagram|caption|Caption)[:\s]*\n([\s\S]{50,400})(?:\n\n|$)/i);
  const caption = captionMatch
    ? captionMatch[1].trim()
    : text.split('\n').filter(l => l.trim().length > 30).slice(0, 4).join('\n');

  const hashtags = `\n\n#FifteenConsult #MarketingQatar #DohaMarketing #GCCBusiness #MarketingConsultancy #QatarBusiness #DigitalMarketing #BrandStrategy #MarketingTips #GCCMarketing`;

  return `${caption.replace(/\*\*/g, '').trim()}${hashtags}`;
}

function extractNewsletter(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const subjectMatch = text.match(/(?:subject|Subject line)[:\s]+(.+)/i);
  const subject = subjectMatch ? subjectMatch[1].trim() : "This week from FifteenConsult";

  return `SUBJECT: ${subject}

---

${text.replace(/\*\*/g, '').replace(/#{1,3}\s/g, '').trim()}

---
FifteenConsult · Doha, Qatar
Turn Marketing Complexity Into Measurable Growth
Unsubscribe | fifteenconsult.com`;
}

function extractSeoBrief(text) {
  const briefMatch = text.match(/(?:SEO brief|Blog brief|BRIEF)[:\s]*([\s\S]+?)(?:\n---|\n\n\n|$)/i);
  if (briefMatch) return formatBrief("SEO BLOG BRIEF", briefMatch[1]);

  // Extract key SEO elements
  const keywordMatch = text.match(/(?:keyword|target)[:\s]+(.+)/i);
  const topicMatch   = text.match(/(?:topic|title|article)[:\s]+(.+)/i);

  return formatBrief("SEO BLOG BRIEF FOR NADIA", text);
}

function formatBrief(title, content) {
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${content.replace(/\*\*/g, '').trim()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated: ${new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}
FifteenConsult AI Marketing Department`;
}

function extractActionItems(text) {
  // Extract numbered or bulleted action items
  const lines = text.split('\n');
  const actions = lines.filter(l =>
    /^\d+[\.\)]\s/.test(l.trim()) ||
    /^[-•*]\s/.test(l.trim()) ||
    /^action/i.test(l.trim())
  );

  if (actions.length > 0) {
    return `ACTION ITEMS — ${new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}

${actions.map((a, i) => `${i+1}. ${a.replace(/^[\d\.\)\-•*\s]+/, '').trim()}`).join('\n')}

Generated by FifteenConsult AI Department`;
  }

  // Fall back to extracting sentences with action verbs
  const actionLines = lines.filter(l =>
    /\b(create|write|send|post|build|research|follow|update|review|fix|optimise|launch|run|draft|schedule)\b/i.test(l)
    && l.trim().length > 20
  ).slice(0, 10);

  return `ACTION ITEMS — ${new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}

${actionLines.map((a, i) => `${i+1}. ${a.trim().replace(/^[-•*\d\.\)]\s*/, '')}`).join('\n')}

Generated by FifteenConsult AI Department`;
}

function extractOutreachMessage(text) {
  // Look for outreach/email section
  const msgMatch = text.match(/(?:outreach|message|email|LinkedIn message|Hi |Dear )([\s\S]{100,600})(?:\n\n\n|---|\nProspect|$)/i);
  if (msgMatch) {
    return msgMatch[0].replace(/\*\*/g, '').trim();
  }

  // Find the most email-like paragraph
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 80);
  const emailPara  = paragraphs.find(p => /\b(Hi|Hello|Dear|I noticed|I came across|Quick question)\b/i.test(p));

  return emailPara
    ? emailPara.replace(/\*\*/g, '').trim()
    : text.split('\n\n').filter(p => p.trim().length > 80)[0]?.replace(/\*\*/g, '').trim() || text;
}

function extractProspectList(text) {
  const lines = text.split('\n');
  const prospects = lines.filter(l =>
    l.trim().length > 10 &&
    (/company|prospect|contact|name|title|role/i.test(l) ||
     /\d+\.\s/.test(l.trim()))
  );

  if (prospects.length > 0) {
    return `PROSPECT LIST — ${new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}

${prospects.join('\n').replace(/\*\*/g, '').trim()}

Source: FifteenConsult Lead Gen · Add to HubSpot`;
  }
  return `PROSPECT LIST — ${new Date().toLocaleDateString('en-GB')}

${text.replace(/\*\*/g, '').trim()}

Source: FifteenConsult Lead Gen · Add to HubSpot`;
}

function extractPipelineUpdate(text) {
  const stageMatch = text.match(/(?:pipeline|Pipeline|New|Contacted|Responded|Meeting)([\s\S]{0,800})/i);
  const content = stageMatch ? stageMatch[0] : text.slice(0, 600);

  return `PIPELINE UPDATE — ${new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}

${content.replace(/\*\*/g, '').trim()}

→ Update HubSpot with these statuses
Generated: FifteenConsult AI Department`;
}

function extractDesignBrief(text) {
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN BRIEF — FIFTEENCONSULT
${new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${text.replace(/\*\*/g, '').replace(/#{1,3}\s/g, '').trim()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Brand colours: #080808 (base) · #C8A96E (gold) · #FFFFFF (text)
Typography: Cormorant Garamond (display) · DM Mono (UI)
→ Execute in Canva or Figma`;
}

function extractBrandFeedback(text) {
  const feedbackMatch = text.match(/(?:brand audit|consistency|off-brand|feedback)([\s\S]{0,600})/i);
  return feedbackMatch
    ? `BRAND AUDIT NOTES\n\n${feedbackMatch[0].replace(/\*\*/g, '').trim()}`
    : `BRAND FEEDBACK\n\n${text.replace(/\*\*/g, '').trim()}`;
}

function extractAdCopy(text) {
  const adMatch = text.match(/(?:ad copy|Ad Copy|Headline|headline|CTA|Body copy)([\s\S]{0,800})/i);
  const content = adMatch ? adMatch[0] : text.slice(0, 800);

  return `AD COPY — FIFTEENCONSULT
${new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}

${content.replace(/\*\*/g, '').trim()}

→ A/B test these variants in LinkedIn Campaign Manager / Meta Ads`;
}

function extractCampaignReport(text) {
  return `CAMPAIGN REPORT — ${new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}

${text.replace(/\*\*/g, '').replace(/#{1,3}\s/g, '').trim()}

Generated: FifteenConsult Paid Ads Dashboard`;
}

function extractExecutiveSummary(text) {
  // Find the executive summary section
  const summaryMatch = text.match(/(?:executive summary|summary|SUMMARY)[:\s]*([\s\S]{0,500}?)(?:\n\n|\n#{1,3}|$)/i);
  if (summaryMatch && summaryMatch[1].trim().length > 50) {
    return `EXECUTIVE SUMMARY — Week ${getWeekNum()}, ${new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}

${summaryMatch[1].replace(/\*\*/g, '').trim()}

FifteenConsult · AI Marketing Department`;
  }

  // Take first meaningful paragraph
  const firstPara = text.split('\n\n').find(p => p.trim().length > 100);
  return `EXECUTIVE SUMMARY — Week ${getWeekNum()}, ${new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}

${(firstPara || text.slice(0,400)).replace(/\*\*/g, '').trim()}

FifteenConsult · AI Marketing Department`;
}

function extractSlackUpdate(text) {
  const lines = text.split('\n').filter(l => l.trim().length > 15);
  const topLines = lines.slice(0, 6).map(l =>
    l.trim().replace(/^[-•*\d\.\)]\s*/, '').replace(/\*\*/g, '')
  );

  return `📊 *FifteenConsult Weekly Update* — ${new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}

${topLines.map(l => `• ${l}`).join('\n')}

_Generated by Zara (Analytics) · FifteenConsult AI Dept_`;
}

function extractContentCalendar(text) {
  const lines = text.split('\n');
  const calLines = lines.filter(l =>
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|day \d|week \d|linkedin|instagram|facebook|post|reel|carousel)\b/i.test(l)
    && l.trim().length > 10
  );

  if (calLines.length > 0) {
    return `CONTENT CALENDAR — ${new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}

${calLines.map(l => l.replace(/\*\*/g, '').trim()).join('\n')}

→ Schedule via Buffer/Hootsuite or post manually`;
  }

  return `CONTENT CALENDAR\n\n${text.replace(/\*\*/g, '').trim()}`;
}

function getWeekNum() {
  const d = new Date();
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
