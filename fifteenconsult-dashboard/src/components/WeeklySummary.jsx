import { TEAM } from "../data/team.js";

const GOLD = "#C8A96E";
const DARK_CARD = "#0f0f0f";
const DARK_BORDER = "#1c1c1c";

export default function WeeklySummary({ outputs, streaming, onRunAll }) {
  const hasOutputs = Object.keys(outputs).length > 0;
  const isBusy = !!streaming;

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
        <div>
          <div style={{ fontSize: 9, color: "var(--text-ghost)", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 8 }}>
            — Department Command Centre
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 700, color: "var(--text-primary)" }}>
            Weekly Summary
          </div>
        </div>
        <button
          onClick={onRunAll}
          disabled={isBusy}
          style={{
            background: isBusy ? "transparent" : GOLD,
            color: isBusy ? GOLD : "#000",
            border: `1px solid ${GOLD}`,
            padding: "12px 28px", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.2em", textTransform: "uppercase",
            cursor: isBusy ? "not-allowed" : "pointer",
            borderRadius: 2, fontFamily: "var(--font-mono)",
            transition: "all 0.2s",
          }}
        >
          {isBusy
            ? `● Running ${TEAM.find((m) => m.id === streaming)?.name || "..."}...`
            : "⚡ Run All Agents"}
        </button>
      </div>

      {!hasOutputs ? (
        <div style={{
          background: DARK_CARD, border: `1px solid ${DARK_BORDER}`,
          borderRadius: 2, padding: "56px 32px", textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 18 }}>🏛</div>
          <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 2 }}>
            No briefings generated yet.<br />
            <span style={{ color: GOLD }}>Run All Agents</span> to generate your weekly department summary,
            <br />or activate individual agents from the dashboard.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {TEAM.map((m) => {
            const output = outputs[m.id];
            if (!output) {
              return (
                <div key={m.id} style={{
                  background: DARK_CARD, border: `1px solid ${DARK_BORDER}`,
                  borderRadius: 2, padding: "16px 20px",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <span style={{ fontSize: 18 }}>{m.emoji}</span>
                  <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{m.name} — No briefing yet</span>
                  {streaming === m.id && (
                    <span style={{
                      marginLeft: "auto", width: 6, height: 6, borderRadius: "50%",
                      background: m.color, animation: "pulse 1s ease infinite",
                      display: "inline-block",
                    }} />
                  )}
                </div>
              );
            }

            const preview = output.text.length > 500
              ? output.text.slice(0, 500) + "\n\n[Open agent for full output →]"
              : output.text;

            return (
              <div key={m.id} style={{
                background: DARK_CARD,
                border: `1px solid ${DARK_BORDER}`,
                borderLeft: `3px solid ${m.color}`,
                borderRadius: 2, overflow: "hidden",
              }}>
                <div style={{
                  padding: "13px 20px", borderBottom: `1px solid ${DARK_BORDER}`,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <span style={{ fontSize: 16 }}>{m.emoji}</span>
                  <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{m.name}</span>
                  <span style={{
                    fontSize: 9, color: m.color, marginLeft: 4,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                  }}>{m.role}</span>
                  <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--text-dim)" }}>
                    {output.timestamp}
                  </span>
                </div>
                <pre style={{
                  fontSize: 11, color: "#888", lineHeight: 1.8, whiteSpace: "pre-wrap",
                  fontFamily: "var(--font-mono)", padding: "16px 20px", margin: 0,
                  maxHeight: 220, overflowY: "auto",
                }}>
                  {preview}
                </pre>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
