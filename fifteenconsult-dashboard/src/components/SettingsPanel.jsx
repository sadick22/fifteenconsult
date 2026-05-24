import { useState } from "react";
import { TEAM } from "../data/team.js";

const T = {
  base:"#0d1117", card:"#131d2e", border:"#1e2d45",
  text:"#e8edf5", textMid:"#7a90b0", textDim:"#3d526b",
  gold:"#C8A96E", green:"#4ade80", red:"#f87171", amber:"#fbbf24",
};

const SETTINGS_KEY = "fc_settings_v1";
const KPIS_KEY     = "fc_live_kpis_v1";

function loadLiveKPIs() {
  try { return JSON.parse(localStorage.getItem(KPIS_KEY) || "{}"); }
  catch { return {}; }
}
function saveLiveKPIs(data) {
  try { localStorage.setItem(KPIS_KEY, JSON.stringify(data)); } catch {}
}

function Input({ label, value, onChange, type="text", unit="" }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5 }}>
        {label}{unit && <span style={{ color:T.textDim }}> ({unit})</span>}
      </div>
      <input
        type={type} value={value}
        onChange={e=>onChange(type==="number"?parseFloat(e.target.value)||0:e.target.value)}
        style={{ width:"100%",background:T.base,border:`1px solid ${T.border}`,borderRadius:7,padding:"8px 12px",fontSize:12,color:T.text,fontFamily:"var(--font-mono)",outline:"none" }}
        onFocus={e=>e.target.style.borderColor=T.gold}
        onBlur={e=>e.target.style.borderColor=T.border}
      />
    </div>
  );
}

