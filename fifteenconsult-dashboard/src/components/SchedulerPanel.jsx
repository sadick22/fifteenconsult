import { useState } from "react";
import {
  FREQUENCY_OPTIONS, DAY_NAMES, DAY_NAMES_FULL,
  getNextRun, formatNextRun, updateAgentSchedule,
} from "../lib/scheduler.js";
import { TEAM } from "../data/team.js";

const T = {
  base:     "var(--bg-base)", card:     "var(--bg-card)",
  cardHover:"var(--bg-hover)", border:   "var(--border)",
  text:     "var(--text)", textMid:  "var(--text-mid)",
  textDim:  "var(--text-dim)", gold:     "var(--gold)",
  green:    "var(--green)", amber:    "var(--amber)",
  red:      "var(--red)",
};

const HOURS = Array.from({length:24},(_,i)=>i);
const MINS  = [0,15,30,45];

function AgentScheduleRow({ member, schedule, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const nextRun  = getNextRun(schedule);
  const nextStr  = formatNextRun(nextRun);
  const isActive = schedule.enabled && schedule.frequency !== "disabled";

  const handleToggle = () => {
    const updated = { ...schedule, enabled: !schedule.enabled };
    onUpdate(member.id, updated);
  };

  const handleFrequency = (freq) => {
    let days = schedule.days;
    if (freq === "weekdays") days = [0,1,2,3,4];
    if (freq === "daily")    days = [0,1,2,3,4,5,6];
    if (freq === "weekly" && (!days || days.length !== 1)) days = [0];
    onUpdate(member.id, { ...schedule, frequency: freq, days, enabled: freq !== "disabled" });
  };

  const handleDayToggle = (day) => {
    const current = schedule.days || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a,b) => a-b);
    if (updated.length === 0) return; // Must have at least 1 day
    onUpdate(member.id, { ...schedule, days: updated });
  };

  const handleTime = (field, val) => {
    onUpdate(member.id, { ...schedule, [field]: parseInt(val) });
  };

  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${isActive ? member.color : T.border}`,
      borderRadius: 10, overflow: "hidden", marginBottom: 10,
      transition: "all 0.2s",
    }}>
      {/* Row header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 18px", cursor: "pointer",
      }} onClick={() => setExpanded(!expanded)}>

        {/* Toggle */}
        <div
          onClick={e => { e.stopPropagation(); handleToggle(); }}
          style={{
            width: 36, height: 20, borderRadius: 10, flexShrink: 0,
            background: isActive ? member.color : T.border,
            position: "relative", cursor: "pointer", transition: "background 0.2s",
          }}
        >
          <div style={{
            position: "absolute", top: 3,
            left: isActive ? 18 : 3,
            width: 14, height: 14, borderRadius: "50%",
            background: "#fff", transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }} />
        </div>

        {/* Agent info */}
        <span style={{ fontSize: 16, flexShrink: 0 }}>{member.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{member.name}</div>
          <div style={{ fontSize: 10, color: member.color, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
            {member.role}
          </div>
        </div>

        {/* Schedule info */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: isActive ? T.text : T.textDim, fontWeight: 500 }}>
            {schedule.label}
          </div>
          <div style={{ fontSize: 10, marginTop: 3, color: isActive ? member.color : T.textDim }}>
            {isActive ? `Next: ${nextStr}` : "Disabled"}
          </div>
        </div>

        <span style={{ fontSize: 11, color: T.textDim, flexShrink: 0 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${T.border}` }}>

          {/* Frequency */}
          <div style={{ marginTop: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: T.textDim, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
              Frequency
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {FREQUENCY_OPTIONS.map(opt => {
                const active = schedule.frequency === opt.value ||
                  (opt.value === "disabled" && !schedule.enabled);
                return (
                  <button key={opt.value} onClick={() => handleFrequency(opt.value)} style={{
                    background: active ? member.color + "22" : "none",
                    border: `1px solid ${active ? member.color : T.border}`,
                    color: active ? member.color : T.textMid,
                    fontSize: 11, fontWeight: active ? 600 : 400,
                    padding: "6px 14px", borderRadius: 7,
                    cursor: "pointer", fontFamily: "var(--font-mono)",
                    transition: "all 0.15s",
                  }}>{opt.label}</button>
                );
              })}
            </div>
          </div>

          {/* Day selector — shown for weekly/custom */}
          {(schedule.frequency === "weekly" || schedule.frequency === "custom") && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: T.textDim, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                Day{schedule.frequency === "weekly" ? "" : "s"}
                {schedule.frequency === "weekly" && <span style={{ color: T.textDim, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}> — pick one</span>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {DAY_NAMES.map((day, i) => {
                  const selected = (schedule.days || []).includes(i);
                  const isGCCWeekend = i === 5 || i === 6;
                  return (
                    <button key={i} onClick={() => {
                      if (schedule.frequency === "weekly") {
                        onUpdate(member.id, { ...schedule, days: [i] });
                      } else {
                        handleDayToggle(i);
                      }
                    }} style={{
                      width: 38, height: 38, borderRadius: 8,
                      background: selected ? member.color + "22" : isGCCWeekend ? T.base : "none",
                      border: `1px solid ${selected ? member.color : T.border}`,
                      color: selected ? member.color : isGCCWeekend ? T.textDim : T.textMid,
                      fontSize: 10, fontWeight: selected ? 700 : 400,
                      cursor: "pointer", fontFamily: "var(--font-mono)",
                      transition: "all 0.15s",
                    }}>{day}</button>
                  );
                })}
              </div>
              <div style={{ fontSize: 9, color: T.textDim, marginTop: 6 }}>
                Fri/Sat = GCC weekend. Schedules still fire if enabled.
              </div>
            </div>
          )}

          {/* Time picker */}
          {schedule.frequency !== "disabled" && schedule.enabled && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: T.textDim, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                Time (your local time)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <select
                  value={schedule.hour}
                  onChange={e => handleTime("hour", e.target.value)}
                  style={{
                    background: T.base, border: `1px solid ${T.border}`,
                    borderRadius: 7, padding: "7px 12px", fontSize: 13,
                    color: T.text, fontFamily: "var(--font-mono)", cursor: "pointer",
                    outline: "none",
                  }}
                >
                  {HOURS.map(h => (
                    <option key={h} value={h}>
                      {String(h).padStart(2,"0")}:00
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: 13, color: T.textDim }}>:</span>
                <select
                  value={schedule.minute}
                  onChange={e => handleTime("minute", e.target.value)}
                  style={{
                    background: T.base, border: `1px solid ${T.border}`,
                    borderRadius: 7, padding: "7px 12px", fontSize: 13,
                    color: T.text, fontFamily: "var(--font-mono)", cursor: "pointer",
                    outline: "none",
                  }}
                >
                  {MINS.map(m => (
                    <option key={m} value={m}>{String(m).padStart(2,"0")}</option>
                  ))}
                </select>
                <span style={{ fontSize: 11, color: T.textDim, marginLeft: 4 }}>
                  Qatar time (AST, UTC+3)
                </span>
              </div>
            </div>
          )}

          {/* Next run preview */}
          {isActive && (
            <div style={{
              background: member.color + "0c",
              border: `1px solid ${member.color}22`,
              borderRadius: 8, padding: "10px 14px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 14 }}>⏰</span>
              <div>
                <div style={{ fontSize: 11, color: member.color, fontWeight: 600 }}>
                  Next run: {formatNextRun(getNextRun({ ...schedule }))}
                </div>
                <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>
                  {schedule.description}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MAIN SCHEDULER PANEL ──────────────────────────────────────────────────────
export default function SchedulerPanel({ schedules, onUpdate, onClose, onRunAll }) {
  const activeCount   = Object.values(schedules).filter(s => s.enabled && s.frequency !== "disabled").length;
  const dueCount      = Object.entries(schedules).filter(([,s]) => {
    if (!s.enabled || s.frequency === "disabled") return false;
    const next = getNextRun(s);
    return next && (next.getTime() - Date.now()) < 3600000; // Due within 1 hour
  }).length;

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: 560,
      background: T.base, borderLeft: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column", zIndex: 300,
      animation: "slideIn 0.25s ease",
      boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
    }}>

      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 6 }}>
            ⏰ Agent Scheduler
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontSize: 10, color: T.green, background: T.green + "18", padding: "2px 10px", borderRadius: 10, fontWeight: 700 }}>
              {activeCount} active
            </span>
            {dueCount > 0 && (
              <span style={{ fontSize: 10, color: T.amber, background: T.amber + "18", padding: "2px 10px", borderRadius: 10, fontWeight: 700 }}>
                {dueCount} due soon
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMid, fontSize: 18, width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ×
        </button>
      </div>

      {/* Info banner */}
      <div style={{ padding: "12px 24px", background: T.gold + "0e", borderBottom: `1px solid #C8A96E22` }}>
        <p style={{ fontSize: 11, color: T.gold + "bb", lineHeight: 1.7 }}>
          ⚡ Schedules run automatically when the dashboard is <strong style={{ color: T.gold }}>open in your browser</strong>. Keep the tab open for fully autonomous operation. Times are in your local timezone.
        </p>
      </div>

      {/* Quick actions */}
      <div style={{ padding: "12px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
        <button onClick={onRunAll} style={{
          background: T.gold, color: "#000",
          border: "none", borderRadius: 7, padding: "8px 18px",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", cursor: "pointer",
          fontFamily: "var(--font-mono)",
        }}>
          ⚡ Run All Now
        </button>
        <button onClick={() => {
          Object.keys(schedules).forEach(id => onUpdate(id, { ...schedules[id], enabled: true }));
        }} style={{
          background: "none", border: `1px solid #4ade8044`, color: T.green,
          borderRadius: 7, padding: "8px 18px",
          fontSize: 10, fontWeight: 600, letterSpacing: "0.12em",
          textTransform: "uppercase", cursor: "pointer",
          fontFamily: "var(--font-mono)",
        }}>
          Enable All
        </button>
        <button onClick={() => {
          Object.keys(schedules).forEach(id => onUpdate(id, { ...schedules[id], enabled: false }));
        }} style={{
          background: "none", border: `1px solid ${T.border}`, color: T.textDim,
          borderRadius: 7, padding: "8px 18px",
          fontSize: 10, fontWeight: 600, letterSpacing: "0.12em",
          textTransform: "uppercase", cursor: "pointer",
          fontFamily: "var(--font-mono)",
        }}>
          Pause All
        </button>
      </div>

      {/* Agent list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
        {TEAM.map(member => (
          <AgentScheduleRow
            key={member.id}
            member={member}
            schedule={schedules[member.id] || {}}
            onUpdate={onUpdate}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, fontSize: 10, color: T.textDim, lineHeight: 1.6 }}>
        Schedules are saved locally. All times are browser-local. Qatar = UTC+3 (AST).
      </div>
    </div>
  );
}

