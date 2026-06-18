/**
 * /src/lib/handoffs.js
 * Internal handoff "mailbox" — lets one agent route work to another.
 * Stored as a single array, mirrored to localStorage + Firestore (same pattern
 * as chats). A lightweight pub/sub lets the alerts panel, orbit, inbox and feed
 * update live the moment a handoff is created.
 *
 * Handoff record shape:
 *   { id, from, to, type, summary, body, status:"pending"|"read", createdAt, readAt }
 *   - summary  → injected into the recipient's context (lean)
 *   - body     → stored in full, pulled into context only on request
 */
import { isFirebaseEnabled, cloudSave } from "./firebase.js";

const KEY = "fc_handoffs_v1";
const listeners = new Set();

export function loadHandoffs() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}

export function saveHandoffs(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  if (isFirebaseEnabled()) cloudSave("handoffs", "all_handoffs", list).catch(() => {});
  listeners.forEach(fn => { try { fn(list); } catch {} });
}

// Subscribe to handoff changes. Returns an unsubscribe function.
export function subscribeHandoffs(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Create a handoff. Returns the new record.
export function addHandoff({ from, to, type = "note", summary, body }) {
  const list = loadHandoffs();
  const rec = {
    id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    from, to, type,
    summary: (summary || "").trim().slice(0, 240),
    body: (body || "").trim(),
    status: "pending",
    createdAt: Date.now(),
    readAt: null,
  };
  list.push(rec);
  saveHandoffs(list);
  return rec;
}

export function markHandoffRead(id) {
  const list = loadHandoffs();
  let changed = false;
  const next = list.map(h => {
    if (h.id === id && h.status !== "read") { changed = true; return { ...h, status: "read", readAt: Date.now() }; }
    return h;
  });
  if (changed) saveHandoffs(next);
}

export function markAllReadFor(agentId) {
  const list = loadHandoffs();
  let changed = false;
  const next = list.map(h => {
    if (h.to === agentId && h.status === "pending") { changed = true; return { ...h, status: "read", readAt: Date.now() }; }
    return h;
  });
  if (changed) saveHandoffs(next);
}

export function pendingFor(agentId) {
  return loadHandoffs().filter(h => h.to === agentId && h.status === "pending");
}

export function getHandoffById(id) {
  return loadHandoffs().find(h => h.id === id) || null;
}

// Mark a handoff complete (pending → done). Stays in the 7-day feed, then archives.
export function markHandoffDone(id) {
  const list = loadHandoffs();
  let changed = false;
  const next = list.map(h => {
    if (h.id === id && h.status !== "done") { changed = true; return { ...h, status: "done", doneAt: Date.now() }; }
    return h;
  });
  if (changed) saveHandoffs(next);
}

const DAY = 24 * 60 * 60 * 1000;

// Live feed = handoffs from the last `days` days, newest first.
export function feedHandoffs(days = 7) {
  const cutoff = Date.now() - days * DAY;
  return loadHandoffs()
    .filter(h => (h.createdAt || 0) >= cutoff)
    .sort((a, b) => b.createdAt - a.createdAt);
}

// Count of handoffs older than the feed window (archived, still stored).
export function archivedCount(days = 7) {
  const cutoff = Date.now() - days * DAY;
  return loadHandoffs().filter(h => (h.createdAt || 0) < cutoff).length;
}

export function recentHandoffs(n = 25) {
  return loadHandoffs().slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, n);
}
