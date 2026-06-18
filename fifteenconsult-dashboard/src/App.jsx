import { useState, useEffect, useCallback, useMemo } from "react";
import { TEAM, TEAM_ROSTER, OUTPUT_STYLE_RULES } from "./data/team.js";
import { callClaudeAPI } from "./lib/api.js";
import { isFirebaseEnabled, saveRunHistory, saveKPIs, saveSettings, checkFirebaseStatus } from "./lib/firebase.js";
import { getAgentDocuments } from "./components/DocumentLibrary.jsx";
import { getCompetitorContext } from "./components/CompetitorIntel.jsx";
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
import OrbitalCommandCenter from "./components/OrbitalCommandCenter.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import DocumentLibrary from "./components/DocumentLibrary.jsx";
import CompetitorIntel from "./components/CompetitorIntel.jsx";
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
  // Sync to Firebase in background
  if (isFirebaseEnabled()) saveRunHistory(agentId, s.history[agentId]).catch(()=>{});
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
function OutputLog({ agentId, output, color, isStreaming, onHistory, onExpand }) {
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
          {output?.text&&<button onClick={()=>onExpand&&onExpand(output.text, output.timestamp, agentId)} style={{ background:"transparent",border:`1px solid ${T.border}`,color:T.textMid,fontSize:11,padding:"3px 8px",borderRadius:6,cursor:"pointer" }} title="Expand output">⛶</button>}
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
function MemberDetail({ member, taskStates, output, streaming, alerts, onToggleTask, onRunBriefing, onBack , onExpand }) {
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

      <OutputLog agentId={member.id} output={displayOutput} color={member.color} isStreaming={isStreaming} onHistory={()=>setShowHistory(true)} onExpand={(text,ts,id)=>onExpand&&onExpand(text,ts,id)}/>

      <AgentChat key={member.id} member={member} lastOutput={displayOutput}/>
      {member.id==="david"&&(
        <>
          <CompetitorIntel color={member.color}/>
          <DocumentLibrary agentId={member.id} agentColor={member.color} agentName={member.name}/>
        </>
      )}

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
  // Init Firebase on mount + load cloud data
  useEffect(()=>{
    if(!isFirebaseEnabled()) return;
    checkFirebaseStatus().then(async s=>{
      if(!s.connected) return;
      console.log("✅ Firebase connected:", s.projectId);

      // Load KPIs from Firestore
      const { loadKPIs, loadRunHistory } = await import("./lib/firebase.js");

      // Sync KPIs
      const cloudKPIs = await loadKPIs().catch(()=>null);
      if(cloudKPIs && Object.keys(cloudKPIs).length > 0){
        localStorage.setItem("fc_live_kpis_v1", JSON.stringify(cloudKPIs));
        console.log("☁️ KPIs loaded from Firestore");
      }

      // Sync chats from Firestore
      const { cloudLoad } = await import("./lib/firebase.js");
      const cloudChats = await cloudLoad("chats", "all_chats", null).catch(()=>null);
      if(cloudChats && Object.keys(cloudChats).length > 0){
        localStorage.setItem("fc_chats_v1", JSON.stringify(cloudChats));
        console.log("☁️ Chats loaded from Firestore");
      }

      // Sync competitors
      const cloudComps = await cloudLoad("dashboard", "competitors", null).catch(()=>null);
      if(cloudComps){
        localStorage.setItem("fc_competitors_v1", JSON.stringify(cloudComps));
        console.log("☁️ Competitors loaded from Firestore");
      }

      // Sync framework
      const cloudFramework = await cloudLoad("dashboard", "framework", null).catch(()=>null);
      if(cloudFramework){
        localStorage.setItem("fc_framework_v1", JSON.stringify(cloudFramework));
        console.log("☁️ Framework loaded from Firestore");
      }

      // Sync notifications
      const cloudNotifs = await cloudLoad("dashboard", "notifications", null).catch(()=>null);
      if(cloudNotifs && cloudNotifs.length > 0){
        localStorage.setItem("fc_notifications_v1", JSON.stringify(cloudNotifs));
        console.log("☁️ Notifications loaded from Firestore");
      }

      // Sync documents
      const cloudDocs = await cloudLoad("documents", "all_docs", null).catch(()=>null);
      if(cloudDocs && Object.keys(cloudDocs).length > 0){
        localStorage.setItem("fc_documents_v1", JSON.stringify(cloudDocs));
        console.log("☁️ Documents loaded from Firestore");
      }

      // Sync run history for all agents
      const { TEAM } = await import("./data/team.js");
      const store = initStorage();
      if(!store.history) store.history = {};
      let historyUpdated = false;
      for(const agent of TEAM){
        const cloudHistory = await loadRunHistory(agent.id).catch(()=>null);
        if(cloudHistory && cloudHistory.length > 0){
          store.history[agent.id] = cloudHistory;
          historyUpdated = true;
        }
      }
      if(historyUpdated){
        writeStorage(store);
        console.log("☁️ Run history loaded from Firestore");
        // Reload outputs from history
        const latestOutputs = {};
        TEAM.forEach(a=>{
          const h = store.history?.[a.id];
          if(h && h.length > 0) latestOutputs[a.id] = { text: h[0].text, timestamp: h[0].timestamp };
        });
        setOutputs(prev=>({ ...latestOutputs, ...prev }));
      }
    }).catch(()=>{});
  },[]);
  const [activeTab,setActiveTab]       = useState("dashboard");
  const [activeMember,setActiveMember] = useState(null);
  const [streaming,setStreaming]       = useState(null);
  const [showAlerts,setShowAlerts]     = useState(false);
  const [showScheduler,setShowScheduler]   = useState(false);
  const [theme,setTheme]                   = useState(()=>{ const t=loadTheme(); applyTheme(t); return t; });
  const [showIntegrations,setShowIntegrations] = useState(false);
  const [showSettings,setShowSettings]         = useState(false);
  const [expandedOutput,setExpandedOutput]     = useState(null);
  const [showMobileMenu,setShowMobileMenu] = useState(false);
  const [homeLayout,setHomeLayout] = useState(()=>{ try { return localStorage.getItem("fc_home_layout")||"orbit"; } catch { return "orbit"; } });

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

  // Map live team + alerts into the orbital command center's agent shape
  const ORBIT_RING = { amani:0,david:0,malik:0, kwame:1,hassan:1,sara:1,nadia:1, tariq:2,zara:2,amara:2,sofia:2 };
  const orbitAgents = useMemo(()=>TEAM.map(m=>{
    const aa = alerts.filter(a=>a.agent===m.id);
    const red = aa.find(a=>a.level==="red");
    const amber = aa.find(a=>a.level==="amber");
    const states = taskStates[m.id]||[];
    const open = states.filter(x=>!x).length;
    let task;
    if (red) task = red.title;
    else if (amber) task = amber.title;
    else if (outputs[m.id]?.text) task = `Last briefing ready · ${open} task${open===1?"":"s"} open`;
    else task = open>0 ? `${open} task${open===1?"":"s"} open · tap to brief` : "Ready · tap to brief";
    return { id:m.id, name:m.name, role:m.role, ring:ORBIT_RING[m.id]??2, task, alert:!!(red||amber), level: red?"red":amber?"amber":null };
  }),[alerts,taskStates,outputs]);

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

    // Build enriched system prompt with live context
    let enrichedSystemPrompt = member.systemPrompt;

    // Shared team awareness + clean-output rules (every agent, every briefing)
    enrichedSystemPrompt += `\n\n---\n${TEAM_ROSTER}\n---\n${OUTPUT_STYLE_RULES}`;

    // Inject competitor intelligence for David and Sofia
    if (member.id === "david" || member.id === "sofia" || member.id === "amani") {
      const competitorCtx = getCompetitorContext();
      enrichedSystemPrompt += `

---
CURRENT COMPETITOR INTELLIGENCE (updated by Sadick):
${competitorCtx}
---`;
    }

    // ── TARIQ: Auto-inject live SEO data ─────────────────────────────────────────
    if (member.id === "tariq") {
      try {
        // Fetch all SEO data in parallel
        const [psRes, gscRes, schemaRes] = await Promise.allSettled([
          fetch("/api/seo?tool=pagespeed&url=https://fifteenconsult.com&strategy=mobile"),
          fetch("/api/seo?tool=gsc&action=keywords"),
          fetch("/api/seo?tool=schema&url=https://fifteenconsult.com"),
        ]);

        let seoContext = "\n\n===\nLIVE SEO DATA (fetched right now — use these exact numbers):\n";

        // PageSpeed
        if (psRes.status === "fulfilled" && psRes.value.ok) {
          const ps = await psRes.value.json();
          if (!ps.error) {
            seoContext += `\nPAGESPEED INSIGHTS (fifteenconsult.com — Mobile):
Performance Score: ${ps.scores?.performance}/100
SEO Score: ${ps.scores?.seo}/100
Accessibility: ${ps.scores?.accessibility}/100
Best Practices: ${ps.scores?.bestPractices}/100
LCP: ${ps.coreWebVitals?.lcp}
CLS: ${ps.coreWebVitals?.cls}
FCP: ${ps.coreWebVitals?.fcp}
TTFB: ${ps.coreWebVitals?.ttfb}
Top Opportunities: ${(ps.opportunities||[]).map(o => `${o.title} (${o.impact} impact)`).join(", ") || "None detected"}`;
          }
        } else {
          seoContext += "\nPAGESPEED: Could not fetch — report as data unavailable, do not guess.";
        }

        // GSC Keywords
        if (gscRes.status === "fulfilled" && gscRes.value.ok) {
          const gsc = await gscRes.value.json();
          if (!gsc.error && gsc.keywords) {
            seoContext += `\n\nGOOGLE SEARCH CONSOLE — Target Keyword Rankings (Last 28 days):`;
            gsc.keywords.forEach(k => {
              seoContext += `\n- "${k.keyword}": Position ${k.position}, ${k.clicks} clicks, ${k.impressions} impressions, CTR ${k.ctr}`;
            });
          }
        } else {
          seoContext += "\n\nGSC KEYWORDS: Not yet configured — remind Sadick to add GSC OAuth credentials to Vercel.";
        }

        // Schema/Structured Data
        if (schemaRes.status === "fulfilled" && schemaRes.value.ok) {
          const schema = await schemaRes.value.json();
          if (!schema.error) {
            seoContext += `\n\nSTRUCTURED DATA & META TAGS (fifteenconsult.com homepage):
Schema Score: ${schema.score}/100
Schema Types Found: ${schema.schemas?.types?.join(", ") || "None"}
Missing Schema: ${schema.schemas?.missing?.join(", ") || "None — good!"}
Meta Title: "${schema.meta?.title}" (${schema.meta?.titleLength} chars)
Meta Description: ${schema.meta?.hasMetaDesc ? `"${schema.meta?.description?.slice(0,80)}..."` : "MISSING"}
Has Canonical: ${schema.meta?.hasCanonical ? "Yes" : "No — missing"}
Has Open Graph: ${schema.meta?.hasOG ? "Yes" : "No — missing"}
Top Recommendations: ${(schema.recommendations||[]).join(" | ") || "None"}`;
          }
        }

        seoContext += "\n\nINSTRUCTION: Base ALL your recommendations on this real data. If a score is low, explain specifically why and what to fix in Webflow. If a keyword is not ranking, give specific on-page actions to target it.\n===";
        enrichedSystemPrompt += seoContext;
      } catch (err) {
        console.warn("Tariq data fetch failed:", err.message);
      }
    }

    // ── SARA: Auto-inject Instagram + News data ─────────────────────────────────────
    if (member.id === "sara") {
      try {
        const [instRes, newsRes] = await Promise.allSettled([
          fetch("/api/instagram"),
          fetch("/api/news"),
        ]);

        let saraContext = "\n\n===\nLIVE SOCIAL MEDIA DATA:\n";

        // Instagram
        if (instRes.status === "fulfilled" && instRes.value.ok) {
          const inst = await instRes.value.json();
          if (inst.configured && !inst.error) {
            saraContext += `\nINSTAGRAM (live):
Followers: ${inst.followersCount || 0}
Following: ${inst.followingCount || 0}
Posts: ${inst.mediaCount || 0}
Recent posts engagement: ${inst.recentEngagement || "Check Instagram Insights"}`;
          } else {
            saraContext += "\nINSTAGRAM: Tokens not configured — current follower count: ~120. Use screenshot upload for Instagram Insights data.";
          }
        }

        saraContext += "\nLINKEDIN: ~6 followers — API pending. Use screenshot upload for LinkedIn Analytics data.";
        saraContext += "\nTIKTOK: Tokens pending — use screenshot upload for TikTok analytics.";

        // News for content inspiration
        if (newsRes.status === "fulfilled" && newsRes.value.ok) {
          const news = await newsRes.value.json();
          if (news.articles?.length > 0) {
            saraContext += "\n\nTRENDING CONTENT OPPORTUNITIES (from news feed):";
            news.articles.slice(0, 6).forEach(a => {
              saraContext += `\n- [${a.source}] ${a.title}`;
            });
            saraContext += "\n\nUse these headlines to create timely, relevant social content. Connect each to GCC or West Africa marketing context.";
          }
        }

        saraContext += "\n\nINSTRUCTION: Base social media strategy on real follower counts above. Use news headlines for content inspiration. Flag any data that needs verification.\n===";
        enrichedSystemPrompt += saraContext;
      } catch (err) { console.warn("Sara data fetch failed:", err.message); }
    }

    // ── AMANI: Auto-inject ALL live data ──────────────────────────────────────────
    if (member.id === "amani") {
      try {
        const [hsRes, mlRes, psRes, newsRes] = await Promise.allSettled([
          fetch("/api/hubspot?action=pipeline"),
          fetch("/api/mailerlite"),
          fetch("/api/seo?tool=pagespeed&url=https://fifteenconsult.com&strategy=mobile"),
          fetch("/api/news"),
        ]);

        let amaniContext = "\n\n===\nCMO EXECUTIVE INTELLIGENCE BRIEF (all live data):\n";

        // HubSpot
        if (hsRes.status === "fulfilled" && hsRes.value.ok) {
          const hs = await hsRes.value.json();
          if (!hs.error) {
            amaniContext += `\nPIPELINE (HubSpot live):
Total Contacts: ${hs.totalContacts || 0}
Open Deals: ${hs.openDeals || 0}
Won Deals: ${hs.wonDeals || 0}
Pipeline Health: ${hs.openDeals > 3 ? "✅ Healthy" : hs.openDeals > 0 ? "🟡 Needs attention" : "🔴 Critical — no open deals"}`;
          }
        }

        // MailerLite
        if (mlRes.status === "fulfilled" && mlRes.value.ok) {
          const ml = await mlRes.value.json();
          if (!ml.error) {
            amaniContext += `\n\nEMAIL MARKETING (MailerLite live):
Subscribers: ${ml.subscriberCount || ml.total || 0}
Open Rate: ${ml.openRate || "No recent campaigns"}
Click Rate: ${ml.clickRate || "No recent campaigns"}`;
          }
        }

        // PageSpeed
        if (psRes.status === "fulfilled" && psRes.value.ok) {
          const ps = await psRes.value.json();
          if (!ps.error) {
            amaniContext += `\n\nWEBSITE (PageSpeed live):
Mobile Performance: ${ps.scores?.performance}/100 ${ps.scores?.performance < 70 ? "🔴 Below paid ads threshold" : "✅"}
SEO Score: ${ps.scores?.seo}/100`;
          }
        }

        // Social (manual data)
        amaniContext += `\n\nSOCIAL MEDIA (current baseline):
LinkedIn: ~6 followers (early stage)
Instagram: ~120 followers (early stage)
TikTok: Starting
Status: All channels in growth phase — consistency is the priority`;

        // News top items
        if (newsRes.status === "fulfilled" && newsRes.value.ok) {
          const news = await newsRes.value.json();
          if (news.articles?.length > 0) {
            amaniContext += "\n\nMARKET INTELLIGENCE (top headlines):";
            news.articles.slice(0, 4).forEach(a => {
              amaniContext += `\n- [${a.source}] ${a.title}`;
            });
          }
        }

        amaniContext += `\n\nDEPARTMENT STATUS:
- Tariq (SEO): PageSpeed + Schema + Semrush connected. GSC pending OAuth fix.
- Zara (Analytics): HubSpot + MailerLite + Clarity + UTM connected. GA4 OAuth parked.
- Nadia (Content): MailerLite + News feeds connected. Publishing framework set.
- Kwame (Lead Gen): HubSpot + News + Apollo + Crunchbase connected.
- Amara (Brand): Canva MCP + Figma MCP connected.
- Hassan (Paid Ads): Meta Ads MCP connected, pending account activation.
- Malik (Advertising): Meta Ads MCP + Ad Library connected.
- David (BD): HubSpot + News + Gmail + Calendar connected.
- Sofia (PA): Gmail + Calendar + News connected.
- Sara (Social): News connected. Instagram/TikTok tokens pending.

\nINSTRUCTION: Use all injected data to produce a genuine CMO executive briefing. Be honest about what data is real vs pending. Identify the single most important strategic priority based on the live pipeline data.\n===`;
        enrichedSystemPrompt += amaniContext;
      } catch (err) { console.warn("Amani data fetch failed:", err.message); }
    }

    // ── HASSAN + MALIK: Auto-inject Meta Ads + News + PageSpeed ────────────────────
    if (member.id === "hassan" || member.id === "malik") {
      try {
        const [psRes, newsRes] = await Promise.allSettled([
          fetch("/api/seo?tool=pagespeed&url=https://fifteenconsult.com&strategy=mobile"),
          fetch("/api/news"),
        ]);

        const role = member.id === "hassan" ? "PAID ADS" : "ADVERTISING STRATEGY";
        let adsContext = `\n\n===\nLIVE ${role} INTELLIGENCE:\n`;

        // PageSpeed — landing page health
        if (psRes.status === "fulfilled" && psRes.value.ok) {
          const ps = await psRes.value.json();
          if (!ps.error) {
            const perfScore = ps.scores?.performance || 0;
            const alert = perfScore < 70 ? "🔴 CRITICAL — Fix before running ads" : perfScore < 85 ? "🟡 Needs improvement" : "✅ Good";
            adsContext += `\nLANDING PAGE PERFORMANCE (fifteenconsult.com):
Mobile Performance Score: ${perfScore}/100 ${alert}
SEO Score: ${ps.scores?.seo}/100
LCP: ${ps.coreWebVitals?.lcp}
${perfScore < 70 ? "WARNING: Do not run paid campaigns until mobile score is above 70. Poor landing page will waste ad budget." : "Landing page is ready for paid traffic."}`;
          }
        }

        // News for advertising intelligence
        if (newsRes.status === "fulfilled" && newsRes.value.ok) {
          const news = await newsRes.value.json();
          if (news.articles?.length > 0) {
            adsContext += "\n\nADVERTISING INTELLIGENCE — Latest News:";
            news.articles.slice(0, 5).forEach(a => {
              adsContext += `\n- [${a.source}] ${a.title}`;
            });
          }
        }

        // Meta Ads status
        adsContext += `\n\nMETA ADS STATUS:
Account ID: 932655362719996
MCP Status: Connected — use Meta Ads MCP tools directly in this chat for live campaign data
Note: If MCP returns no data, account may still be pending activation`;

        adsContext += "\n\nINSTRUCTION: Use Meta Ads MCP to pull live campaign performance. Check landing page score — flag if below 70. Monitor competitor ads via Meta Ad Library (facebook.com/ads/library).\n===";
        enrichedSystemPrompt += adsContext;

      } catch (err) { console.warn("Hassan/Malik data fetch failed:", err.message); }
    }

    // ── DAVID: Auto-inject HubSpot + News data ──────────────────────────────────────
    if (member.id === "david") {
      try {
        const [hsRes, newsRes] = await Promise.allSettled([
          fetch("/api/hubspot?action=pipeline"),
          fetch("/api/news"),
        ]);

        let davidContext = "\n\n===\nLIVE BD INTELLIGENCE:\n";

        if (hsRes.status === "fulfilled" && hsRes.value.ok) {
          const hs = await hsRes.value.json();
          if (!hs.error) {
            davidContext += `\nHUBSPOT PIPELINE (live):
Total Contacts: ${hs.totalContacts || 0}
Open Deals: ${hs.openDeals || 0}
Won Deals: ${hs.wonDeals || 0}
Pipeline Health: ${hs.openDeals > 0 ? "Active deals in progress" : "No open deals — critical gap"}`;
          }
        }

        if (newsRes.status === "fulfilled" && newsRes.value.ok) {
          const news = await newsRes.value.json();
          if (news.articles?.length > 0) {
            davidContext += "\n\nMARKET INTELLIGENCE (scan for BD opportunities):";
            news.articles.slice(0, 6).forEach(a => {
              davidContext += `\n- [${a.source}] ${a.title}`;
            });
          }
        }

        davidContext += "\n\nINSTRUCTION: Use Gmail MCP to check for prospect replies. Use Google Calendar MCP to identify available call slots. Use HubSpot MCP to update pipeline. Always verify news items before referencing in outreach.\n===";
        enrichedSystemPrompt += davidContext;
      } catch (err) { console.warn("David data fetch failed:", err.message); }
    }

    // ── SOFIA: Auto-inject News data ──────────────────────────────────────────────
    if (member.id === "sofia") {
      try {
        const newsRes = await fetch("/api/news");
        if (newsRes.ok) {
          const news = await newsRes.json();
          if (news.articles?.length > 0) {
            let sofiaContext = "\n\n===\nLIVE NEWS FOR TODAY'S BRIEFING:\n";
            news.articles.slice(0, 10).forEach(a => {
              sofiaContext += `\n- [${a.source} · ${a.category}] ${a.title}`;
            });
            sofiaContext += "\n\nINSTRUCTION: Use Google Calendar MCP for today's schedule. Use Gmail MCP to check priority emails. Select the 3 most relevant news items for Sadick's morning briefing based on GCC business, West Africa tech, and marketing industry relevance.\n===";
            enrichedSystemPrompt += sofiaContext;
          }
        }
      } catch (err) { console.warn("Sofia data fetch failed:", err.message); }
    }

    // ── KWAME: Auto-inject HubSpot + News data ──────────────────────────────────────
    if (member.id === "kwame") {
      try {
        const [hsRes, newsRes] = await Promise.allSettled([
          fetch("/api/hubspot?action=pipeline"),
          fetch("/api/news"),
        ]);

        let kwameContext = "\n\n===\nLIVE PIPELINE & INTELLIGENCE DATA:\n";

        // HubSpot pipeline
        if (hsRes.status === "fulfilled" && hsRes.value.ok) {
          const hs = await hsRes.value.json();
          if (!hs.error) {
            kwameContext += `\nHUBSPOT PIPELINE (live):
Total Contacts: ${hs.totalContacts || 0}
Open Deals: ${hs.openDeals || 0}
Won Deals: ${hs.wonDeals || 0}
Total Deals: ${hs.totalDeals || 0}

PIPELINE HEALTH: ${hs.totalContacts > 0 ? "Active" : "Pipeline is empty — focus on prospecting today"}
PRIORITY: ${hs.openDeals > 0 ? `${hs.openDeals} deals need attention` : "No open deals — need to book discovery calls"}`;
          }
        } else {
          kwameContext += "\nHUBSPOT: Connection error — check HubSpot integration";
        }

        // News for market intelligence
        if (newsRes.status === "fulfilled" && newsRes.value.ok) {
          const news = await newsRes.value.json();
          if (news.articles?.length > 0) {
            kwameContext += "\n\nMARKET INTELLIGENCE — Latest News (scan for prospect triggers):";
            news.articles.slice(0, 6).forEach(a => {
              kwameContext += `\n- [${a.source}] ${a.title}`;
            });
            kwameContext += "\n\nScan these headlines for: funding announcements, new market entries, leadership changes, expansion plans — these are your outreach triggers.";
          }
        }

        kwameContext += `\n\nINSTRUCTION: 
1. Use the HubSpot data to report real pipeline status — never invent numbers
2. Use news headlines to identify genuine trigger events for outreach
3. When drafting outreach, always verify the trigger event is real before referencing it
4. Flag any intelligence that needs verification with [VERIFY BEFORE USE]\n===`;
        enrichedSystemPrompt += kwameContext;

      } catch (err) {
        console.warn("Kwame data fetch failed:", err.message);
      }
    }

    // ── NADIA: Auto-inject MailerLite + News data ───────────────────────────────────
    if (member.id === "nadia") {
      try {
        const [mlRes, newsRes] = await Promise.allSettled([
          fetch("/api/mailerlite"),
          fetch("/api/news"),
        ]);

        let nadiaContext = "\n\n===\nLIVE CONTENT INTELLIGENCE (use to inform today's content):\n";

        // MailerLite performance
        if (mlRes.status === "fulfilled" && mlRes.value.ok) {
          const ml = await mlRes.value.json();
          if (!ml.error) {
            nadiaContext += `\nEMAIL PERFORMANCE (MailerLite):
Subscribers: ${ml.subscriberCount || ml.total || 0}
Last Campaign Open Rate: ${ml.openRate || "No recent campaigns"}
Click Rate: ${ml.clickRate || "No recent campaigns"}
Best Performing Topic: ${ml.bestCampaign || "Check MailerLite dashboard"}`;
          }
        }

        // News feeds
        if (newsRes.status === "fulfilled" && newsRes.value.ok) {
          const news = await newsRes.value.json();
          if (news.articles?.length > 0) {
            nadiaContext += "\n\nLATEST NEWS HEADLINES (use for topical content ideas):";
            news.articles.slice(0, 8).forEach(a => {
              nadiaContext += `\n- [${a.source}] ${a.title}`;
            });
            nadiaContext += "\n\nUse 1-2 of these headlines as content inspiration for today's posts. Make the connection to FifteenConsult's expertise.";
          }
        }

        nadiaContext += "\n\nINSTRUCTION: Reference the email performance data when creating newsletter content. Use news headlines to create timely, relevant posts. Always connect news to GCC/West Africa marketing context.\n===";
        enrichedSystemPrompt += nadiaContext;

      } catch (err) {
        console.warn("Nadia data fetch failed:", err.message);
      }
    }

    // ── ZARA: Auto-inject live analytics data ────────────────────────────────────
    if (member.id === "zara") {
      try {
        const [hsRes, mlRes, psRes, clarityRes] = await Promise.allSettled([
          fetch("/api/hubspot?action=pipeline"),
          fetch(`/api/mailerlite`),
          fetch("/api/seo?tool=pagespeed&url=https://fifteenconsult.com&strategy=mobile"),
          fetch("/api/analytics?tool=clarity"),
        ]);

        let zaraContext = "\n\n===\nLIVE ANALYTICS DATA (use these exact numbers — do not invent any metrics):\n";

        // HubSpot
        if (hsRes.status === "fulfilled" && hsRes.value.ok) {
          const hs = await hsRes.value.json();
          if (!hs.error) {
            zaraContext += `\nHUBSPOT CRM (live):
Total Contacts: ${hs.totalContacts || 0}
Total Deals: ${hs.totalDeals || 0}
Open Deals: ${hs.openDeals || 0}
Won Deals: ${hs.wonDeals || 0}`;
          }
        } else {
          zaraContext += "\nHUBSPOT: Connection error — flag as data unavailable";
        }

        // MailerLite
        if (mlRes.status === "fulfilled" && mlRes.value.ok) {
          const ml = await mlRes.value.json();
          if (!ml.error) {
            zaraContext += `\n\nMAILERLITE EMAIL (live):
Total Subscribers: ${ml.subscriberCount || ml.total || 0}
Active Subscribers: ${ml.activeCount || 0}
Recent Campaign Open Rate: ${ml.openRate || "No campaigns yet"}
Click Rate: ${ml.clickRate || "No campaigns yet"}`;
          }
        } else {
          zaraContext += "\n\nMAILERLITE: Connection error — flag as data unavailable";
        }

        // PageSpeed
        if (psRes.status === "fulfilled" && psRes.value.ok) {
          const ps = await psRes.value.json();
          if (!ps.error) {
            zaraContext += `\n\nWEBSITE PERFORMANCE (PageSpeed — live):
Mobile Performance: ${ps.scores?.performance}/100
Mobile SEO Score: ${ps.scores?.seo}/100
LCP: ${ps.coreWebVitals?.lcp}
CLS: ${ps.coreWebVitals?.cls}
FCP: ${ps.coreWebVitals?.fcp}`;
          }
        }

        // Microsoft Clarity
        if (clarityRes.status === "fulfilled" && clarityRes.value.ok) {
          const clarity = await clarityRes.value.json();
          if (clarity.configured && !clarity.error) {
            zaraContext += `\n\nMICROSOFT CLARITY BEHAVIOUR (live):
Sessions (30 days): ${clarity.sessions || 0}
Pages Per Session: ${clarity.pagesPerSession || "—"}
Avg Scroll Depth: ${clarity.avgScrollDepth || "—"}
Rage Clicks: ${clarity.rageClicks || 0}
Dead Clicks: ${clarity.deadClicks || 0}
Quick Backs: ${clarity.quickBacks || 0}`;
          } else if (!clarity.configured) {
            zaraContext += "\n\nMICROSOFT CLARITY: Not yet configured — add CLARITY_API_TOKEN and CLARITY_PROJECT_ID to Vercel";
          }
        }

        // GA4 status
        zaraContext += "\n\nGA4 WEBSITE TRAFFIC: OAuth pending — use screenshot upload for GA4 data";
        zaraContext += "\n\nSOCIAL MEDIA: Instagram/TikTok/LinkedIn integrations pending — flag as data unavailable";
        zaraContext += "\n\nPAID ADS: Meta Ads MCP connected but pending account activation";

        zaraContext += "\n\nINSTRUCTION: Build your report using ONLY the live data above. Clearly flag every missing data source as 'Data pending — [source]'. Never estimate or invent numbers.\n===";
        enrichedSystemPrompt += zaraContext;

      } catch (err) {
        console.warn("Zara data fetch failed:", err.message);
      }
    }

    // Inject uploaded documents for David
    if (member.id === "david") {
      const docs = getAgentDocuments("david");
      if (docs.length > 0) {
        const docContext = docs.map((d, i) =>
          `DOCUMENT ${i+1}: ${d.name}${d.note ? ` (Note: ${d.note})` : ""}\nUploaded: ${d.uploadedAt}\n---\n${d.content}\n---`
        ).join("\n\n");
        enrichedSystemPrompt += `\n\n===\nUPLOADED DOCUMENTS FOR ANALYSIS (${docs.length} document${docs.length>1?"s":""}):\n${docContext}\n===\nWhen running your briefing, acknowledge these documents and reference them in your analysis and recommendations.`;
      }
    }

    try {
      finalText=await callClaudeAPI(enrichedSystemPrompt,trigger,(partial)=>{
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
          {/* Expanded output modal */}
      {expandedOutput&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:500,display:"flex",flexDirection:"column",padding:24 }}
          onClick={e=>{ if(e.target===e.currentTarget) setExpandedOutput(null); }}>
          <div style={{ background:"var(--bg-card)",borderRadius:12,border:"1px solid var(--border)",flex:1,display:"flex",flexDirection:"column",maxWidth:900,margin:"0 auto",width:"100%",overflow:"hidden" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",borderBottom:"1px solid var(--border)" }}>
              <div style={{ fontSize:13,fontWeight:600,color:"var(--text)" }}>
                {expandedOutput.agentName} — {expandedOutput.timestamp}
              </div>
              <button onClick={()=>setExpandedOutput(null)} style={{ background:"none",border:"1px solid var(--border)",color:"var(--text-mid)",fontSize:18,width:32,height:32,borderRadius:8,cursor:"pointer" }}>×</button>
            </div>
            <pre style={{ flex:1,overflowY:"auto",padding:"20px 24px",fontSize:13,color:"var(--text-mid)",lineHeight:2,whiteSpace:"pre-wrap",fontFamily:"var(--font-mono)",margin:0 }}>
              {expandedOutput.text}
            </pre>
          </div>
        </div>
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

          {activeMember&&<MemberDetail member={activeMember} taskStates={taskStates} output={outputs[activeMember.id]} streaming={streaming} alerts={alerts} onToggleTask={toggleTask} onRunBriefing={runBriefing} onBack={()=>setActiveMember(null)} onExpand={(text, timestamp, name) => setExpandedOutput({ text, timestamp, agentName: name })}/>}

          {!activeMember&&activeTab==="dashboard"&&activeView==="dashboard"&&(
            <div style={{ animation:"fadeUp 0.3s ease" }}>
              {/* Home layout toggle */}
              <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:14 }}>
                <div style={{ display:"inline-flex",background:T.card,border:`1px solid ${T.border}`,borderRadius:9,padding:3,gap:2 }}>
                  {[{id:"orbit",label:"◎ Orbit"},{id:"grid",label:"▦ Grid"}].map(o=>(
                    <button key={o.id} onClick={()=>{ setHomeLayout(o.id); try{localStorage.setItem("fc_home_layout",o.id);}catch{} }}
                      style={{ background:homeLayout===o.id?T.gold:"transparent",color:homeLayout===o.id?"#000":T.textMid,border:"none",borderRadius:7,padding:"6px 14px",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",fontFamily:"var(--font-mono)",transition:"all 0.18s" }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
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

              {homeLayout==="orbit" ? (
                <div style={{ height:"calc(100vh - 188px)",minHeight:520,margin:"2px -26px -26px" }}>
                  <OrbitalCommandCenter agents={orbitAgents} onOpenAgent={(a)=>setActiveMember(TEAM.find(m=>m.id===a.id))}/>
                </div>
              ) : (<>
              <div className="stat-grid" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28 }}>
                <StatCard label="Active Agents"  value={TEAM.length}                  sub="All online"                                        icon="🤖" accent={T.gold}/>
                <StatCard label="Tasks Complete" value={`${totalDone}/${totalTasks}`} sub={`${Math.round(totalDone/totalTasks*100)}% done`}    icon="✅" accent={T.green}/>
                <StatCard label="Briefings Run"  value={totalOutputs}                 sub={`${TEAM.length-totalOutputs} pending`}              icon="📄" accent={T.blue}/>
                <StatCard label="Alerts"         value={criticalCount>0?`${criticalCount} 🚨`:alerts.filter(a=>a.level==="amber").length>0?`${alerts.filter(a=>a.level==="amber").length} ⚠️`:"All clear ✓"} sub={criticalCount>0?"Action needed today":alerts.filter(a=>a.level==="amber").length>0?"Review this week":"On track"} icon="🔔" accent={criticalCount>0?T.red:alerts.filter(a=>a.level==="amber").length>0?T.amber:T.green}/>
              </div>

              <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:13 }}>Your Team · {TEAM.length} Agents</div>
              <div className="agent-grid" style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:12 }}>
                {TEAM.map(m=>(
                  <MemberCard key={m.id} member={m} taskStates={taskStates} output={outputs[m.id]} streaming={streaming} historyCount={(histories[m.id]||[]).length} alerts={alerts} schedule={schedules[m.id]} onOpen={()=>setActiveMember(m)} onRun={()=>runBriefing(m,"")}/>
                ))}
              </div>
              </>)}
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
