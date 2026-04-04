import KpiBar from "./KpiBar.jsx";
import OutputLog from "./OutputLog.jsx";

const DARK_CARD = "#0f0f0f";
const DARK_BORDER = "#1c1c1c";
const DARK_HOVER = "#161616";

export default function MemberDetail({ member, taskStates, output, streaming, onToggleTask, onRunBriefing, onBack }) {
  const states = taskStates[member.id] || member.tasks.map((t) => t.done);
  const doneTasks = states.filter(Boolean).length;
  const isStreaming = streaming === member.id;
  const isBusy = !!streaming;

  return (
    <div className="fade-up">
      {/* Back */}
      <button
        onClick={onBack}
        style={{
          background: "none", border: "none", color: "var(--text-dim)",
          fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase",
          cursor: "pointer", marginBottom: 28, display: "flex", alignItems: "center", gap: 6,
          fontFamily: "var(--font-mono)", padding: 0, transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-dim)")}
      >
        ← Back to Dashboard
      </button>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: 44, fontWeight: 700, color: "var(--text-primary)",
            letterSpacing: "-1px", lineHeight: 1,
          }}>
            {member.name}
          </div>
          <div style={{ fontSize: 10, color: member.color, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 8 }}>
            {member.role} · {member.cadence} cadence
          </div>
        </div>
        <button
          onClick={() => onRunBriefing(member)}
          disabled={isBusy}
          style={{
            background: isStreaming || isBusy ? "transparent" : member.color,
            color: isStreaming || isBusy ? member.color : "#000",
            border: `1px solid ${member.color}`,
            padding: "11px 24px", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.18em", textTransform: "uppercase",
            cursor: isBusy ? "not-allowed" : "pointer",
            borderRadius: 2, fontFamily: "var(--font-mono)",
            transition: "all 0.2s",
          }}
        >
          {isStreaming ? "● Streaming..." : `Run ${member.cadence === "weekly" ? "Weekly" : "Daily"} Briefing`}
        </button>
      </div>

      {/* Tasks + KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        {/* Tasks */}
        <div style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}`, borderRadius: 2, padding: 24 }}>
          <div style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 18 }}>
            — Daily Tasks · {doneTasks}/{member.tasks.length}
          </div>
          {member.tasks.map((t, i) => {
            const done = states[i] ?? t.done;
            return (
              <div
                key={i}
                onClick={() => onToggleTask(member.id, i)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "9px 8px", cursor: "pointer", borderRadius: 2, marginBottom: 2,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = DARK_HOVER)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{
                  width: 15, height: 15, flexShrink: 0, marginTop: 1, borderRadius: 2,
                  border: `1px solid ${done ? member.color : "#2a2a2a"}`,
                  background: done ? member.color : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}>
                  {done && <span style={{ fontSize: 9, color: "#000", fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{
                  fontSize: 12, color: done ? "#3a3a3a" : "#a09880", lineHeight: 1.6,
                  textDecoration: done ? "line-through" : "none",
                }}>
                  {t.text}
                </span>
              </div>
            );
          })}
        </div>

        {/* KPIs */}
        <div style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}`, borderRadius: 2, padding: 24 }}>
          <div style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 18 }}>
            — KPI Tracker
          </div>
          {member.kpis.map((k) => <KpiBar key={k.label} {...k} color={member.color} />)}
        </div>
      </div>

      {/* Output */}
      <OutputLog output={output} color={member.color} isStreaming={isStreaming} />

      {/* System Prompt */}
      <div style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}`, borderRadius: 2, padding: 24, marginTop: 18 }}>
        <div style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 14 }}>
          — System Prompt
        </div>
        <pre style={{
          fontSize: 11, color: "#3a3a3a", lineHeight: 1.8, whiteSpace: "pre-wrap",
          fontFamily: "var(--font-mono)", maxHeight: 220, overflowY: "auto",
          background: "#050505", padding: 14, borderRadius: 2,
        }}>
          {member.systemPrompt}
        </pre>
      </div>
    </div>
  );
}
