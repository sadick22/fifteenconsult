import { TEAM } from "../data/team.js";

/**
 * HandoffFeed — the department's live internal traffic.
 * Shows handoffs from the last 7 days (older ones archive automatically).
 * variant: "rail"  → slim panel docked beside the orbital home screen
 *          "panel" → full-width panel for the War Room
 *
 * Props: handoffs (array), onMarkDone(id), onOpenAgent(id)
 */

const T = {
  base: "var(--bg-base)", card: "var(--bg-card)", border: "var(--border)",
  text: "var(--text)", textMid: "var(--text-mid)", textDim: "var(--text-dim)",
  gold: "var(--gold)", green: "var(--green)", amber: "var(--amber)",
};

const DAY = 24 * 60 * 60 * 1000;
const nameOf = (id) => { const m = TEAM.find(x => x.id === id); return m ? m.name.split(" ")[0] : id; };
const emojiOf = (id) => { const m = TEAM.find(x => x.id === id); return m ? m.emoji : "•"; };
const colorOf = (id) => { const m = TEAM.find(x => x.id === id); return m ? m.color : "var(--gold)"; };

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return `${d}d ago`;
}

export default function HandoffFeed({ handoffs = [], onMarkDone, onOpenAgent, variant = "panel" }) {
  const cutoff = Date.now() - 7 * DAY;
  const feed = handoffs
    .filter(h => (h.createdAt || 0) >= cutoff)
    .sort((a, b) => b.createdAt - a.createdAt);
  const archived = handoffs.filter(h => (h.createdAt || 0) < cutoff).length;
  const pendingCount = feed.filter(h => h.status === "pending").length;

  const isRail = variant === "rail";

  return (
    <div style={{
      background: isRail ? "rgba(10,15,30,0.55)" : T.card,
      border: `1px solid ${T.border}`, borderRadius: isRail ? 16 : 12,
      display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
      backdropFilter: isRail ? "blur(6px)" : "none",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px", borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>📡</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Handoff Feed</div>
            <div style={{ fontSize: 9, color: T.textDim, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Last 7 days · {pendingCount} open
            </div>
          </div>
        </div>
        <span style={{
          width: 7, height: 7, borderRadius: "50%", background: T.green,
          boxShadow: `0 0 8px ${T.green}`, animation: "pulse 2s infinite",
        }}/>
      </div>

      {/* Feed list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
        {feed.length === 0 && (
          <div style={{ textAlign: "center", padding: "28px 16px", color: T.textDim, fontSize: 11, lineHeight: 1.7 }}>
            No handoffs yet.<br/>Ask an agent to send work to a colleague —<br/>e.g. “Nadia, write this and send it to David.”
          </div>
        )}

        {feed.map(h => {
          const done = h.status === "done";
          return (
            <div key={h.id}
              onClick={() => onOpenAgent && onOpenAgent(h.to)}
              style={{
                padding: "10px 11px", marginBottom: 6, borderRadius: 9,
                background: T.base, border: `1px solid ${done ? T.border : colorOf(h.to) + "44"}`,
                cursor: onOpenAgent ? "pointer" : "default", opacity: done ? 0.62 : 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = colorOf(h.to); }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = done ? T.border : colorOf(h.to) + "44"; }}
            >
              {/* Route line */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, fontSize: 11, flexWrap: "wrap" }}>
                <span style={{ color: colorOf(h.from), fontWeight: 600 }}>{emojiOf(h.from)} {nameOf(h.from)}</span>
                <span style={{ color: T.textDim }}>→</span>
                <span style={{ color: colorOf(h.to), fontWeight: 600 }}>{emojiOf(h.to)} {nameOf(h.to)}</span>
                <span style={{ marginLeft: "auto", fontSize: 9, color: T.textDim }}>{timeAgo(h.createdAt)}</span>
              </div>

              {/* Summary */}
              <div style={{ fontSize: 11, color: T.textMid, lineHeight: 1.5, marginBottom: 7 }}>{h.summary}</div>

              {/* Status row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 8.5, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700,
                  padding: "2px 8px", borderRadius: 20,
                  color: done ? T.green : T.amber,
                  border: `1px solid ${done ? T.green : T.amber}55`,
                  background: (done ? T.green : T.amber) + "12",
                }}>
                  {done ? "✓ done" : "● open"}
                </span>
                {!done && onMarkDone && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onMarkDone(h.id); }}
                    style={{
                      marginLeft: "auto", background: "none", border: `1px solid ${T.border}`,
                      color: T.textDim, fontSize: 9, fontWeight: 600, letterSpacing: "0.08em",
                      textTransform: "uppercase", padding: "3px 10px", borderRadius: 6,
                      cursor: "pointer", fontFamily: "var(--font-mono)",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = T.green; e.currentTarget.style.borderColor = T.green; }}
                    onMouseLeave={e => { e.currentTarget.style.color = T.textDim; e.currentTarget.style.borderColor = T.border; }}
                  >✓ Mark done</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Archive footer */}
      {archived > 0 && (
        <div style={{ padding: "8px 16px", borderTop: `1px solid ${T.border}`, fontSize: 9, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0 }}>
          + {archived} archived (older than 7 days)
        </div>
      )}
    </div>
  );
}
