import { useState, useEffect, useCallback } from "react";
import { TEAM } from "./data/team.js";
import { callClaudeAPI } from "./lib/api.js";
import { loadStorage, saveStorage, addToHistory, getHistory } from "./lib/storage.js";
import { getDateContext, buildBriefingTrigger } from "./lib/dateContext.js";

// ── THEME ─────────────────────────────────────────────────────────────────────
const T = {
  base:      "#0d1117",
  sidebar:   "#0a0f1a",
  card:      "#131d2e",
  cardHover: "#172236",
  border:    "#1e2d45",
  borderL:   "#243448",
  gold:      "#C8A96E",
  text:      "#e8edf5",
  textMid:   "#7a90b0",
  textDim:   "#3d526b",
  green:     "#4ade80",
  red:       "#f87171",
  amber:     "#fbbf24",
  blue:      "#60a5fa",
};

function now_ts() {
  return new Date().toLocaleString("en-GB", {
    weekday:"short", day:"numeric", month:"short",
    year:"numeric", hour:"2-digit", minute:"2-digit"
  });
}
function pct(c,t){ return Math.min(100, Math.round((c/t)*100)); }

// ── STORAGE INIT ──────────────────────────────────────────────────────────────
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
function readHistory(agentId) {
  return initStorage().history?.[agentId] || [];
}

// ── DATE BADGE ────────────────────────────────────────────────────────────────
function DateBadge() {
  const d = getDateContext();
  return (
    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
      {[
        { label: d.dayOfWeek + ", " + d.dayOfMonth + " " + d.month + " " + d.year, color: T.gold },
        { label: "Week " + d.weekNum, color: T.textMid },
        { label: "Q" + d.currentQuarter + " · " + d.daysLeftInQuarter + "d left", color: T.blue },
        { label: d.daysLeftInMonth + "d left in month", color: d.daysLeftInMonth <= 7 ? T.amber : T.textMid },
        { label: d.isGCCWeekend ? "GCC Weekend" : "GCC Working Day", color: d.isGCCWeekend ? T.amber : T.green },
      ].map((b,i) => (
        <span key={i} style={{
          fontSize:10, color:b.color, background:b.color+"18",
          padding:"3px 10px", borderRadius:20, fontWeight:500,
          border:`1px solid ${b.color}30`,
        }}>{b.label}</span>
      ))}
    </div>
  );
}

// ── STAT CARD ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"20px 22px", display:"flex", alignItems:"center", gap:14 }}>
      <div style={{ width:42,height:42,borderRadius:10,background:(accent||T.gold)+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontSize:10,color:T.textMid,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3 }}>{label}</div>
        <div style={{ fontSize:24,fontWeight:700,color:accent||T.gold,lineHeight:1,fontFamily:"var(--font-display)" }}>{value}</div>
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
        <span style={{ color:ok?color:T.red,fontWeight:600 }}>
          {current}{unit} <span style={{ color:T.textDim,fontWeight:400 }}>/ {target}{unit}</span>
        </span>
      </div>
      <div style={{ background:T.border,borderRadius:4,height:4,overflow:"hidden" }}>
        <div style={{ width:`${p}%`,height:"100%",borderRadius:4,background:ok?color:T.red,transition:"width 1.2s ease" }}/>
      </div>
      <div style={{ fontSize:9,color:T.textDim,marginTop:3,textAlign:"right" }}>{p}% of target</div>
    </div>
  );
}

