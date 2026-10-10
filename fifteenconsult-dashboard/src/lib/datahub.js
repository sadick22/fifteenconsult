/**
 * /src/lib/datahub.js
 * The Data Hub — Mumin Consult's shared company data: clients, documents,
 * and assets. Stored in Firestore + localStorage (same pattern as handoffs
 * and memory). Every agent receives a LEAN injected block so they always
 * know the clients, the documents that exist, and the assets available —
 * with full document text stored for on-demand pull.
 *
 * Shapes:
 *  clients:   [{ id, name, industry, status, services, notes, addedAt }]
 *  documents: [{ id, title, summary, content, addedAt }]
 *  assets:    [{ id, name, description, url, addedAt }]
 */
import { isFirebaseEnabled, cloudSave } from "./firebase.js";

const KEY = "fc_datahub_v1";
const listeners = new Set();

const EMPTY = { clients: [], documents: [], assets: [] };

export function loadDataHub() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "null");
    return d ? { ...EMPTY, ...d } : { ...EMPTY };
  } catch { return { ...EMPTY }; }
}

export function saveDataHub(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  if (isFirebaseEnabled()) cloudSave("datahub", "all_data", data).catch(() => {});
  listeners.forEach(fn => { try { fn(data); } catch {} });
}

export function subscribeDataHub(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const newId = (p) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

// ---------- Clients ----------
export function addClient({ name, industry, status, services, notes }) {
  const d = loadDataHub();
  d.clients.push({ id: newId("c"), name, industry, status, services, notes, addedAt: Date.now() });
  saveDataHub(d);
}
export function updateClient(id, fields) {
  const d = loadDataHub();
  d.clients = d.clients.map(c => c.id === id ? { ...c, ...fields } : c);
  saveDataHub(d);
}
export function removeClient(id) {
  const d = loadDataHub();
  d.clients = d.clients.filter(c => c.id !== id);
  saveDataHub(d);
}

// ---------- Documents ----------
export function addDocument({ title, summary, content }) {
  const d = loadDataHub();
  d.documents.push({ id: newId("d"), title, summary, content, addedAt: Date.now() });
  saveDataHub(d);
}
export function updateDocument(id, fields) {
  const d = loadDataHub();
  d.documents = d.documents.map(x => x.id === id ? { ...x, ...fields } : x);
  saveDataHub(d);
}
export function removeDocument(id) {
  const d = loadDataHub();
  d.documents = d.documents.filter(x => x.id !== id);
  saveDataHub(d);
}
export function getDocumentById(id) {
  return loadDataHub().documents.find(x => x.id === id) || null;
}

// ---------- Assets ----------
export function addAsset({ name, description, url }) {
  const d = loadDataHub();
  d.assets.push({ id: newId("a"), name, description, url, addedAt: Date.now() });
  saveDataHub(d);
}
export function updateAsset(id, fields) {
  const d = loadDataHub();
  d.assets = d.assets.map(x => x.id === id ? { ...x, ...fields } : x);
  saveDataHub(d);
}
export function removeAsset(id) {
  const d = loadDataHub();
  d.assets = d.assets.filter(x => x.id !== id);
  saveDataHub(d);
}

// ---------- Lean context block injected into every agent ----------
export function formatDataHubBlock(opts = {}) {
  const d = loadDataHub();
  const parts = [];

  if (d.clients.length) {
    const rows = d.clients.map(c =>
      `- ${c.name} (${c.industry || "—"}) · status: ${c.status || "active"} · we provide: ${c.services || "—"}${c.notes ? ` · notes: ${c.notes}` : ""}`
    ).join("\n");
    parts.push(`OUR CLIENTS — you know these clients; when Sadick names one, use this context without asking who they are:\n${rows}`);
  }

  if (d.documents.length) {
    const rows = d.documents.map(x =>
      `- "${x.title}": ${x.summary || "(no summary)"}`
    ).join("\n");
    parts.push(`COMPANY DOCUMENTS — these exist in the Data Hub. You know their summaries; if you need a document's full text, tell Sadick to attach it from the Data Hub (📚 button in this chat):\n${rows}`);
  }

  if (d.assets.length) {
    const rows = d.assets.map(x =>
      `- ${x.name}: ${x.description || "(no description)"}`
    ).join("\n");
    parts.push(`BRAND ASSETS AVAILABLE — reference these by name when relevant (e.g. in design specs); Sadick can attach the actual image to a chat message when you need to see it:\n${rows}`);
  }

  if (!parts.length) return "";
  return `COMPANY DATA HUB\n${parts.join("\n\n")}`;
}

// Full text of selected documents (for on-demand pull into a chat's context)
export function formatFullDocuments(ids = []) {
  if (!ids.length) return "";
  const d = loadDataHub();
  const docs = d.documents.filter(x => ids.includes(x.id));
  if (!docs.length) return "";
  return docs.map(x => `FULL DOCUMENT — "${x.title}":\n${x.content}`).join("\n\n===\n\n");
}
