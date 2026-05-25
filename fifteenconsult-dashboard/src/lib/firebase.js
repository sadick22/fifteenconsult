/**
 * /src/lib/firebase.js
 * Firebase/Firestore integration for persistent cloud storage
 * Replaces localStorage for KPIs, run history, settings, documents, competitors
 *
 * Setup:
 * 1. Go to console.firebase.google.com
 * 2. Create project "fifteenconsult-dashboard"
 * 3. Add Web App → copy config values
 * 4. Enable Firestore Database (start in test mode)
 * 5. Add env vars to Vercel (see below)
 *
 * Required Vercel env vars (all with VITE_ prefix):
 * VITE_FIREBASE_API_KEY
 * VITE_FIREBASE_AUTH_DOMAIN
 * VITE_FIREBASE_PROJECT_ID
 * VITE_FIREBASE_APP_ID
 */

// ── FIREBASE CONFIG ───────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const FIREBASE_ENABLED = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

// ── DYNAMIC IMPORTS (only load Firebase if configured) ────────────────────────

let db = null;
let initialized = false;

async function getDB() {
  if (db) return db;
  if (!FIREBASE_ENABLED) return null;
  if (initialized) return null;
  initialized = true;

  try {
    const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, serverTimestamp }
      = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    window._fsHelpers = { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, serverTimestamp };
    console.log("✅ Firebase connected:", firebaseConfig.projectId);
    return db;
  } catch (err) {
    console.warn("Firebase init failed:", err.message);
    return null;
  }
}

// ── DOCUMENT ID ───────────────────────────────────────────────────────────────
// Single user dashboard — use "sadick" as fixed user ID
const USER_ID = "sadick";

// ── STORAGE HELPERS ───────────────────────────────────────────────────────────

export function isFirebaseEnabled() {
  return FIREBASE_ENABLED;
}

// Save any data to Firestore (falls back to localStorage)
export async function cloudSave(collection_name, key, data) {
  const database = await getDB();
  if (!database) {
    // Fallback to localStorage
    try { localStorage.setItem(`fc_${key}`, JSON.stringify(data)); } catch {}
    return false;
  }

  try {
    const { doc, setDoc, serverTimestamp } = window._fsHelpers;
    await setDoc(doc(database, collection_name, `${USER_ID}_${key}`), {
      data,
      updatedAt: serverTimestamp(),
      userId: USER_ID,
    });
    return true;
  } catch (err) {
    console.warn("Firestore save failed:", err.message);
    try { localStorage.setItem(`fc_${key}`, JSON.stringify(data)); } catch {}
    return false;
  }
}

// Load data from Firestore (falls back to localStorage)
export async function cloudLoad(collection_name, key, defaultValue = null) {
  const database = await getDB();
  if (!database) {
    try {
      const local = localStorage.getItem(`fc_${key}`);
      return local ? JSON.parse(local) : defaultValue;
    } catch { return defaultValue; }
  }

  try {
    const { doc, getDoc } = window._fsHelpers;
    const snap = await getDoc(doc(database, collection_name, `${USER_ID}_${key}`));
    if (snap.exists()) return snap.data().data;
    // Try localStorage as fallback
    const local = localStorage.getItem(`fc_${key}`);
    return local ? JSON.parse(local) : defaultValue;
  } catch (err) {
    console.warn("Firestore load failed:", err.message);
    try {
      const local = localStorage.getItem(`fc_${key}`);
      return local ? JSON.parse(local) : defaultValue;
    } catch { return defaultValue; }
  }
}

// ── SPECIFIC SAVE/LOAD FUNCTIONS ──────────────────────────────────────────────

export async function saveKPIs(kpis) {
  return cloudSave("dashboard", "live_kpis", kpis);
}

export async function loadKPIs() {
  return cloudLoad("dashboard", "live_kpis", {});
}

export async function saveSettings(settings) {
  return cloudSave("dashboard", "settings", settings);
}

export async function loadSettings() {
  return cloudLoad("dashboard", "settings", {});
}

export async function saveRunHistory(agentId, history) {
  return cloudSave("run_history", agentId, history);
}

export async function loadRunHistory(agentId) {
  return cloudLoad("run_history", agentId, []);
}

export async function saveDocuments(agentId, docs) {
  return cloudSave("documents", agentId, docs);
}

export async function loadDocuments(agentId) {
  return cloudLoad("documents", agentId, []);
}

export async function saveCompetitors(data) {
  return cloudSave("dashboard", "competitors", data);
}

export async function loadCompetitors() {
  return cloudLoad("dashboard", "competitors", null);
}

export async function saveFramework(data) {
  return cloudSave("dashboard", "framework", data);
}

export async function loadFramework() {
  return cloudLoad("dashboard", "framework", null);
}

export async function saveNotifications(data) {
  return cloudSave("dashboard", "notifications", data);
}

export async function loadNotifications() {
  return cloudLoad("dashboard", "notifications", []);
}

// ── STATUS CHECK ──────────────────────────────────────────────────────────────
export async function checkFirebaseStatus() {
  if (!FIREBASE_ENABLED) return { connected: false, reason: "Not configured — add Firebase env vars to Vercel" };
  const db = await getDB();
  if (!db) return { connected: false, reason: "Failed to initialize" };
  return { connected: true, projectId: firebaseConfig.projectId };
}

