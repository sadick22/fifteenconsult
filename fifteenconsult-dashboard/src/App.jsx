import { useState, useEffect, useCallback } from "react";
import { TEAM } from "./data/team.js";
import { callClaudeAPI } from "./lib/api.js";
import { loadStorage, saveStorage } from "./lib/storage.js";
import MemberCard from "./components/MemberCard.jsx";
import MemberDetail from "./components/MemberDetail.jsx";
import WeeklySummary from "./components/WeeklySummary.jsx";

const GOLD = "#C8A96E";
const DARK_BASE = "#080808";
const DARK_BORDER = "#1c1c1c";

function timestamp() {
  return new Date().toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function App() {
  const [activeTab, setActiveTab]     = useState("dashboard");
  const [activeMember, setActiveMember] = useState(null);
  const [streaming, setStreaming]     = useState(null);
  const [outputs, setOutputs]         = useState(() => loadStorage().outputs || {});
  const [taskStates, setTaskStates]   = useState(() => {
    const stored = loadStorage().tasks || {};
    const init = {};
    TEAM.forEach((m) => {
      init[m.id] = stored[m.id] || m.tasks.map((t) => t.done);
    });
    return init;
  });

  useEffect(() => {
    saveStorage({ outputs, tasks: taskStates });
  }, [outputs, taskStates]);

  const toggleTask = (memberId, idx) => {
    setTaskStates((prev) => {
      const updated = [...(prev[memberId] || [])];
      updated[idx] = !updated[idx];
      return { ...prev, [memberId]: updated };
    });
  };

  const runBriefing = useCallback(async (member) => {
    if (streaming) return;
    setStreaming(member.id);
    const ts = timestamp();
    setOutputs((prev) => ({ ...prev, [member.id]: { text: "", timestamp: ts } }));
    try {
      await callClaudeAPI(
        member.systemPrompt,
        member.briefingTrigger,
        (partial) => {
          setOutputs((prev) => ({ ...prev, [member.id]: { text: partial, timestamp: ts } }));
        }
      );
    } catch (err) {
      setOutputs((prev) => ({
        ...prev,
        [member.id]: { text: `⚠ Error: ${err.message}\n\nCheck your API connection and try again.`, timestamp: ts },
      }));
    } finally {
      setStreaming(null);
    }
  }, [streaming]);

  const runAll = useCallback(async () => {
    if (streaming) return;
    for (const member of TEAM) {
      await runBriefing(member);
    }
  }, [runBriefing, streaming]);

  const totalTasks = TEAM.reduce((s, m) => s + m.tasks.length, 0);
  const totalDone  = TEAM.reduce((s, m) => s + (taskStates[m.id] || []).filter(Boolean).length, 0);
  const totalOutputs = Object.keys(outputs).length;
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div style={{ minHeight: "100vh", background: DARK_BASE }}>

      {/* ── HEADER ── */}
      <header style={{
        borderBottom: `1px solid ${DARK_BORDER}`,
        padding: "18px 36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: DARK_BASE, position: "sticky", top: 0, zIndex: 100,
      }}>
        <div
          onClick={() => { setActiveMember(null); setActiveTab("dashboard"); }}
          style={{ display: "flex", alignItems: "baseline", gap: 14, cursor: "pointer" }}
        >
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: 20, fontWeight: 700, color: GOLD, letterSpacing: "-0.5px",
          }}>FifteenConsult</span>
          <span style={{ fontSize: 9, color: "#222", letterSpacing: "0.28em", textTransform: "uppercase" }}>
            AI Marketing Department
          </span>
        </div>

        <nav style={{ display: "flex", gap: 2 }}>
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "summary",   label: "Weekly Summary" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setActiveMember(null); }}
              style={{
                background: "none", border: "none",
                fontFamily: "var(--font-mono)",
                padding: "6px 18px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase",
                color: activeTab === t.id && !activeMember ? GOLD : "var(--text-dim)",
                borderBottom: activeTab === t.id && !activeMember
                  ? `1px solid ${GOLD}` : "1px solid transparent",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div style={{ fontSize: 9, color: "#222", letterSpacing: "0.1em" }}>{today}</div>
      </header>

      {/* ── MAIN ── */}
      <main style={{ padding: "36px", maxWidth: 1280, margin: "0 auto" }}>

        {/* Member Detail */}
        {activeMember && (
          <MemberDetail
            member={activeMember}
            taskStates={taskStates}
            output={outputs[activeMember.id]}
            streaming={streaming}
            onToggleTask={toggleTask}
            onRunBriefing={runBriefing}
            onBack={() => setActiveMember(null)}
          />
        )}

        {/* Dashboard */}
        {!activeMember && activeTab === "dashboard" && (
          <div className="fade-up">

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 44 }}>
              {[
                { label: "Active Agents",   value: "7",                                sub: "All systems online" },
                { label: "Tasks Complete",  value: `${totalDone}/${totalTasks}`,        sub: `${Math.round(totalDone / totalTasks * 100)}% done` },
                { label: "Briefings Run",   value: totalOutputs,                        sub: `${TEAM.length - totalOutputs} pending` },
                { label: "Running Now",     value: streaming ? "1" : "—",              sub: streaming ? TEAM.find((m) => m.id === streaming)?.name : "Idle" },
              ].map((s) => (
                <div key={s.label} style={{
                  background: "#0f0f0f", border: `1px solid ${DARK_BORDER}`,
                  padding: "20px 22px", borderRadius: 2,
                }}>
                  <div style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>
                    {s.label}
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 34, color: GOLD, fontWeight: 700 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 5 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Run All */}
            <div style={{ marginBottom: 28, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={runAll}
                disabled={!!streaming}
                style={{
                  background: !!streaming ? "transparent" : GOLD,
                  color: !!streaming ? GOLD : "#000",
                  border: `1px solid ${GOLD}`,
                  padding: "10px 26px", fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  cursor: !!streaming ? "not-allowed" : "pointer",
                  borderRadius: 2, fontFamily: "var(--font-mono)", transition: "all 0.2s",
                }}
              >
                {!!streaming
                  ? `● Running ${TEAM.find((m) => m.id === streaming)?.name || "..."}...`
                  : "⚡ Run All Agents"}
              </button>
            </div>

            {/* Team label */}
            <div style={{ fontSize: 9, color: "#222", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 16 }}>
              — Your Team
            </div>

            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px,1fr))", gap: 14 }}>
              {TEAM.map((m) => (
                <MemberCard
                  key={m.id}
                  member={m}
                  taskStates={taskStates}
                  output={outputs[m.id]}
                  streaming={streaming}
                  onOpen={() => setActiveMember(m)}
                  onRun={() => runBriefing(m)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Weekly Summary */}
        {!activeMember && activeTab === "summary" && (
          <WeeklySummary
            outputs={outputs}
            streaming={streaming}
            onRunAll={runAll}
          />
        )}

      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: `1px solid ${DARK_BORDER}`, padding: "14px 36px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 9, color: "#222", letterSpacing: "0.14em", textTransform: "uppercase",
      }}>
        <span>FifteenConsult · AI Marketing Department · 7 Agents Active</span>
        <span>Powered by Claude</span>
      </footer>
    </div>
  );
}
