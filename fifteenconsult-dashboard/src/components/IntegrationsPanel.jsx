import { useState, useEffect } from "react";
import {
  fetchHubSpotPipeline, pushContactToHubSpot,
  fetchMailerLiteStats, createMailerLiteDraft,
  getConnectionStatuses,
} from "../lib/integrations.js";

const INTEGRATIONS = [
  {
    id: "hubspot",
    name: "HubSpot CRM",
    icon: "🟠",
    color: "#ff7a59",
    agentId: "kwame",
    agentName: "Kwame",
    description: "Live pipeline data · Push leads",
    envKey: "VITE_HUBSPOT_API_KEY",
    docsUrl: "https://app.hubspot.com/api-key",
  },
  {
    id: "mailerlite",
    name: "MailerLite",
    icon: "💚",
    color: "#09c269",
    agentId: "nadia",
    agentName: "Nadia",
    description: "Subscriber stats · Push drafts",
    envKey: "VITE_MAILERLITE_API_KEY",
    docsUrl: "https://app.mailerlite.com/integrations/api",
  },
  {
    id: "ga4",
    name: "Google Analytics 4",
    icon: "📊",
    color: "#4285f4",
    agentId: "zara",
    agentName: "Zara",
    description: "Traffic · Conversions · Sources",
    envKey: "VITE_GA4_MEASUREMENT_ID",
    docsUrl: "https://analytics.google.com",
    comingSoon: true,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    color: "#0077b5",
    agentId: "sara",
    agentName: "Sara",
    description: "Followers · Engagement · Ads",
    envKey: "VITE_LINKEDIN_ACCESS_TOKEN",
    docsUrl: "https://www.linkedin.com/developers/",
    comingSoon: true,
  },
  {
    id: "meta",
    name: "Meta Ads",
    icon: "📱",
    color: "#1877f2",
    agentId: "hassan",
    agentName: "Hassan",
    description: "Ad spend · CPL · ROAS",
    envKey: "VITE_META_ACCESS_TOKEN",
    docsUrl: "https://developers.facebook.com/docs/marketing-api",
    comingSoon: true,
  },
  {
    id: "make",
    name: "Make.com",
    icon: "⚙️",
    color: "#6d00cc",
    agentId: null,
    agentName: "All agents",
    description: "Automation · Webhooks · Workflows",
    envKey: "VITE_MAKE_WEBHOOK_URL",
    docsUrl: "https://make.com",
    comingSoon: true,
  },
];

