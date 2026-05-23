/**
 * scheduler.js
 * Agent scheduling engine for FifteenConsult AI Marketing Department.
 *
 * Schedules are stored in localStorage and checked on every page load/focus.
 * When a scheduled run is due, the agent fires automatically.
 *
 * GCC-aware: defaults respect the Qatar/GCC working week (Sun–Thu).
 */

const STORAGE_KEY = "fc_schedules_v2";

// ── DEFAULT SCHEDULES ─────────────────────────────────────────────────────────
// GCC working week: Sunday–Thursday. Friday/Saturday = weekend.
// Times are in 24h format, local browser time.

export const DEFAULT_SCHEDULES = {
  nadia: {
    enabled:   true,
    frequency: "daily",         // daily | weekly | weekdays | custom
    days:      [0,1,2,3,4],    // Sun–Thu (GCC working week)
    hour:      8,
    minute:    0,
    label:     "Daily 8:00 AM (Sun–Thu)",
    description: "Morning content standup every GCC working day",
  },
  tariq: {
    enabled:   true,
    frequency: "daily",
    days:      [0,1,2,3,4],
    hour:      8,
    minute:    30,
    label:     "Daily 8:30 AM (Sun–Thu)",
    description: "SEO status report every GCC working day",
  },
  sara: {
    enabled:   true,
    frequency: "daily",
    days:      [0,1,2,3,4],
    hour:      8,
    minute:    0,
    label:     "Daily 8:00 AM (Sun–Thu)",
    description: "Social media morning brief every GCC working day",
  },
  kwame: {
    enabled:   true,
    frequency: "daily",
    days:      [0,1,2,3,4],
    hour:      9,
    minute:    0,
    label:     "Daily 9:00 AM (Sun–Thu)",
    description: "Lead gen update every GCC working day",
  },
  amara: {
    enabled:   true,
    frequency: "weekly",
    days:      [0],             // Sunday (start of GCC week)
    hour:      9,
    minute:    0,
    label:     "Weekly — Sunday 9:00 AM",
    description: "Brand & design brief at start of GCC week",
  },
  hassan: {
    enabled:   true,
    frequency: "daily",
    days:      [0,1,2,3,4],
    hour:      9,
    minute:    30,
    label:     "Daily 9:30 AM (Sun–Thu)",
    description: "Ads performance report every GCC working day",
  },
  zara: {
    enabled:   true,
    frequency: "weekly",
    days:      [4],             // Thursday (end of GCC working week)
    hour:      16,
    minute:    0,
    label:     "Weekly — Thursday 4:00 PM",
    description: "Weekly analytics report at end of GCC working week",
  },
};

// ── FREQUENCY OPTIONS ─────────────────────────────────────────────────────────
export const FREQUENCY_OPTIONS = [
  { value: "daily",    label: "Every day" },
  { value: "weekdays", label: "GCC working days (Sun–Thu)" },
  { value: "weekly",   label: "Once a week" },
  { value: "disabled", label: "Manual only" },
];

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_NAMES_FULL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// ── STORAGE ───────────────────────────────────────────────────────────────────
export function loadSchedules() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    // Merge with defaults — stored values override defaults
    const merged = {};
    Object.keys(DEFAULT_SCHEDULES).forEach(id => {
      merged[id] = { ...DEFAULT_SCHEDULES[id], ...(stored[id] || {}) };
    });
    return merged;
  } catch {
    return { ...DEFAULT_SCHEDULES };
  }
}

export function saveSchedules(schedules) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
  } catch {}
}

export function updateAgentSchedule(agentId, updates) {
  const all = loadSchedules();
  all[agentId] = { ...all[agentId], ...updates };
  saveSchedules(all);
  return all;
}

// ── LAST RUN TRACKING ─────────────────────────────────────────────────────────
const LAST_RUN_KEY = "fc_last_run_v2";

export function getLastRuns() {
  try {
    return JSON.parse(localStorage.getItem(LAST_RUN_KEY) || "{}");
  } catch { return {}; }
}

export function markRun(agentId) {
  const runs = getLastRuns();
  runs[agentId] = Date.now();
  try { localStorage.setItem(LAST_RUN_KEY, JSON.stringify(runs)); } catch {}
}

// ── NEXT RUN CALCULATION ──────────────────────────────────────────────────────
/**
 * Calculate the next scheduled run time for an agent.
 * Returns a Date object or null if disabled.
 */
export function getNextRun(schedule) {
  if (!schedule.enabled || schedule.frequency === "disabled") return null;

  const now  = new Date();
  const days = getDaysForFrequency(schedule);
  if (!days.length) return null;

  // Try today first, then scan forward up to 14 days
  for (let i = 0; i < 14; i++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + i);
    candidate.setHours(schedule.hour, schedule.minute, 0, 0);

    // Must be a scheduled day
    if (!days.includes(candidate.getDay())) continue;

    // Must be in the future (at least 1 minute ahead)
    if (candidate.getTime() > now.getTime() + 60000) {
      return candidate;
    }
  }
  return null;
}

function getDaysForFrequency(schedule) {
  switch (schedule.frequency) {
    case "daily":    return [0,1,2,3,4,5,6];
    case "weekdays": return [0,1,2,3,4]; // GCC Sun–Thu
    case "weekly":   return schedule.days || [0];
    case "custom":   return schedule.days || [];
    default:         return [];
  }
}

/**
 * Format next run time as human-readable string.
 */
export function formatNextRun(nextRun) {
  if (!nextRun) return "Manual only";

  const now  = new Date();
  const diff = nextRun.getTime() - now.getTime();
  const mins = Math.round(diff / 60000);
  const hrs  = Math.round(diff / 3600000);

  if (mins < 2)   return "Running soon";
  if (mins < 60)  return `In ${mins}m`;
  if (hrs < 2)    return `In ${hrs}h`;
  if (hrs < 24)   return `Today ${nextRun.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (nextRun.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow ${nextRun.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}`;
  }

  return nextRun.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Check which agents are due to run now.
 * Returns array of agent IDs that should fire.
 */
export function getDueAgents(schedules) {
  const now      = new Date();
  const lastRuns = getLastRuns();
  const due      = [];

  Object.entries(schedules).forEach(([agentId, schedule]) => {
    if (!schedule.enabled || schedule.frequency === "disabled") return;

    const days = getDaysForFrequency(schedule);
    if (!days.includes(now.getDay())) return;

    // Check if scheduled time has passed today
    const scheduledToday = new Date(now);
    scheduledToday.setHours(schedule.hour, schedule.minute, 0, 0);

    if (now < scheduledToday) return; // Not yet

    // Check if already ran today
    const lastRun = lastRuns[agentId];
    if (lastRun) {
      const lastRunDate = new Date(lastRun);
      const todayStart  = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      if (lastRunDate >= todayStart) return; // Already ran today
    }

    due.push(agentId);
  });

  return due;
}
