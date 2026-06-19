/**
 * /src/lib/memory.js
 * Auto-captured working memory — a short rolling log of what each agent has
 * recently done. Filled hands-off after every briefing (no extra API call:
 * the entry is distilled from the briefing text itself). Injected lean into
 * briefings + chat so agents have continuity across sessions.
 *
 * Shape: { [agentId]: [ { date, summary, ts }, ... ] }  (rolling, capped)
 */
import { isFirebaseEnabled, cloudSave } from "./firebase.js";

const KEY = "fc_memory_v1";
const MAX = 8; // rolling cap per agent

export function loadMemory() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
  catch { return {}; }
}

export function saveMemory(map) {
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch {}
  if (isFirebaseEnabled()) cloudSave("memory", "all_memory", map).catch(() => {});
}

// Distil a clean one-liner from a briefing's full text — no second API call.
export function distill(text, max = 220) {
  if (!text) return "";
  let s = text
    .replace(/\[\[HANDOFF\]\][\s\S]*?\[\[\/HANDOFF\]\]/gi, "")
    .replace(/\[\[\/?HANDOFF\]\]/gi, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[*_`#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return (stop > 80 ? cut.slice(0, stop + 1) : cut).trim() + "…";
}

export function addMemoryEntry(agentId, { date, summary }) {
  if (!summary) return;
  const map = loadMemory();
  const list = map[agentId] || [];
  list.push({ date, summary, ts: Date.now() });
  map[agentId] = list.slice(-MAX);
  saveMemory(map);
}

export function getMemory(agentId, n = 5) {
  return (loadMemory()[agentId] || []).slice(-n);
}

// Lean text block injected into the agent's context.
export function formatMemoryBlock(agentId, n = 5) {
  const list = getMemory(agentId, n);
  if (!list.length) return "";
  const lines = list.map(e => `- ${e.date}: ${e.summary}`).join("\n");
  return `WHAT YOU'VE DONE RECENTLY (your own working memory — use it for continuity and don't repeat yourself):\n${lines}`;
}

export function clearMemory(agentId) {
  const map = loadMemory();
  if (agentId) delete map[agentId]; else Object.keys(map).forEach(k => delete map[k]);
  saveMemory(map);
}
