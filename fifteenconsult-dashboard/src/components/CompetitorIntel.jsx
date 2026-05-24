import { useState } from "react";

const COMP_KEY = "fc_competitors_v1";

const DEFAULT_COMPETITORS = {
  direct: [
    { id:1, name:"Elixirr", market:"GCC/Global", notes:"Strategy consultancy, premium positioning, strong digital presence", type:"direct" },
    { id:2, name:"BPG Group", market:"UAE/GCC", notes:"One of GCC's largest integrated communications groups", type:"direct" },
    { id:3, name:"MCN (Middle East Communications Network)", market:"GCC", notes:"Major regional agency network, WPP affiliate", type:"direct" },
  ],
  benchmark: [
    { id:4, name:"Accenture Song", market:"Global", notes:"World's largest creative agency. Study their AI + creativity integration", type:"benchmark" },
    { id:5, name:"Publicis Groupe", market:"Global", notes:"Study their 'Power of One' integrated model", type:"benchmark" },
    { id:6, name:"Dentsu", market:"Global/APAC", notes:"Strong in data-driven marketing and performance", type:"benchmark" },
  ],
};

function loadCompetitors() {
  try { return JSON.parse(localStorage.getItem(COMP_KEY) || JSON.stringify(DEFAULT_COMPETITORS)); }
  catch { return DEFAULT_COMPETITORS; }
}
function saveCompetitors(data) {
  try { localStorage.setItem(COMP_KEY, JSON.stringify(data)); } catch {}
}

export function getCompetitorContext() {
  const data = loadCompetitors();
  const direct    = data.direct.map(c=>`${c.name} (${c.market}): ${c.notes}`).join("\n");
  const benchmark = data.benchmark.map(c=>`${c.name} (${c.market}): ${c.notes}`).join("\n");
  return `DIRECT COMPETITORS:\n${direct}\n\nASPIRATIONAL BENCHMARKS:\n${benchmark}`;
}

