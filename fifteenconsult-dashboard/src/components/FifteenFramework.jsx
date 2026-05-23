import { useState } from "react";

const T = {
  base:"var(--bg-base)", card:"var(--bg-card)", border:"var(--border)",
  text:"var(--text)", textMid:"var(--text-mid)", textDim:"var(--text-dim)",
  gold:"var(--gold)", green:"var(--green)", amber:"var(--amber)", red:"var(--red)",
};

const INITIAL_DATA = {
  foundation: [
    { id:1,  label:"Brand Positioning",      metric:"Clarity score",      target:"9/10",  current:"6/10"  },
    { id:2,  label:"Target Audience ICP",    metric:"ICP completeness",   target:"100%",  current:"70%"   },
    { id:3,  label:"Value Proposition",      metric:"Win rate impact",    target:"+30%",  current:"+12%"  },
    { id:4,  label:"Competitive Advantage",  metric:"Differentiators",    target:"5",     current:"3"     },
    { id:5,  label:"Content Strategy",       metric:"Pillar coverage",    target:"6/6",   current:"4/6"   },
  ],
  execution: [
    { id:6,  label:"Content Production",     metric:"Posts/week",         target:"8",     current:"4"     },
    { id:7,  label:"Lead Generation",        metric:"Prospects/week",     target:"50",    current:"28"    },
    { id:8,  label:"Paid Acquisition",       metric:"CPL (QAR)",          target:"150",   current:"87"    },
    { id:9,  label:"SEO Authority",          metric:"Domain authority",   target:"30",    current:"18"    },
    { id:10, label:"Social Proof",           metric:"Case studies",       target:"5",     current:"3"     },
  ],
  measurement: [
    { id:11, label:"Revenue Pipeline",       metric:"Active deals (QAR)", target:"500K",  current:"120K"  },
    { id:12, label:"Conversion Rate",        metric:"Lead→Call rate",     target:"15%",   current:"8%"    },
    { id:13, label:"Client Retention",       metric:"Retention rate",     target:"90%",   current:"100%"  },
    { id:14, label:"Brand Visibility",       metric:"Organic reach/mo",   target:"5000",  current:"1200"  },
    { id:15, label:"Marketing ROI",          metric:"Return on spend",    target:"4x",    current:"2.1x"  },
  ],
};

const PILLAR_META = {
  foundation:  { label:"Foundation",  color:"#6EB5C8" },
  execution:   { label:"Execution",   color:"var(--gold)" },
  measurement: { label:"Measurement", color:"#6EC87A" },
};

const STORAGE_KEY = "fc_framework_v1";

function loadData() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      foundation:  stored.foundation  || INITIAL_DATA.foundation,
      execution:   stored.execution   || INITIAL_DATA.execution,
      measurement: stored.measurement || INITIAL_DATA.measurement,
    };
  } catch { return INITIAL_DATA; }
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function getPct(current, target) {
  // Extract numbers from strings like "6/10", "70%", "+12%", "120K", "2.1x"
  const c = parseFloat(current.replace(/[^0-9.]/g,"")) || 0;
  const t = parseFloat(target.replace(/[^0-9.]/g,""))  || 100;
  if (t === 0) return 0;
  return Math.min(100, Math.round((c / t) * 100));
}

function statusColor(p) {
  if (p >= 75) return T.green;
  if (p >= 45) return T.amber;
  return T.red;
}

