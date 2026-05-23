import { useState, useEffect, useCallback } from "react";
import { TEAM } from "./data/team.js";
import { callClaudeAPI } from "./lib/api.js";

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
  blue:      "#60a5fa",
};

function ts() {
  return new Date().toLocaleString("en-GB", { weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
}
function pct(c, t) { return Math.min(100, Math.round((c/t)*100)); }

function load() { try { return JSON.parse(localStorage.getItem("fc_v5")||"{}"); } catch { return {}; } }
function save(d) { try { localStorage.setItem("fc_v5", JSON.stringify(d)); } catch {} }

function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"20px 24px", display:"flex", alignItems:"center", gap:16 }}>
      <div style={{ width:44, height:44, borderRadius:10, background:(accent||T.gold)+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontSize:11, color:T.textMid, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>{label}</div>
        <div style={{ fontSize:26, fontWeight:700, color:accent||T.gold, lineHeight:1, fontFamily:"var(--font-display)" }}>{value}</div>
        <div style={{ fontSize:11, color:T.textDim, marginTop:3 }}>{sub}</div>
      </div>
    </div>
  );
}

function MemberCard({ member, taskStates, output, streaming, onOpen, onRun }) {
  const states = taskStates[member.id]||[];
  const done = states.filter(Boolean).length;
  const progress = states.length ? pct(done, states.length) : 0;
  const isStreaming = streaming===member.id;
  const isBusy = !!streaming;
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onOpen} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background:hov?T.cardHover:T.card, border:`1px solid ${hov?T.borderL:T.border}`, borderRadius:12,
      padding:20, cursor:"pointer", position:"relative", overflow:"hidden",
      transition:"all 0.2s ease", transform:hov?"translateY(-2px)":"none",
      boxShadow:hov?"0 8px 32px rgba(0,0,0,0.35)":"none",
    }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${member.color},transparent)`, opacity:0.9 }}/>
      {isStreaming && <div style={{ position:"absolute", top:12, right:12, width:8, height:8, borderRadius:"50%", background:member.color, animation:"pulse 1s ease infinite", boxShadow:`0 0 8px ${member.color}` }}/>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:600, color:T.text, marginBottom:3 }}>{member.name}</div>
          <div style={{ fontSize:10, color:member.color, letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:500 }}>{member.role}</div>
        </div>
        <div style={{ width:38, height:38, borderRadius:9, background:member.color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{member.emoji}</div>
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.textMid, marginBottom:6 }}>
          <span>Tasks</span><span style={{ color:member.color, fontWeight:600 }}>{done}/{states.length}</span>
        </div>
        <div style={{ background:T.border, borderRadius:4, height:4, overflow:"hidden" }}>
          <div style={{ width:`${progress}%`, height:"100%", background:`linear-gradient(90deg,${member.color},${member.color}99)`, borderRadius:4, transition:"width 1s ease" }}/>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
        {member.kpis.slice(0,2).map(k => {
          const p = pct(k.current, k.target);
          return (
            <div key={k.label} style={{ background:T.base, borderRadius:8, padding:"10px 12px", border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:9, color:T.textDim, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{k.label}</div>
              <div style={{ fontSize:18, fontWeight:700, color:p>=60?T.text:T.red, lineHeight:1 }}>{k.current}{k.unit||""}</div>
              <div style={{ fontSize:9, color:T.textDim, marginTop:2 }}>of {k.target}{k.unit||""}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:10, color:output?member.color:T.textDim }}>{output?`✓ ${output.timestamp}`:`No briefing · ${member.cadence}`}</div>
        <button onClick={e=>{e.stopPropagation();onRun();}} disabled={isBusy} style={{
          background:isBusy?"transparent":member.color+"22", border:`1px solid ${isBusy?T.border:member.color+"66"}`,
          color:isBusy?T.textDim:member.color, fontSize:10, fontWeight:600, letterSpacing:"0.12em",
          textTransform:"uppercase", padding:"5px 14px", borderRadius:6,
          cursor:isBusy?"not-allowed":"pointer", fontFamily:"var(--font-mono)", transition:"all 0.2s",
        }}>{isStreaming?"Running...":"Run"}</button>
      </div>
    </div>
  );
}

function KpiRow({ label, current, target, unit="", color }) {
  const p = pct(current, target);
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6 }}>
        <span style={{ color:T.textMid }}>{label}</span>
        <span style={{ color:p>=60?color:T.red, fontWeight:600 }}>{current}{unit} <span style={{ color:T.textDim, fontWeight:400 }}>/ {target}{unit}</span></span>
      </div>
      <div style={{ background:T.border, borderRadius:4, height:5, overflow:"hidden" }}>
        <div style={{ width:`${p}%`, height:"100%", borderRadius:4, background:p>=60?color:T.red, transition:"width 1.2s ease" }}/>
      </div>
    </div>
  );
}

function OutputLog({ output, color, isStreaming }) {
  if (!output) return null;
  return (
    <div style={{ background:T.base, border:`1px solid ${T.border}`, borderLeft:`3px solid ${color}`, borderRadius:10, padding:"18px 20px", marginTop:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <span style={{ fontSize:10, color:T.textDim, letterSpacing:"0.15em", textTransform:"uppercase" }}>Agent Output</span>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {isStreaming && <span style={{ width:7, height:7, borderRadius:"50%", background:color, animation:"pulse 1s infinite", display:"inline-block" }}/>}
          <span style={{ fontSize:10, color:T.textDim }}>{output.timestamp}</span>
        </div>
      </div>
      <pre style={{ fontSize:12, color:T.textMid, lineHeight:1.9, whiteSpace:"pre-wrap", fontFamily:"var(--font-mono)", margin:0 }}>
        {output.text||(isStreaming?"Initialising agent...":"")}
        {isStreaming&&<span style={{ color, animation:"pulse 0.8s infinite" }}>▌</span>}
      </pre>
    </div>
  );
}

function MemberDetail({ member, taskStates, output, streaming, onToggleTask, onRunBriefing, onBack }) {
  const states = taskStates[member.id]||member.tasks.map(t=>t.done);
  const done = states.filter(Boolean).length;
  const isStreaming = streaming===member.id;
  const isBusy = !!streaming;
  return (
    <div style={{ animation:"fadeUp 0.3s ease" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:T.textMid, fontSize:12, cursor:"pointer", fontFamily:"var(--font-mono)", display:"flex", alignItems:"center", gap:6, marginBottom:28, padding:0 }}
        onMouseEnter={e=>e.currentTarget.style.color=T.text} onMouseLeave={e=>e.currentTarget.style.color=T.textMid}>
        ← Back to Dashboard
      </button>
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"28px 32px", marginBottom:20, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${member.color},transparent)` }}/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:56, height:56, borderRadius:14, background:member.color+"20", fontSize:28, display:"flex", alignItems:"center", justifyContent:"center" }}>{member.emoji}</div>
            <div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:32, fontWeight:700, color:T.text, lineHeight:1 }}>{member.name}</div>
              <div style={{ fontSize:11, color:member.color, letterSpacing:"0.15em", textTransform:"uppercase", marginTop:6 }}>{member.role} · {member.cadence} briefing</div>
            </div>
          </div>
          <button onClick={()=>onRunBriefing(member)} disabled={isBusy} style={{
            background:isStreaming||isBusy?"transparent":member.color,
            color:isStreaming||isBusy?member.color:"#000",
            border:`1px solid ${member.color}`, padding:"12px 28px", fontSize:11, fontWeight:700,
            letterSpacing:"0.15em", textTransform:"uppercase", cursor:isBusy?"not-allowed":"pointer",
            borderRadius:8, fontFamily:"var(--font-mono)", transition:"all 0.2s",
          }}>{isStreaming?"● Streaming...":`Run ${member.cadence==="weekly"?"Weekly":"Daily"} Briefing`}</button>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:24 }}>
          <div style={{ fontSize:11, color:T.textDim, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:18 }}>
            Daily Tasks · <span style={{ color:member.color }}>{done}/{member.tasks.length}</span>
          </div>
          {member.tasks.map((t,i)=>{
            const d = states[i]??t.done;
            return (
              <div key={i} onClick={()=>onToggleTask(member.id,i)} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"10px 8px", cursor:"pointer", borderRadius:8, marginBottom:2, transition:"background 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.background=T.cardHover}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{ width:18, height:18, flexShrink:0, marginTop:1, borderRadius:5, border:`2px solid ${d?member.color:T.border}`, background:d?member.color:"transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}>
                  {d&&<span style={{ fontSize:10, color:"#000", fontWeight:700 }}>✓</span>}
                </div>
                <span style={{ fontSize:13, color:d?T.textDim:T.text, lineHeight:1.5, textDecoration:d?"line-through":"none" }}>{t.text}</span>
              </div>
            );
          })}
        </div>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:24 }}>
          <div style={{ fontSize:11, color:T.textDim, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:18 }}>KPI Tracker</div>
          {member.kpis.map(k=><KpiRow key={k.label} {...k} color={member.color}/>)}
        </div>
      </div>
      <OutputLog output={output} color={member.color} isStreaming={isStreaming}/>
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:24, marginTop:20 }}>
        <div style={{ fontSize:11, color:T.textDim, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:14 }}>System Prompt</div>
        <pre style={{ fontSize:11, color:T.textDim, lineHeight:1.8, whiteSpace:"pre-wrap", fontFamily:"var(--font-mono)", maxHeight:220, overflowY:"auto", background:T.base, padding:16, borderRadius:8 }}>{member.systemPrompt}</pre>
      </div>
    </div>
  );
}

