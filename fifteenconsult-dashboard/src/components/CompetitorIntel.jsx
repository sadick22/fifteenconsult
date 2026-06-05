import { isFirebaseEnabled, cloudSave } from "../lib/firebase.js";
import { useState, useRef } from "react";

const COMP_KEY = "fc_competitors_v1";

const DEFAULT_COMPETITORS = {
  direct: [
    { id:1, name:"Elixirr",  market:"GCC/Global", url:"https://elixirr.com",    notes:"Strategy consultancy, premium positioning, strong digital presence. Direct challenger competitor — expanding to Riyadh.", type:"direct" },
    { id:2, name:"BPG Group", market:"UAE/GCC",   url:"https://bpggroup.com",   notes:"One of GCC's largest integrated communications groups. Won Emaar hospitality account.", type:"direct" },
    { id:3, name:"MCN Middle East", market:"GCC", url:"https://mcnme.com",      notes:"Major regional agency network, WPP affiliate. Full-service but generic positioning.", type:"direct" },
  ],
  benchmark: [
    { id:4, name:"Accenture Song", market:"Global", url:"https://www.accenture.com/us-en/services/song-index", notes:"World's largest creative agency. Study their AI + creativity integration.", type:"benchmark" },
    { id:5, name:"Publicis Groupe", market:"Global", url:"https://www.publicisgroupe.com", notes:"Study their 'Power of One' integrated model.", type:"benchmark" },
    { id:6, name:"Dentsu",         market:"Global/APAC", url:"https://www.dentsu.com", notes:"Strong in data-driven marketing and performance.", type:"benchmark" },
  ],
};

function loadCompetitors() {
  try { return JSON.parse(localStorage.getItem(COMP_KEY) || JSON.stringify(DEFAULT_COMPETITORS)); }
  catch { return DEFAULT_COMPETITORS; }
}
function saveCompetitors(data) {
  try { localStorage.setItem(COMP_KEY, JSON.stringify(data)); } catch {}
  if (isFirebaseEnabled()) cloudSave("dashboard", "competitors", data).catch(()=>{});
}

export function getCompetitorContext() {
  const data = loadCompetitors();
  const direct    = data.direct.map(c=>`${c.name} (${c.market})${c.url?` — ${c.url}`:""}: ${c.notes}`).join("\n");
  const benchmark = data.benchmark.map(c=>`${c.name} (${c.market})${c.url?` — ${c.url}`:""}: ${c.notes}`).join("\n");
  return `DIRECT COMPETITORS:\n${direct}\n\nASPIRATIONAL BENCHMARKS:\n${benchmark}`;
}

