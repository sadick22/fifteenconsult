/**
 * dateContext.js
 * Generates rich date awareness context injected into every agent briefing.
 * Covers: exact date, week number, days remaining in month/quarter,
 * GCC business context, and working day awareness.
 */

export function getDateContext() {
  const now = new Date();

  const dayNames   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const dayOfWeek   = dayNames[now.getDay()];
  const dayOfMonth  = now.getDate();
  const month       = monthNames[now.getMonth()];
  const monthNum    = now.getMonth() + 1;
  const year        = now.getFullYear();
  const weekNum     = getWeekNumber(now);

  // Days remaining in month
  const lastDayOfMonth    = new Date(year, now.getMonth() + 1, 0).getDate();
  const daysLeftInMonth   = lastDayOfMonth - dayOfMonth;

  // Days remaining in quarter
  const quarterEnd        = getQuarterEnd(now);
  const daysLeftInQuarter = Math.ceil((quarterEnd - now) / (1000 * 60 * 60 * 24));
  const currentQuarter    = Math.ceil(monthNum / 3);

  // GCC working week (Sun–Thu standard, Fri–Sat weekend)
  const isGCCWeekend = now.getDay() === 5 || now.getDay() === 6;
  const gccDayContext = isGCCWeekend
    ? "Note: Today is a GCC weekend day (Friday/Saturday). Plan content and outreach for Sunday resumption."
    : "Today is a GCC working day.";

  // Week position
  const weekPosition = getWeekPosition(now.getDay());

  // Month progress %
  const monthProgress = Math.round((dayOfMonth / lastDayOfMonth) * 100);

  // GCC seasonal context
  const seasonalContext = getSeasonalContext(monthNum, dayOfMonth);

  return {
    formatted: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATE & TIME CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Today          : ${dayOfWeek}, ${dayOfMonth} ${month} ${year}
Week Number    : Week ${weekNum} of ${year}
Week Position  : ${weekPosition}
Month Progress : ${monthProgress}% through ${month} (${daysLeftInMonth} days remaining)
Quarter        : Q${currentQuarter} ${year} — ${daysLeftInQuarter} days remaining
GCC Context    : ${gccDayContext}
${seasonalContext ? `Seasonal Note  : ${seasonalContext}` : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim(),
    dayOfWeek,
    dayOfMonth,
    month,
    year,
    weekNum,
    daysLeftInMonth,
    daysLeftInQuarter,
    currentQuarter,
    isGCCWeekend,
    monthProgress,
  };
}

export function buildBriefingTrigger(baseTrigger, dateContext, customPrompt = "") {
  const custom = customPrompt?.trim()
    ? `\n\nFOCUS DIRECTIVE FOR THIS BRIEFING: ${customPrompt.trim()}`
    : "";

  return `${dateContext.formatted}\n\n${baseTrigger}${custom}`;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getQuarterEnd(date) {
  const month = date.getMonth();
  const year  = date.getFullYear();
  const quarterEndMonth = [2, 5, 8, 11][Math.floor(month / 3)];
  return new Date(year, quarterEndMonth + 1, 0);
}

function getWeekPosition(dayIndex) {
  const positions = {
    0: "Weekend (Sunday — GCC start of week)",
    1: "Start of week (Monday)",
    2: "Early week (Tuesday)",
    3: "Mid-week (Wednesday)",
    4: "Late week (Thursday)",
    5: "End of GCC working week (Friday)",
    6: "Weekend (Saturday)",
  };
  return positions[dayIndex] || "Weekday";
}

function getSeasonalContext(month, day) {
  // GCC-relevant seasonal notes
  if (month === 12 && day >= 18 && day <= 31) return "UAE/Qatar National Day season — high brand visibility period in GCC";
  if (month === 1)  return "New Year — strong period for marketing strategy and planning pitches in GCC";
  if (month === 2)  return "Pre-Ramadan period approaching — plan Ramadan campaign content now";
  if (month === 3)  return "Potential Ramadan period — adjust posting times to evening, focus on brand warmth";
  if (month === 4)  return "Eid Al-Fitr period likely — strong brand engagement window post-Ramadan";
  if (month === 6)  return "Summer slowdown beginning in GCC — nurture existing leads, focus on content";
  if (month === 7 || month === 8) return "GCC summer — key decision makers may be travelling. Focus on digital, nurture sequences";
  if (month === 9)  return "Post-summer return — strong Q4 pipeline building period in GCC";
  if (month === 10) return "Q4 push begins — ideal for closing deals and pitching annual retainers";
  if (month === 11) return "Year-end budget spend — many GCC companies finalising 2025 marketing budgets";
  return "";
}
