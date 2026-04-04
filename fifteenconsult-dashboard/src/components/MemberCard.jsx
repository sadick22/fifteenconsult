const DARK_CARD = "#0f0f0f";
const DARK_BORDER = "#1c1c1c";

export default function MemberCard({ member, taskStates, output, streaming, onOpen, onRun }) {
  const states = taskStates[member.id] || [];
  const doneTasks = states.filter(Boolean).length;
  const prog = states.length ? Math.round((doneTasks / states.length) * 100) : 0;
  const isStreaming = streaming === member.id;
  const isBusy = !!streaming;
  const hasOutput = !!output;

  return (
    <div
      className="card-lift"
      style={{
        background: DARK_CARD,
        border: `1px solid ${DARK_BORDER}`,
        borderRadius: 2,
        padding: "22px",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      {/* Top progress bar */}
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: `${prog}%`, height: 2,
        background: member.color,
        transition: "width 1s ease",
      }} />

      {/* Streaming pulse dot */}
      {isStreaming && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          width: 6, height: 6, borderRadius: "50%",
          background: member.color,
          animation: "pulse 1s ease infinite",
        }} />
      )}

      {/* Click-to-open zone */}
      <div onClick={onOpen}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500, marginBottom: 3 }}>
              {member.name}
            </div>
            <div style={{ fontSize: 9, color: member.color, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              {member.role}
            </div>
          </div>
          <span style={{ fontSize: 22 }}>{member.emoji}</span>
        </div>

        {/* Tasks bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-dim)", marginBottom: 5 }}>
            <span>Tasks</span>
            <span style={{ color: member.color }}>{doneTasks}/{states.length}</span>
          </div>
          <div style={{ background: "#1a1a1a", borderRadius: 1, height: 2 }}>
            <div style={{
              width: `${prog}%`, height: "100%",
              background: member.color, borderRadius: 1,
              transition: "width 1s ease",
            }} />
          </div>
        </div>

        {/* KPI mini grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {member.kpis.slice(0, 2).map((k) => {
            const pct = Math.min(100, Math.round((k.current / k.target) * 100));
            return (
              <div key={k.label} style={{ background: "#080808", padding: "9px 11px", borderRadius: 2 }}>
                <div style={{ fontSize: 9, color: "var(--text-ghost)", marginBottom: 3, letterSpacing: "0.1em" }}>
                  {k.label.toUpperCase()}
                </div>
                <div style={{ fontSize: 16, color: pct >= 60 ? "var(--text-primary)" : "var(--red)" }}>
                  {k.current}{k.unit || ""}
                </div>
                <div style={{ fontSize: 9, color: "var(--text-ghost)" }}>/{k.target}{k.unit || ""}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 9, color: hasOutput ? member.color : "var(--text-ghost)", letterSpacing: "0.05em" }}>
          {hasOutput ? `✓ ${output.timestamp}` : `No briefing yet · ${member.cadence}`}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRun(); }}
          disabled={isBusy}
          style={{
            background: "none",
            border: `1px solid ${isBusy ? "#222" : member.color + "66"}`,
            color: isBusy ? "var(--text-ghost)" : member.color,
            fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase",
            padding: "4px 12px", borderRadius: 2, fontFamily: "var(--font-mono)",
            transition: "all 0.2s",
          }}
        >
          {isStreaming ? "Running..." : "Run"}
        </button>
      </div>
    </div>
  );
}