function AgentKPIEditor({ member, liveKPIs, onSave }) {
  const saved   = liveKPIs[member.id] || {};
  const [values, setValues] = useState(() => {
    const init = {};
    member.kpis.forEach(k => {
      init[k.label] = { current: saved[k.label]?.current ?? k.current, target: saved[k.label]?.target ?? k.target };
    });
    return init;
  });
  const [saved2, setSaved2] = useState(false);

  const handleSave = () => {
    onSave(member.id, values);
    setSaved2(true);
    setTimeout(()=>setSaved2(false), 2000);
  };

  return (
    <div style={{ background:T.base,borderRadius:10,padding:16,border:`1px solid ${T.border}`,marginBottom:12 }}>
      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
        <span style={{ fontSize:18 }}>{member.emoji}</span>
        <div>
          <div style={{ fontSize:13,fontWeight:600,color:T.text }}>{member.name}</div>
          <div style={{ fontSize:10,color:member.color,letterSpacing:"0.1em",textTransform:"uppercase" }}>{member.role}</div>
        </div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
        {member.kpis.map(k => (
          <div key={k.label} style={{ background:T.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8 }}>
              {k.label}{k.unit?` (${k.unit})`:""}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
              <div>
                <div style={{ fontSize:9,color:T.textDim,marginBottom:3 }}>Current</div>
                <input
                  type="number"
                  value={values[k.label]?.current ?? k.current}
                  onChange={e=>setValues(v=>({...v,[k.label]:{...v[k.label],current:parseFloat(e.target.value)||0}}))}
                  style={{ width:"100%",background:T.base,border:`1px solid ${T.border}`,borderRadius:5,padding:"5px 8px",fontSize:12,color:T.green,fontFamily:"var(--font-mono)",outline:"none" }}
                  onFocus={e=>e.target.style.borderColor=T.green}
                  onBlur={e=>e.target.style.borderColor=T.border}
                />
              </div>
              <div>
                <div style={{ fontSize:9,color:T.textDim,marginBottom:3 }}>Target</div>
                <input
                  type="number"
                  value={values[k.label]?.target ?? k.target}
                  onChange={e=>setValues(v=>({...v,[k.label]:{...v[k.label],target:parseFloat(e.target.value)||0}}))}
                  style={{ width:"100%",background:T.base,border:`1px solid ${T.border}`,borderRadius:5,padding:"5px 8px",fontSize:12,color:T.amber,fontFamily:"var(--font-mono)",outline:"none" }}
                  onFocus={e=>e.target.style.borderColor=T.amber}
                  onBlur={e=>e.target.style.borderColor=T.border}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={handleSave} style={{
        marginTop:12,background:saved2?T.green+"22":T.gold+"22",
        border:`1px solid ${saved2?T.green:T.gold}`,
        color:saved2?T.green:T.gold,
        borderRadius:7,padding:"7px 18px",fontSize:10,fontWeight:700,
        letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",
        fontFamily:"var(--font-mono)",transition:"all 0.2s",
      }}>
        {saved2?"✓ Saved":"Save KPIs"}
      </button>
    </div>
  );
}

function DashboardSettings({ settings, onSave }) {
  const [vals, setVals] = useState(settings);
  const [saved, setSaved] = useState(false);

  const save = () => { onSave(vals); setSaved(true); setTimeout(()=>setSaved(false),2000); };

  return (
    <div>
      <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:16 }}>
        Company Information
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20 }}>
        <Input label="Company Name"    value={vals.companyName||"FifteenConsult"} onChange={v=>setVals(p=>({...p,companyName:v}))}/>
        <Input label="Website"         value={vals.website||"fifteenconsult.com"} onChange={v=>setVals(p=>({...p,website:v}))}/>
        <Input label="Primary Market"  value={vals.primaryMarket||"Doha, Qatar — GCC"} onChange={v=>setVals(p=>({...p,primaryMarket:v}))}/>
        <Input label="Growth Market"   value={vals.growthMarket||"West Africa"} onChange={v=>setVals(p=>({...p,growthMarket:v}))}/>
        <Input label="Monthly Ad Budget (QAR)" type="number" value={vals.adBudget||5000} onChange={v=>setVals(p=>({...p,adBudget:v}))}/>
        <Input label="Monthly Revenue Target (QAR)" type="number" value={vals.revenueTarget||50000} onChange={v=>setVals(p=>({...p,revenueTarget:v}))}/>
      </div>

      <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:16 }}>
        Active Clients
      </div>
      <textarea
        value={vals.clients||"Coreo Real Estate, Nappy Qatar, Elite Escape Tourism, Base Intelligent Communities, African Languages Lab"}
        onChange={e=>setVals(p=>({...p,clients:e.target.value}))}
        rows={3}
        style={{ width:"100%",background:T.base,border:`1px solid ${T.border}`,borderRadius:7,padding:"10px 12px",fontSize:12,color:T.text,fontFamily:"var(--font-mono)",outline:"none",resize:"vertical",lineHeight:1.6,marginBottom:20 }}
        onFocus={e=>e.target.style.borderColor=T.gold}
        onBlur={e=>e.target.style.borderColor=T.border}
      />

      <div style={{ fontSize:10,color:T.textDim,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:16 }}>
        Dashboard Preferences
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20 }}>
        {[
          { key:"showMorningOnLoad", label:"Show Morning Briefing on Load", type:"toggle" },
          { key:"gccWeekend",        label:"GCC Weekend Mode (Fri-Sat)",     type:"toggle" },
          { key:"notificationsOn",   label:"Enable Notifications",           type:"toggle" },
          { key:"autoRefreshKPIs",   label:"Auto-refresh KPIs (every hour)", type:"toggle" },
        ].map(s=>(
          <div key={s.key} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",background:T.base,borderRadius:8,padding:"10px 14px",border:`1px solid ${T.border}` }}>
            <span style={{ fontSize:12,color:T.textMid }}>{s.label}</span>
            <div
              onClick={()=>setVals(p=>({...p,[s.key]:!p[s.key]}))}
              style={{ width:36,height:20,borderRadius:10,cursor:"pointer",transition:"background 0.2s",position:"relative",background:vals[s.key]?T.gold:"#2a3a52" }}
            >
              <div style={{ position:"absolute",top:2,left:vals[s.key]?18:2,width:16,height:16,borderRadius:"50%",background:"white",transition:"left 0.2s" }}/>
            </div>
          </div>
        ))}
      </div>

      <button onClick={save} style={{
        background:saved?T.green+"22":T.gold+"22",
        border:`1px solid ${saved?T.green:T.gold}`,
        color:saved?T.green:T.gold,
        borderRadius:8,padding:"10px 24px",fontSize:11,fontWeight:700,
        letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",
        fontFamily:"var(--font-mono)",transition:"all 0.2s",
      }}>
        {saved?"✓ Settings Saved":"Save Settings"}
      </button>
    </div>
  );
}

