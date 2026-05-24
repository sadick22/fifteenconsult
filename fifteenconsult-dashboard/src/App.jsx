import { useState, useEffect, useCallback, useMemo } from "react";
import { TEAM } from "./data/team.js";
import { callClaudeAPI } from "./lib/api.js";
import { getDateContext, buildBriefingTrigger } from "./lib/dateContext.js";
import { evaluateAlerts } from "./lib/alerts.js";
import { AlertBadge, AlertsPanel, AlertStrip } from "./components/AlertsPanel.jsx";
import CustomPrompt from "./components/CustomPrompt.jsx";
import CopyToolbar from "./components/CopyToolbar.jsx";
import SchedulerPanel from "./components/SchedulerPanel.jsx";
import AgentChat from "./components/AgentChat.jsx";
import MorningBriefing from "./components/MorningBriefing.jsx";
import WarRoom from "./components/WarRoom.jsx";
import FifteenFramework from "./components/FifteenFramework.jsx";
import NotificationCentre, { addNotification } from "./components/NotificationCentre.jsx";
import { loadSchedules, saveSchedules, updateAgentSchedule, getDueAgents, getNextRun, formatNextRun, markRun } from "./lib/scheduler.js";
import { loadTheme, saveTheme, applyTheme } from "./lib/theme.js";
import IntegrationsPanel from "./components/IntegrationsPanel.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import { getConnectionStatuses } from "./lib/integrations.js";

// ── THEME ─────────────────────────────────────────────────────────────────────
const T = {
  base:     "var(--bg-base)",
  sidebar:  "var(--bg-sidebar)",
  card:     "var(--bg-card)",
  cardHover:"var(--bg-hover)",
  border:   "var(--border)",
  borderL:  "var(--border-light)",
  gold:     "var(--gold)",
  text:     "var(--text)",
  textMid:  "var(--text-mid)",
  textDim:  "var(--text-dim)",
  green:    "var(--green)",
  red:      "var(--red)",
  amber:    "var(--amber)",
  blue:     "var(--blue)",
};

// ── STORAGE ───────────────────────────────────────────────────────────────────
function initStorage() {
  try { return JSON.parse(localStorage.getItem("fc_v6")||"{}"); } catch { return {}; }
}
function writeStorage(d) {
  try { localStorage.setItem("fc_v6", JSON.stringify(d)); } catch {}
}
function pushHistory(agentId, entry) {
  const s = initStorage();
  if (!s.history) s.history = {};
  if (!s.history[agentId]) s.history[agentId] = [];
  s.history[agentId] = [{ ...entry, id: Date.now() }, ...s.history[agentId]].slice(0,20);
  writeStorage(s);
  return s.history[agentId];
}
function readHistory(agentId) { return initStorage().history?.[agentId] || []; }

// ── HELPERS ───────────────────────────────────────────────────────────────────
function now_ts() {
  return new Date().toLocaleString("en-GB", { weekday:"short", day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
}
function pct(c,t){ return Math.min(100, Math.round((c/t)*100)); }

// ── LIVE KPI DATA (maps team KPIs to alert engine format) ─────────────────────
function buildKpiData(team) {
  const KEY_MAP = {
    "Posts/Week":           "postsPerWeek",
    "Blog Drafts":          "blogDrafts",
    "Newsletter":           "newsletterDrafts",
    "Engagement Rate":      "engagementRate",
    "Keywords Tracked":     "keywordsTracked",
    "Domain Authority":     "domainAuthority",
    "Organic Visits/Mo":    "organicVisits",
    "Backlinks Built":      "backlinksBuilt",
    "LinkedIn Followers":   "linkedinFollowers",
    "Instagram Followers":  "instagramFollowers",
    "Avg Engagement %":     "avgEngagement",
    "Leads Researched/Wk":  "leadsResearched",
    "Outreach Sent":        "outreachSent",
    "Response Rate":        "responseRate",
    "Meetings Booked":      "meetingsBooked",
    "Design Assets/Wk":     "designAssets",
    "Brand Consistency":    "brandConsistency",
    "Proposals Designed":   "proposalsDesigned",
    "Campaigns Active":     "campaignsActive",
    "Cost Per Lead":        "costPerLead",
    "Monthly Spend":        "monthlySpend",
    "ROAS":                 "roas",
    "Reports Delivered":    "reportsDelivered",
    "Data Sources":         "dataSourcesConnected",
    "Dashboard Updates":    "dashboardUpdates",
    "Insights Actioned":    "insightsActioned",
  };
  const data = {};
  team.forEach(m => {
    const kpiMap = {};
    m.kpis.forEach(k => {
      const key = KEY_MAP[k.label];
      if (key) kpiMap[key] = k.current;
    });
    data[m.id] = kpiMap;
  });
  return data;
}

// ── DATE BADGE ────────────────────────────────────────────────────────────────
function DateBadge() {
  const d = getDateContext();
  return (
    <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
      {[
        { label:`${d.dayOfWeek}, ${d.dayOfMonth} ${d.month} ${d.year}`, color:"#C8A96E" },
        { label:`Week ${d.weekNum}`, color:"var(--text-mid)" },
        { label:`Q${d.currentQuarter} · ${d.daysLeftInQuarter}d left`, color:"var(--blue)" },
        { label:`${d.daysLeftInMonth}d left in month`, color:d.daysLeftInMonth<=7?"#fbbf24":"var(--text-mid)" },
        { label:d.isGCCWeekend?"GCC Weekend":"GCC Working Day", color:d.isGCCWeekend?"#fbbf24":"#4ade80" },
      ].map((b,i)=>(
        <span key={i} style={{ fontSize:9,color:b.color,background:b.color+"18",padding:"3px 9px",borderRadius:20,fontWeight:500,border:`1px solid ${b.color}28` }}>{b.label}</span>
      ))}
    </div>
  );
}

// ── STAT CARD ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"18px 20px",display:"flex",alignItems:"center",gap:13 }}>
      <div style={{ width:40,height:40,borderRadius:10,background:(accent||T.gold)+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontSize:10,color:T.textMid,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3 }}>{label}</div>
        <div style={{ fontSize:22,fontWeight:700,color:accent||T.gold,lineHeight:1,fontFamily:"var(--font-display)" }}>{value}</div>
        <div style={{ fontSize:10,color:T.textDim,marginTop:3 }}>{sub}</div>
      </div>
    </div>
  );
}

// ── KPI ROW ───────────────────────────────────────────────────────────────────
function KpiRow({ label, current, target, unit="", color }) {
  const p = pct(current,target);
  const ok = p>=60;
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5 }}>
        <span style={{ color:T.textMid }}>{label}</span>
        <span style={{ color:ok?color:T.red,fontWeight:600 }}>{current}{unit} <span style={{ color:T.textDim,fontWeight:400 }}>/ {target}{unit}</span></span>
      </div>
      <div style={{ background:T.border,borderRadius:4,height:4,overflow:"hidden" }}>
        <div style={{ width:`${p}%`,height:"100%",borderRadius:4,background:ok?color:T.red,transition:"width 1.2s ease" }}/>
      </div>
      <div style={{ fontSize:9,color:T.textDim,marginTop:3,textAlign:"right" }}>{p}% of target</div>
    </div>
  );
}

