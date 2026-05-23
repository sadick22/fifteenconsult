/**
 * theme.js - Dark/Light mode management
 */

const THEME_KEY = "fc_theme_v1";

export function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || "dark";
  } catch { return "dark"; }
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "");
  } catch {}
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "");
}

// Dark theme colors (for inline styles)
export const DARK = {
  base:     "var(--bg-base)",
  sidebar:  "var(--bg-sidebar)",
  card:     "var(--bg-card)",
  hover:    "var(--bg-hover)",
  border:   "var(--border)",
  borderL:  "var(--border-light)",
  text:     "var(--text)",
  textMid:  "var(--text-mid)",
  textDim:  "var(--text-dim)",
  textGhost:"var(--text-ghost)",
  gold:     "var(--gold)",
  green:    "var(--green)",
  red:      "var(--red)",
  amber:    "var(--amber)",
  blue:     "var(--blue)",
};