function StatusBadge({ connected, comingSoon }) {
  if (comingSoon) return (
    <span style={{ fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#7a90b0",background:"#1e2d45",padding:"2px 8px",borderRadius:10 }}>
      Coming Soon
    </span>
  );
  return (
    <span style={{ fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:connected?"#4ade80":"#f87171",background:connected?"#4ade8018":"#f8717118",padding:"2px 8px",borderRadius:10 }}>
      {connected ? "● Connected" : "○ Not connected"}
    </span>
  );
}

function HubSpotPanel({ connected }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({ firstName:"", lastName:"", email:"", company:"", notes:"" });
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null);

  const load = async () => {
    setLoading(true);
    const result = await fetchHubSpotPipeline();
    setData(result);
    setLoading(false);
  };

  useEffect(() => { if (connected) load(); }, [connected]);

  const handlePush = async () => {
    if (!form.email) return;
    setPushing(true);
    const result = await pushContactToHubSpot(form);
    setPushResult(result);
    setPushing(false);
    if (result.success) setForm({ firstName:"", lastName:"", email:"", company:"", notes:"" });
    setTimeout(() => setPushResult(null), 4000);
  };

  if (!connected) return (
    <div style={{ padding:"14px 0",fontSize:12,color:"var(--text-dim)",lineHeight:1.7 }}>
      Add <code style={{ background:"var(--bg-base)",padding:"2px 6px",borderRadius:4,fontSize:11 }}>VITE_HUBSPOT_API_KEY</code> to Vercel environment variables to connect.
      <br/>
      <a href="https://app.hubspot.com/api-key" target="_blank" rel="noreferrer" style={{ color:"#ff7a59",fontSize:11 }}>Get your HubSpot API key →</a>
    </div>
  );

  return (
    <div>
      {/* Live pipeline data */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:10,color:"var(--text-dim)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10 }}>
          Live Pipeline
          <button onClick={load} style={{ marginLeft:10,background:"none",border:"none",color:"#ff7a59",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)" }}>↻ Refresh</button>
        </div>
        {loading ? (
          <div style={{ fontSize:12,color:"var(--text-dim)" }}>Loading from HubSpot...</div>
        ) : data?.error ? (
          <div style={{ fontSize:11,color:"#f87171" }}>⚠ {data.error}</div>
        ) : data ? (
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10 }}>
            {[
              { label:"Total Contacts", value:data.totalContacts?.toLocaleString() || "—" },
              { label:"Open Deals",     value:data.openDeals || "—" },
              { label:"Total Deals",    value:data.totalDeals || "—" },
              { label:"Deals Won",      value:data.wonDeals || "—" },
            ].map(s => (
              <div key={s.label} style={{ background:"var(--bg-base)",borderRadius:8,padding:"10px 12px",border:"1px solid var(--border)" }}>
                <div style={{ fontSize:9,color:"var(--text-dim)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:18,fontWeight:700,color:"#ff7a59" }}>{s.value}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Push new contact */}
      <div>
        <div style={{ fontSize:10,color:"var(--text-dim)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10 }}>
          Push New Lead to HubSpot
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8 }}>
          {[
            { key:"firstName", placeholder:"First name" },
            { key:"lastName",  placeholder:"Last name"  },
            { key:"email",     placeholder:"Email *"    },
            { key:"company",   placeholder:"Company"    },
          ].map(f => (
            <input key={f.key} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
              placeholder={f.placeholder}
              style={{ background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:7,padding:"8px 12px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none" }}
              onFocus={e=>e.target.style.borderColor="#ff7a59"}
              onBlur={e=>e.target.style.borderColor="var(--border)"}
            />
          ))}
        </div>
        <input value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
          placeholder="Notes (optional)"
          style={{ width:"100%",background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:7,padding:"8px 12px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none",marginBottom:8 }}
          onFocus={e=>e.target.style.borderColor="#ff7a59"}
          onBlur={e=>e.target.style.borderColor="var(--border)"}
        />
        <div style={{ display:"flex",gap:10,alignItems:"center" }}>
          <button onClick={handlePush} disabled={!form.email||pushing} style={{
            background:!form.email||pushing?"transparent":"#ff7a59",
            color:!form.email||pushing?"#ff7a59":"#000",
            border:"1px solid #ff7a59",borderRadius:7,padding:"8px 20px",
            fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",
            cursor:!form.email||pushing?"not-allowed":"pointer",fontFamily:"var(--font-mono)",
          }}>
            {pushing?"Pushing...":"Push to HubSpot"}
          </button>
          {pushResult?.success && <span style={{ fontSize:11,color:"#4ade80" }}>✓ Contact created in HubSpot</span>}
          {pushResult?.error   && <span style={{ fontSize:11,color:"#f87171" }}>⚠ {pushResult.error}</span>}
        </div>
      </div>
    </div>
  );
}

function MailerLitePanel({ connected }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft]     = useState({ subject:"", content:"" });
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null);

  const load = async () => {
    setLoading(true);
    const result = await fetchMailerLiteStats();
    setData(result);
    setLoading(false);
  };

  useEffect(() => { if (connected) load(); }, [connected]);

  const handlePush = async () => {
    if (!draft.subject) return;
    setPushing(true);
    const result = await createMailerLiteDraft(draft);
    setPushResult(result);
    setPushing(false);
    setTimeout(() => setPushResult(null), 5000);
  };

  if (!connected) return (
    <div style={{ padding:"14px 0",fontSize:12,color:"var(--text-dim)",lineHeight:1.7 }}>
      Add <code style={{ background:"var(--bg-base)",padding:"2px 6px",borderRadius:4,fontSize:11 }}>VITE_MAILERLITE_API_KEY</code> to Vercel environment variables to connect.
      <br/>
      <a href="https://app.mailerlite.com/integrations/api" target="_blank" rel="noreferrer" style={{ color:"#09c269",fontSize:11 }}>Get your MailerLite API key →</a>
    </div>
  );

  return (
    <div>
      {/* Live stats */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:10,color:"var(--text-dim)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10 }}>
          Live Stats
          <button onClick={load} style={{ marginLeft:10,background:"none",border:"none",color:"#09c269",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)" }}>↻ Refresh</button>
        </div>
        {loading ? (
          <div style={{ fontSize:12,color:"var(--text-dim)" }}>Loading from MailerLite...</div>
        ) : data?.error ? (
          <div style={{ fontSize:11,color:"#f87171" }}>⚠ {data.error}</div>
        ) : data ? (
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12 }}>
            {[
              { label:"Subscribers",   value:data.totalSubscribers?.toLocaleString() || "—" },
              { label:"Last Open Rate",value:data.openRate  || "—" },
              { label:"Last CTR",      value:data.clickRate || "—" },
            ].map(s => (
              <div key={s.label} style={{ background:"var(--bg-base)",borderRadius:8,padding:"10px 12px",border:"1px solid var(--border)" }}>
                <div style={{ fontSize:9,color:"var(--text-dim)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:18,fontWeight:700,color:"#09c269" }}>{s.value}</div>
              </div>
            ))}
          </div>
        ) : null}
        {data?.lastCampaignName && (
          <div style={{ fontSize:11,color:"var(--text-dim)" }}>Last campaign: <span style={{ color:"var(--text-mid)" }}>{data.lastCampaignName}</span></div>
        )}
      </div>

      {/* Push newsletter draft */}
      <div>
        <div style={{ fontSize:10,color:"var(--text-dim)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10 }}>
          Push Newsletter Draft to MailerLite
        </div>
        <input value={draft.subject} onChange={e=>setDraft(p=>({...p,subject:e.target.value}))}
          placeholder="Email subject line *"
          style={{ width:"100%",background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:7,padding:"8px 12px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none",marginBottom:8 }}
          onFocus={e=>e.target.style.borderColor="#09c269"}
          onBlur={e=>e.target.style.borderColor="var(--border)"}
        />
        <textarea value={draft.content} onChange={e=>setDraft(p=>({...p,content:e.target.value}))}
          placeholder="Email content (paste Nadia's newsletter draft here)"
          rows={4}
          style={{ width:"100%",background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:7,padding:"8px 12px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none",resize:"vertical",lineHeight:1.6,marginBottom:8 }}
          onFocus={e=>e.target.style.borderColor="#09c269"}
          onBlur={e=>e.target.style.borderColor="var(--border)"}
        />
        <div style={{ display:"flex",gap:10,alignItems:"center",flexWrap:"wrap" }}>
          <button onClick={handlePush} disabled={!draft.subject||pushing} style={{
            background:!draft.subject||pushing?"transparent":"#09c269",
            color:!draft.subject||pushing?"#09c269":"#000",
            border:"1px solid #09c269",borderRadius:7,padding:"8px 20px",
            fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",
            cursor:!draft.subject||pushing?"not-allowed":"pointer",fontFamily:"var(--font-mono)",
          }}>
            {pushing?"Creating draft...":"Create Draft in MailerLite"}
          </button>
          {pushResult?.success && (
            <span style={{ fontSize:11,color:"#4ade80" }}>
              ✓ Draft created!
              {pushResult.url && <a href={pushResult.url} target="_blank" rel="noreferrer" style={{ color:"#09c269",marginLeft:6 }}>Open in MailerLite →</a>}
            </span>
          )}
          {pushResult?.error && <span style={{ fontSize:11,color:"#f87171" }}>⚠ {pushResult.error}</span>}
        </div>
      </div>
    </div>
  );
}

function ComingSoonPanel({ integration }) {
  return (
    <div style={{ padding:"16px 0" }}>
      <div style={{ fontSize:12,color:"var(--text-dim)",lineHeight:1.8,marginBottom:12 }}>
        {integration.description} will be available once connected.
      </div>
      <div style={{ background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:8,padding:"12px 16px" }}>
        <div style={{ fontSize:10,color:"var(--text-dim)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6 }}>
          To connect
        </div>
        <div style={{ fontSize:11,color:"var(--text-mid)",lineHeight:1.8 }}>
          1. Get your API key from <a href={integration.docsUrl} target="_blank" rel="noreferrer" style={{ color:integration.color }}>
            {integration.name} →
          </a><br/>
          2. Add <code style={{ background:"var(--bg-card)",padding:"2px 6px",borderRadius:4 }}>{integration.envKey}</code> to Vercel Environment Variables<br/>
          3. Redeploy — the integration activates automatically
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsPanel({ onClose }) {
  const [activeId, setActiveId] = useState("hubspot");
  const statuses = getConnectionStatuses();
  const active   = INTEGRATIONS.find(i => i.id === activeId);
  const connected = statuses[activeId];

  return (
    <div style={{
      position:"fixed",top:0,right:0,bottom:0,width:600,
      background:"var(--bg-base)",borderLeft:"1px solid var(--border)",
      display:"flex",flexDirection:"column",zIndex:300,
      animation:"slideIn 0.25s ease",boxShadow:"-8px 0 32px rgba(0,0,0,0.4)",
    }}>
      {/* Header */}
      <div style={{ padding:"20px 24px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:17,fontWeight:700,color:"var(--text)",marginBottom:6 }}>🔌 External Connections</div>
          <div style={{ fontSize:11,color:"var(--text-dim)" }}>
            {Object.values(statuses).filter(Boolean).length} of {INTEGRATIONS.length} connected
          </div>
        </div>
        <button onClick={onClose} style={{ background:"none",border:"1px solid var(--border)",color:"var(--text-mid)",fontSize:18,width:32,height:32,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
      </div>

      <div style={{ display:"flex",flex:1,overflow:"hidden" }}>
        {/* Integration list */}
        <div style={{ width:180,borderRight:"1px solid var(--border)",overflowY:"auto",flexShrink:0 }}>
          {INTEGRATIONS.map(intg => {
            const isActive   = activeId === intg.id;
            const isConnected = statuses[intg.id];
            return (
              <div key={intg.id} onClick={()=>setActiveId(intg.id)} style={{
                padding:"14px 16px",cursor:"pointer",
                borderLeft:isActive?`3px solid ${intg.color}`:"3px solid transparent",
                background:isActive?intg.color+"12":"transparent",
                borderBottom:"1px solid var(--border)",transition:"all 0.15s",
              }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                  <span style={{ fontSize:16 }}>{intg.icon}</span>
                  <span style={{ fontSize:12,fontWeight:isActive?600:400,color:isActive?intg.color:"var(--text-mid)" }}>
                    {intg.name}
                  </span>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <span style={{ width:6,height:6,borderRadius:"50%",background:intg.comingSoon?"var(--text-dim)":isConnected?"#4ade80":"#f87171",display:"inline-block" }}/>
                  <span style={{ fontSize:9,color:"var(--text-dim)" }}>{intg.comingSoon?"soon":isConnected?"live":"not set"}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        <div style={{ flex:1,overflow:"auto",padding:"20px 24px" }}>
          {active && (
            <>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                  <span style={{ fontSize:24 }}>{active.icon}</span>
                  <div>
                    <div style={{ fontSize:15,fontWeight:700,color:"var(--text)" }}>{active.name}</div>
                    <div style={{ fontSize:10,color:active.color,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:2 }}>
                      {active.agentName} · {active.description}
                    </div>
                  </div>
                </div>
                <StatusBadge connected={connected} comingSoon={active.comingSoon}/>
              </div>

              {activeId==="hubspot"    && <HubSpotPanel    connected={connected}/>}
              {activeId==="mailerlite" && <MailerLitePanel connected={connected}/>}
              {active.comingSoon       && <ComingSoonPanel  integration={active}/>}
            </>
          )}
        </div>
      </div>

      <div style={{ padding:"12px 24px",borderTop:"1px solid var(--border)",fontSize:10,color:"var(--text-dim)" }}>
        All API keys stored securely as Vercel environment variables — never in code.
      </div>
    </div>
  );
}
