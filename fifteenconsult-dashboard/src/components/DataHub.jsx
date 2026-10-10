import { useState, useEffect } from "react";
import {
  loadDataHub, subscribeDataHub,
  addClient, updateClient, removeClient,
  addDocument, updateDocument, removeDocument,
  addAsset, updateAsset, removeAsset,
} from "../lib/datahub.js";

/**
 * DataHub — one page for Mumin Consult's shared company data.
 * Three tabs: Clients · Documents · Assets.
 * Everything saved here is injected (lean) into all 11 agents automatically.
 */

const T = {
  base:"var(--bg-base)", card:"var(--bg-card)", border:"var(--border)",
  text:"var(--text)", textMid:"var(--text-mid)", textDim:"var(--text-dim)",
  gold:"var(--gold)", green:"var(--green)", amber:"var(--amber)", red:"var(--red)",
};

const STATUS_COLORS = { active:"#6EC87A", "pro bono":"#6EB5C8", past:"#8b96ac", prospect:"#C8A96E" };

const inputStyle = {
  background:T.card, border:`1px solid ${T.border}`, borderRadius:6,
  padding:"8px 10px", fontSize:12, color:T.text, fontFamily:"var(--font-mono)",
  outline:"none", width:"100%", boxSizing:"border-box",
};
const btnStyle = (color, filled=false) => ({
  background: filled ? color : "none", border:`1px solid ${filled?color:T.border}`,
  color: filled ? "#000" : T.textDim, borderRadius:6, padding:"6px 14px",
  fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
  cursor:"pointer", fontFamily:"var(--font-mono)",
});