function WeeklySummary({ outputs, streaming, onRunAll }) {
  const hasOutputs = Object.keys(outputs).length>0;
  const isBusy = !!streaming;
  return (
    <div style={{ animation:"fadeUp 0.3s ease" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32 }}>
        <div>
          <div style={{ fontSize:11, color:T.textDim, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:6 }}>Department Command</div>
          <div style={{ fontFamily:"var(--font-display)", fontSize:34, fontWeight:700, color:T.text }}>Weekly Summary</div>
        </div>
        <button onClick={onRunAll} disabled={isBusy} style={{ background:isBusy?"transparent":T.gold, color:isBusy?T.gold:"#000", border:`1px solid ${T.gold}`, padding:"12px 28px", fontSize:11, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", cursor:isBusy?"not-allowed":"pointer", borderRadius:8, fontFamily:"var(--font-mono)", transition:"all 0.2s" }}>
          {isBusy?`● Running ${TEAM.find(m=>m.id===streaming)?.name||"..."}...`:"⚡ Run All Agents"}
        </button>
      </div>
      {!hasOutputs?(
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"60px 32px", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:16 }}>🏛</div>
          <div style={{ fontSize:14, color:T.textMid, lineHeight:2 }}>No briefings generated yet.<br/><span style={{ color:T.gold }}>Run All Agents</span> to populate this view.</div>
        </div>
      ):(
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {TEAM.map(m=>{
            const out=outputs[m.id];
            return (
              <div key={m.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderLeft:`3px solid ${m.color}`, borderRadius:12, overflow:"hidden" }}>
                <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:18 }}>{m.emoji}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{m.name}</span>
                  <span style={{ fontSize:10, color:m.color, letterSpacing:"0.1em", textTransform:"uppercase" }}>{m.role}</span>
                  {out&&<span style={{ marginLeft:"auto", fontSize:10, color:T.textDim }}>{out.timestamp}</span>}
                  {!out&&streaming===m.id&&<span style={{ marginLeft:"auto", width:7, height:7, borderRadius:"50%", background:m.color, animation:"pulse 1s infinite", display:"inline-block" }}/>}
                </div>
                {out?(
                  <pre style={{ fontSize:12, color:T.textMid, lineHeight:1.8, whiteSpace:"pre-wrap", fontFamily:"var(--font-mono)", padding:"16px 20px", margin:0, maxHeight:200, overflowY:"auto" }}>
                    {out.text.length>500?out.text.slice(0,500)+"\n\n[Open agent for full output →]":out.text}
                  </pre>
                ):(
                  <div style={{ padding:"16px 20px", fontSize:12, color:T.textDim }}>No briefing yet</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Sidebar({ activeTab, setActiveTab, activeMember, setActiveMember, streaming }) {
  return (
    <aside style={{ width:220, flexShrink:0, background:T.sidebar, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", height:"100vh", position:"sticky", top:0 }}>
      <div style={{ padding:"24px 20px 20px", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:700, color:T.gold }}>FifteenConsult</div>
        <div style={{ fontSize:9, color:T.textDim, letterSpacing:"0.2em", textTransform:"uppercase", marginTop:3 }}>AI Marketing Dept</div>
      </div>
      <nav style={{ padding:"16px 12px", flex:1, overflowY:"auto" }}>
        <div style={{ fontSize:9, color:T.textDim, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:8, padding:"0 8px" }}>Main Menu</div>
        {[{id:"dashboard",label:"Dashboard",icon:"⊞"},{id:"summary",label:"Weekly Summary",icon:"📋"}].map(item=>{
          const active=activeTab===item.id&&!activeMember;
          return (
            <button key={item.id} onClick={()=>{setActiveTab(item.id);setActiveMember(null);}} style={{ width:"100%", background:active?T.gold+"18":"none", border:"none", borderRadius:8, padding:"10px 12px", fontSize:13, fontWeight:active?600:400, color:active?T.gold:T.textMid, display:"flex", alignItems:"center", gap:10, cursor:"pointer", transition:"all 0.15s", textAlign:"left", fontFamily:"var(--font-mono)" }}
              onMouseEnter={e=>{if(!active)e.currentTarget.style.background=T.card;}}
              onMouseLeave={e=>{if(!active)e.currentTarget.style.background="none";}}>
              <span style={{ fontSize:15 }}>{item.icon}</span>{item.label}
            </button>
          );
        })}
        <div style={{ fontSize:9, color:T.textDim, letterSpacing:"0.15em", textTransform:"uppercase", margin:"20px 0 8px", padding:"0 8px" }}>Agents</div>
        {TEAM.map(m=>{
          const active=activeMember?.id===m.id;
          const isRunning=streaming===m.id;
          return (
            <button key={m.id} onClick={()=>setActiveMember(m)} style={{ width:"100%", background:active?m.color+"18":"none", border:"none", borderRadius:8, padding:"8px 12px", fontSize:12, fontWeight:active?600:400, color:active?m.color:T.textMid, display:"flex", alignItems:"center", gap:10, cursor:"pointer", transition:"all 0.15s", textAlign:"left", fontFamily:"var(--font-mono)" }}
              onMouseEnter={e=>{if(!active)e.currentTarget.style.background=T.card;}}
              onMouseLeave={e=>{if(!active)e.currentTarget.style.background="none";}}>
              <span style={{ fontSize:14 }}>{m.emoji}</span>
              <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name.split(" ")[0]}</span>
              {isRunning&&<span style={{ width:6, height:6, borderRadius:"50%", background:m.color, animation:"pulse 1s infinite", display:"inline-block", flexShrink:0 }}/>}
            </button>
          );
        })}
      </nav>
      <div style={{ padding:"16px 20px", borderTop:`1px solid ${T.border}`, fontSize:10, color:T.textDim }}>Powered by Claude</div>
    </aside>
  );
}

export default function App() {
  const [activeTab, setActiveTab]       = useState("dashboard");
  const [activeMember, setActiveMember] = useState(null);
  const [streaming, setStreaming]       = useState(null);
  const [outputs, setOutputs]           = useState(()=>load().outputs||{});
  const [taskStates, setTaskStates]     = useState(()=>{
    const stored=load().tasks||{};
    const init={};
    TEAM.forEach(m=>{init[m.id]=stored[m.id]||m.tasks.map(t=>t.done);});
    return init;
  });

  useEffect(()=>{save({outputs,tasks:taskStates});},[outputs,taskStates]);

  const toggleTask=(memberId,idx)=>{
    setTaskStates(prev=>{const u=[...(prev[memberId]||[])];u[idx]=!u[idx];return{...prev,[memberId]:u};});
  };

  const runBriefing=useCallback(async(member)=>{
    if(streaming)return;
    setStreaming(member.id);
    const t=ts();
    setOutputs(prev=>({...prev,[member.id]:{text:"",timestamp:t}}));
    try {
      await callClaudeAPI(member.systemPrompt,member.briefingTrigger,(partial)=>{
        setOutputs(prev=>({...prev,[member.id]:{text:partial,timestamp:t}}));
      });
    } catch(err) {
      setOutputs(prev=>({...prev,[member.id]:{text:`⚠ Error: ${err.message}`,timestamp:t}}));
    } finally { setStreaming(null); }
  },[streaming]);

  const runAll=useCallback(async()=>{
    if(streaming)return;
    for(const m of TEAM)await runBriefing(m);
  },[runBriefing,streaming]);

  const totalTasks=TEAM.reduce((s,m)=>s+m.tasks.length,0);
  const totalDone=TEAM.reduce((s,m)=>s+(taskStates[m.id]||[]).filter(Boolean).length,0);
  const totalOutputs=Object.keys(outputs).length;
  const today=new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.base, color:T.text, fontFamily:"var(--font-mono)" }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} activeMember={activeMember} setActiveMember={setActiveMember} streaming={streaming}/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"auto" }}>
        <header style={{ padding:"20px 32px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.base, position:"sticky", top:0, zIndex:50 }}>
          <div>
            <div style={{ fontSize:22, fontWeight:700, color:T.text, fontFamily:"var(--font-display)" }}>
              {activeMember?activeMember.name:activeTab==="dashboard"?"Dashboard":"Weekly Summary"}
            </div>
            <div style={{ fontSize:11, color:T.textDim, marginTop:2 }}>{today}</div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            {!activeMember&&(
              <button onClick={runAll} disabled={!!streaming} style={{ background:!!streaming?"transparent":T.gold, color:!!streaming?T.gold:"#000", border:`1px solid ${T.gold}`, padding:"10px 22px", fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", cursor:!!streaming?"not-allowed":"pointer", borderRadius:8, fontFamily:"var(--font-mono)", transition:"all 0.2s" }}>
                {!!streaming?`● ${TEAM.find(m=>m.id===streaming)?.name||"Running"}...`:"⚡ Run All Agents"}
              </button>
            )}
            <div style={{ padding:"8px 16px", background:T.card, borderRadius:8, border:`1px solid ${T.border}`, fontSize:11, color:T.textMid }}>
              {streaming?<span style={{ color:T.gold }}>● Running agent...</span>:<span style={{ color:T.green }}>● {TEAM.length} agents online</span>}
            </div>
          </div>
        </header>
        <main style={{ padding:32, flex:1 }}>
          {activeMember&&(
            <MemberDetail member={activeMember} taskStates={taskStates} output={outputs[activeMember.id]} streaming={streaming} onToggleTask={toggleTask} onRunBriefing={runBriefing} onBack={()=>setActiveMember(null)}/>
          )}
          {!activeMember&&activeTab==="dashboard"&&(
            <div style={{ animation:"fadeUp 0.3s ease" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:36 }}>
                <StatCard label="Active Agents"  value="7"                            sub="All online"                                   icon="🤖" accent={T.gold}/>
                <StatCard label="Tasks Complete" value={`${totalDone}/${totalTasks}`} sub={`${Math.round(totalDone/totalTasks*100)}% done`} icon="✅" accent={T.green}/>
                <StatCard label="Briefings Run"  value={totalOutputs}                 sub={`${TEAM.length-totalOutputs} pending`}           icon="📄" accent={T.blue}/>
                <StatCard label="Running Now"    value={streaming?"1":"—"}            sub={streaming?TEAM.find(m=>m.id===streaming)?.name:"Idle"} icon="⚡" accent={T.gold}/>
              </div>
              <div style={{ fontSize:11, color:T.textDim, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:16 }}>Your Team · 7 Agents</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:14 }}>
                {TEAM.map(m=><MemberCard key={m.id} member={m} taskStates={taskStates} output={outputs[m.id]} streaming={streaming} onOpen={()=>setActiveMember(m)} onRun={()=>runBriefing(m)}/>)}
              </div>
            </div>
          )}
          {!activeMember&&activeTab==="summary"&&(
            <WeeklySummary outputs={outputs} streaming={streaming} onRunAll={runAll}/>
          )}
        </main>
      </div>
    </div>
  );
}
