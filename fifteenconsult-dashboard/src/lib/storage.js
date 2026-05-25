/**
 * storage.js
 * Unified storage — uses Firebase Firestore when configured, localStorage as fallback.
 * All existing code works unchanged — Firebase syncs transparently in background.
 */

import {
  isFirebaseEnabled, saveRunHistory, loadRunHistory,
  saveKPIs, loadKPIs, saveSettings, loadSettings,
  saveDocuments, loadDocuments, saveCompetitors, loadCompetitors,
  saveFramework, loadFramework, saveNotifications, loadNotifications,
} from "./firebase.js";

const KEY = "fc_v6";
const MAX_HISTORY_PER_AGENT = 20;

// ── LOCAL STORAGE HELPERS ────────────────────────────────────────────────────

export function loadStorage() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
  catch { return {}; }
}

export function saveStorage(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); }
  catch (e) { console.warn("Storage write failed:", e); }
}

// ── HISTORY ──────────────────────────────────────────────────────────────────

export function addToHistory(agentId, entry) {
  const store = loadStorage();
  if (!store.history) store.history = {};
  if (!store.history[agentId]) store.history[agentId] = [];

  store.history[agentId] = [
    { ...entry, id: Date.now() },
    ...store.history[agentId],
  ].slice(0, MAX_HISTORY_PER_AGENT);

  saveStorage(store);

  // Sync to Firebase in background
  if (isFirebaseEnabled()) {
    saveRunHistory(agentId, store.history[agentId]).catch(() => {});
  }

  return store.history[agentId];
}

export function getHistory(agentId) {
  return loadStorage().history?.[agentId] || [];
}

export function getAllHistory() {
  return loadStorage().history || {};
}

export function clearAgentHistory(agentId) {
  const store = loadStorage();
  if (store.history) delete store.history[agentId];
  saveStorage(store);
  if (isFirebaseEnabled()) saveRunHistory(agentId, []).catch(() => {});
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

// ── OUTPUTS ──────────────────────────────────────────────────────────────────

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

// ── KPIs (Firebase-synced) ────────────────────────────────────────────────────

const KPIS_KEY = "fc_live_kpis_v1";

export function saveLiveKPIs(data) {
  try { localStorage.setItem(KPIS_KEY, JSON.stringify(data)); } catch {}
  if (isFirebaseEnabled()) saveKPIs(data).catch(() => {});
}

export function loadLiveKPIs() {
  try { return JSON.parse(localStorage.getItem(KPIS_KEY) || "{}"); }
  catch { return {}; }
}

// ── SETTINGS (Firebase-synced) ────────────────────────────────────────────────

const SETTINGS_KEY = "fc_settings_v1";

export function saveDashboardSettings(data) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(data)); } catch {}
  if (isFirebaseEnabled()) saveSettings(data).catch(() => {});
}

export function loadDashboardSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"); }
  catch { return {}; }
}

// ── COMPETITORS (Firebase-synced) ─────────────────────────────────────────────

const COMP_KEY = "fc_competitors_v1";

export function saveCompetitorData(data) {
  try { localStorage.setItem(COMP_KEY, JSON.stringify(data)); } catch {}
  if (isFirebaseEnabled()) saveCompetitors(data).catch(() => {});
}

export function loadCompetitorData() {
  try { return JSON.parse(localStorage.getItem(COMP_KEY) || "null"); }
  catch { return null; }
}

// ── FRAMEWORK (Firebase-synced) ───────────────────────────────────────────────

const FRAMEWORK_KEY = "fc_framework_v1";

export function saveFrameworkData(data) {
  try { localStorage.setItem(FRAMEWORK_KEY, JSON.stringify(data)); } catch {}
  if (isFirebaseEnabled()) saveFramework(data).catch(() => {});
}

export function loadFrameworkData() {
  try { return JSON.parse(localStorage.getItem(FRAMEWORK_KEY) || "null"); }
  catch { return null; }
}

// ── NOTIFICATIONS (Firebase-synced) ───────────────────────────────────────────

const NOTIF_KEY = "fc_notifications_v1";

export function saveNotificationData(data) {
  try { localStorage.setItem(NOTIF_KEY, JSON.stringify(data)); } catch {}
  if (isFirebaseEnabled()) saveNotifications(data).catch(() => {});
}

export function loadNotificationData() {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]"); }
  catch { return []; }
}

// ── FULL RESET ─────────────────────────────────────────────────────────────────

export function clearAll() {
  try { localStorage.removeItem(KEY); } catch {}
}

// ── FIREBASE INIT TRIGGER ─────────────────────────────────────────────────────
// Call this on app load to initialise Firebase and sync any pending data

export async function initFirebaseSync() {
  if (!isFirebaseEnabled()) return;
  try {
    const { checkFirebaseStatus } = await import("./firebase.js");
    const status = await checkFirebaseStatus();
    if (status.connected) {
      console.log("✅ Firebase connected:", status.projectId);
    }
  } catch (err) {
    console.warn("Firebase sync init failed:", err.message);
  }
}