export default function FifteenFramework() {
  const [activeTab, setActiveTab] = useState("foundation");
  const [data, setData]           = useState(loadData);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const pillarMeta = PILLAR_META[activeTab];
  const items      = data[activeTab];

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditValue(item.current);
  };

  const commitEdit = () => {
    if (editingId === null) return;
    const updated = { ...data };
    Object.keys(updated).forEach(section => {
      updated[section] = updated[section].map(item =>
        item.id === editingId ? { ...item, current: editValue.trim() || item.current } : item
      );
    });
    setData(updated);
    saveData(updated);
    setEditingId(null);
    setEditValue("");
  };

  // All items for overview stats
  const allItems     = [...data.foundation, ...data.execution, ...data.measurement];
  const onTrackCount = allItems.filter(item => getPct(item.current, item.target) >= 75).length;

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
        <div style={{ fontSize:12,color:T.textMid,lineHeight:1.7 }}>
          15 minutes of executive attention · 15 key metrics · 15 strategic pillars
        </div>
      </div>

      {/* Overview stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:28 }}>
        {[
          { label:"Pillars On Track",  value:`${onTrackCount}/15`,                        color:T.green },
          { label:"Execution Score",   value:`${Math.round(onTrackCount/15*100)}%`,        color:T.gold  },
          { label:"Growth Stage",      value:"Building",                                   color:T.amber },
        ].map((s,i) => (
          <div key={i} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"18px 20px",textAlign:"center" }}>
            <div style={{ fontFamily:"var(--font-display)",fontSize:28,fontWeight:700,color:s.color,marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.1em",textTransform:"uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pillar tabs */}
      <div style={{ display:"flex",gap:8,marginBottom:20 }}>
        {Object.entries(PILLAR_META).map(([key,meta]) => {
          const active = activeTab === key;
          return (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              background: active ? meta.color+"22" : "none",
              border: `1px solid ${active ? meta.color : T.border}`,
              color: active ? meta.color : T.textMid,
              fontSize:11, fontWeight: active ? 700 : 400,
              padding:"8px 20px", borderRadius:8, cursor:"pointer",
              fontFamily:"var(--font-mono)", letterSpacing:"0.1em",
              textTransform:"uppercase", transition:"all 0.15s",
            }}>{meta.label}</button>
          );
        })}
      </div>

      {/* Pillar items */}
      <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20 }}>
        <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:16 }}>
          {pillarMeta.label} Pillars · Click any current value to update it
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12 }}>
          {items.map(item => {
            const p  = getPct(item.current, item.target);
            const sc = statusColor(p);
            const isEditing = editingId === item.id;

            return (
              <div key={item.id} style={{
                background: T.base, borderRadius:9, padding:"14px 16px",
                border: `1px solid ${p < 45 ? "#f8717144" : T.border}`,
                borderLeft: `2px solid ${sc}`,
              }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                  <div style={{ flex:1,minWidth:0,paddingRight:8 }}>
                    <div style={{ fontSize:9,color:T.textDim,marginBottom:3 }}>#{item.id}</div>
                    <div style={{ fontSize:12,fontWeight:600,color:T.text,lineHeight:1.3,marginBottom:2 }}>{item.label}</div>
                    <div style={{ fontSize:10,color:T.textMid }}>{item.metric}</div>
                  </div>

                  {/* Editable value */}
                  <div style={{ textAlign:"right",flexShrink:0 }}>
                    {isEditing ? (
                      <input
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={e => { if(e.key==="Enter") commitEdit(); if(e.key==="Escape"){ setEditingId(null); setEditValue(""); } }}
                        autoFocus
                        style={{
                          width:70, background:T.card,
                          border:`1px solid ${pillarMeta.color}`,
                          borderRadius:5, padding:"4px 8px",
                          fontSize:14, color:T.text,
                          fontFamily:"var(--font-mono)",
                          outline:"none", textAlign:"right",
                        }}
                      />
                    ) : (
                      <div
                        onClick={() => startEdit(item)}
                        title="Click to edit"
                        style={{
                          cursor:"pointer",
                          padding:"4px 8px",
                          borderRadius:5,
                          border:`1px solid transparent`,
                          transition:"all 0.15s",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = pillarMeta.color+"66";
                          e.currentTarget.style.background  = pillarMeta.color+"12";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = "transparent";
                          e.currentTarget.style.background  = "transparent";
                        }}
                      >
                        <div style={{ fontSize:16,fontWeight:700,color:sc,lineHeight:1 }}>{item.current}</div>
                        <div style={{ fontSize:9,color:T.textDim,marginTop:2 }}>/{item.target}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ background:T.border,borderRadius:3,height:3,overflow:"hidden",marginBottom:4 }}>
                  <div style={{ width:`${p}%`,height:"100%",background:sc,borderRadius:3,transition:"width 0.8s ease" }}/>
                </div>
                <div style={{ fontSize:9,color:sc,fontWeight:600 }}>
                  {p>=75?"On Track":p>=45?"At Risk":"Behind"} · {p}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tagline */}
      <div style={{ marginTop:20,padding:"14px 20px",background:"#C8A96E0a",border:`1px solid #C8A96E22`,borderRadius:10,textAlign:"center" }}>
        <div style={{ fontSize:13,color:T.gold,fontFamily:"var(--font-display)",fontStyle:"italic" }}>
          "Turn Marketing Complexity Into Measurable Growth"
        </div>
      </div>
    </div>
  );
}