function CompetitorRow({ comp, onDelete, onEdit, color }) {
  const [editing, setEditing] = useState(false);
  const [vals, setVals]       = useState(comp);

  if (editing) return (
    <div style={{ background:"var(--bg-base)",border:`1px solid ${color}44`,borderRadius:8,padding:"12px 14px",marginBottom:8 }}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8 }}>
        {[["name","Name"],["market","Market/Region"]].map(([k,l])=>(
          <input key={k} value={vals[k]} onChange={e=>setVals(p=>({...p,[k]:e.target.value}))}
            placeholder={l}
            style={{ background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none" }}/>
        ))}
      </div>
      <textarea value={vals.notes} onChange={e=>setVals(p=>({...p,notes:e.target.value}))}
        placeholder="Notes — what do they do, what can we learn?"
        rows={2}
        style={{ width:"100%",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none",resize:"none",marginBottom:8 }}/>
      <div style={{ display:"flex",gap:8 }}>
        <button onClick={()=>{ onEdit(vals); setEditing(false); }} style={{ background:color+"22",border:`1px solid ${color}`,color,borderRadius:6,padding:"5px 14px",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",fontFamily:"var(--font-mono)" }}>Save</button>
        <button onClick={()=>setEditing(false)} style={{ background:"none",border:"1px solid var(--border)",color:"var(--text-dim)",borderRadius:6,padding:"5px 14px",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)" }}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:8,marginBottom:6 }}>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3 }}>
          <span style={{ fontSize:12,fontWeight:600,color:"var(--text)" }}>{comp.name}</span>
          <span style={{ fontSize:9,color:color,background:color+"18",padding:"1px 7px",borderRadius:10,fontWeight:600 }}>{comp.market}</span>
        </div>
        <div style={{ fontSize:11,color:"var(--text-dim)",lineHeight:1.5 }}>{comp.notes}</div>
      </div>
      <div style={{ display:"flex",gap:4,flexShrink:0 }}>
        <button onClick={()=>setEditing(true)} style={{ background:"none",border:"none",color:"var(--text-dim)",cursor:"pointer",fontSize:13 }}
          onMouseEnter={e=>e.currentTarget.style.color=color}
          onMouseLeave={e=>e.currentTarget.style.color="var(--text-dim)"}>✏️</button>
        <button onClick={()=>onDelete(comp.id)} style={{ background:"none",border:"none",color:"var(--text-dim)",cursor:"pointer",fontSize:13 }}
          onMouseEnter={e=>e.currentTarget.style.color="#f87171"}
          onMouseLeave={e=>e.currentTarget.style.color="var(--text-dim)"}>×</button>
      </div>
    </div>
  );
}

export default function CompetitorIntel({ color="#34D399" }) {
  const [data, setData]   = useState(loadCompetitors);
  const [tab, setTab]     = useState("direct");
  const [adding, setAdding] = useState(false);
  const [newComp, setNewComp] = useState({ name:"",market:"",notes:"" });

  const items = data[tab];

  const addCompetitor = () => {
    if (!newComp.name) return;
    const updated = { ...data, [tab]: [...data[tab], { ...newComp, id:Date.now(), type:tab }] };
    setData(updated);
    saveCompetitors(updated);
    setNewComp({ name:"",market:"",notes:"" });
    setAdding(false);
  };

  const deleteCompetitor = (id) => {
    const updated = { ...data, [tab]: data[tab].filter(c=>c.id!==id) };
    setData(updated);
    saveCompetitors(updated);
  };

  const editCompetitor = (vals) => {
    const updated = { ...data, [tab]: data[tab].map(c=>c.id===vals.id?vals:c) };
    setData(updated);
    saveCompetitors(updated);
  };

  return (
    <div style={{ marginTop:20,background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:18 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
        <div>
          <div style={{ fontSize:12,fontWeight:600,color:"var(--text)",marginBottom:2 }}>🎯 Competitor Intelligence</div>
          <div style={{ fontSize:10,color:"var(--text-dim)" }}>David uses this for competitive analysis and strategic recommendations</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:6,marginBottom:14 }}>
        {[["direct","Direct Competitors"],["benchmark","Aspirational Benchmarks"]].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{
            background:tab===key?color+"18":"none",
            border:`1px solid ${tab===key?color:"var(--border)"}`,
            color:tab===key?color:"var(--text-dim)",
            fontSize:10,fontWeight:tab===key?700:400,
            padding:"5px 14px",borderRadius:7,cursor:"pointer",
            fontFamily:"var(--font-mono)",letterSpacing:"0.08em",textTransform:"uppercase",
          }}>{label} ({data[key].length})</button>
        ))}
      </div>

      {/* List */}
      {items.map(comp=>(
        <CompetitorRow key={comp.id} comp={comp} color={color} onDelete={deleteCompetitor} onEdit={editCompetitor}/>
      ))}

      {/* Add new */}
      {adding ? (
        <div style={{ background:"var(--bg-base)",border:`1px solid ${color}44`,borderRadius:8,padding:"12px 14px",marginTop:8 }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8 }}>
            {[["name","Company name *"],["market","Market/Region"]].map(([k,l])=>(
              <input key={k} value={newComp[k]} onChange={e=>setNewComp(p=>({...p,[k]:e.target.value}))}
                placeholder={l}
                style={{ background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none" }}/>
            ))}
          </div>
          <textarea value={newComp.notes} onChange={e=>setNewComp(p=>({...p,notes:e.target.value}))}
            placeholder="Notes — what do they do, what can we learn from them?"
            rows={2}
            style={{ width:"100%",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none",resize:"none",marginBottom:8 }}/>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={addCompetitor} style={{ background:color+"22",border:`1px solid ${color}`,color,borderRadius:6,padding:"5px 14px",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",fontFamily:"var(--font-mono)" }}>Add</button>
            <button onClick={()=>setAdding(false)} style={{ background:"none",border:"1px solid var(--border)",color:"var(--text-dim)",borderRadius:6,padding:"5px 14px",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={()=>setAdding(true)} style={{ width:"100%",background:"none",border:`1px dashed ${color}55`,borderRadius:8,padding:"8px",color:color,fontSize:10,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",fontFamily:"var(--font-mono)",marginTop:6,transition:"all 0.15s" }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=color}
          onMouseLeave={e=>e.currentTarget.style.borderColor=color+"55"}>
          + Add {tab==="direct"?"Competitor":"Benchmark"}
        </button>
      )}
    </div>
  );
}
