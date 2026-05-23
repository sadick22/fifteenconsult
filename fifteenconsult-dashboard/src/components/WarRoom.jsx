import { TEAM } from "../data/team.js";
import { getDateContext } from "../lib/dateContext.js";

const T = {
  base:"var(--bg-base)", card:"var(--bg-card)", border:"var(--border)",
  text:"var(--text)", textMid:"var(--text-mid)", textDim:"var(--text-dim)",
  gold:"var(--gold)", green:"var(--green)", amber:"var(--amber)", red:"var(--red)",
};

function pct(c,t){ return Math.min(100,Math.round((c/t)*100)); }

function statusColor(p) {
  if(p>=80) return T.green;
  if(p>=50) return T.amber;
  return T.red;
}
function statusLabel(p) {
  if(p>=80) return "On Track";
  if(p>=50) return "At Risk";
  return "Behind";
}

function KpiBlock({ label, current, target, unit="", color }) {
  const p = pct(current,target);
  const sc = statusColor(p);
  return (
    <div style={{ background:T.base,borderRadius:8,padding:"12px 14px",border:`1px solid ${p<50?T.red+"44":T.border}` }}>
      <div style={{ fontSize:9,color:T.textDim,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6 }}>{label}</div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:6 }}>
        <span style={{ fontSize:20,fontWeight:700,color:sc,lineHeight:1 }}>{current}{unit}</span>
        <span style={{ fontSize:10,color:T.textDim }}>/{target}{unit}</span>
      </div>
      <div style={{ background:T.border,borderRadius:3,height:3,overflow:"hidden",marginBottom:4 }}>
        <div style={{ width:`${p}%`,height:"100%",background:sc,borderRadius:3,transition:"width 1s ease" }}/>
      </div>
      <div style={{ fontSize:9,color:sc,fontWeight:600 }}>{statusLabel(p)} · {p}%</div>
    </div>
  );
}

export default function WarRoom({ alerts, taskStates, outputs }) {
  const dateCtx = getDateContext();
  const critical = alerts.filter(a=>a.level==="red");
  const onTrack  = alerts.filter(a=>a.level==="green");
  const totalTasks = TEAM.reduce((s,m)=>s+(taskStates[m.id]||[]).length,0);
  const doneTasks  = TEAM.reduce((s,m)=>s+(taskStates[m.id]||[]).filter(Boolean).length,0);

  return (
    <div style={{ animation:"fadeUp 0.3s ease" }}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:6 }}>
          Weekly Command Centre
        </div>
        <div style={{ fontFamily:"var(--font-display)",fontSize:32,fontWeight:700,color:T.text,marginBottom:6 }}>
          War Room
        </div>
        <div style={{ fontSize:11,color:T.textDim }}>
          Week {dateCtx.weekNum} · {dateCtx.dayOfWeek}, {dateCtx.dayOfMonth} {dateCtx.month} {dateCtx.year} · Q{dateCtx.currentQuarter} · {dateCtx.daysLeftInQuarter} days to quarter end
        </div>
      </div>

      {/* Department health */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28 }}>
        {[
          { label:"Overall Health",   value:critical.length===0?"Good":"Needs Work", color:critical.length===0?T.green:T.red },
          { label:"Agents Briefed",   value:`${Object.keys(outputs).length}/7`,      color:T.gold },
          { label:"Tasks Complete",   value:`${Math.round(doneTasks/totalTasks*100)}%`, color:T.textMid },
          { label:"Active Alerts",    value:`${critical.length} critical`,            color:critical.length>0?T.red:T.green },
        ].map((s,i) => (
          <div key={i} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"16px 18px" }}>
            <div style={{ fontSize:9,color:T.textDim,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:18,fontWeight:700,color:s.color,fontFamily:"var(--font-display)" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* KPIs per agent */}
      {TEAM.map(m => {
        const agentAlerts = alerts.filter(a=>a.agent===m.id);
        const hasRed = agentAlerts.some(a=>a.level==="red");
        return (
          <div key={m.id} style={{
            background:T.card,
            border:`1px solid ${hasRed?T.red+"44":T.border}`,
            borderLeft:`3px solid ${m.color}`,
            borderRadius:10,padding:"18px 20px",marginBottom:14,
          }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <span style={{ fontSize:18 }}>{m.emoji}</span>
                <div>
                  <div style={{ fontSize:13,fontWeight:600,color:T.text }}>{m.name}</div>
                  <div style={{ fontSize:9,color:m.color,letterSpacing:"0.12em",textTransform:"uppercase" }}>{m.role}</div>
                </div>
              </div>
              <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                {agentAlerts.map(a => (
                  <span key={a.id} style={{ fontSize:9,color:a.level==="red"?T.red:T.amber,background:(a.level==="red"?T.red:T.amber)+"18",padding:"2px 8px",borderRadius:8,fontWeight:600 }}>
                    {a.emoji} {a.title.slice(0,30)}{a.title.length>30?"...":""}
                  </span>
                ))}
                {agentAlerts.length===0&&<span style={{ fontSize:10,color:T.green }}>✓ On track</span>}
              </div>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10 }}>
              {m.kpis.map(k=>(
                <KpiBlock key={k.label} {...k} color={m.color}/>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
