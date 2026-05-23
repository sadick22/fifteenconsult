import { useState } from "react";

const T = {
  base:"#0d1117", card:"#131d2e", border:"#1e2d45",
  text:"#e8edf5", textMid:"#7a90b0", textDim:"#3d526b",
  gold:"#C8A96E", green:"#4ade80", amber:"#fbbf24", red:"#f87171",
};

const FRAMEWORK = {
  tagline: "Turn Marketing Complexity Into Measurable Growth",
  concept: "15 minutes of executive attention · 15 key metrics · 15 strategic pillars",
  pillars: {
    foundation: {
      label: "Foundation",
      color: "#6EB5C8",
      items: [
        { id:1,  label:"Brand Positioning",      metric:"Clarity score",      target:"9/10",  current:"6/10" },
        { id:2,  label:"Target Audience ICP",    metric:"ICP completeness",   target:"100%",  current:"70%" },
        { id:3,  label:"Value Proposition",      metric:"Win rate impact",    target:"+30%",  current:"+12%" },
        { id:4,  label:"Competitive Advantage",  metric:"Differentiators",    target:"5",     current:"3" },
        { id:5,  label:"Content Strategy",       metric:"Pillar coverage",    target:"6/6",   current:"4/6" },
      ]
    },
    execution: {
      label: "Execution",
      color: "#C8A96E",
      items: [
        { id:6,  label:"Content Production",     metric:"Posts/week",         target:"8",     current:"4" },
        { id:7,  label:"Lead Generation",        metric:"Prospects/week",     target:"50",    current:"28" },
        { id:8,  label:"Paid Acquisition",       metric:"CPL (QAR)",          target:"150",   current:"87" },
        { id:9,  label:"SEO Authority",          metric:"Domain authority",   target:"30",    current:"18" },
        { id:10, label:"Social Proof",           metric:"Case studies",       target:"5",     current:"3" },
      ]
    },
    measurement: {
      label: "Measurement",
      color: "#6EC87A",
      items: [
        { id:11, label:"Revenue Pipeline",       metric:"Active deals (QAR)", target:"500K",  current:"120K" },
        { id:12, label:"Conversion Rate",        metric:"Lead→Call rate",     target:"15%",   current:"8%" },
        { id:13, label:"Client Retention",       metric:"Retention rate",     target:"90%",   current:"100%" },
        { id:14, label:"Brand Visibility",       metric:"Organic reach/mo",   target:"5000",  current:"1200" },
        { id:15, label:"Marketing ROI",          metric:"Return on spend",    target:"4x",    current:"2.1x" },
      ]
    }
  }
};

function PillarCard({ item, color }) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(item.current);

  const numCurrent = parseFloat(current.replace(/[^0-9.]/g,"")) || 0;
  const numTarget  = parseFloat(item.target.replace(/[^0-9.]/g,"")) || 100;
  const p = Math.min(100, Math.round((numCurrent/numTarget)*100));
  const statusColor = p>=75?T.green:p>=45?T.amber:T.red;

  return (
    <div style={{
      background:T.base,border:`1px solid ${p<45?T.red+"44":T.border}`,
      borderRadius:9,padding:"14px 16px",
      borderLeft:`2px solid ${statusColor}`,
    }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
        <div>
          <div style={{ fontSize:10,color:T.textDim,marginBottom:2 }}>#{item.id}</div>
          <div style={{ fontSize:12,fontWeight:600,color:T.text,lineHeight:1.3 }}>{item.label}</div>
          <div style={{ fontSize:10,color:T.textMid,marginTop:2 }}>{item.metric}</div>
        </div>
        <div style={{ textAlign:"right",flexShrink:0,marginLeft:8 }}>
          {editing?(
            <input
              value={current}
              onChange={e=>setCurrent(e.target.value)}
              onBlur={()=>setEditing(false)}
              autoFocus
              style={{ width:60,background:T.card,border:`1px solid ${color}`,borderRadius:5,padding:"3px 7px",fontSize:12,color:T.text,fontFamily:"var(--font-mono)",outline:"none",textAlign:"right" }}
            />
          ):(
            <div onClick={()=>setEditing(true)} style={{ cursor:"pointer" }}>
              <div style={{ fontSize:15,fontWeight:700,color:statusColor }}>{current}</div>
              <div style={{ fontSize:9,color:T.textDim }}>/{item.target}</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ background:T.border,borderRadius:3,height:3,overflow:"hidden" }}>
        <div style={{ width:`${p}%`,height:"100%",background:statusColor,borderRadius:3,transition:"width 1s ease" }}/>
      </div>
    </div>
  );
}

export default function FifteenFramework() {
  const [activeTab, setActiveTab] = useState("foundation");
  const pillar = FRAMEWORK.pillars[activeTab];

  const allItems = Object.values(FRAMEWORK.pillars).flatMap(p=>p.items);
  const onTrackCount = allItems.filter(item=>{
    const c = parseFloat(item.current.replace(/[^0-9.]/g,""))||0;
    const t = parseFloat(item.target.replace(/[^0-9.]/g,""))||100;
    return (c/t)>=0.75;
  }).length;

  return (
    <div style={{ animation:"fadeUp 0.3s ease" }}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:6 }}>
          FifteenConsult Proprietary Framework
        </div>
        <div style={{ fontFamily:"var(--font-display)",fontSize:32,fontWeight:700,color:T.gold,marginBottom:6 }}>
          The Fifteen Framework
        </div>
        <div style={{ fontSize:12,color:T.textMid,lineHeight:1.7 }}>{FRAMEWORK.concept}</div>
      </div>

      {/* Overview stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:28 }}>
        {[
          { label:"Pillars On Track",   value:`${onTrackCount}/15`, color:T.green },
          { label:"Execution Score",    value:`${Math.round(onTrackCount/15*100)}%`, color:T.gold },
          { label:"Growth Stage",       value:"Building", color:T.amber },
        ].map((s,i)=>(
          <div key={i} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"18px 20px",textAlign:"center" }}>
            <div style={{ fontFamily:"var(--font-display)",fontSize:28,fontWeight:700,color:s.color,marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.1em",textTransform:"uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pillar tabs */}
      <div style={{ display:"flex",gap:8,marginBottom:20 }}>
        {Object.entries(FRAMEWORK.pillars).map(([key,p])=>{
          const active = activeTab===key;
          return (
            <button key={key} onClick={()=>setActiveTab(key)} style={{
              background:active?p.color+"22":"none",
              border:`1px solid ${active?p.color:T.border}`,
              color:active?p.color:T.textMid,
              fontSize:11,fontWeight:active?700:400,
              padding:"8px 20px",borderRadius:8,cursor:"pointer",
              fontFamily:"var(--font-mono)",letterSpacing:"0.1em",
              textTransform:"uppercase",transition:"all 0.15s",
            }}>{p.label}</button>
          );
        })}
      </div>

      {/* Pillar items */}
      <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20 }}>
        <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:16 }}>
          {pillar.label} Pillars · Click current value to edit
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10 }}>
          {pillar.items.map(item=>(
            <PillarCard key={item.id} item={item} color={pillar.color}/>
          ))}
        </div>
      </div>

      {/* Tagline */}
      <div style={{ marginTop:20,padding:"14px 20px",background:T.gold+"0a",border:`1px solid ${T.gold}22`,borderRadius:10,textAlign:"center" }}>
        <div style={{ fontSize:13,color:T.gold,fontFamily:"var(--font-display)",fontStyle:"italic" }}>
          "{FRAMEWORK.tagline}"
        </div>
      </div>
    </div>
  );
}
