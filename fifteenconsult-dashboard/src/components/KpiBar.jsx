export default function KpiBar({ label, current, target, unit = "", color }) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  const ok = pct >= 60;

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
        <span style={{ color: "var(--text-muted)" }}>{label}</span>
        <span style={{ color: ok ? color : "var(--red)" }}>
          {current}{unit}
          <span style={{ color: "var(--text-dim)" }}> / {target}{unit}</span>
        </span>
      </div>
      <div style={{ background: "#1a1a1a", borderRadius: 2, height: 3 }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 2,
          background: ok ? color : "var(--red)",
          transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
      <div style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 4, textAlign: "right" }}>
        {pct}% of target
      </div>
    </div>
  );
}
