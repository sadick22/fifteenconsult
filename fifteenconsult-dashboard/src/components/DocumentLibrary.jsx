import { useState, useRef } from "react";

const DOC_KEY = "fc_documents_v1";

function loadDocs() {
  try { return JSON.parse(localStorage.getItem(DOC_KEY) || "{}"); }
  catch { return {}; }
}
function saveDocs(data) {
  try { localStorage.setItem(DOC_KEY, JSON.stringify(data)); } catch {}
}

export function getAgentDocuments(agentId) {
  const all = loadDocs();
  return all[agentId] || [];
}

export default function DocumentLibrary({ agentId, agentColor, agentName }) {
  const [docs, setDocs]         = useState(() => (loadDocs()[agentId] || []));
  const [uploading, setUploading] = useState(false);
  const [note, setNote]         = useState("");
  const fileRef                 = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result;
      const newDoc = {
        id:        Date.now(),
        name:      file.name,
        type:      file.type,
        size:      (file.size / 1024).toFixed(1) + " KB",
        content:   content.slice(0, 8000), // limit to 8k chars for context
        note:      note,
        uploadedAt: new Date().toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }),
      };

      const all  = loadDocs();
      const curr = all[agentId] || [];
      if (curr.length >= 10) {
        alert("Maximum 10 documents per agent. Please delete one first.");
        setUploading(false);
        return;
      }
      const updated = [...curr, newDoc];
      all[agentId]  = updated;
      saveDocs(all);
      setDocs(updated);
      setNote("");
      setUploading(false);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const deleteDoc = (id) => {
    const all     = loadDocs();
    const updated = (all[agentId] || []).filter(d => d.id !== id);
    all[agentId]  = updated;
    saveDocs(all);
    setDocs(updated);
  };

  return (
    <div style={{ marginTop:20 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
        <div>
          <div style={{ fontSize:12,fontWeight:600,color:"var(--text)",marginBottom:2 }}>
            📎 Document Library
          </div>
          <div style={{ fontSize:10,color:"var(--text-dim)" }}>
            Upload plans, strategies, decks — {agentName} will analyse them
          </div>
        </div>
        <span style={{ fontSize:10,color:"var(--text-dim)" }}>{docs.length}/10 docs</span>
      </div>

      {/* Upload area */}
      <div style={{ marginBottom:12 }}>
        <input
          value={note}
          onChange={e=>setNote(e.target.value)}
          placeholder="Add a note about this document (optional)"
          style={{ width:"100%",background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:7,padding:"8px 12px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none",marginBottom:8 }}
          onFocus={e=>e.target.style.borderColor=agentColor}
          onBlur={e=>e.target.style.borderColor="var(--border)"}
        />
        <input ref={fileRef} type="file" accept=".txt,.md,.pdf,.docx,.csv,.json" onChange={handleUpload} style={{ display:"none" }}/>
        <button
          onClick={()=>fileRef.current?.click()}
          disabled={uploading||docs.length>=10}
          style={{
            background:"none",
            border:`1px dashed ${uploading||docs.length>=10?"var(--border)":agentColor}`,
            borderRadius:8,padding:"10px 20px",
            color:uploading||docs.length>=10?"var(--text-dim)":agentColor,
            fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",
            cursor:uploading||docs.length>=10?"not-allowed":"pointer",
            fontFamily:"var(--font-mono)",width:"100%",transition:"all 0.2s",
          }}
        >
          {uploading?"Processing...":"+ Upload Document (.txt, .md, .pdf, .csv, .json)"}
        </button>
        <div style={{ fontSize:10,color:"var(--text-dim)",marginTop:6 }}>
          Documents are stored locally and injected into {agentName}'s context when running briefings
        </div>
      </div>

      {/* Document list */}
      {docs.length === 0 ? (
        <div style={{ textAlign:"center",padding:"20px 0",color:"var(--text-dim)",fontSize:12 }}>
          No documents uploaded yet.<br/>
          <span style={{ fontSize:11 }}>Upload a marketing plan, strategy doc, or competitor analysis.</span>
        </div>
      ) : (
        docs.map(doc => (
          <div key={doc.id} style={{ display:"flex",alignItems:"flex-start",gap:12,padding:"10px 14px",background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:8,marginBottom:8 }}>
            <span style={{ fontSize:18,flexShrink:0 }}>
              {doc.name.endsWith('.pdf')?"📄":doc.name.endsWith('.csv')?"📊":doc.name.endsWith('.json')?"⚙️":"📝"}
            </span>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:12,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{doc.name}</div>
              <div style={{ fontSize:10,color:"var(--text-dim)",marginTop:2 }}>
                {doc.size} · Uploaded {doc.uploadedAt}
                {doc.note && <span style={{ color:agentColor }}> · {doc.note}</span>}
              </div>
            </div>
            <button onClick={()=>deleteDoc(doc.id)} style={{ background:"none",border:"none",color:"var(--text-dim)",cursor:"pointer",fontSize:16,padding:"0 4px",flexShrink:0 }}
              onMouseEnter={e=>e.currentTarget.style.color="#f87171"}
              onMouseLeave={e=>e.currentTarget.style.color="var(--text-dim)"}
            >×</button>
          </div>
        ))
      )}
    </div>
  );
}