// ── MEMBER CARD ───────────────────────────────────────────────────────────────
function MemberCard({ member, taskStates, output, streaming, historyCount, onOpen, onRun }) {
  const states = taskStates[member.id]||[];
  const done = states.filter(Boolean).length;
  const progress = states.length ? pct(done,states.length) : 0;
  const isStreaming = streaming===member.id;
  const isBusy = !!streaming;
  const [hov,setHov]=useState(false);

  // KPI alert check
  const kpiAlert = member.kpis.some(k => pct(k.current,k.target) < 40);

  return (
    <div onClick={onOpen} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background:hov?T.cardHover:T.card,
      border:`1px solid ${kpiAlert?T.red+"66":hov?T.borderL:T.border}`,
      borderRadius:12,padding:20,cursor:"pointer",position:"relative",overflow:"hidden",
      transition:"all 0.2s ease",transform:hov?"translateY(-2px)":"none",
      boxShadow:hov?"0 8px 32px rgba(0,0,0,0.35)":"none",
    }}>
      <div style={{ position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${member.color},transparent)`,opacity:0.9 }}/>
      {isStreaming&&<div style={{ position:"absolute",top:12,right:12,width:8,height:8,borderRadius:"50%",background:member.color,animation:"pulse 1s ease infinite",boxShadow:`0 0 8px ${member.color}` }}/>}
      {kpiAlert&&!isStreaming&&<div style={{ position:"absolute",top:10,right:10,fontSize:12 }} title="KPI below target">⚠️</div>}

      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14 }}>
        <div>
          <div style={{ fontSize:14,fontWeight:600,color:T.text,marginBottom:2 }}>{member.name}</div>
          <div style={{ fontSize:9,color:member.color,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:500 }}>{member.role}</div>
        </div>
        <div style={{ width:36,height:36,borderRadius:9,background:member.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17 }}>{member.emoji}</div>
      </div>

      <div style={{ marginBottom:14 }}>
        <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,color:T.textMid,marginBottom:5 }}>
          <span>Tasks</span>
          <span style={{ color:member.color,fontWeight:600 }}>{done}/{states.length}</span>
        </div>
        <div style={{ background:T.border,borderRadius:4,height:3,overflow:"hidden" }}>
          <div style={{ width:`${progress}%`,height:"100%",background:`linear-gradient(90deg,${member.color},${member.color}99)`,borderRadius:4,transition:"width 1s ease" }}/>
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14 }}>
        {member.kpis.slice(0,2).map(k=>{
          const p=pct(k.current,k.target);
          return (
            <div key={k.label} style={{ background:T.base,borderRadius:8,padding:"9px 11px",border:`1px solid ${p<40?T.red+"44":T.border}` }}>
              <div style={{ fontSize:9,color:T.textDim,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3 }}>{k.label}</div>
              <div style={{ fontSize:17,fontWeight:700,color:p>=60?T.text:T.red,lineHeight:1 }}>{k.current}{k.unit||""}</div>
              <div style={{ fontSize:9,color:T.textDim,marginTop:2 }}>of {k.target}{k.unit||""}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div style={{ fontSize:9,color:output?member.color:T.textDim }}>
          {output?`✓ ${output.timestamp}`:`No briefing · ${member.cadence}`}
          {historyCount>0&&<span style={{ marginLeft:6,color:T.textDim }}>· {historyCount} saved</span>}
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
  const [selected, setSelected] = useState(history[0]||null);

  return (
    <div style={{
      position:"fixed",top:0,right:0,bottom:0,width:560,
      background:T.sidebar,borderLeft:`1px solid ${T.border}`,
      display:"flex",flexDirection:"column",zIndex:200,
      animation:"slideIn 0.25s ease",
    }}>
      <div style={{ padding:"20px 24px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <div style={{ fontSize:16,fontWeight:600,color:T.text }}>{agentName}</div>
          <div style={{ fontSize:10,color:color,letterSpacing:"0.12em",textTransform:"uppercase",marginTop:2 }}>Run History · {history.length} briefings</div>
        </div>
        <button onClick={onClose} style={{ background:"none",border:`1px solid ${T.border}`,color:T.textMid,fontSize:18,width:32,height:32,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
      </div>

      {history.length===0?(
        <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:T.textDim,fontSize:13 }}>
          No briefings run yet.
        </div>
      ):(
        <div style={{ display:"flex",flex:1,overflow:"hidden" }}>
          {/* List */}
          <div style={{ width:180,borderRight:`1px solid ${T.border}`,overflowY:"auto",flexShrink:0 }}>
            {history.map((h,i)=>(
              <div key={h.id} onClick={()=>setSelected(h)} style={{
                padding:"12px 16px",cursor:"pointer",borderBottom:`1px solid ${T.border}`,
                background:selected?.id===h.id?color+"18":"transparent",
                borderLeft:selected?.id===h.id?`3px solid ${color}`:"3px solid transparent",
                transition:"all 0.15s",
              }}>
                <div style={{ fontSize:10,fontWeight:600,color:selected?.id===h.id?color:T.textMid,marginBottom:3 }}>
                  {i===0?"Latest":"#"+(i+1)}
                </div>
                <div style={{ fontSize:9,color:T.textDim,lineHeight:1.4 }}>{h.timestamp}</div>
                {h.customPrompt&&<div style={{ fontSize:9,color:color,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>"{h.customPrompt}"</div>}
              </div>
            ))}
          </div>

          {/* Detail */}
          <div style={{ flex:1,overflow:"hidden",display:"flex",flexDirection:"column" }}>
            {selected&&(
              <>
                <div style={{ padding:"12px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div style={{ fontSize:11,color:T.textMid }}>{selected.timestamp}</div>
                  <button onClick={()=>onRestore(selected.text)} style={{
                    background:color+"22",border:`1px solid ${color}44`,color:color,
                    fontSize:9,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",
                    padding:"4px 12px",borderRadius:6,cursor:"pointer",fontFamily:"var(--font-mono)",
                  }}>Restore to view</button>
                </div>
                <div style={{ flex:1,overflowY:"auto",padding:16 }}>
                  <pre style={{ fontSize:11,color:T.textMid,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"var(--font-mono)",margin:0 }}>
                    {selected.text}
                  </pre>
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
function OutputLog({ output, color, isStreaming, onCopy, onHistory }) {
  const [copied,setCopied]=useState(false);
  if(!output&&!isStreaming) return null;

  const handleCopy=()=>{
    if(!output?.text) return;
    navigator.clipboard.writeText(output.text).then(()=>{
      setCopied(true);
      setTimeout(()=>setCopied(false),2000);
    });
    if(onCopy) onCopy();
  };

  return (
    <div style={{ background:T.base,border:`1px solid ${T.border}`,borderLeft:`3px solid ${color}`,borderRadius:10,padding:"18px 20px",marginTop:20 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase" }}>Agent Output</span>
          {isStreaming&&<span style={{ width:7,height:7,borderRadius:"50%",background:color,animation:"pulse 1s infinite",display:"inline-block" }}/>}
        </div>
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          {output&&<span style={{ fontSize:9,color:T.textDim }}>{output.timestamp}</span>}
          {output?.text&&(
            <button onClick={handleCopy} style={{ background:copied?color+"22":"transparent",border:`1px solid ${copied?color:T.border}`,color:copied?color:T.textMid,fontSize:9,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",padding:"3px 10px",borderRadius:6,cursor:"pointer",fontFamily:"var(--font-mono)",transition:"all 0.2s" }}>
              {copied?"✓ Copied":"Copy"}
            </button>
          )}
          {onHistory&&(
            <button onClick={onHistory} style={{ background:"transparent",border:`1px solid ${T.border}`,color:T.textMid,fontSize:9,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",padding:"3px 10px",borderRadius:6,cursor:"pointer",fontFamily:"var(--font-mono)" }}>
              History
            </button>
          )}
        </div>
      </div>
      <pre style={{ fontSize:12,color:T.textMid,lineHeight:1.9,whiteSpace:"pre-wrap",fontFamily:"var(--font-mono)",margin:0,maxHeight:420,overflowY:"auto" }}>
        {output?.text||(isStreaming?"Initialising agent...":"")}
        {isStreaming&&<span style={{ color,animation:"pulse 0.8s infinite" }}>▌</span>}
      </pre>
    </div>
  );
}

// ── CUSTOM PROMPT INPUT ───────────────────────────────────────────────────────
function CustomPromptInput({ value, onChange, color }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6 }}>
        Focus Directive (optional)
      </div>
      <input
        value={value}
        onChange={e=>onChange(e.target.value)}
        placeholder={`e.g. "Focus on Real Estate clients this week" or "Prioritise Coreo case study"`}
        style={{
          width:"100%",background:T.base,border:`1px solid ${T.border}`,
          borderRadius:8,padding:"10px 14px",fontSize:12,color:T.text,
          fontFamily:"var(--font-mono)",outline:"none",transition:"border 0.2s",
        }}
        onFocus={e=>e.target.style.borderColor=color}
        onBlur={e=>e.target.style.borderColor=T.border}
      />
      <div style={{ fontSize:9,color:T.textDim,marginTop:4 }}>
        This directive will be injected into the agent's briefing trigger for this run only.
      </div>
    </div>
  );
}

// ── MEMBER DETAIL ─────────────────────────────────────────────────────────────
function MemberDetail({ member, taskStates, output, streaming, onToggleTask, onRunBriefing, onBack }) {
  const states = taskStates[member.id]||member.tasks.map(t=>t.done);
  const done = states.filter(Boolean).length;
  const isStreaming = streaming===member.id;
  const isBusy = !!streaming;
  const [customPrompt,setCustomPrompt]=useState("");
  const [showHistory,setShowHistory]=useState(false);
  const [restoredText,setRestoredText]=useState(null);
  const dateCtx = getDateContext();

  const displayOutput = restoredText
    ? { text:restoredText, timestamp:"Restored from history" }
    : output;

  return (
    <div style={{ animation:"fadeUp 0.3s ease" }}>
      {showHistory&&(
        <HistoryPanel
          agentId={member.id} agentName={member.name} color={member.color}
          onClose={()=>setShowHistory(false)}
          onRestore={(text)=>{ setRestoredText(text); setShowHistory(false); }}
        />
      )}

      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
        <button onClick={onBack} style={{ background:"none",border:"none",color:T.textMid,fontSize:12,cursor:"pointer",fontFamily:"var(--font-mono)",display:"flex",alignItems:"center",gap:6,padding:0,transition:"color 0.2s" }}
          onMouseEnter={e=>e.currentTarget.style.color=T.text}
          onMouseLeave={e=>e.currentTarget.style.color=T.textMid}>
          ← Back to Dashboard
        </button>
        <button onClick={()=>setShowHistory(true)} style={{ background:T.card,border:`1px solid ${T.border}`,color:T.textMid,fontSize:10,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",padding:"6px 16px",borderRadius:8,cursor:"pointer",fontFamily:"var(--font-mono)" }}>
          📋 View History ({readHistory(member.id).length})
        </button>
      </div>

      {/* Header card */}
      <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"24px 28px",marginBottom:20,position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${member.color},transparent)` }}/>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16 }}>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ width:52,height:52,borderRadius:12,background:member.color+"20",fontSize:26,display:"flex",alignItems:"center",justifyContent:"center" }}>{member.emoji}</div>
            <div>
              <div style={{ fontFamily:"var(--font-display)",fontSize:28,fontWeight:700,color:T.text,lineHeight:1 }}>{member.name}</div>
              <div style={{ fontSize:10,color:member.color,letterSpacing:"0.15em",textTransform:"uppercase",marginTop:5 }}>{member.role} · {member.cadence} briefing</div>
              <div style={{ fontSize:10,color:T.textDim,marginTop:4 }}>
                {dateCtx.dayOfWeek}, {dateCtx.dayOfMonth} {dateCtx.month} {dateCtx.year} · Week {dateCtx.weekNum}
              </div>
            </div>
          </div>
          <button onClick={()=>onRunBriefing(member,customPrompt)} disabled={isBusy} style={{
            background:isStreaming||isBusy?"transparent":member.color,
            color:isStreaming||isBusy?member.color:"#000",
            border:`1px solid ${member.color}`,padding:"11px 24px",fontSize:11,fontWeight:700,
            letterSpacing:"0.14em",textTransform:"uppercase",cursor:isBusy?"not-allowed":"pointer",
            borderRadius:8,fontFamily:"var(--font-mono)",transition:"all 0.2s",
          }}>{isStreaming?"● Streaming...":`Run ${member.cadence==="weekly"?"Weekly":"Daily"} Briefing`}</button>
        </div>

        {/* Custom prompt */}
        <div style={{ marginTop:20,paddingTop:20,borderTop:`1px solid ${T.border}` }}>
          <CustomPromptInput value={customPrompt} onChange={setCustomPrompt} color={member.color}/>
        </div>
      </div>

      {/* Tasks + KPIs */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18 }}>
        <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:22 }}>
          <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:16 }}>
            Tasks · <span style={{ color:member.color }}>{done}/{member.tasks.length}</span>
          </div>
          {member.tasks.map((t,i)=>{
            const d=states[i]??t.done;
            return (
              <div key={i} onClick={()=>onToggleTask(member.id,i)} style={{ display:"flex",alignItems:"flex-start",gap:11,padding:"8px 6px",cursor:"pointer",borderRadius:7,marginBottom:1,transition:"background 0.15s" }}
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
        <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:22 }}>
          <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:16 }}>KPI Tracker</div>
          {member.kpis.map(k=><KpiRow key={k.label} {...k} color={member.color}/>)}
        </div>
      </div>

      <OutputLog
        output={displayOutput} color={member.color} isStreaming={isStreaming}
        onHistory={()=>setShowHistory(true)}
      />

      {/* System prompt */}
      <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:22,marginTop:18 }}>
        <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:12 }}>System Prompt</div>
        <pre style={{ fontSize:10,color:T.textDim,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"var(--font-mono)",maxHeight:180,overflowY:"auto",background:T.base,padding:14,borderRadius:8 }}>{member.systemPrompt}</pre>
      </div>
    </div>
  );
}