// ── MEMBER CARD ───────────────────────────────────────────────────────────────
function MemberCard({ member, taskStates, output, streaming, historyCount, alerts, schedule, onOpen, onRun }) {
  const states   = taskStates[member.id]||[];
  const done     = states.filter(Boolean).length;
  const progress = states.length ? pct(done,states.length) : 0;
  const isStreaming = streaming===member.id;
  const isBusy   = !!streaming;
  const [hov,setHov]=useState(false);

  // Agent-specific alerts
  const agentAlerts = alerts.filter(a=>a.agent===member.id);
  const hasRed   = agentAlerts.some(a=>a.level==="red");
  const hasAmber = agentAlerts.some(a=>a.level==="amber");
  const hasGreen = agentAlerts.some(a=>a.level==="green") && !hasRed && !hasAmber;
  const alertColor = hasRed?T.red:hasAmber?T.amber:hasGreen?T.green:null;

  return (
    <div onClick={onOpen} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background:hov?T.cardHover:T.card,
      border:`1px solid ${alertColor?alertColor+"55":hov?T.borderL:T.border}`,
      borderRadius:12,padding:20,cursor:"pointer",position:"relative",overflow:"hidden",
      transition:"all 0.2s ease",transform:hov?"translateY(-2px)":"none",
      boxShadow:hov?`0 8px 32px rgba(0,0,0,0.35)`:hasRed?`0 0 0 1px #f8717122`:"none",
    }}>
      {/* Colour accent bar */}
      <div style={{ position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${alertColor||member.color},transparent)`,opacity:0.9 }}/>

      {/* Status dot */}
      {isStreaming && <div style={{ position:"absolute",top:12,right:12,width:8,height:8,borderRadius:"50%",background:member.color,animation:"pulse 1s ease infinite",boxShadow:`0 0 8px ${member.color}` }}/>}
      {!isStreaming && alertColor && (
        <div style={{ position:"absolute",top:11,right:11,width:8,height:8,borderRadius:"50%",background:alertColor,animation:hasRed?"pulse 2s ease infinite":"none" }}/>
      )}

      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:13 }}>
        <div>
          <div style={{ fontSize:14,fontWeight:600,color:T.text,marginBottom:2 }}>{member.name}</div>
          <div style={{ fontSize:9,color:member.color,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:500 }}>{member.role}</div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4 }}>
          <div style={{ width:34,height:34,borderRadius:8,background:member.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>{member.emoji}</div>
          {agentAlerts.length>0&&(
            <span style={{ fontSize:8,color:alertColor,background:alertColor+"18",padding:"1px 6px",borderRadius:8,fontWeight:700,letterSpacing:"0.08em" }}>
              {agentAlerts.length} alert{agentAlerts.length>1?"s":""}
            </span>
          )}
        </div>
      </div>

      {/* Task progress */}
      <div style={{ marginBottom:13 }}>
        <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,color:T.textMid,marginBottom:5 }}>
          <span>Tasks</span>
          <span style={{ color:member.color,fontWeight:600 }}>{done}/{states.length}</span>
        </div>
        <div style={{ background:T.border,borderRadius:4,height:3,overflow:"hidden" }}>
          <div style={{ width:`${progress}%`,height:"100%",background:`linear-gradient(90deg,${member.color},${member.color}88)`,borderRadius:4,transition:"width 1s ease" }}/>
        </div>
      </div>

      {/* KPI mini grid */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:13 }}>
        {member.kpis.slice(0,2).map(k=>{
          const p=pct(k.current,k.target);
          return (
            <div key={k.label} style={{ background:T.base,borderRadius:7,padding:"8px 10px",border:`1px solid ${p<40?"#f8717144":T.border}` }}>
              <div style={{ fontSize:8,color:T.textDim,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3 }}>{k.label}</div>
              <div style={{ fontSize:16,fontWeight:700,color:p>=60?T.text:p>=40?T.amber:T.red,lineHeight:1 }}>{k.current}{k.unit||""}</div>
              <div style={{ fontSize:8,color:T.textDim,marginTop:2 }}>of {k.target}{k.unit||""}</div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div style={{ fontSize:9,color:output?member.color:T.textDim }}>
          {output?`✓ ${output.timestamp}`:`No briefing · ${member.cadence}`}
          {historyCount>0&&<span style={{ marginLeft:5,color:T.textDim }}>· {historyCount} saved</span>}
          {schedule?.enabled&&schedule?.frequency!=="disabled"&&(
            <div style={{ marginTop:3,color:T.textDim }}>
              ⏰ {formatNextRun(getNextRun(schedule))}
            </div>
          )}
        </div>
        <button onClick={e=>{e.stopPropagation();onRun();}} disabled={isBusy} style={{
          background:isBusy?"transparent":member.color+"22",
          border:`1px solid ${isBusy?T.border:member.color+"66"}`,
          color:isBusy?T.textDim:member.color,
          fontSize:9,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",
          padding:"4px 12px",borderRadius:6,cursor:isBusy?"not-allowed":"pointer",
          fontFamily:"var(--font-mono)",transition:"all 0.2s",
        }}>{isStreaming?"Running...":"Run"}</button>
      </div>
    </div>
  );
}

// ── HISTORY PANEL ─────────────────────────────────────────────────────────────
function HistoryPanel({ agentId, agentName, color, onClose, onRestore }) {
  const history = readHistory(agentId);
  const [selected,setSelected]=useState(history[0]||null);
  return (
    <div style={{ position:"fixed",top:0,right:0,bottom:0,width:560,background:T.sidebar,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",zIndex:200,animation:"slideIn 0.25s ease",boxShadow:"-8px 0 32px rgba(0,0,0,0.4)" }}>
      <div style={{ padding:"20px 24px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <div style={{ fontSize:15,fontWeight:600,color:T.text }}>{agentName}</div>
          <div style={{ fontSize:10,color,letterSpacing:"0.12em",textTransform:"uppercase",marginTop:2 }}>Run History · {history.length} briefings</div>
        </div>
        <button onClick={onClose} style={{ background:"none",border:`1px solid ${T.border}`,color:T.textMid,fontSize:18,width:32,height:32,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
      </div>
      {history.length===0?(
        <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:T.textDim,fontSize:13 }}>No briefings run yet.</div>
      ):(
        <div style={{ display:"flex",flex:1,overflow:"hidden" }}>
          <div style={{ width:180,borderRight:`1px solid ${T.border}`,overflowY:"auto",flexShrink:0 }}>
            {history.map((h,i)=>(
              <div key={h.id} onClick={()=>setSelected(h)} style={{ padding:"12px 16px",cursor:"pointer",borderBottom:`1px solid ${T.border}`,background:selected?.id===h.id?color+"18":"transparent",borderLeft:selected?.id===h.id?`3px solid ${color}`:"3px solid transparent",transition:"all 0.15s" }}>
                <div style={{ fontSize:10,fontWeight:600,color:selected?.id===h.id?color:T.textMid,marginBottom:3 }}>{i===0?"Latest":"#"+(i+1)}</div>
                <div style={{ fontSize:9,color:T.textDim,lineHeight:1.4 }}>{h.timestamp}</div>
                {h.customPrompt&&<div style={{ fontSize:9,color,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>"{h.customPrompt}"</div>}
              </div>
            ))}
          </div>
          <div style={{ flex:1,overflow:"hidden",display:"flex",flexDirection:"column" }}>
            {selected&&(
              <>
                <div style={{ padding:"12px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div style={{ fontSize:11,color:T.textMid }}>{selected.timestamp}</div>
                  <button onClick={()=>onRestore(selected.text)} style={{ background:color+"22",border:`1px solid ${color}44`,color,fontSize:9,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",padding:"4px 12px",borderRadius:6,cursor:"pointer",fontFamily:"var(--font-mono)" }}>Restore</button>
                </div>
                <div style={{ flex:1,overflowY:"auto",padding:16 }}>
                  <pre style={{ fontSize:11,color:T.textMid,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"var(--font-mono)",margin:0 }}>{selected.text}</pre>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── OUTPUT LOG ────────────────────────────────────────────────────────────────
function OutputLog({ agentId, output, color, isStreaming, onHistory }) {
  if(!output&&!isStreaming) return null;
  return (
    <div style={{ background:T.base,border:`1px solid ${T.border}`,borderLeft:`3px solid ${color}`,borderRadius:10,padding:"16px 20px",marginTop:20 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase" }}>Agent Output</span>
          {isStreaming&&<span style={{ width:7,height:7,borderRadius:"50%",background:color,animation:"pulse 1s infinite",display:"inline-block" }}/>}
        </div>
        <div style={{ display:"flex",gap:7,alignItems:"center" }}>
          {output&&<span style={{ fontSize:9,color:T.textDim }}>{output.timestamp}</span>}
          {onHistory&&<button onClick={onHistory} style={{ background:"transparent",border:`1px solid ${T.border}`,color:T.textMid,fontSize:9,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",padding:"3px 10px",borderRadius:6,cursor:"pointer",fontFamily:"var(--font-mono)" }}>History</button>}
        </div>
      </div>
      <pre style={{ fontSize:12,color:T.textMid,lineHeight:1.9,whiteSpace:"pre-wrap",fontFamily:"var(--font-mono)",margin:0,maxHeight:400,overflowY:"auto" }}>
        {output?.text||(isStreaming?"Initialising agent...":"")}
        {isStreaming&&<span style={{ color,animation:"pulse 0.8s infinite" }}>▌</span>}
      </pre>
      {!isStreaming&&output?.text&&(
        <CopyToolbar
          agentId={agentId}
          outputText={output.text}
          color={color}
          timestamp={output.timestamp}
        />
      )}
    </div>
  );
}

// ── AGENT ALERT SUMMARY (shown in agent detail) ───────────────────────────────
function AgentAlertSummary({ alerts, color }) {
  if (!alerts||alerts.length===0) return null;
  const ALERT_COLORS = { red:"#f87171", amber:"#fbbf24", green:"#4ade80" };
  return (
    <div style={{ marginBottom:18 }}>
      {alerts.map(a=>(
        <div key={a.id} style={{ background:ALERT_COLORS[a.level]+"12",border:`1px solid ${ALERT_COLORS[a.level]}33`,borderLeft:`3px solid ${ALERT_COLORS[a.level]}`,borderRadius:8,padding:"10px 14px",marginBottom:8 }}>
          <div style={{ fontSize:11,fontWeight:600,color:ALERT_COLORS[a.level],marginBottom:3 }}>{a.emoji} {a.title}</div>
          <div style={{ fontSize:11,color:T.textMid,lineHeight:1.6 }}>{a.detail}</div>
          {a.action&&<div style={{ fontSize:10,color:T.textDim,marginTop:6,fontStyle:"italic" }}>→ {a.action}</div>}
        </div>
      ))}
    </div>
  );
}

// ── MEMBER DETAIL ─────────────────────────────────────────────────────────────
function MemberDetail({ member, taskStates, output, streaming, alerts, onToggleTask, onRunBriefing, onBack }) {
  const states=taskStates[member.id]||member.tasks.map(t=>t.done);
  const done=states.filter(Boolean).length;
  const isStreaming=streaming===member.id;
  const isBusy=!!streaming;
  const [customPrompt,setCustomPrompt]=useState("");
  const [showHistory,setShowHistory]=useState(false);
  const [restoredText,setRestoredText]=useState(null);
  const dateCtx=getDateContext();
  const agentAlerts=alerts.filter(a=>a.agent===member.id);
  const displayOutput=restoredText?{text:restoredText,timestamp:"Restored from history"}:output;

  return (
    <div style={{ animation:"fadeUp 0.3s ease" }}>
      {showHistory&&<HistoryPanel agentId={member.id} agentName={member.name} color={member.color} onClose={()=>setShowHistory(false)} onRestore={(text)=>{setRestoredText(text);setShowHistory(false);}}/>}

      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22 }}>
        <button onClick={onBack} style={{ background:"none",border:"none",color:T.textMid,fontSize:12,cursor:"pointer",fontFamily:"var(--font-mono)",display:"flex",alignItems:"center",gap:6,padding:0 }}
          onMouseEnter={e=>e.currentTarget.style.color=T.text} onMouseLeave={e=>e.currentTarget.style.color=T.textMid}>
          ← Back to Dashboard
        </button>
        <button onClick={()=>setShowHistory(true)} style={{ background:T.card,border:`1px solid ${T.border}`,color:T.textMid,fontSize:10,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",padding:"6px 14px",borderRadius:8,cursor:"pointer",fontFamily:"var(--font-mono)" }}>
          📋 History ({readHistory(member.id).length})
        </button>
      </div>

      {/* Alerts for this agent */}
      <AgentAlertSummary alerts={agentAlerts} color={member.color}/>

      {/* Header */}
      <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"22px 26px",marginBottom:18,position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${member.color},transparent)` }}/>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:14 }}>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ width:50,height:50,borderRadius:12,background:member.color+"20",fontSize:24,display:"flex",alignItems:"center",justifyContent:"center" }}>{member.emoji}</div>
            <div>
              <div style={{ fontFamily:"var(--font-display)",fontSize:26,fontWeight:700,color:T.text,lineHeight:1 }}>{member.name}</div>
              <div style={{ fontSize:10,color:member.color,letterSpacing:"0.15em",textTransform:"uppercase",marginTop:5 }}>{member.role} · {member.cadence} briefing</div>
              <div style={{ fontSize:10,color:T.textDim,marginTop:4 }}>{dateCtx.dayOfWeek}, {dateCtx.dayOfMonth} {dateCtx.month} {dateCtx.year} · Week {dateCtx.weekNum}</div>
            </div>
          </div>
          <button onClick={()=>onRunBriefing(member,customPrompt)} disabled={isBusy} style={{ background:isStreaming||isBusy?"transparent":member.color,color:isStreaming||isBusy?member.color:"#000",border:`1px solid ${member.color}`,padding:"10px 22px",fontSize:10,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",cursor:isBusy?"not-allowed":"pointer",borderRadius:8,fontFamily:"var(--font-mono)",transition:"all 0.2s" }}>
            {isStreaming?"● Streaming...":`Run ${member.cadence==="weekly"?"Weekly":"Daily"} Briefing`}
          </button>
        </div>
        <CustomPrompt
          agentId={member.id}
          color={member.color}
          value={customPrompt}
          onChange={setCustomPrompt}
          alerts={alerts}
        />
      </div>

      <div className="detail-grid" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16 }}>
        <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20 }}>
          <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:14 }}>Tasks · <span style={{ color:member.color }}>{done}/{member.tasks.length}</span></div>
          {member.tasks.map((t,i)=>{
            const d=states[i]??t.done;
            return (
              <div key={i} onClick={()=>onToggleTask(member.id,i)} style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"7px 6px",cursor:"pointer",borderRadius:7,marginBottom:1,transition:"background 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.background=T.cardHover}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{ width:16,height:16,flexShrink:0,marginTop:2,borderRadius:4,border:`2px solid ${d?member.color:T.border}`,background:d?member.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s" }}>
                  {d&&<span style={{ fontSize:9,color:"#000",fontWeight:700 }}>✓</span>}
                </div>
                <span style={{ fontSize:12,color:d?T.textDim:T.text,lineHeight:1.5,textDecoration:d?"line-through":"none" }}>{t.text}</span>
              </div>
            );
          })}
        </div>
        <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20 }}>
          <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:14 }}>KPI Tracker</div>
          {member.kpis.map(k=><KpiRow key={k.label} {...k} color={member.color}/>)}
        </div>
      </div>

      <OutputLog agentId={member.id} output={displayOutput} color={member.color} isStreaming={isStreaming} onHistory={()=>setShowHistory(true)}/>

      <AgentChat member={member} lastOutput={displayOutput}/>

      <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginTop:16 }}>
        <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:12 }}>System Prompt</div>
        <pre style={{ fontSize:10,color:T.textDim,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"var(--font-mono)",maxHeight:160,overflowY:"auto",background:T.base,padding:12,borderRadius:8 }}>{member.systemPrompt}</pre>
      </div>
    </div>
  );
}

