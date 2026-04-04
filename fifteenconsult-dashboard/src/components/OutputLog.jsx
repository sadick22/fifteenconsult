export default function OutputLog({ output, color, isStreaming }) {
  if (!output) return null;

  return (
    <div style={{
      background: "#050505",
      border: `1px solid var(--dark-border)`,
      borderLeft: `2px solid ${color}`,
      borderRadius: 2,
      padding: "18px 20px",
      marginTop: 20,
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Agent Output
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isStreaming && (
            <span style={{
              display: "inline-block", width: 6, height: 6, borderRadius: "50%",
              background: color, animation: "pulse 1s ease infinite",
            }} />
          )}
          <span style={{ fontSize: 9, color: "var(--text-dim)" }}>{output.timestamp}</span>
        </div>
      </div>
      <pre style={{
        fontSize: 12,
        color: "#b0a898",
        lineHeight: 1.9,
        whiteSpace: "pre-wrap",
        fontFamily: "var(--font-mono)",
        margin: 0,
        minHeight: isStreaming ? 40 : "auto",
      }}>
        {output.text || (isStreaming ? "Initialising..." : "")}
        {isStreaming && <span style={{ color, animation: "pulse 0.8s ease infinite" }}>▌</span>}
      </pre>
    </div>
  );
}