export default function SettingsPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState("kpis");
  const [liveKPIs, setLiveKPIs]   = useState(loadLiveKPIs);
  const [settings, setSettings]   = useState(() => {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}"); } catch { return {}; }
  });
  const [saved, setSaved]         = useState(false);

  const handleKPISave = (agentId, values) => {
    const updated = { ...liveKPIs, [agentId]: values };
    setLiveKPIs(updated);
    saveLiveKPIs(updated);
  };

  const handleSettingsSave = (vals) => {
    setSettings(vals);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(vals));
  };

  const tabs = [
    { id:"kpis",      label:"Live KPIs",        icon:"📊" },
    { id:"dashboard", label:"Dashboard",         icon:"⚙️" },
    { id:"agents",    label:"Agent Info",        icon:"🤖" },
  ];

  return (
    <div style={{
      position:"fixed",top:0,right:0,bottom:0,width:620,
      background:T.base,borderLeft:`1px solid ${T.border}`,
      display:"flex",flexDirection:"column",zIndex:300,
      animation:"slideIn 0.25s ease",boxShadow:"-8px 0 32px rgba(0,0,0,0.4)",
    }}>
      {/* Header */}
      <div style={{ padding:"20px 24px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <div style={{ fontSize:17,fontWeight:700,color:T.text,marginBottom:4 }}>⚙️ Settings</div>
          <div style={{ fontSize:11,color:T.textDim }}>Update KPIs, dashboard preferences, and agent configuration</div>
        </div>
        <button onClick={onClose} style={{ background:"none",border:`1px solid ${T.border}`,color:T.textMid,fontSize:18,width:32,height:32,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:4,padding:"12px 24px",borderBottom:`1px solid ${T.border}` }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
            background:activeTab===t.id?T.gold+"18":"none",
            border:`1px solid ${activeTab===t.id?T.gold:T.border}`,
            color:activeTab===t.id?T.gold:T.textDim,
            fontSize:11,fontWeight:activeTab===t.id?700:400,
            padding:"6px 16px",borderRadius:7,cursor:"pointer",
            fontFamily:"var(--font-mono)",letterSpacing:"0.1em",
            textTransform:"uppercase",transition:"all 0.15s",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1,overflowY:"auto",padding:"20px 24px" }}>

        {activeTab==="kpis" && (
          <div>
            <div style={{ fontSize:12,color:T.textMid,lineHeight:1.7,marginBottom:20,padding:"12px 16px",background:T.gold+"0a",border:`1px solid ${T.gold}22`,borderRadius:8 }}>
              💡 Update the <strong style={{ color:T.gold }}>Current</strong> values weekly with real numbers from your platforms. These drive the KPI bars, War Room, and alerts.
            </div>
            {TEAM.map(m=>(
              <AgentKPIEditor key={m.id} member={m} liveKPIs={liveKPIs} onSave={handleKPISave}/>
            ))}
          </div>
        )}

        {activeTab==="dashboard" && (
          <DashboardSettings settings={settings} onSave={handleSettingsSave}/>
        )}

        {activeTab==="agents" && (
          <div>
            <div style={{ fontSize:12,color:T.textMid,lineHeight:1.7,marginBottom:20,padding:"12px 16px",background:"#60a5fa0a",border:"1px solid #60a5fa22",borderRadius:8 }}>
              💡 Agent system prompts are managed in <code style={{ background:T.card,padding:"2px 6px",borderRadius:4,fontSize:11 }}>src/data/team.js</code> in your GitHub repo. Edit them there to customise how each agent thinks and responds.
            </div>
            {TEAM.map(m=>(
              <div key={m.id} style={{ background:T.card,border:`1px solid ${T.border}`,borderLeft:`3px solid ${m.color}`,borderRadius:10,padding:"14px 16px",marginBottom:10 }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                  <span style={{ fontSize:18 }}>{m.emoji}</span>
                  <div>
                    <div style={{ fontSize:13,fontWeight:600,color:T.text }}>{m.name}</div>
                    <div style={{ fontSize:10,color:m.color,letterSpacing:"0.1em",textTransform:"uppercase" }}>{m.role} · {m.cadence}</div>
                  </div>
                  <div style={{ marginLeft:"auto",fontSize:10,color:T.textDim }}>
                    {m.tasks.length} tasks · {m.kpis.length} KPIs
                  </div>
                </div>
                <div style={{ fontSize:11,color:T.textDim,lineHeight:1.6 }}>
                  {m.systemPrompt.slice(0,120)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding:"12px 24px",borderTop:`1px solid ${T.border}`,fontSize:10,color:T.textDim }}>
        Settings saved locally in your browser · KPI updates reflect immediately across dashboard
      </div>
    </div>
  );
}