// ─────────────────────────────── CLIENTS ───────────────────────────────
function ClientForm({ initial, onSave, onCancel, color }) {
  const [v, setV] = useState(initial || { name:"", industry:"", status:"active", services:"", notes:"" });
  const set = (k) => (e) => setV(p => ({ ...p, [k]: e.target.value }));
  return (
    <div style={{ background:T.base, border:`1px solid ${color}44`, borderRadius:10, padding:14, marginBottom:10 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:8 }}>
        <input value={v.name} onChange={set("name")} placeholder="Client name *" style={inputStyle}/>
        <input value={v.industry} onChange={set("industry")} placeholder="Industry (e.g. Real Estate)" style={inputStyle}/>
        <select value={v.status} onChange={set("status")} style={{ ...inputStyle, cursor:"pointer" }}>
          {["active","pro bono","prospect","past"].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <input value={v.services} onChange={set("services")} placeholder="Services we provide (e.g. Social media management, brand strategy)" style={{ ...inputStyle, marginBottom:8 }}/>
      <textarea value={v.notes} onChange={set("notes")} rows={2} placeholder="Notes — key context, tone, what agents should know when producing work for this client" style={{ ...inputStyle, resize:"none", marginBottom:8 }}/>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={()=>{ if(v.name.trim()) onSave(v); }} disabled={!v.name.trim()} style={btnStyle(color, !!v.name.trim())}>Save client</button>
        <button onClick={onCancel} style={btnStyle(color)}>Cancel</button>
      </div>
    </div>
  );
}

function ClientsTab({ data, color }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  return (
    <div>
      <div style={{ fontSize:11, color:T.textDim, marginBottom:14, lineHeight:1.7 }}>
        Every client saved here is known to all 11 agents automatically. Say a client's name in any chat — the agent already has their industry, status, services, and notes.
      </div>
      {data.clients.map(c => editingId===c.id ? (
        <ClientForm key={c.id} color={color} initial={c}
          onSave={(v)=>{ updateClient(c.id, v); setEditingId(null); }}
          onCancel={()=>setEditingId(null)}/>
      ) : (
        <div key={c.id} style={{ background:T.base, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5, flexWrap:"wrap" }}>
            <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{c.name}</span>
            {c.industry && <span style={{ fontSize:9, color:T.textDim, letterSpacing:"0.08em", textTransform:"uppercase" }}>{c.industry}</span>}
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", padding:"2px 9px", borderRadius:12, color:STATUS_COLORS[c.status]||T.gold, border:`1px solid ${(STATUS_COLORS[c.status]||T.gold)}55`, background:(STATUS_COLORS[c.status]||T.gold)+"14" }}>{c.status}</span>
            <span style={{ marginLeft:"auto", display:"flex", gap:6 }}>
              <button onClick={()=>setEditingId(c.id)} style={{ background:"none", border:"none", color:T.textDim, cursor:"pointer", fontSize:13 }}>✏️</button>
              <button onClick={()=>{ if(confirm(`Remove ${c.name}?`)) removeClient(c.id); }} style={{ background:"none", border:"none", color:T.textDim, cursor:"pointer", fontSize:15, lineHeight:1 }}>×</button>
            </span>
          </div>
          {c.services && <div style={{ fontSize:11, color:T.textMid, marginBottom:3 }}><span style={{ color:T.textDim }}>We provide:</span> {c.services}</div>}
          {c.notes && <div style={{ fontSize:11, color:T.textDim, lineHeight:1.6 }}>{c.notes}</div>}
        </div>
      ))}
      {adding
        ? <ClientForm color={color} onSave={(v)=>{ addClient(v); setAdding(false); }} onCancel={()=>setAdding(false)}/>
        : <button onClick={()=>setAdding(true)} style={{ width:"100%", background:"none", border:`1px dashed ${color}55`, borderRadius:10, padding:10, color, fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer", fontFamily:"var(--font-mono)" }}>+ Add client</button>}
    </div>
  );
}

// ────────────────────────────── DOCUMENTS ──────────────────────────────
function DocumentForm({ initial, onSave, onCancel, color }) {
  const [v, setV] = useState(initial || { title:"", summary:"", content:"" });
  const set = (k) => (e) => setV(p => ({ ...p, [k]: e.target.value }));
  return (
    <div style={{ background:T.base, border:`1px solid ${color}44`, borderRadius:10, padding:14, marginBottom:10 }}>
      <input value={v.title} onChange={set("title")} placeholder="Document title * (e.g. Mumin Consult Marketing Strategy v2.0)" style={{ ...inputStyle, marginBottom:8 }}/>
      <textarea value={v.summary} onChange={set("summary")} rows={2} placeholder="Lean summary * — 1-3 lines. This is what every agent carries at all times, so make it count." style={{ ...inputStyle, resize:"none", marginBottom:8 }}/>
      <textarea value={v.content} onChange={set("content")} rows={10} placeholder="Full document text — paste everything here. Stored permanently; agents receive it only when you attach it to a chat (📚). Large documents are fine." style={{ ...inputStyle, resize:"vertical", marginBottom:8 }}/>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <button onClick={()=>{ if(v.title.trim()&&v.summary.trim()) onSave(v); }} disabled={!v.title.trim()||!v.summary.trim()} style={btnStyle(color, !!(v.title.trim()&&v.summary.trim()))}>Save document</button>
        <button onClick={onCancel} style={btnStyle(color)}>Cancel</button>
        {v.content && <span style={{ fontSize:9, color:T.textDim, marginLeft:"auto" }}>{Math.round(v.content.length/1000)}k chars</span>}
      </div>
    </div>
  );
}

function DocumentsTab({ data, color }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [openId, setOpenId] = useState(null);
  return (
    <div>
      <div style={{ fontSize:11, color:T.textDim, marginBottom:14, lineHeight:1.7 }}>
        Agents always carry every document's title + summary. The full text stays stored here — attach it to any chat with the 📚 button when an agent needs the detail. Paste your 40-page strategy here.
      </div>
      {data.documents.map(x => editingId===x.id ? (
        <DocumentForm key={x.id} color={color} initial={x}
          onSave={(v)=>{ updateDocument(x.id, v); setEditingId(null); }}
          onCancel={()=>setEditingId(null)}/>
      ) : (
        <div key={x.id} style={{ background:T.base, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
            <span style={{ fontSize:13, fontWeight:600, color:T.text }}>📄 {x.title}</span>
            <span style={{ marginLeft:"auto", display:"flex", gap:6, alignItems:"center" }}>
              <span style={{ fontSize:9, color:T.textDim }}>{Math.round((x.content||"").length/1000)}k chars</span>
              <button onClick={()=>setOpenId(openId===x.id?null:x.id)} style={{ background:"none", border:`1px solid ${T.border}`, color:T.textDim, borderRadius:5, padding:"2px 9px", fontSize:9, cursor:"pointer", fontFamily:"var(--font-mono)" }}>{openId===x.id?"Hide":"View"}</button>
              <button onClick={()=>setEditingId(x.id)} style={{ background:"none", border:"none", color:T.textDim, cursor:"pointer", fontSize:13 }}>✏️</button>
              <button onClick={()=>{ if(confirm(`Remove "${x.title}"?`)) removeDocument(x.id); }} style={{ background:"none", border:"none", color:T.textDim, cursor:"pointer", fontSize:15, lineHeight:1 }}>×</button>
            </span>
          </div>
          <div style={{ fontSize:11, color:T.textMid, lineHeight:1.6 }}>{x.summary}</div>
          {openId===x.id && (
            <pre style={{ fontSize:11, color:T.textDim, whiteSpace:"pre-wrap", fontFamily:"var(--font-mono)", margin:"8px 0 0", background:T.card, border:`1px solid ${T.border}`, borderRadius:6, padding:10, maxHeight:260, overflowY:"auto" }}>{x.content || "(no content)"}</pre>
          )}
        </div>
      ))}
      {adding
        ? <DocumentForm color={color} onSave={(v)=>{ addDocument(v); setAdding(false); }} onCancel={()=>setAdding(false)}/>
        : <button onClick={()=>setAdding(true)} style={{ width:"100%", background:"none", border:`1px dashed ${color}55`, borderRadius:10, padding:10, color, fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer", fontFamily:"var(--font-mono)" }}>+ Add document</button>}
    </div>
  );
}

// ─────────────────────────────── ASSETS ────────────────────────────────
function AssetForm({ initial, onSave, onCancel, color }) {
  const [v, setV] = useState(initial || { name:"", description:"", url:"" });
  const set = (k) => (e) => setV(p => ({ ...p, [k]: e.target.value }));
  return (
    <div style={{ background:T.base, border:`1px solid ${color}44`, borderRadius:10, padding:14, marginBottom:10 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
        <input value={v.name} onChange={set("name")} placeholder="Asset name * (e.g. Base brand photo set)" style={inputStyle}/>
        <input value={v.url} onChange={set("url")} placeholder="Link (Drive, Canva, site URL) — optional" style={inputStyle}/>
      </div>
      <textarea value={v.description} onChange={set("description")} rows={2} placeholder="Description * — what it is, theme, when to use it. Agents reference assets by this description." style={{ ...inputStyle, resize:"none", marginBottom:8 }}/>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={()=>{ if(v.name.trim()&&v.description.trim()) onSave(v); }} disabled={!v.name.trim()||!v.description.trim()} style={btnStyle(color, !!(v.name.trim()&&v.description.trim()))}>Save asset</button>
        <button onClick={onCancel} style={btnStyle(color)}>Cancel</button>
      </div>
    </div>
  );
}

function AssetsTab({ data, color }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  return (
    <div>
      <div style={{ fontSize:11, color:T.textDim, marginBottom:14, lineHeight:1.7 }}>
        A registry of brand assets — photo sets, logos, templates, videos. Agents know each asset by name and description (e.g. Amara can reference them in design specs). To let an agent actually see an image, attach it in their chat with 📎.
      </div>
      {data.assets.map(x => editingId===x.id ? (
        <AssetForm key={x.id} color={color} initial={x}
          onSave={(v)=>{ updateAsset(x.id, v); setEditingId(null); }}
          onCancel={()=>setEditingId(null)}/>
      ) : (
        <div key={x.id} style={{ background:T.base, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <span style={{ fontSize:13, fontWeight:600, color:T.text }}>🖼 {x.name}</span>
            <span style={{ marginLeft:"auto", display:"flex", gap:6 }}>
              {x.url && <a href={x.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:10, color, textDecoration:"none", border:`1px solid ${color}55`, borderRadius:5, padding:"2px 9px", fontFamily:"var(--font-mono)" }}>Open ↗</a>}
              <button onClick={()=>setEditingId(x.id)} style={{ background:"none", border:"none", color:T.textDim, cursor:"pointer", fontSize:13 }}>✏️</button>
              <button onClick={()=>{ if(confirm(`Remove ${x.name}?`)) removeAsset(x.id); }} style={{ background:"none", border:"none", color:T.textDim, cursor:"pointer", fontSize:15, lineHeight:1 }}>×</button>
            </span>
          </div>
          <div style={{ fontSize:11, color:T.textMid, lineHeight:1.6 }}>{x.description}</div>
        </div>
      ))}
      {adding
        ? <AssetForm color={color} onSave={(v)=>{ addAsset(v); setAdding(false); }} onCancel={()=>setAdding(false)}/>
        : <button onClick={()=>setAdding(true)} style={{ width:"100%", background:"none", border:`1px dashed ${color}55`, borderRadius:10, padding:10, color, fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer", fontFamily:"var(--font-mono)" }}>+ Add asset</button>}
    </div>
  );
}

// ─────────────────────────────── PAGE ──────────────────────────────────
export default function DataHub({ color = "#C8A96E" }) {
  const [data, setData] = useState(loadDataHub);
  const [tab, setTab] = useState("clients");

  useEffect(() => {
    setData(loadDataHub());
    const off = subscribeDataHub(setData);
    return off;
  }, []);

  const TABS = [
    { id:"clients",   label:"Clients",   count:data.clients.length },
    { id:"documents", label:"Documents", count:data.documents.length },
    { id:"assets",    label:"Assets",    count:data.assets.length },
  ];

  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
      <div style={{ marginBottom:6 }}>
        <div style={{ fontSize:14, fontWeight:600, color:T.text, marginBottom:3 }}>🗂 Data Hub</div>
        <div style={{ fontSize:11, color:T.textDim, lineHeight:1.6 }}>
          Mumin Consult's shared company data. Everything here is automatically known by all 11 agents — clients, documents, and assets.
        </div>
      </div>

      <div style={{ display:"flex", gap:6, margin:"14px 0" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background: tab===t.id ? color+"18" : "none",
            border:`1px solid ${tab===t.id?color:T.border}`,
            color: tab===t.id ? color : T.textDim,
            fontSize:10, fontWeight:tab===t.id?700:400, padding:"6px 16px", borderRadius:8,
            cursor:"pointer", fontFamily:"var(--font-mono)", letterSpacing:"0.1em", textTransform:"uppercase",
          }}>{t.label} ({t.count})</button>
        ))}
      </div>

      {tab==="clients"   && <ClientsTab data={data} color={color}/>}
      {tab==="documents" && <DocumentsTab data={data} color={color}/>}
      {tab==="assets"    && <AssetsTab data={data} color={color}/>}
    </div>
  );
}
