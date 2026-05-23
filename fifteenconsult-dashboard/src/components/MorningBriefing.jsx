import { useState } from "react";
import { getDateContext } from "../lib/dateContext.js";
import { TEAM } from "../data/team.js";

const T = {
  base:"#0d1117", card:"#131d2e", border:"#1e2d45",
  text:"#e8edf5", textMid:"#7a90b0", textDim:"#3d526b",
  gold:"#C8A96E", green:"#4ade80", amber:"#fbbf24", red:"#f87171",
};

const GCC_GREETINGS = [
  "Good morning", "Sabah al-kheir", "Welcome back",
];

export default function MorningBriefing({ outputs, alerts, taskStates, streaming, onRunAll, onRunAgent, onClose }) {
  const dateCtx   = getDateContext();
  const [runningAll, setRunningAll] = useState(false);
  const critical  = alerts.filter(a => a.level === "red");
  const warnings  = alerts.filter(a => a.level === "amber");
  const totalTasks = TEAM.reduce((s,m) => s + (taskStates[m.id]||[]).length, 0);
  const doneTasks  = TEAM.reduce((s,m) => s + (taskStates[m.id]||[]).filter(Boolean).length, 0);
  const briefingsRun = Object.keys(outputs).length;
  const greeting   = GCC_GREETINGS[new Date().getDay() % GCC_GREETINGS.length];

  // Daily agents (run every working day)
  const dailyAgents  = TEAM.filter(m => m.cadence === "daily");
  const weeklyAgents = TEAM.filter(m => m.cadence === "weekly");

  const handleRunAll = async () => {
    setRunningAll(true);
    await onRunAll();
    setRunningAll(false);
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.7)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:400, animation:"fadeUp 0.3s ease", backdropFilter:"blur(4px)",
    }}>
      <div style={{
        background:T.base, border:`1px solid ${T.border}`,
        borderRadius:16, width:"min(680px, 95vw)", maxHeight:"90vh",
        overflow:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{
          padding:"28px 32px 24px", borderBottom:`1px solid ${T.border}`,
          background:`linear-gradient(135deg, #0d1117 0%, #131d2e 100%)`,
          position:"relative", overflow:"hidden",
        }}>
          {/* Gold accent */}
          <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${T.gold},transparent)` }}/>

          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:11,color:T.textDim,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:6 }}>
                {dateCtx.dayOfWeek}, {dateCtx.dayOfMonth} {dateCtx.month} · Week {dateCtx.weekNum}
              </div>
              <div style={{ fontFamily:"var(--font-display)",fontSize:30,fontWeight:700,color:T.text,lineHeight:1,marginBottom:8 }}>
                {greeting}, Sadick ☀️
              </div>
              <div style={{ fontSize:13,color:T.textMid,lineHeight:1.7 }}>
                {critical.length > 0
                  ? `⚠️ ${critical.length} critical issue${critical.length>1?"s":""} need attention before anything else.`
                  : warnings.length > 0
                  ? `${warnings.length} warnings to review. Otherwise, good to go.`
                  : "✓ All systems on track. Let's have a great day."}
              </div>
            </div>
            <button onClick={onClose} style={{ background:"none",border:`1px solid ${T.border}`,color:T.textMid,width:32,height:32,borderRadius:8,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,borderBottom:`1px solid ${T.border}` }}>
          {[
            { label:"Briefings Run",  value:`${briefingsRun}/7`,        color:briefingsRun===7?T.green:T.amber },
            { label:"Tasks Done",     value:`${doneTasks}/${totalTasks}`, color:T.textMid },
            { label:"Critical Alerts",value:critical.length,            color:critical.length>0?T.red:T.green },
            { label:"Days Left/Month",value:dateCtx.daysLeftInMonth,    color:dateCtx.daysLeftInMonth<=5?T.amber:T.textMid },
          ].map((s,i) => (
            <div key={i} style={{ padding:"16px 20px",background:T.card,borderRight:i<3?`1px solid ${T.border}`:"none" }}>
              <div style={{ fontSize:9,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:22,fontWeight:700,color:s.color,fontFamily:"var(--font-display)" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Critical alerts */}
        {critical.length > 0 && (
          <div style={{ padding:"16px 24px",borderBottom:`1px solid ${T.border}` }}>
            <div style={{ fontSize:10,color:T.red,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:10 }}>
              🚨 Act Today
            </div>
            {critical.map(a => (
              <div key={a.id} style={{ background:"#f8717110",border:"1px solid #f8717130",borderLeft:`3px solid ${T.red}`,borderRadius:8,padding:"10px 14px",marginBottom:8 }}>
                <div style={{ fontSize:12,fontWeight:600,color:T.red,marginBottom:3 }}>{a.emoji} {a.title}</div>
                <div style={{ fontSize:11,color:T.textMid }}>{a.action}</div>
              </div>
            ))}
          </div>
        )}

        {/* Agent status */}
        <div style={{ padding:"16px 24px",borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:12 }}>
            Today's Agents
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
            {TEAM.map(m => {
              const hasOutput  = !!outputs[m.id];
              const isRunning  = streaming === m.id;
              const agentAlerts = alerts.filter(a=>a.agent===m.id&&a.level==="red");
              return (
                <div key={m.id} style={{
                  display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
                  background:T.card,borderRadius:8,
                  border:`1px solid ${agentAlerts.length>0?T.red+"44":T.border}`,
                }}>
                  <span style={{ fontSize:16 }}>{m.emoji}</span>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:12,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{m.name.split(" ")[0]}</div>
                    <div style={{ fontSize:9,color:m.color,letterSpacing:"0.1em",textTransform:"uppercase" }}>{m.role.split(" ")[0]}</div>
                  </div>
                  <div style={{ fontSize:10,flexShrink:0 }}>
                    {isRunning
                      ? <span style={{ color:m.color,animation:"pulse 1s infinite" }}>● Running</span>
                      : hasOutput
                      ? <span style={{ color:T.green }}>✓ Done</span>
                      : <span style={{ color:T.textDim }}>Pending</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GCC context */}
        {dateCtx.isGCCWeekend && (
          <div style={{ padding:"12px 24px",borderBottom:`1px solid ${T.border}`,background:T.amber+"0a" }}>
            <div style={{ fontSize:11,color:T.amber }}>
              🌙 GCC Weekend — Outreach paused. Good time to focus on content creation and planning.
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ padding:"20px 24px",display:"flex",gap:10,flexWrap:"wrap" }}>
          <button onClick={handleRunAll} disabled={!!streaming} style={{
            background:!!streaming?"transparent":T.gold,
            color:!!streaming?T.gold:"#000",
            border:`1px solid ${T.gold}`,
            padding:"12px 28px",fontSize:12,fontWeight:700,
            letterSpacing:"0.15em",textTransform:"uppercase",
            cursor:!!streaming?"not-allowed":"pointer",
            borderRadius:9,fontFamily:"var(--font-mono)",
            transition:"all 0.2s",flex:1,
          }}>
            {!!streaming?`● Running ${TEAM.find(m=>m.id===streaming)?.name||"..."}...`:"⚡ Run All Daily Agents"}
          </button>
          <button onClick={onClose} style={{
            background:"none",border:`1px solid ${T.border}`,
            color:T.textMid,padding:"12px 20px",fontSize:11,fontWeight:600,
            letterSpacing:"0.12em",textTransform:"uppercase",
            cursor:"pointer",borderRadius:9,fontFamily:"var(--font-mono)",
          }}>
            Skip to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
