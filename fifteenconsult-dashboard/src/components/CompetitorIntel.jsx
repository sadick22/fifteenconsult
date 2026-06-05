import { isFirebaseEnabled, cloudSave } from "../lib/firebase.js";
import { useState, useRef } from "react";

const COMP_KEY = "fc_competitors_v1";

const DEFAULT_COMPETITORS = {
  direct: [
    { id:1, name:"Elixirr",  market:"GCC/Global", urls:[
        { url:"https://elixirr.com", label:"Homepage" },
        { url:"https://elixirr.com/what-we-do", label:"What We Do" },
        { url:"https://elixirr.com/our-work", label:"Our Work" },
      ], notes:"Strategy consultancy, premium positioning, strong digital presence. Direct challenger competitor — expanding to Riyadh.", type:"direct" },
    { id:2, name:"BPG Group", market:"UAE/GCC", urls:[
        { url:"https://bpggroup.com", label:"Homepage" },
        { url:"https://bpggroup.com/services", label:"Services" },
      ], notes:"One of GCC's largest integrated communications groups. Won Emaar hospitality account.", type:"direct" },
    { id:3, name:"MCN Middle East", market:"GCC", urls:[
        { url:"https://mcnme.com", label:"Homepage" },
      ], notes:"Major regional agency network, WPP affiliate. Full-service but generic positioning.", type:"direct" },
  ],
  benchmark: [
    { id:4, name:"Accenture Song", market:"Global", urls:[
        { url:"https://www.accenture.com/us-en/services/song-index", label:"Homepage" },
      ], notes:"World's largest creative agency. Study their AI + creativity integration.", type:"benchmark" },
    { id:5, name:"Publicis Groupe", market:"Global", urls:[
        { url:"https://www.publicisgroupe.com", label:"Homepage" },
      ], notes:"Study their 'Power of One' integrated model.", type:"benchmark" },
    { id:6, name:"Dentsu", market:"Global/APAC", urls:[
        { url:"https://www.dentsu.com", label:"Homepage" },
      ], notes:"Strong in data-driven marketing and performance.", type:"benchmark" },
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
  const fmt = c => {
    const urlList = (c.urls||[]).map(u=>`${u.label}: ${u.url}`).join(", ");
    return `${c.name} (${c.market})${urlList?` — URLs: [${urlList}]`:""}: ${c.notes}`;
  };
  const direct    = data.direct.map(fmt).join("\n");
  const benchmark = data.benchmark.map(fmt).join("\n");
  return `DIRECT COMPETITORS:\n${direct}\n\nASPIRATIONAL BENCHMARKS:\n${benchmark}\n\nTo analyse any competitor, say: "Fetch [URL] and give me competitive intelligence on their positioning, services, and messaging."`;
}

function CompetitorRow({ comp, onDelete, onEdit, onFetch, color }) {
  const [editing, setEditing]         = useState(false);
  const [vals, setVals]               = useState({...comp, urls: comp.urls||[]});
  const [fetchResults, setFetchResults] = useState({});
  const [fetchingUrl, setFetchingUrl] = useState(null);
  const [newUrl, setNewUrl]           = useState({ url:"", label:"" });
  const [addingUrl, setAddingUrl]     = useState(false);

  const handleFetch = async (urlObj) => {
    setFetchingUrl(urlObj.url);
    const result = await onFetch(urlObj.url, comp.name, urlObj.label);
    setFetchResults(prev => ({ ...prev, [urlObj.url]: result }));
    setFetchingUrl(null);
  };

  const handleFetchAll = async () => {
    for (const urlObj of (comp.urls||[])) {
      setFetchingUrl(urlObj.url);
      const result = await onFetch(urlObj.url, comp.name, urlObj.label);
      setFetchResults(prev => ({ ...prev, [urlObj.url]: result }));
    }
    setFetchingUrl(null);
  };

  const addUrl = () => {
    if (!newUrl.url) return;
    const url = newUrl.url.startsWith("http") ? newUrl.url : "https://" + newUrl.url;
    setVals(p => ({ ...p, urls: [...(p.urls||[]), { url, label: newUrl.label || url.split("/").pop() || "Page" }] }));
    setNewUrl({ url:"", label:"" });
    setAddingUrl(false);
  };

  const removeUrl = (url) => {
    setVals(p => ({ ...p, urls: (p.urls||[]).filter(u=>u.url!==url) }));
  };

  if (editing) return (
    <div style={{ background:"var(--bg-base)",border:`1px solid ${color}44`,borderRadius:8,padding:"12px 14px",marginBottom:8 }}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8 }}>
        {[["name","Company name *"],["market","Market/Region"]].map(([k,l])=>(
          <input key={k} value={vals[k]||""} onChange={e=>setVals(p=>({...p,[k]:e.target.value}))}
            placeholder={l}
            style={{ background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none" }}/>
        ))}
      </div>

      {/* URL list */}
      <div style={{ marginBottom:8 }}>
        <div style={{ fontSize:10,color:"var(--text-dim)",marginBottom:4,letterSpacing:"0.08em",textTransform:"uppercase" }}>Website Pages to Monitor</div>
        {(vals.urls||[]).map((u,i)=>(
          <div key={i} style={{ display:"flex",gap:6,marginBottom:4,alignItems:"center" }}>
            <span style={{ fontSize:10,color:color,background:color+"18",padding:"2px 8px",borderRadius:4,flexShrink:0 }}>{u.label}</span>
            <span style={{ fontSize:10,color:"var(--text-dim)",fontFamily:"var(--font-mono)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{u.url}</span>
            <button onClick={()=>removeUrl(u.url)} style={{ background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:12,flexShrink:0 }}>×</button>
          </div>
        ))}
        {addingUrl ? (
          <div style={{ display:"flex",gap:6,marginTop:6 }}>
            <input value={newUrl.label} onChange={e=>setNewUrl(p=>({...p,label:e.target.value}))}
              placeholder="Label (e.g. Services)"
              style={{ background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:"5px 8px",fontSize:11,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none",width:100 }}/>
            <input value={newUrl.url} onChange={e=>setNewUrl(p=>({...p,url:e.target.value}))}
              placeholder="https://example.com/page"
              style={{ background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:"5px 8px",fontSize:11,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none",flex:1 }}/>
            <button onClick={addUrl} style={{ background:color+"22",border:`1px solid ${color}`,color,borderRadius:6,padding:"4px 10px",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)",flexShrink:0 }}>Add</button>
            <button onClick={()=>setAddingUrl(false)} style={{ background:"none",border:"1px solid var(--border)",color:"var(--text-dim)",borderRadius:6,padding:"4px 8px",fontSize:10,cursor:"pointer",flexShrink:0 }}>✕</button>
          </div>
        ) : (
          <button onClick={()=>setAddingUrl(true)} style={{ background:"none",border:`1px dashed ${color}44`,borderRadius:6,padding:"4px 12px",color,fontSize:9,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"var(--font-mono)",marginTop:4 }}>+ Add URL</button>
        )}
      </div>

      <textarea value={vals.notes||""} onChange={e=>setVals(p=>({...p,notes:e.target.value}))}
        placeholder="Notes — positioning, strengths, weaknesses, what FifteenConsult should do differently"
        rows={2}
        style={{ width:"100%",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none",resize:"none",marginBottom:8,boxSizing:"border-box" }}/>
      <div style={{ display:"flex",gap:8 }}>
        <button onClick={()=>{ onEdit(vals); setEditing(false); }} style={{ background:color+"22",border:`1px solid ${color}`,color,borderRadius:6,padding:"5px 14px",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",fontFamily:"var(--font-mono)" }}>Save</button>
        <button onClick={()=>setEditing(false)} style={{ background:"none",border:"1px solid var(--border)",color:"var(--text-dim)",borderRadius:6,padding:"5px 14px",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)" }}>Cancel</button>
      </div>
    </div>
  );

  const urls = comp.urls || [];

  return (
    <div style={{ background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:8,marginBottom:6,overflow:"hidden" }}>
      {/* Header */}
      <div style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px" }}>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap" }}>
            <span style={{ fontSize:12,fontWeight:600,color:"var(--text)" }}>{comp.name}</span>
            <span style={{ fontSize:9,color,background:color+"18",padding:"1px 7px",borderRadius:10,fontWeight:600 }}>{comp.market}</span>
            <span style={{ fontSize:9,color:"var(--text-dim)" }}>{urls.length} page{urls.length!==1?"s":""}</span>
          </div>
          <div style={{ fontSize:11,color:"var(--text-dim)",lineHeight:1.5 }}>{comp.notes}</div>
        </div>
        <div style={{ display:"flex",gap:4,flexShrink:0 }}>
          {urls.length > 1 && (
            <button onClick={handleFetchAll} disabled={!!fetchingUrl}
              style={{ background:color+"18",border:`1px solid ${color}44`,color,borderRadius:6,padding:"4px 10px",fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:fetchingUrl?"not-allowed":"pointer",fontFamily:"var(--font-mono)" }}>
              {fetchingUrl ? "..." : "🔍 All"}
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

      {/* URL list with individual fetch buttons */}
      {urls.length > 0 && (
        <div style={{ borderTop:"1px solid var(--border)",padding:"8px 12px",display:"flex",flexDirection:"column",gap:4 }}>
          {urls.map((u,i)=>(
            <div key={i}>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <span style={{ fontSize:9,color,background:color+"18",padding:"2px 8px",borderRadius:4,flexShrink:0,fontWeight:600 }}>{u.label}</span>
                <a href={u.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:10,color:"var(--text-dim)",fontFamily:"var(--font-mono)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:"none" }}
                  onMouseEnter={e=>e.currentTarget.style.color=color}
                  onMouseLeave={e=>e.currentTarget.style.color="var(--text-dim)"}>
                  {u.url.replace("https://","").replace("http://","")} ↗
                </a>
                <button onClick={()=>handleFetch(u)} disabled={fetchingUrl===u.url}
                  style={{ background:"none",border:`1px solid ${color}44`,color,borderRadius:5,padding:"3px 8px",fontSize:9,fontWeight:700,cursor:fetchingUrl===u.url?"not-allowed":"pointer",fontFamily:"var(--font-mono)",flexShrink:0 }}>
                  {fetchingUrl===u.url ? "..." : "Fetch"}
                </button>
              </div>
              {/* Individual fetch result */}
              {fetchResults[u.url] && (
                <div style={{ marginTop:6,background:"var(--bg-card)",borderRadius:6,padding:"8px 10px",border:`1px solid ${color}22` }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
                    <span style={{ fontSize:9,color,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em" }}>{u.label} Analysis</span>
                    <button onClick={()=>setFetchResults(p=>({...p,[u.url]:null}))} style={{ background:"none",border:"none",color:"var(--text-dim)",cursor:"pointer",fontSize:11 }}>×</button>
                  </div>
                  {fetchResults[u.url].error ? (
                    <div style={{ fontSize:10,color:"#f87171" }}>⚠ {fetchResults[u.url].error}</div>
                  ) : (
                    <div style={{ fontSize:10,color:"var(--text-dim)",lineHeight:1.7,whiteSpace:"pre-wrap",maxHeight:150,overflowY:"auto" }}>{fetchResults[u.url].summary}</div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div style={{ fontSize:9,color:"var(--text-dim)",marginTop:4,opacity:0.7 }}>
            💡 After fetching, paste results into David's chat: "Analyse this competitor data and give me FifteenConsult's competitive positioning against {comp.name}"
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
  const [newComp, setNewComp] = useState({ name:"",market:"",urls:[],notes:"" });
  const [newUrl, setNewUrl]   = useState({ url:"", label:"" });
  const [addingUrl, setAddingUrl] = useState(false);

  const items = data[tab];

  const fetchPage = async (url, name, label) => {
    try {
      const res = await fetch("/api/seo?tool=schema&url=" + encodeURIComponent(url));
      const schema = await res.json();
      const summary = [
        `PAGE: ${url}`,
        schema.meta?.title       ? `Title: "${schema.meta.title}"` : "",
        schema.meta?.description ? `Description: "${schema.meta.description}"` : "⚠ No meta description",
        schema.meta?.hasOG       ? "✓ Open Graph present" : "✗ No Open Graph",
        schema.schemas?.count > 0 ? `✓ Schema: ${schema.schemas.types?.join(", ")}` : "✗ No schema markup",
        `SEO Score: ${schema.score}/100`,
        schema.recommendations?.length ? `Issues: ${schema.recommendations.join(" | ")}` : "",
        `→ Paste into David's chat: "Fetch ${url} and analyse ${name}'s ${label} — positioning, messaging, services, and how FifteenConsult should compete."`,
      ].filter(Boolean).join("\n");
      return { summary };
    } catch (err) {
      return { error: err.message };
    }
  };

  const addUrlToNew = () => {
    if (!newUrl.url) return;
    const url = newUrl.url.startsWith("http") ? newUrl.url : "https://" + newUrl.url;
    setNewComp(p => ({ ...p, urls: [...(p.urls||[]), { url, label: newUrl.label || "Page" }] }));
    setNewUrl({ url:"", label:"" });
    setAddingUrl(false);
  };

  const addCompetitor = () => {
    if (!newComp.name) return;
    const updated = { ...data, [tab]: [...data[tab], { ...newComp, id:Date.now(), type:tab }] };
    setData(updated);
    saveCompetitors(updated);
    setNewComp({ name:"",market:"",urls:[],notes:"" });
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
      <div style={{ marginBottom:6 }}>
        <div style={{ fontSize:12,fontWeight:600,color:"var(--text)",marginBottom:2 }}>🎯 Competitor Intelligence</div>
        <div style={{ fontSize:10,color:"var(--text-dim)" }}>Add multiple pages per competitor — homepage, services, work, about. Fetch each page, then paste into David's chat for deep competitive analysis.</div>
      </div>

      <div style={{ background:color+"10",border:`1px solid ${color}33`,borderRadius:7,padding:"8px 12px",marginBottom:14,fontSize:10,color:"var(--text-dim)",lineHeight:1.7 }}>
        💡 <strong style={{ color:"var(--text)" }}>Workflow:</strong> Add competitor → add multiple page URLs (homepage, services, about, work) → click <strong style={{ color }}>Fetch</strong> on each → copy results → paste into <strong style={{ color:"var(--text)" }}>David's chat</strong> for strategic analysis.
      </div>

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

      {items.map(comp=>(
        <CompetitorRow key={comp.id} comp={comp} color={color} onDelete={deleteCompetitor} onEdit={editCompetitor} onFetch={fetchPage}/>
      ))}

      {adding ? (
        <div style={{ background:"var(--bg-base)",border:`1px solid ${color}44`,borderRadius:8,padding:"12px 14px",marginTop:8 }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8 }}>
            {[["name","Company name *"],["market","Market/Region"]].map(([k,l])=>(
              <input key={k} value={newComp[k]} onChange={e=>setNewComp(p=>({...p,[k]:e.target.value}))}
                placeholder={l}
                style={{ background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none" }}/>
            ))}
          </div>

          {/* URLs */}
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:10,color:"var(--text-dim)",marginBottom:6,letterSpacing:"0.08em",textTransform:"uppercase" }}>Website Pages</div>
            {(newComp.urls||[]).map((u,i)=>(
              <div key={i} style={{ display:"flex",gap:6,marginBottom:4,alignItems:"center" }}>
                <span style={{ fontSize:10,color,background:color+"18",padding:"2px 8px",borderRadius:4,flexShrink:0 }}>{u.label}</span>
                <span style={{ fontSize:10,color:"var(--text-dim)",fontFamily:"var(--font-mono)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{u.url}</span>
                <button onClick={()=>setNewComp(p=>({...p,urls:p.urls.filter((_,j)=>j!==i)}))} style={{ background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:12 }}>×</button>
              </div>
            ))}
            {addingUrl ? (
              <div style={{ display:"flex",gap:6,marginTop:4 }}>
                <input value={newUrl.label} onChange={e=>setNewUrl(p=>({...p,label:e.target.value}))}
                  placeholder="Label (e.g. Services)"
                  style={{ background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:"5px 8px",fontSize:11,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none",width:100 }}/>
                <input value={newUrl.url} onChange={e=>setNewUrl(p=>({...p,url:e.target.value}))}
                  placeholder="https://example.com/page"
                  style={{ background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:"5px 8px",fontSize:11,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none",flex:1 }}/>
                <button onClick={addUrlToNew} style={{ background:color+"22",border:`1px solid ${color}`,color,borderRadius:6,padding:"4px 10px",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)",flexShrink:0 }}>Add</button>
                <button onClick={()=>setAddingUrl(false)} style={{ background:"none",border:"1px solid var(--border)",color:"var(--text-dim)",borderRadius:6,padding:"4px 8px",fontSize:10,cursor:"pointer",flexShrink:0 }}>✕</button>
              </div>
            ) : (
              <button onClick={()=>setAddingUrl(true)} style={{ background:"none",border:`1px dashed ${color}44`,borderRadius:6,padding:"4px 12px",color,fontSize:9,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontFamily:"var(--font-mono)",marginTop:4 }}>+ Add URL</button>
            )}
          </div>

          <textarea value={newComp.notes} onChange={e=>setNewComp(p=>({...p,notes:e.target.value}))}
            placeholder="Notes — what do they do, what's their positioning, what can we learn?"
            rows={2}
            style={{ width:"100%",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:"7px 10px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none",resize:"none",marginBottom:8,boxSizing:"border-box" }}/>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={addCompetitor} style={{ background:color+"22",border:`1px solid ${color}`,color,borderRadius:6,padding:"5px 14px",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",fontFamily:"var(--font-mono)" }}>Add Competitor</button>
            <button onClick={()=>{ setAdding(false); setNewComp({name:"",market:"",urls:[],notes:""}); }} style={{ background:"none",border:"1px solid var(--border)",color:"var(--text-dim)",borderRadius:6,padding:"5px 14px",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={()=>setAdding(true)} style={{ width:"100%",background:"none",border:`1px dashed ${color}55`,borderRadius:8,padding:"8px",color,fontSize:10,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",fontFamily:"var(--font-mono)",marginTop:6 }}>
          + Add {tab==="direct"?"Competitor":"Benchmark"}
        </button>
      )}
    </div>
  );
}