// ── WEEKLY SUMMARY ────────────────────────────────────────────────────────────
function WeeklySummary({ outputs, streaming, onRunAll, histories }) {
  const hasOutputs = Object.keys(outputs).length>0;
  const isBusy=!!streaming;
  const dateCtx=getDateContext();

  return (
    <div style={{ animation:"fadeUp 0.3s ease" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28 }}>
        <div>
          <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:6 }}>Department Command</div>
          <div style={{ fontFamily:"var(--font-display)",fontSize:32,fontWeight:700,color:T.text }}>Weekly Summary</div>
          <div style={{ fontSize:11,color:T.textDim,marginTop:6 }}>Week {dateCtx.weekNum} · {dateCtx.dayOfWeek}, {dateCtx.dayOfMonth} {dateCtx.month} {dateCtx.year}</div>
        </div>
        <button onClick={onRunAll} disabled={isBusy} style={{ background:isBusy?"transparent":T.gold,color:isBusy?T.gold:"#000",border:`1px solid ${T.gold}`,padding:"11px 26px",fontSize:11,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",cursor:isBusy?"not-allowed":"pointer",borderRadius:8,fontFamily:"var(--font-mono)",transition:"all 0.2s" }}>
          {isBusy?`● Running ${TEAM.find(m=>m.id===streaming)?.name||"..."}...`:"⚡ Run All Agents"}
        </button>
      </div>

      {!hasOutputs?(
        <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"60px 32px",textAlign:"center" }}>
          <div style={{ fontSize:36,marginBottom:14 }}>🏛</div>
          <div style={{ fontSize:13,color:T.textMid,lineHeight:2 }}>No briefings generated yet.<br/><span style={{ color:T.gold }}>Run All Agents</span> to populate this view.</div>
        </div>
      ):(
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {TEAM.map(m=>{
            const out=outputs[m.id];
            const hCount=(histories[m.id]||[]).length;
            return (
              <div key={m.id} style={{ background:T.card,border:`1px solid ${T.border}`,borderLeft:`3px solid ${m.color}`,borderRadius:12,overflow:"hidden" }}>
                <div style={{ padding:"13px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12 }}>
                  <span style={{ fontSize:16 }}>{m.emoji}</span>
                  <span style={{ fontSize:13,fontWeight:600,color:T.text }}>{m.name}</span>
                  <span style={{ fontSize:9,color:m.color,letterSpacing:"0.1em",textTransform:"uppercase" }}>{m.role}</span>
                  {hCount>0&&<span style={{ fontSize:9,color:T.textDim }}>· {hCount} briefings saved</span>}
                  {out&&<span style={{ marginLeft:"auto",fontSize:9,color:T.textDim }}>{out.timestamp}</span>}
                  {!out&&streaming===m.id&&<span style={{ marginLeft:"auto",width:7,height:7,borderRadius:"50%",background:m.color,animation:"pulse 1s infinite",display:"inline-block" }}/>}
                </div>
                {out?(
                  <pre style={{ fontSize:11,color:T.textMid,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"var(--font-mono)",padding:"14px 20px",margin:0,maxHeight:180,overflowY:"auto" }}>
                    {out.text.length>500?out.text.slice(0,500)+"\n\n[Open agent for full output →]":out.text}
                  </pre>
                ):(
                  <div style={{ padding:"14px 20px",fontSize:11,color:T.textDim }}>No briefing yet</div>
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
function Sidebar({ activeTab, setActiveTab, activeMember, setActiveMember, streaming, histories }) {
  return (
    <aside style={{ width:210,flexShrink:0,background:T.sidebar,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0 }}>
      <div style={{ padding:"22px 18px 18px",borderBottom:`1px solid ${T.border}` }}>
        <div style={{ fontFamily:"var(--font-display)",fontSize:17,fontWeight:700,color:T.gold }}>FifteenConsult</div>
        <div style={{ fontSize:9,color:T.textDim,letterSpacing:"0.2em",textTransform:"uppercase",marginTop:3 }}>AI Marketing Dept</div>
      </div>
      <nav style={{ padding:"14px 10px",flex:1,overflowY:"auto" }}>
        <div style={{ fontSize:9,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:6,padding:"0 8px" }}>Main Menu</div>
        {[{id:"dashboard",label:"Dashboard",icon:"⊞"},{id:"summary",label:"Weekly Summary",icon:"📋"}].map(item=>{
          const active=activeTab===item.id&&!activeMember;
          return (
            <button key={item.id} onClick={()=>{setActiveTab(item.id);setActiveMember(null);}} style={{ width:"100%",background:active?T.gold+"18":"none",border:"none",borderRadius:8,padding:"9px 10px",fontSize:12,fontWeight:active?600:400,color:active?T.gold:T.textMid,display:"flex",alignItems:"center",gap:9,cursor:"pointer",transition:"all 0.15s",textAlign:"left",fontFamily:"var(--font-mono)" }}
              onMouseEnter={e=>{if(!active)e.currentTarget.style.background=T.card;}}
              onMouseLeave={e=>{if(!active)e.currentTarget.style.background="none";}}>
              <span style={{ fontSize:14 }}>{item.icon}</span>{item.label}
            </button>
          );
        })}
        <div style={{ fontSize:9,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",margin:"18px 0 6px",padding:"0 8px" }}>Agents</div>
        {TEAM.map(m=>{
          const active=activeMember?.id===m.id;
          const isRunning=streaming===m.id;
          const hCount=(histories[m.id]||[]).length;
          return (
            <button key={m.id} onClick={()=>setActiveMember(m)} style={{ width:"100%",background:active?m.color+"18":"none",border:"none",borderRadius:8,padding:"7px 10px",fontSize:12,fontWeight:active?600:400,color:active?m.color:T.textMid,display:"flex",alignItems:"center",gap:9,cursor:"pointer",transition:"all 0.15s",textAlign:"left",fontFamily:"var(--font-mono)" }}
              onMouseEnter={e=>{if(!active)e.currentTarget.style.background=T.card;}}
              onMouseLeave={e=>{if(!active)e.currentTarget.style.background="none";}}>
              <span style={{ fontSize:13 }}>{m.emoji}</span>
              <span style={{ flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{m.name.split(" ")[0]}</span>
              {hCount>0&&<span style={{ fontSize:8,color:T.textDim,background:T.card,padding:"1px 5px",borderRadius:8 }}>{hCount}</span>}
              {isRunning&&<span style={{ width:6,height:6,borderRadius:"50%",background:m.color,animation:"pulse 1s infinite",display:"inline-block",flexShrink:0 }}/>}
            </button>
          );
        })}
      </nav>
      <div style={{ padding:"14px 18px",borderTop:`1px solid ${T.border}`,fontSize:9,color:T.textDim }}>Powered by Claude</div>
    </aside>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const stored = initStorage();

  const [activeTab,setActiveTab]       = useState("dashboard");
  const [activeMember,setActiveMember] = useState(null);
  const [streaming,setStreaming]       = useState(null);
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

  // Persist on change
  useEffect(()=>{
    const s = initStorage();
    s.outputs=outputs;
    s.tasks=taskStates;
    writeStorage(s);
  },[outputs,taskStates]);

  const toggleTask=(memberId,idx)=>{
    setTaskStates(prev=>{
      const u=[...(prev[memberId]||[])];
      u[idx]=!u[idx];
      return{...prev,[memberId]:u};
    });
  };

  const runBriefing=useCallback(async(member,customPrompt="")=>{
    if(streaming) return;
    setStreaming(member.id);
    const t=now_ts();
    const dateCtx=getDateContext();
    const trigger=buildBriefingTrigger(member.briefingTrigger, dateCtx, customPrompt);

    setOutputs(prev=>({...prev,[member.id]:{text:"",timestamp:t}}));
    let finalText="";

    try {
      finalText = await callClaudeAPI(member.systemPrompt, trigger, (partial)=>{
        setOutputs(prev=>({...prev,[member.id]:{text:partial,timestamp:t}}));
      });
    } catch(err) {
      finalText=`⚠ Error: ${err.message}`;
      setOutputs(prev=>({...prev,[member.id]:{text:finalText,timestamp:t}}));
    } finally {
      setStreaming(null);
      // Save to history
      if(finalText&&!finalText.startsWith("⚠")) {
        const newHistory = pushHistory(member.id,{ text:finalText, timestamp:t, customPrompt, weekNum:getDateContext().weekNum });
        setHistories(prev=>({...prev,[member.id]:newHistory}));
      }
    }
  },[streaming]);

  const runAll=useCallback(async()=>{
    if(streaming) return;
    for(const m of TEAM) await runBriefing(m,"");
  },[runBriefing,streaming]);

  const totalTasks  = TEAM.reduce((s,m)=>s+m.tasks.length,0);
  const totalDone   = TEAM.reduce((s,m)=>s+(taskStates[m.id]||[]).filter(Boolean).length,0);
  const totalOutputs= Object.keys(outputs).length;
  const totalHistory= Object.values(histories).reduce((s,h)=>s+h.length,0);

  return (
    <div style={{ display:"flex",minHeight:"100vh",background:T.base,color:T.text,fontFamily:"var(--font-mono)" }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} activeMember={activeMember} setActiveMember={setActiveMember} streaming={streaming} histories={histories}/>

      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"auto" }}>
        {/* Header */}
        <header style={{ padding:"18px 28px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:T.base,position:"sticky",top:0,zIndex:50 }}>
          <div>
            <div style={{ fontSize:20,fontWeight:700,color:T.text,fontFamily:"var(--font-display)" }}>
              {activeMember?activeMember.name:activeTab==="dashboard"?"Dashboard":"Weekly Summary"}
            </div>
            <div style={{ marginTop:8 }}><DateBadge/></div>
          </div>
          <div style={{ display:"flex",gap:10,alignItems:"center" }}>
            {!activeMember&&(
              <button onClick={runAll} disabled={!!streaming} style={{ background:!!streaming?"transparent":T.gold,color:!!streaming?T.gold:"#000",border:`1px solid ${T.gold}`,padding:"9px 20px",fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",cursor:!!streaming?"not-allowed":"pointer",borderRadius:8,fontFamily:"var(--font-mono)",transition:"all 0.2s" }}>
                {!!streaming?`● ${TEAM.find(m=>m.id===streaming)?.name||"Running"}...`:"⚡ Run All Agents"}
              </button>
            )}
            <div style={{ padding:"7px 14px",background:T.card,borderRadius:8,border:`1px solid ${T.border}`,fontSize:10,color:T.textMid }}>
              {streaming?<span style={{ color:T.gold }}>● Running agent...</span>:<span style={{ color:T.green }}>● {TEAM.length} agents online</span>}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ padding:28,flex:1 }}>
          {activeMember&&(
            <MemberDetail member={activeMember} taskStates={taskStates} output={outputs[activeMember.id]} streaming={streaming} onToggleTask={toggleTask} onRunBriefing={runBriefing} onBack={()=>setActiveMember(null)}/>
          )}

          {!activeMember&&activeTab==="dashboard"&&(
            <div style={{ animation:"fadeUp 0.3s ease" }}>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:13,marginBottom:32 }}>
                <StatCard label="Active Agents"  value="7"                            sub="All online"                                      icon="🤖" accent={T.gold}/>
                <StatCard label="Tasks Complete" value={`${totalDone}/${totalTasks}`} sub={`${Math.round(totalDone/totalTasks*100)}% done`}  icon="✅" accent={T.green}/>
                <StatCard label="Briefings Run"  value={totalOutputs}                 sub={`${TEAM.length-totalOutputs} pending`}            icon="📄" accent={T.blue}/>
                <StatCard label="Saved History"  value={totalHistory}                 sub="Briefings in log"                                 icon="📋" accent={T.amber}/>
              </div>
              <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:14 }}>Your Team · 7 Agents</div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:13 }}>
                {TEAM.map(m=>(
                  <MemberCard key={m.id} member={m} taskStates={taskStates} output={outputs[m.id]} streaming={streaming} historyCount={(histories[m.id]||[]).length} onOpen={()=>setActiveMember(m)} onRun={()=>runBriefing(m,"")}/>
                ))}
              </div>
            </div>
          )}

          {!activeMember&&activeTab==="summary"&&(
            <WeeklySummary outputs={outputs} streaming={streaming} onRunAll={runAll} histories={histories}/>
          )}
        </main>
      </div>
    </div>
  );
}
