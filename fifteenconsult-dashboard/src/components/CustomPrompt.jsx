import { useState, useEffect } from "react";
import { AGENT_PRESETS, getSmartSuggestions, getSavedPrompts, saveCustomPrompt, deleteSavedPrompt } from "../lib/prompts.js";
import { getDateContext } from "../lib/dateContext.js";

const T = {
  base:     "#0d1117", card:     "#131d2e",
  cardHover:"#172236", border:   "#1e2d45",
  borderL:  "#243448", text:     "#e8edf5",
  textMid:  "#7a90b0", textDim:  "#3d526b",
  gold:     "#C8A96E", green:    "#4ade80",
  amber:    "#fbbf24", red:      "#f87171",
};

// Group presets by category
function groupByCategory(presets) {
  return presets.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});
}

export default function CustomPrompt({ agentId, color, value, onChange, alerts, onRun }) {
  const [tab, setTab]               = useState("presets"); // presets | custom | saved
  const [savedPrompts, setSaved]    = useState(() => getSavedPrompts(agentId));
  const [saveLabel, setSaveLabel]   = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const dateCtx = getDateContext();

  const presets      = AGENT_PRESETS[agentId] || [];
  const grouped      = groupByCategory(presets);
  const suggestions  = getSmartSuggestions(agentId, dateCtx, alerts);

  // Refresh saved prompts when tab changes
  useEffect(() => {
    if (tab === "saved") setSaved(getSavedPrompts(agentId));
  }, [tab, agentId]);

  const applyPreset = (prompt) => {
    onChange(prompt);
    setTab("custom");
  };

  const handleSave = () => {
    if (!value.trim()) return;
    saveCustomPrompt(agentId, value.trim());
    setSaved(getSavedPrompts(agentId));
    setShowSaveInput(false);
    setSaveLabel("");
  };

  const handleDelete = (prompt) => {
    deleteSavedPrompt(agentId, prompt);
    setSaved(getSavedPrompts(agentId));
  };

  return (
    <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 2 }}>Focus Directive</div>
          <div style={{ fontSize: 10, color: T.textDim }}>Tell this agent exactly what to focus on for this run</div>
        </div>
        {value.trim() && (
          <button onClick={() => onChange("")} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textDim, fontSize: 9, padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Clear
          </button>
        )}
      </div>

      {/* Smart suggestions strip */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: T.textDim, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 7 }}>
            Smart suggestions for today
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => {
                const match = presets.find(p => p.prompt.toLowerCase().includes(s.text.toLowerCase().split(" ").slice(0,3).join(" ")));
                if (match) applyPreset(match.prompt);
              }} style={{
                background: color + "10", border: `1px solid ${color}33`,
                color: color, fontSize: 10, padding: "4px 12px", borderRadius: 20,
                cursor: "pointer", fontFamily: "var(--font-mono)", transition: "all 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = color + "22"}
                onMouseLeave={e => e.currentTarget.style.background = color + "10"}
              >
                {s.icon} {s.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {[
          { id: "presets", label: "Quick Presets" },
          { id: "custom",  label: "Custom" },
          { id: "saved",   label: `Saved (${savedPrompts.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? color + "22" : "none",
            border: `1px solid ${tab === t.id ? color + "55" : T.border}`,
            color: tab === t.id ? color : T.textDim,
            fontSize: 10, fontWeight: tab === t.id ? 600 : 400,
            letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "5px 14px", borderRadius: 6, cursor: "pointer",
            fontFamily: "var(--font-mono)", transition: "all 0.15s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── PRESETS TAB ── */}
      {tab === "presets" && (
        <div>
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: T.textDim, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
                {category}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 7 }}>
                {items.map(preset => {
                  const isSelected = value === preset.prompt;
                  return (
                    <button key={preset.id} onClick={() => applyPreset(preset.prompt)} style={{
                      background: isSelected ? color + "22" : T.base,
                      border: `1px solid ${isSelected ? color : T.border}`,
                      borderRadius: 8, padding: "10px 12px", cursor: "pointer",
                      textAlign: "left", transition: "all 0.15s",
                      display: "flex", alignItems: "flex-start", gap: 8,
                    }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = T.cardHover; e.currentTarget.style.borderColor = color + "55"; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = T.base; e.currentTarget.style.borderColor = isSelected ? color : T.border; }}
                    >
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{preset.icon}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: isSelected ? color : T.text, marginBottom: 2 }}>{preset.label}</div>
                        <div style={{ fontSize: 9, color: T.textDim, lineHeight: 1.4 }}>
                          {preset.prompt.slice(0, 60)}...
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CUSTOM TAB ── */}
      {tab === "custom" && (
        <div>
          {value && (
            <div style={{ background: color + "0e", border: `1px solid ${color}33`, borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 11, color: color + "cc", lineHeight: 1.6 }}>
              <strong style={{ color }}>Active directive:</strong> {value.slice(0, 120)}{value.length > 120 ? "..." : ""}
            </div>
          )}
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={`Type a specific focus for this run...\n\nExamples:\n• "Focus on Real Estate developers in Qatar — specifically Barwa and Ezdan"\n• "Draft outreach for hospitality sector clients only"\n• "Analyse why our LinkedIn engagement dropped this week"`}
            rows={5}
            style={{
              width: "100%", background: T.base, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: "12px 14px", fontSize: 12, color: T.text,
              fontFamily: "var(--font-mono)", outline: "none", resize: "vertical",
              lineHeight: 1.7, transition: "border 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = color}
            onBlur={e => e.target.style.borderColor = T.border}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <div style={{ fontSize: 10, color: T.textDim }}>
              {value.length > 0 ? `${value.length} chars · will be injected into this briefing` : "Leave blank to run the standard briefing"}
            </div>
            {value.trim() && (
              <button onClick={handleSave} style={{
                background: "none", border: `1px solid ${T.border}`, color: T.textMid,
                fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-mono)",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMid; }}
              >
                + Save directive
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── SAVED TAB ── */}
      {tab === "saved" && (
        <div>
          {savedPrompts.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: T.textDim, fontSize: 12 }}>
              No saved directives yet.<br />
              <span style={{ color: T.textMid }}>Type a custom directive and click "+ Save directive" to store it.</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {savedPrompts.map((prompt, i) => {
                const isSelected = value === prompt;
                return (
                  <div key={i} style={{
                    background: isSelected ? color + "18" : T.base,
                    border: `1px solid ${isSelected ? color : T.border}`,
                    borderRadius: 8, padding: "11px 14px",
                    display: "flex", alignItems: "flex-start", gap: 10,
                    transition: "all 0.15s",
                  }}>
                    <div style={{ flex: 1, cursor: "pointer" }} onClick={() => applyPreset(prompt)}>
                      <div style={{ fontSize: 12, color: isSelected ? color : T.text, lineHeight: 1.6 }}>
                        {prompt.length > 120 ? prompt.slice(0, 120) + "..." : prompt}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => applyPreset(prompt)} style={{
                        background: color + "22", border: `1px solid ${color}44`, color,
                        fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
                        padding: "3px 10px", borderRadius: 5, cursor: "pointer", fontFamily: "var(--font-mono)",
                      }}>Use</button>
                      <button onClick={() => handleDelete(prompt)} style={{
                        background: "none", border: `1px solid ${T.border}`, color: T.textDim,
                        fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
                        padding: "3px 10px", borderRadius: 5, cursor: "pointer", fontFamily: "var(--font-mono)",
                      }}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Active prompt preview + Run button */}
      {value.trim() && (
        <div style={{ marginTop: 16, padding: "12px 16px", background: color + "0c", border: `1px solid ${color}2a`, borderRadius: 8 }}>
          <div style={{ fontSize: 9, color: color, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>
            ✓ Focus directive active — will be injected into next run
          </div>
          <div style={{ fontSize: 11, color: T.textMid, lineHeight: 1.6 }}>
            {value.length > 200 ? value.slice(0, 200) + "..." : value}
          </div>
        </div>
      )}
    </div>
  );
}