// ── WEEKLY SUMMARY ────────────────────────────────────────────────────────────
function WeeklySummary({ outputs, streaming, onRunAll, histories, alerts }) {
  const hasOutputs=Object.keys(outputs).length>0;
  const isBusy=!!streaming;
  const dateCtx=getDateContext();
  const critical=alerts.filter(a=>a.level==="red");

  return (
    <div style={{ animation:"fadeUp 0.3s ease" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:26 }}>
        <div>
          <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:6 }}>Department Command</div>
          <div style={{ fontFamily:"var(--font-display)",fontSize:30,fontWeight:700,color:T.text }}>Weekly Summary</div>
          <div style={{ fontSize:11,color:T.textDim,marginTop:5 }}>Week {dateCtx.weekNum} · {dateCtx.dayOfWeek}, {dateCtx.dayOfMonth} {dateCtx.month} {dateCtx.year}</div>
        </div>
        <button onClick={onRunAll} disabled={isBusy} style={{ background:isBusy?"transparent":T.gold,color:isBusy?T.gold:"#000",border:`1px solid ${T.gold}`,padding:"10px 22px",fontSize:10,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",cursor:isBusy?"not-allowed":"pointer",borderRadius:8,fontFamily:"var(--font-mono)",transition:"all 0.2s" }}>
          {isBusy?`● ${TEAM.find(m=>m.id===streaming)?.name||"Running"}...`:"⚡ Run All Agents"}
        </button>
      </div>

      {critical.length>0&&(
        <div style={{ background:"#f8717112",border:"1px solid #f8717133",borderRadius:10,padding:"12px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:12 }}>
          <span style={{ fontSize:16 }}>🚨</span>
          <div>
            <div style={{ fontSize:12,fontWeight:700,color:"#f87171",marginBottom:3 }}>{critical.length} critical alert{critical.length>1?"s":""} need attention</div>
            <div style={{ fontSize:11,color:T.textMid }}>{critical.map(a=>a.title).slice(0,2).join(" · ")}</div>
          </div>
        </div>
      )}

      {!hasOutputs?(
        <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"50px 32px",textAlign:"center" }}>
          <div style={{ fontSize:34,marginBottom:14 }}>🏛</div>
          <div style={{ fontSize:13,color:T.textMid,lineHeight:2 }}>No briefings generated yet.<br/><span style={{ color:T.gold }}>Run All Agents</span> to populate this view.</div>
        </div>
      ):(
        <div style={{ display:"flex",flexDirection:"column",gap:11 }}>
          {TEAM.map(m=>{
            const out=outputs[m.id];
            const hCount=(histories[m.id]||[]).length;
            const mAlerts=alerts.filter(a=>a.agent===m.id);
            const hasRed=mAlerts.some(a=>a.level==="red");
            return (
              <div key={m.id} style={{ background:T.card,border:`1px solid ${hasRed?"#f8717133":T.border}`,borderLeft:`3px solid ${m.color}`,borderRadius:12,overflow:"hidden" }}>
                <div style={{ padding:"12px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:11 }}>
                  <span style={{ fontSize:15 }}>{m.emoji}</span>
                  <span style={{ fontSize:13,fontWeight:600,color:T.text }}>{m.name}</span>
                  <span style={{ fontSize:9,color:m.color,letterSpacing:"0.1em",textTransform:"uppercase" }}>{m.role}</span>
                  {mAlerts.length>0&&<span style={{ fontSize:9,color:hasRed?"#f87171":"#fbbf24",background:(hasRed?"#f87171":"#fbbf24")+"18",padding:"1px 7px",borderRadius:8,fontWeight:700 }}>{mAlerts.length} alert{mAlerts.length>1?"s":""}</span>}
                  {hCount>0&&<span style={{ fontSize:9,color:T.textDim }}>· {hCount} saved</span>}
                  {out&&<span style={{ marginLeft:"auto",fontSize:9,color:T.textDim }}>{out.timestamp}</span>}
                  {!out&&streaming===m.id&&<span style={{ marginLeft:"auto",width:7,height:7,borderRadius:"50%",background:m.color,animation:"pulse 1s infinite",display:"inline-block" }}/>}
                </div>
                {out?(
                  <>
                  <div style={{ padding:"8px 20px 0",display:"flex",justifyContent:"flex-end",gap:8 }}>
                    <button onClick={()=>navigator.clipboard.writeText(out.text)} style={{ background:"none",border:`1px solid ${T.border}`,color:T.textDim,fontSize:9,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",padding:"3px 10px",borderRadius:6,cursor:"pointer",fontFamily:"var(--font-mono)" }}>Copy Full</button>
                  </div>
                  <pre style={{ fontSize:11,color:T.textMid,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"var(--font-mono)",padding:"8px 20px 13px",margin:0,maxHeight:160,overflowY:"auto" }}>
                    {out.text.length>500?out.text.slice(0,500)+"\n\n[Open agent for full output →]":out.text}
                  </pre>
                  </>
                ):(
                  <div style={{ padding:"13px 20px",fontSize:11,color:T.textDim }}>No briefing yet</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({ activeTab, setActiveTab, activeMember, setActiveMember, streaming, histories, alerts, onOpenAlerts, onOpenScheduler, scheduleActiveCount, onOpenMorning, onOpenNotifications, activeView, setActiveView, onOpenIntegrations, connectionCount, onOpenSettings }) {
  const red   = alerts.filter(a=>a.level==="red").length;
  const amber = alerts.filter(a=>a.level==="amber").length;
  const green = alerts.filter(a=>a.level==="green").length;
  const total = alerts.length;
  const worstColor = red>0?"#f87171":amber>0?"#fbbf24":green>0?"#4ade80":"#60a5fa";
  const showAlertsBtn = total > 0;

  return (
    <aside style={{ width:210,flexShrink:0,background:T.sidebar,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0 }}>
      <div style={{ padding:"20px 18px 16px",borderBottom:`1px solid ${T.border}` }}>
        <div style={{ fontFamily:"var(--font-display)",fontSize:17,fontWeight:700,color:T.gold }}>FifteenConsult</div>
        <div style={{ fontSize:9,color:T.textDim,letterSpacing:"0.2em",textTransform:"uppercase",marginTop:3 }}>AI Marketing Dept</div>
      </div>

      <nav style={{ padding:"12px 10px",flex:1,overflowY:"auto" }}>
        <div style={{ fontSize:9,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:5,padding:"0 8px" }}>Main Menu</div>

        {[{id:"dashboard",label:"Dashboard",icon:"⊞"},{id:"summary",label:"Weekly Summary",icon:"📋"},{id:"warroom",label:"War Room",icon:"🎯"},{id:"framework",label:"15 Framework",icon:"⬡"}].map(item=>{
          const active=((item.id==="warroom"||item.id==="framework")?activeView===item.id:activeTab===item.id&&activeView==="dashboard")&&!activeMember;
          return (
            <button key={item.id} onClick={()=>{
              if(item.id==="warroom"||item.id==="framework"){
                setActiveView(item.id);
                setActiveTab("dashboard");
              } else {
                setActiveTab(item.id);
                setActiveView("dashboard");
              }
              setActiveMember(null);
            }} style={{ width:"100%",background:active?"#C8A96E18":"none",border:"none",borderRadius:8,padding:"9px 10px",fontSize:12,fontWeight:active?600:400,color:active?T.gold:T.textMid,display:"flex",alignItems:"center",gap:9,cursor:"pointer",transition:"all 0.15s",textAlign:"left",fontFamily:"var(--font-mono)" }}
              onMouseEnter={e=>{if(!active)e.currentTarget.style.background=T.card;}}
              onMouseLeave={e=>{if(!active)e.currentTarget.style.background="none";}}>
              <span style={{ fontSize:14 }}>{item.icon}</span>{item.label}
            </button>
          );
        })}

        {/* Alerts button */}
        <button onClick={onOpenIntegrations} style={{ width:"100%",background:"none",border:"none",borderRadius:8,padding:"9px 10px",fontSize:12,fontWeight:400,color:"var(--text-mid)",display:"flex",alignItems:"center",gap:9,cursor:"pointer",transition:"all 0.15s",textAlign:"left",fontFamily:"var(--font-mono)",marginTop:2 }}
          onMouseEnter={e=>e.currentTarget.style.background="var(--bg-card)"}
          onMouseLeave={e=>e.currentTarget.style.background="none"}>
          <span style={{ fontSize:14 }}>🔌</span>
          <span style={{ flex:1 }}>Connections</span>
          <span style={{ fontSize:8,color:connectionCount>0?"#4ade80":"#f87171",fontWeight:700 }}>{connectionCount} live</span>
        </button>

        <button onClick={onOpenSettings} style={{ width:"100%",background:"none",border:"none",borderRadius:8,padding:"9px 10px",fontSize:12,fontWeight:400,color:"var(--text-mid)",display:"flex",alignItems:"center",gap:9,cursor:"pointer",transition:"all 0.15s",textAlign:"left",fontFamily:"var(--font-mono)",marginTop:2 }}
          onMouseEnter={e=>e.currentTarget.style.background="var(--bg-card)"}
          onMouseLeave={e=>e.currentTarget.style.background="none"}>
          <span style={{ fontSize:14 }}>⚙️</span>
          <span style={{ flex:1 }}>Settings</span>
        </button>

        <button onClick={onOpenMorning} style={{ width:"100%",background:"#C8A96E12",border:`1px solid #C8A96E33`,borderRadius:8,padding:"9px 10px",fontSize:12,fontWeight:600,color:T.gold,display:"flex",alignItems:"center",gap:9,cursor:"pointer",transition:"all 0.15s",textAlign:"left",fontFamily:"var(--font-mono)",marginTop:8 }}
          onMouseEnter={e=>e.currentTarget.style.background="#C8A96E22"}
          onMouseLeave={e=>e.currentTarget.style.background="#C8A96E12"}>
          <span style={{ fontSize:14 }}>☀️</span>
          <span style={{ flex:1 }}>Morning Briefing</span>
        </button>

        <button onClick={onOpenNotifications} style={{ width:"100%",background:"none",border:"none",borderRadius:8,padding:"9px 10px",fontSize:12,fontWeight:400,color:T.textMid,display:"flex",alignItems:"center",gap:9,cursor:"pointer",transition:"all 0.15s",textAlign:"left",fontFamily:"var(--font-mono)",marginTop:2 }}
          onMouseEnter={e=>e.currentTarget.style.background=T.card}
          onMouseLeave={e=>e.currentTarget.style.background="none"}>
          <span style={{ fontSize:14 }}>🔔</span>
          <span style={{ flex:1 }}>Notifications</span>
        </button>

        <button onClick={onOpenScheduler} style={{ width:"100%",background:"none",border:"none",borderRadius:8,padding:"9px 10px",fontSize:12,fontWeight:400,color:T.textMid,display:"flex",alignItems:"center",gap:9,cursor:"pointer",transition:"all 0.15s",textAlign:"left",fontFamily:"var(--font-mono)",marginTop:2 }}
          onMouseEnter={e=>e.currentTarget.style.background=T.card}
          onMouseLeave={e=>e.currentTarget.style.background="none"}>
          <span style={{ fontSize:14 }}>⏰</span>
          <span style={{ flex:1 }}>Scheduler</span>
          <span style={{ fontSize:9,color:scheduleActiveCount>0?T.green:T.textDim,background:T.card,padding:"1px 6px",borderRadius:8 }}>{scheduleActiveCount} on</span>
        </button>

        {showAlertsBtn&&(
          <button onClick={onOpenAlerts} style={{ width:"100%",background:worstColor+"12",border:`1px solid ${worstColor}33`,borderRadius:8,padding:"9px 10px",fontSize:12,fontWeight:600,color:worstColor,display:"flex",alignItems:"center",gap:9,cursor:"pointer",transition:"all 0.15s",textAlign:"left",fontFamily:"var(--font-mono)",marginTop:4 }}>
            <span style={{ fontSize:14,animation:red>0?"pulse 1.5s infinite":"none" }}>🔔</span>
            <span style={{ flex:1 }}>Alerts</span>
            <span style={{ fontSize:9,background:worstColor+"22",padding:"1px 7px",borderRadius:8,fontWeight:700 }}>{red+amber}</span>
          </button>
        )}

        <div style={{ fontSize:9,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",margin:"16px 0 5px",padding:"0 8px" }}>Agents</div>
        {TEAM.map(m=>{
          const active=activeMember?.id===m.id;
          const isRunning=streaming===m.id;
          const hCount=(histories[m.id]||[]).length;
          const mAlerts=alerts.filter(a=>a.agent===m.id);
          const hasRed=mAlerts.some(a=>a.level==="red");
          const hasAmber=mAlerts.some(a=>a.level==="amber")&&!hasRed;
          const dotColor=hasRed?"#f87171":hasAmber?"#fbbf24":null;
          return (
            <button key={m.id} onClick={()=>setActiveMember(m)} style={{ width:"100%",background:active?m.color+"18":"none",border:"none",borderRadius:8,padding:"7px 10px",fontSize:12,fontWeight:active?600:400,color:active?m.color:T.textMid,display:"flex",alignItems:"center",gap:9,cursor:"pointer",transition:"all 0.15s",textAlign:"left",fontFamily:"var(--font-mono)" }}
              onMouseEnter={e=>{if(!active)e.currentTarget.style.background=T.card;}}
              onMouseLeave={e=>{if(!active)e.currentTarget.style.background="none";}}>
              <span style={{ fontSize:13 }}>{m.emoji}</span>
              <span style={{ flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{m.name.split(" ")[0]}</span>
              {hCount>0&&<span style={{ fontSize:8,color:T.textDim,background:T.card,padding:"1px 5px",borderRadius:8 }}>{hCount}</span>}
              {dotColor&&<span style={{ width:6,height:6,borderRadius:"50%",background:dotColor,display:"inline-block",flexShrink:0 }}/>}
              {isRunning&&<span style={{ width:6,height:6,borderRadius:"50%",background:m.color,animation:"pulse 1s infinite",display:"inline-block",flexShrink:0 }}/>}
            </button>
          );
        })}
      </nav>
      <div style={{ padding:"12px 18px",borderTop:`1px solid ${T.border}`,fontSize:9,color:T.textDim }}>Powered by Claude</div>
    </aside>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const stored=initStorage();
  const [activeTab,setActiveTab]       = useState("dashboard");
  const [activeMember,setActiveMember] = useState(null);
  const [streaming,setStreaming]       = useState(null);
  const [showAlerts,setShowAlerts]     = useState(false);
  const [showScheduler,setShowScheduler]   = useState(false);
  const [theme,setTheme]                   = useState(()=>{ const t=loadTheme(); applyTheme(t); return t; });
  const [showIntegrations,setShowIntegrations] = useState(false);
  const [showSettings,setShowSettings]         = useState(false);
  const [showMobileMenu,setShowMobileMenu] = useState(false);

  const toggleTheme = () => {
    const next = theme==="dark"?"light":"dark";
    setTheme(next);
    saveTheme(next);
  };
  const [showNotifications,setShowNotifications] = useState(false);
  const [showMorningBriefing,setShowMorningBriefing] = useState(false);
  const [activeView,setActiveView]         = useState("dashboard"); // dashboard|warroom|framework
  const [schedules,setSchedules]       = useState(()=>loadSchedules());
  const [outputs,setOutputs]           = useState(stored.outputs||{});
  const [taskStates,setTaskStates]     = useState(()=>{
    const init={};
    TEAM.forEach(m=>{ init[m.id]=stored.tasks?.[m.id]||m.tasks.map(t=>t.done); });
    return init;
  });
  const [histories,setHistories]       = useState(()=>{
    const h={};
    TEAM.forEach(m=>{ h[m.id]=stored.history?.[m.id]||[]; });
    return h;
  });

  useEffect(()=>{ const s=initStorage(); s.outputs=outputs; s.tasks=taskStates; writeStorage(s); },[outputs,taskStates]);

  // Compute alerts live from current KPI data
  const kpiData = useMemo(()=>buildKpiData(TEAM),[]);
  const alerts  = useMemo(()=>evaluateAlerts(kpiData,taskStates,outputs),[kpiData,taskStates,outputs]);

  const toggleTask=(memberId,idx)=>{
    setTaskStates(prev=>{ const u=[...(prev[memberId]||[])]; u[idx]=!u[idx]; return{...prev,[memberId]:u}; });
  };

  const runBriefing=useCallback(async(member,customPrompt="")=>{
    if(streaming) return;
    setStreaming(member.id);
    const t=now_ts();
    const dateCtx=getDateContext();
    const trigger=buildBriefingTrigger(member.briefingTrigger,dateCtx,customPrompt);
    setOutputs(prev=>({...prev,[member.id]:{text:"",timestamp:t}}));
    let finalText="";
    try {
      finalText=await callClaudeAPI(member.systemPrompt,trigger,(partial)=>{
        setOutputs(prev=>({...prev,[member.id]:{text:partial,timestamp:t}}));
      });
    } catch(err) {
      finalText=`⚠ Error: ${err.message}`;
      setOutputs(prev=>({...prev,[member.id]:{text:finalText,timestamp:t}}));
    } finally {
      setStreaming(null);
      if(finalText&&!finalText.startsWith("⚠")) {
        const newHistory=pushHistory(member.id,{text:finalText,timestamp:t,customPrompt,weekNum:getDateContext().weekNum});
        setHistories(prev=>({...prev,[member.id]:newHistory}));
        addNotification("briefing",`${member.name} briefing complete`,`${member.role} · ${t}`,member.id);
      } else if(finalText.startsWith("⚠")) {
        addNotification("error",`${member.name} briefing failed`,finalText.slice(0,80),member.id);
      }
    }
  },[streaming]);

  const runAll=useCallback(async()=>{ if(streaming) return; for(const m of TEAM) await runBriefing(m,""); },[runBriefing,streaming]);

  // Save schedules whenever they change
  useEffect(()=>{ saveSchedules(schedules); },[schedules]);

  // Update a single agent schedule
  const handleScheduleUpdate=useCallback((agentId, updated)=>{
    setSchedules(prev=>({ ...prev, [agentId]:updated }));
  },[]);

  // Auto-run scheduler — checks every 60 seconds when page is visible
  useEffect(()=>{
    const check=()=>{
      if(streaming) return;
      const due=getDueAgents(schedules);
      if(due.length>0) {
        const agentId=due[0]; // Run one at a time
        const member=TEAM.find(m=>m.id===agentId);
        if(member) {
          markRun(agentId);
          runBriefing(member,"");
        }
      }
    };
    // Check on mount
    const timer=setInterval(check,60000);
    // Also check when tab becomes visible
    const onVisible=()=>{ if(document.visibilityState==="visible") check(); };
    document.addEventListener("visibilitychange",onVisible);
    return ()=>{ clearInterval(timer); document.removeEventListener("visibilitychange",onVisible); };
  },[schedules,streaming,runBriefing]);

  const totalTasks  = TEAM.reduce((s,m)=>s+m.tasks.length,0);
  const totalDone   = TEAM.reduce((s,m)=>s+(taskStates[m.id]||[]).filter(Boolean).length,0);
  const totalOutputs= Object.keys(outputs).length;
  const totalHistory= Object.values(histories).reduce((s,h)=>s+h.length,0);
  const criticalCount = alerts.filter(a=>a.level==="red").length;

  return (
    <div style={{ display:"flex",minHeight:"100vh",background:T.base,color:T.text,fontFamily:"var(--font-mono)" }}>
      <div className="desktop-sidebar"><Sidebar activeTab={activeTab} setActiveTab={setActiveTab} activeMember={activeMember} setActiveMember={setActiveMember} streaming={streaming} histories={histories} alerts={alerts} onOpenAlerts={()=>setShowAlerts(true)} onOpenScheduler={()=>setShowScheduler(true)} scheduleActiveCount={Object.values(schedules).filter(s=>s.enabled&&s.frequency!=="disabled").length} onOpenMorning={()=>setShowMorningBriefing(true)} onOpenNotifications={()=>setShowNotifications(true)} activeView={activeView} setActiveView={setActiveView} onOpenIntegrations={()=>setShowIntegrations(true)} connectionCount={Object.values(getConnectionStatuses()).filter(Boolean).length} onOpenSettings={()=>setShowSettings(true)}/></div>

      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"auto",paddingBottom:"env(safe-area-inset-bottom)" }}>
        <header style={{ padding:"16px 26px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:T.base,position:"sticky",top:0,zIndex:50 }}>
          <div>
            <div style={{ fontSize:19,fontWeight:700,color:T.text,fontFamily:"var(--font-display)",marginBottom:8 }}>
              {activeMember?activeMember.name:activeView==="warroom"?"War Room":activeView==="framework"?"The Fifteen Framework":activeTab==="dashboard"?"Dashboard":"Weekly Summary"}
            </div>
            <DateBadge/>
          </div>
          <div style={{ display:"flex",gap:9,alignItems:"center" }}>
            {/* Mobile menu button */}
            <button className="mobile-menu-btn" onClick={()=>setShowMobileMenu(true)} style={{ display:"none",alignItems:"center",justifyContent:"center",background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 11px",cursor:"pointer",fontSize:16 }}>
              ☰
            </button>
            <button onClick={()=>setShowScheduler(true)} style={{ display:"flex",alignItems:"center",gap:6,background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 13px",cursor:"pointer",fontFamily:"var(--font-mono)",transition:"all 0.2s" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderL}
              onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
              <span style={{ fontSize:13 }}>⏰</span>
              <span style={{ fontSize:10,color:T.textMid }}>Schedule</span>
            </button>
            {/* Theme toggle */}
            <button onClick={toggleTheme} title={theme==="dark"?"Switch to light mode":"Switch to dark mode"} style={{ display:"flex",alignItems:"center",justifyContent:"center",background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 11px",cursor:"pointer",fontSize:15,transition:"all 0.2s" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderL}
              onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
              {theme==="dark"?"☀️":"🌙"}
            </button>
            <AlertBadge alerts={alerts} onClick={()=>setShowAlerts(true)}/>
            {!activeMember&&activeView==="dashboard"&&(
              <button onClick={runAll} disabled={!!streaming} style={{ background:!!streaming?"transparent":T.gold,color:!!streaming?T.gold:"#000",border:`1px solid ${T.gold}`,padding:"9px 18px",fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",cursor:!!streaming?"not-allowed":"pointer",borderRadius:8,fontFamily:"var(--font-mono)",transition:"all 0.2s" }}>
                {!!streaming?`● ${TEAM.find(m=>m.id===streaming)?.name||"Running"}...`:"⚡ Run All Agents"}
              </button>
            )}
            <div style={{ padding:"7px 13px",background:T.card,borderRadius:8,border:`1px solid ${T.border}`,fontSize:10,color:T.textMid }}>
              {streaming?<span style={{ color:T.gold }}>● Running...</span>:<span style={{ color:T.green }}>● {TEAM.length} online</span>}
            </div>
          </div>
        </header>

        <main style={{ padding:26,flex:1 }}>
          {showMorningBriefing&&(
            <MorningBriefing
              outputs={outputs} alerts={alerts} taskStates={taskStates}
              streaming={streaming} onRunAll={runAll}
              onClose={()=>setShowMorningBriefing(false)}
            />
          )}
          {showSettings&&(
            <SettingsPanel onClose={()=>setShowSettings(false)}/>
          )}
          {showIntegrations&&(
            <IntegrationsPanel onClose={()=>setShowIntegrations(false)}/>
          )}
          {showNotifications&&(
            <NotificationCentre
              onClose={()=>setShowNotifications(false)}
              onAgentClick={(agentId)=>{ setActiveMember(TEAM.find(m=>m.id===agentId)); setShowNotifications(false); }}
            />
          )}
          {showAlerts&&(
            <AlertsPanel alerts={alerts} onClose={()=>setShowAlerts(false)} onAgentClick={(agentId)=>{ setActiveMember(TEAM.find(m=>m.id===agentId)); setShowAlerts(false); }}/>
          )}
          {showScheduler&&(
            <SchedulerPanel
              schedules={schedules}
              onUpdate={handleScheduleUpdate}
              onClose={()=>setShowScheduler(false)}
              onRunAll={()=>{ setShowScheduler(false); runAll(); }}
            />
          )}

          {activeMember&&<MemberDetail member={activeMember} taskStates={taskStates} output={outputs[activeMember.id]} streaming={streaming} alerts={alerts} onToggleTask={toggleTask} onRunBriefing={runBriefing} onBack={()=>setActiveMember(null)}/>}

          {!activeMember&&activeTab==="dashboard"&&activeView==="dashboard"&&(
            <div style={{ animation:"fadeUp 0.3s ease" }}>
              {/* Critical alert strip */}
              {criticalCount>0&&(
                <div onClick={()=>setShowAlerts(true)} style={{ background:"#f8717112",border:"1px solid #f8717133",borderRadius:10,padding:"12px 18px",display:"flex",alignItems:"center",gap:13,marginBottom:22,cursor:"pointer" }}>
                  <span style={{ fontSize:18,flexShrink:0 }}>🚨</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12,fontWeight:700,color:"#f87171",marginBottom:2 }}>{criticalCount} critical alert{criticalCount>1?"s":""} — FifteenConsult's new business pipeline needs attention</div>
                    <div style={{ fontSize:11,color:T.textMid }}>{alerts.filter(a=>a.level==="red").slice(0,2).map(a=>a.title).join(" · ")}</div>
                  </div>
                  <span style={{ fontSize:11,color:"#f87171",fontWeight:600,flexShrink:0 }}>View all →</span>
                </div>
              )}

              <div className="stat-grid" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28 }}>
                <StatCard label="Active Agents"  value={TEAM.length}                  sub="All online"                                        icon="🤖" accent={T.gold}/>
                <StatCard label="Tasks Complete" value={`${totalDone}/${totalTasks}`} sub={`${Math.round(totalDone/totalTasks*100)}% done`}    icon="✅" accent={T.green}/>
                <StatCard label="Briefings Run"  value={totalOutputs}                 sub={`${TEAM.length-totalOutputs} pending`}              icon="📄" accent={T.blue}/>
                <StatCard label="Alerts"         value={criticalCount>0?`${criticalCount} 🚨`:alerts.filter(a=>a.level==="amber").length>0?`${alerts.filter(a=>a.level==="amber").length} ⚠️`:"All clear ✓"} sub={criticalCount>0?"Action needed today":alerts.filter(a=>a.level==="amber").length>0?"Review this week":"On track"} icon="🔔" accent={criticalCount>0?T.red:alerts.filter(a=>a.level==="amber").length>0?T.amber:T.green}/>
              </div>

              <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:13 }}>Your Team · 7 Agents</div>
              <div className="agent-grid" style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:12 }}>
                {TEAM.map(m=>(
                  <MemberCard key={m.id} member={m} taskStates={taskStates} output={outputs[m.id]} streaming={streaming} historyCount={(histories[m.id]||[]).length} alerts={alerts} schedule={schedules[m.id]} onOpen={()=>setActiveMember(m)} onRun={()=>runBriefing(m,"")}/>
                ))}
              </div>
            </div>
          )}

          {!activeMember&&activeTab==="summary"&&<WeeklySummary outputs={outputs} streaming={streaming} onRunAll={runAll} histories={histories} alerts={alerts}/>}
          {!activeMember&&activeView==="warroom"&&(
            <WarRoom alerts={alerts} taskStates={taskStates} outputs={outputs}/>
          )}
          {!activeMember&&activeView==="framework"&&(
            <FifteenFramework/>
          )}
        </main>
      </div>
      {/* Mobile bottom nav */}
      <nav className="mobile-bottom-nav" style={{
        display:"none", position:"fixed", bottom:0, left:0, right:0,
        background:"var(--bg-sidebar)", borderTop:"1px solid var(--border)",
        padding:"8px 0 env(safe-area-inset-bottom)",
        zIndex:80, justifyContent:"space-around", alignItems:"center",
      }}>
        {[
          { id:"dashboard", icon:"⊞", label:"Home"     },
          { id:"summary",   icon:"📋", label:"Summary"  },
          { id:"warroom",   icon:"🎯", label:"War Room" },
          { id:"framework", icon:"⬡",  label:"15"       },
          { id:"alerts",    icon:"🔔", label:"Alerts"   },
        ].map(item => {
          const isActive =
            item.id==="alerts"    ? false :
            item.id==="warroom"   ? activeView==="warroom"   && !activeMember :
            item.id==="framework" ? activeView==="framework" && !activeMember :
            activeTab===item.id   && activeView==="dashboard" && !activeMember;
          const handleClick = () => {
            if(item.id==="alerts")    { setShowAlerts(true); return; }
            if(item.id==="warroom")   { setActiveView("warroom");   setActiveTab("dashboard"); setActiveMember(null); return; }
            if(item.id==="framework") { setActiveView("framework"); setActiveTab("dashboard"); setActiveMember(null); return; }
            setActiveTab(item.id); setActiveView("dashboard"); setActiveMember(null);
          };
          return (
            <button key={item.id} onClick={handleClick} style={{
              background:"none", border:"none", display:"flex", flexDirection:"column",
              alignItems:"center", gap:3, padding:"6px 12px", cursor:"pointer",
              color:isActive?"#C8A96E":"var(--text-dim)", transition:"color 0.15s",
            }}>
              <span style={{ fontSize:20 }}>{item.icon}</span>
              <span style={{ fontSize:9,letterSpacing:"0.06em",textTransform:"uppercase" }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile overlay menu */}
      {showMobileMenu&&(
        <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex" }}>
          <div style={{ flex:1,background:"rgba(0,0,0,0.6)" }} onClick={()=>setShowMobileMenu(false)}/>
          <div style={{ width:260,background:"var(--bg-sidebar)",borderLeft:"1px solid var(--border)",overflowY:"auto",animation:"slideIn 0.25s ease" }}>
            <div style={{ padding:"20px 18px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid var(--border)" }}>
              <div style={{ fontFamily:"var(--font-display)",fontSize:17,fontWeight:700,color:"#C8A96E" }}>FifteenConsult</div>
              <button onClick={()=>setShowMobileMenu(false)} style={{ background:"none",border:"none",color:"var(--text-mid)",fontSize:20,cursor:"pointer" }}>×</button>
            </div>
            <div style={{ padding:"12px 10px" }}>
              {TEAM.map(m=>(
                <button key={m.id} onClick={()=>{ setActiveMember(m); setShowMobileMenu(false); }} style={{ width:"100%",background:"none",border:"none",borderRadius:8,padding:"10px 12px",fontSize:13,color:"var(--text-mid)",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left",fontFamily:"var(--font-mono)" }}>
                  <span style={{ fontSize:16 }}>{m.emoji}</span><span>{m.name}</span>
                </button>
              ))}
              <div style={{ borderTop:"1px solid var(--border)",marginTop:8,paddingTop:8 }}>
                <button onClick={()=>{ toggleTheme(); setShowMobileMenu(false); }} style={{ width:"100%",background:"none",border:"none",borderRadius:8,padding:"10px 12px",fontSize:13,color:"var(--text-mid)",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left",fontFamily:"var(--font-mono)" }}>
                  <span style={{ fontSize:16 }}>{theme==="dark"?"☀️":"🌙"}</span>
                  <span>{theme==="dark"?"Light mode":"Dark mode"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