function CompetitorRow({ comp, onDelete, onEdit, onFetch, color, fetching }) {
  const [editing, setEditing] = useState(false);
  const [vals, setVals]       = useState({...comp});
  const [fetchResult, setFetchResult] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  const handleFetch = async () => {
    if (!comp.url) return;
    setFetchLoading(true);
    const result = await onFetch(comp.url, comp.name);
    setFetchResult(result);
    setFetchLoading(false);
  };

  if (editing) return (
    <div style={{ background:"var(--bg-base)",border:`1px solid ${color}44`,borderRadius:8,padding:"12px 14px",marginBottom:8 }}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8 }}>
        {[["name","Company name *"],["market","Market/Region"],["url","Website URL (https://...)"]].map(([k,l])=>(
          <input key={k} value={vals[k]||""} onChange={e=>setVals(p=>({...p,[k]:e.target.value}))}
            placeholder={l}
            style={{ background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none",
              ...(k==="url"?{gridColumn:"1/-1"}:{}) }}/>
        ))}
      </div>
      <textarea value={vals.notes||""} onChange={e=>setVals(p=>({...p,notes:e.target.value}))}
        placeholder="Notes — what do they do, what's their positioning, what can we learn?"
        rows={2}
        style={{ width:"100%",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none",resize:"none",marginBottom:8,boxSizing:"border-box" }}/>
      <div style={{ display:"flex",gap:8 }}>
        <button onClick={()=>{ onEdit(vals); setEditing(false); }} style={{ background:color+"22",border:`1px solid ${color}`,color,borderRadius:6,padding:"5px 14px",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",fontFamily:"var(--font-mono)" }}>Save</button>
        <button onClick={()=>setEditing(false)} style={{ background:"none",border:"1px solid var(--border)",color:"var(--text-dim)",borderRadius:6,padding:"5px 14px",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)" }}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div style={{ background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:8,marginBottom:6,overflow:"hidden" }}>
      {/* Main row */}
      <div style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px" }}>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap" }}>
            <span style={{ fontSize:12,fontWeight:600,color:"var(--text)" }}>{comp.name}</span>
            <span style={{ fontSize:9,color,background:color+"18",padding:"1px 7px",borderRadius:10,fontWeight:600 }}>{comp.market}</span>
            {comp.url && (
              <a href={comp.url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize:9,color:"var(--text-dim)",textDecoration:"none",fontFamily:"var(--font-mono)" }}
                onMouseEnter={e=>e.currentTarget.style.color=color}
                onMouseLeave={e=>e.currentTarget.style.color="var(--text-dim)"}>
                {comp.url.replace("https://","").replace("http://","").split("/")[0]} ↗
              </a>
            )}
          </div>
          <div style={{ fontSize:11,color:"var(--text-dim)",lineHeight:1.5 }}>{comp.notes}</div>
        </div>
        <div style={{ display:"flex",gap:4,flexShrink:0,alignItems:"center" }}>
          {comp.url && (
            <button
              onClick={handleFetch}
              disabled={fetchLoading}
              title="Fetch & analyse this website"
              style={{ background:fetchLoading?"none":color+"18",border:`1px solid ${color}44`,color,borderRadius:6,padding:"4px 10px",fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:fetchLoading?"not-allowed":"pointer",fontFamily:"var(--font-mono)",transition:"all 0.15s" }}
              onMouseEnter={e=>{ if(!fetchLoading) e.currentTarget.style.background=color+"30"; }}
              onMouseLeave={e=>{ if(!fetchLoading) e.currentTarget.style.background=color+"18"; }}
            >
              {fetchLoading ? "Fetching..." : "🔍 Fetch"}
            </button>
          )}
          <button onClick={()=>setEditing(true)} style={{ background:"none",border:"none",color:"var(--text-dim)",cursor:"pointer",fontSize:13 }}
            onMouseEnter={e=>e.currentTarget.style.color=color}
            onMouseLeave={e=>e.currentTarget.style.color="var(--text-dim)"}>✏️</button>
          <button onClick={()=>onDelete(comp.id)} style={{ background:"none",border:"none",color:"var(--text-dim)",cursor:"pointer",fontSize:13 }}
            onMouseEnter={e=>e.currentTarget.style.color="#f87171"}
            onMouseLeave={e=>e.currentTarget.style.color="var(--text-dim)"}>×</button>
        </div>
      </div>

      {/* Fetch result */}
      {fetchResult && (
        <div style={{ borderTop:"1px solid var(--border)",padding:"10px 12px",background:"var(--bg-card)" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
            <div style={{ fontSize:10,color,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase" }}>
              🔍 Website Analysis — {comp.name}
            </div>
            <button onClick={()=>setFetchResult(null)} style={{ background:"none",border:"none",color:"var(--text-dim)",cursor:"pointer",fontSize:13 }}>×</button>
          </div>
          {fetchResult.error ? (
            <div style={{ fontSize:11,color:"#f87171" }}>⚠ {fetchResult.error}</div>
          ) : (
            <div style={{ fontSize:11,color:"var(--text-dim)",lineHeight:1.8,whiteSpace:"pre-wrap",maxHeight:200,overflowY:"auto" }}>
              {fetchResult.summary}
            </div>
          )}
          <div style={{ fontSize:10,color:"var(--text-dim)",marginTop:6,opacity:0.6 }}>
            Copy this analysis and paste into David's chat for strategic recommendations.
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompetitorIntel({ color="#34D399" }) {
  const [data, setData]     = useState(loadCompetitors);
  const [tab, setTab]       = useState("direct");
  const [adding, setAdding] = useState(false);
  const [newComp, setNewComp] = useState({ name:"",market:"",url:"",notes:"" });

  const items = data[tab];

  const fetchCompetitor = async (url, name) => {
    try {
      const res = await fetch("/api/seo?tool=schema&url=" + encodeURIComponent(url));
      const schema = await res.json();

      // Also do a basic web fetch via our news proxy trick
      const summary = [
        `WEBSITE: ${url}`,
        schema.meta?.title ? `Title: ${schema.meta.title}` : "",
        schema.meta?.description ? `Description: ${schema.meta.description}` : "",
        schema.meta?.hasOG ? "✓ Open Graph tags present" : "✗ No Open Graph tags",
        schema.meta?.hasCanonical ? "✓ Canonical URL set" : "✗ No canonical URL",
        schema.schemas?.count > 0 ? `✓ ${schema.schemas.count} schema markup types: ${schema.schemas.types?.join(", ")}` : "✗ No schema markup",
        `SEO Score: ${schema.score}/100`,
        schema.recommendations?.length > 0 ? `\nSEO Issues:\n${schema.recommendations.join("\n")}` : "",
        `\nFor deeper analysis: Open David's chat and say "Fetch and analyse ${url} — give me competitive intelligence on their positioning, services, messaging, and what FifteenConsult should do differently."`,
      ].filter(Boolean).join("\n");

      return { summary };
    } catch (err) {
      return { error: err.message };
    }
  };

  const addCompetitor = () => {
    if (!newComp.name) return;
    const updated = { ...data, [tab]: [...data[tab], { ...newComp, id:Date.now(), type:tab }] };
    setData(updated);
    saveCompetitors(updated);
    setNewComp({ name:"",market:"",url:"",notes:"" });
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
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
        <div>
          <div style={{ fontSize:12,fontWeight:600,color:"var(--text)",marginBottom:2 }}>🎯 Competitor Intelligence</div>
          <div style={{ fontSize:10,color:"var(--text-dim)" }}>Add website URLs — click Fetch to analyse any competitor's site. David uses this for competitive strategy.</div>
        </div>
      </div>

      {/* How to use hint */}
      <div style={{ background:color+"10",border:`1px solid ${color}33`,borderRadius:7,padding:"8px 12px",marginBottom:14,fontSize:10,color:"var(--text-dim)",lineHeight:1.7 }}>
        💡 <strong style={{ color:"var(--text)" }}>How to use:</strong> Add competitor website URL → click <strong style={{ color }}>Fetch</strong> to get their SEO and positioning data → copy the analysis → paste into David's chat for strategic recommendations.
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
        <CompetitorRow key={comp.id} comp={comp} color={color} onDelete={deleteCompetitor} onEdit={editCompetitor} onFetch={fetchCompetitor}/>
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
          <input value={newComp.url} onChange={e=>setNewComp(p=>({...p,url:e.target.value}))}
            placeholder="Website URL (https://example.com) — required for web fetch"
            style={{ width:"100%",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none",marginBottom:8,boxSizing:"border-box" }}/>
          <textarea value={newComp.notes} onChange={e=>setNewComp(p=>({...p,notes:e.target.value}))}
            placeholder="Notes — what do they do, what's their positioning, what can we learn?"
            rows={2}
            style={{ width:"100%",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none",resize:"none",marginBottom:8,boxSizing:"border-box" }}/>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={addCompetitor} style={{ background:color+"22",border:`1px solid ${color}`,color,borderRadius:6,padding:"5px 14px",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",fontFamily:"var(--font-mono)" }}>Add</button>
            <button onClick={()=>setAdding(false)} style={{ background:"none",border:"1px solid var(--border)",color:"var(--text-dim)",borderRadius:6,padding:"5px 14px",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={()=>setAdding(true)} style={{ width:"100%",background:"none",border:`1px dashed ${color}55`,borderRadius:8,padding:"8px",color,fontSize:10,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",fontFamily:"var(--font-mono)",marginTop:6,transition:"all 0.15s" }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=color}
          onMouseLeave={e=>e.currentTarget.style.borderColor=color+"55"}>
          + Add {tab==="direct"?"Competitor":"Benchmark"}
        </button>
      )}
    </div>
  );
}
