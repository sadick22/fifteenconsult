import { useState } from "react";
import { ALERT, ALERT_COLORS, getAlertSummary, getWorstLevel } from "../lib/alerts.js";

const T = {
  base:    "var(--bg-base)",
  card:    "var(--bg-card)",
  cardHover:"var(--bg-hover)",
  border:  "var(--border)",
  text:    "var(--text)",
  textMid: "var(--text-mid)",
  textDim: "var(--text-dim)",
  gold:    "var(--gold)",
};

const LEVEL_BG = {
  red:   "#f8717118",
  amber: "#fbbf2418",
  green: "#4ade8018",
  blue:  "#60a5fa18",
};

const LEVEL_LABEL = {
  red:   "Critical",
  amber: "Warning",
  green: "On Track",
  blue:  "Info",
};

// ── ALERT BADGE (shown in header/sidebar) ────────────────────────────────────
export function AlertBadge({ alerts, onClick }) {
  const summary = getAlertSummary(alerts);
  const worst   = getWorstLevel(alerts);
  if (summary.total === 0) return null;

  const color = ALERT_COLORS[worst];

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        background: color + "18",
        border: `1px solid ${color}44`,
        borderRadius: 20, padding: "4px 12px 4px 8px",
        cursor: "pointer", transition: "all 0.2s",
        fontFamily: "var(--font-mono)",
      }}
      onMouseEnter={e => e.currentTarget.style.background = color + "28"}
      onMouseLeave={e => e.currentTarget.style.background = color + "18"}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block", animation: worst === ALERT.RED ? "pulse 1.2s infinite" : "none" }} />
      <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.1em" }}>
        {summary.red > 0 && `${summary.red} critical`}
        {summary.red === 0 && summary.amber > 0 && `${summary.amber} warnings`}
        {summary.red === 0 && summary.amber === 0 && `${summary.green} on track`}
      </span>
    </button>
  );
}

