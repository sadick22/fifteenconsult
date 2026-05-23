/**
 * storage.js
 * Handles all localStorage persistence for the FC dashboard.
 * Supports: current outputs, task states, run history per agent.
 */

const KEY = "fc_v6";
const MAX_HISTORY_PER_AGENT = 20; // keep last 20 briefings per agent

export function loadStorage() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveStorage(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Storage write failed:", e);
  }
}

// ── HISTORY ───────────────────────────────────────────────────────────────────

/**
 * Add a completed briefing to an agent's run history.
 * @param {string} agentId
 * @param {object} entry - { text, timestamp, date, customPrompt }
 */
export function addToHistory(agentId, entry) {
  const store = loadStorage();
  if (!store.history) store.history = {};
  if (!store.history[agentId]) store.history[agentId] = [];

  // Prepend newest first
  store.history[agentId] = [
    { ...entry, id: Date.now() },
    ...store.history[agentId],
  ].slice(0, MAX_HISTORY_PER_AGENT);

  saveStorage(store);
  return store.history[agentId];
}

/**
 * Get full run history for an agent.
 */
export function getHistory(agentId) {
  const store = loadStorage();
  return store.history?.[agentId] || [];
}

/**
 * Get all history across all agents (for weekly summary).
 */
export function getAllHistory() {
  const store = loadStorage();
  return store.history || {};
}

/**
 * Clear history for a specific agent.
 */
export function clearAgentHistory(agentId) {
  const store = loadStorage();
  if (store.history) delete store.history[agentId];
  saveStorage(store);
}

/**
 * Clear ALL stored data (full reset).
 */
export function clearAll() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

// ── TASKS ─────────────────────────────────────────────────────────────────────

export function saveTasks(tasks) {
  const store = loadStorage();
  store.tasks = tasks;
  saveStorage(store);
}

export function loadTasks() {
  return loadStorage().tasks || {};
}

// ── CURRENT OUTPUTS ───────────────────────────────────────────────────────────

export function saveOutputs(outputs) {
  const store = loadStorage();
  store.outputs = outputs;
  saveStorage(store);
}

export function loadOutputs() {
  return loadStorage().outputs || {};
}

// ── SCHEDULES ─────────────────────────────────────────────────────────────────

export function saveSchedules(schedules) {
  const store = loadStorage();
  store.schedules = schedules;
  saveStorage(store);
}

export function loadSchedules() {
  return loadStorage().schedules || {};
}