// ── SINGLE ALERT ROW ─────────────────────────────────────────────────────────
function AlertRow({ alert, onAgentClick }) {
  const [expanded, setExpanded] = useState(false);
  const color = ALERT_COLORS[alert.level];

  return (
    <div style={{
      background: LEVEL_BG[alert.level],
      border: `1px solid ${color}33`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10, marginBottom: 10,
      overflow: "hidden", transition: "all 0.2s",
    }}>
      {/* Header row */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}
      >
        <span style={{ fontSize: 16, flexShrink: 0 }}>{alert.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 2 }}>
            {alert.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, color, background: color + "22", padding: "2px 8px", borderRadius: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
              {LEVEL_LABEL[alert.level]}
            </span>
            {alert.agentName && (
              <span style={{ fontSize: 10, color: T.textDim }}>{alert.agentName}</span>
            )}
          </div>
        </div>
        <span style={{ fontSize: 11, color: T.textDim, flexShrink: 0 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${color}22` }}>
          <p style={{ fontSize: 12, color: T.textMid, lineHeight: 1.7, marginTop: 10, marginBottom: 10 }}>
            {alert.detail}
          </p>
          {alert.action && (
            <div style={{ background: T.base, borderRadius: 8, padding: "10px 14px", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 9, color: T.textDim, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 5 }}>
                Recommended Action
              </div>
              <p style={{ fontSize: 12, color: color, lineHeight: 1.6 }}>{alert.action}</p>
            </div>
          )}
          {alert.agent && onAgentClick && (
            <button
              onClick={() => onAgentClick(alert.agent)}
              style={{
                marginTop: 10, background: color + "22",
                border: `1px solid ${color}44`, color,
                fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", padding: "5px 14px", borderRadius: 6,
                cursor: "pointer", fontFamily: "var(--font-mono)", transition: "all 0.2s",
              }}
            >
              Open {alert.agentName?.split(" ")[0]} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── ALERTS PANEL (full slide-in) ─────────────────────────────────────────────
export function AlertsPanel({ alerts, onClose, onAgentClick }) {
  const summary = getAlertSummary(alerts);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? alerts : alerts.filter(a => a.level === filter);

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: 480,
      background: T.base, borderLeft: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column", zIndex: 300,
      animation: "slideIn 0.25s ease",
      boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 6 }}>
            🔔 Department Alerts
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {summary.red > 0 && (
              <span style={{ fontSize: 10, color: ALERT_COLORS.red, background: ALERT_COLORS.red + "18", padding: "2px 10px", borderRadius: 10, fontWeight: 700 }}>
                {summary.red} Critical
              </span>
            )}
            {summary.amber > 0 && (
              <span style={{ fontSize: 10, color: ALERT_COLORS.amber, background: ALERT_COLORS.amber + "18", padding: "2px 10px", borderRadius: 10, fontWeight: 700 }}>
                {summary.amber} Warnings
              </span>
            )}
            {summary.green > 0 && (
              <span style={{ fontSize: 10, color: ALERT_COLORS.green, background: ALERT_COLORS.green + "18", padding: "2px 10px", borderRadius: 10, fontWeight: 700 }}>
                {summary.green} On Track
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMid, fontSize: 18, width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ×
        </button>
      </div>

      {/* Context banner */}
      <div style={{ padding: "10px 24px", background: T.gold + "0e", borderBottom: `1px solid #C8A96E22` }}>
        <p style={{ fontSize: 11, color: T.gold + "bb", lineHeight: 1.6 }}>
          ⚡ Alerts are calibrated for FifteenConsult as a <strong style={{ color: T.gold }}>marketing consultancy seeking clients</strong> in Qatar/GCC — not a brand running campaigns for others.
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, padding: "12px 24px", borderBottom: `1px solid ${T.border}` }}>
        {[
          { id: "all",   label: `All (${summary.total})` },
          { id: "red",   label: `Critical (${summary.red})` },
          { id: "amber", label: `Warnings (${summary.amber})` },
          { id: "green", label: `On Track (${summary.green})` },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            background: filter === f.id ? (ALERT_COLORS[f.id] || T.gold) + "22" : "none",
            border: `1px solid ${filter === f.id ? (ALERT_COLORS[f.id] || T.gold) + "55" : T.border}`,
            color: filter === f.id ? (ALERT_COLORS[f.id] || T.gold) : T.textDim,
            fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "4px 12px", borderRadius: 6, cursor: "pointer",
            fontFamily: "var(--font-mono)", transition: "all 0.15s",
          }}>{f.label}</button>
        ))}
      </div>

      {/* Alert list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.textDim, fontSize: 13 }}>
            No alerts in this category
          </div>
        ) : (
          filtered.map(alert => (
            <AlertRow key={alert.id} alert={alert} onAgentClick={onAgentClick} />
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, fontSize: 10, color: T.textDim, lineHeight: 1.6 }}>
        Alerts refresh when you open this panel. Red = act today. Amber = act this week.
      </div>
    </div>
  );
}

// ── INLINE ALERT STRIP (shown on dashboard when critical alerts exist) ────────
export function AlertStrip({ alerts, onOpenPanel }) {
  const critical = alerts.filter(a => a.level === ALERT.RED);
  if (critical.length === 0) return null;

  return (
    <div style={{
      background: ALERT_COLORS.red + "12",
      border: `1px solid ${ALERT_COLORS.red}33`,
      borderRadius: 10, padding: "12px 18px",
      display: "flex", alignItems: "center", gap: 14,
      marginBottom: 24,
      cursor: "pointer",
    }} onClick={onOpenPanel}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>🚨</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: ALERT_COLORS.red, marginBottom: 3 }}>
          {critical.length} critical alert{critical.length > 1 ? "s" : ""} need your attention
        </div>
        <div style={{ fontSize: 11, color: T.textMid }}>
          {critical.slice(0, 2).map(a => a.title).join(" · ")}
          {critical.length > 2 && ` · +${critical.length - 2} more`}
        </div>
      </div>
      <span style={{ fontSize: 11, color: ALERT_COLORS.red, fontWeight: 600, flexShrink: 0 }}>
        View all →
      </span>
    </div>
  );
}

