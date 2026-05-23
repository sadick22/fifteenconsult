import { useState, useEffect } from "react";

const T = {
  base:"var(--bg-base)", card:"var(--bg-card)", border:"var(--border)",
  text:"var(--text)", textMid:"var(--text-mid)", textDim:"var(--text-dim)",
  gold:"var(--gold)", green:"var(--green)", amber:"var(--amber)", red:"var(--red)",
};

const NOTIF_KEY = "fc_notifications_v1";

export function addNotification(type, title, detail, agentId=null) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY)||"[]");
    all.unshift({
      id: Date.now(),
      type, // "briefing" | "alert" | "schedule" | "system" | "success"
      title, detail, agentId,
      timestamp: new Date().toLocaleString("en-GB",{
        weekday:"short",day:"numeric",month:"short",
        hour:"2-digit",minute:"2-digit"
      }),
      read: false,
    });
    localStorage.setItem(NOTIF_KEY, JSON.stringify(all.slice(0,50)));
  } catch {}
}

function loadNotifications() {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY)||"[]"); }
  catch { return []; }
}

function markAllRead() {
  try {
    const all = loadNotifications().map(n=>({...n,read:true}));
    localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
  } catch {}
}

const TYPE_CONFIG = {
  briefing: { icon:"📄", color:"#6EB5C8", label:"Briefing" },
  alert:    { icon:"⚠️", color:"var(--amber)", label:"Alert"    },
  schedule: { icon:"⏰", color:"var(--gold)", label:"Schedule" },
  system:   { icon:"⚙️", color:"var(--text-mid)", label:"System"   },
  success:  { icon:"✅", color:"var(--green)", label:"Success"  },
  error:    { icon:"❌", color:"var(--red)", label:"Error"    },
};

export default function NotificationCentre({ onClose, onAgentClick }) {
  const [notifications, setNotifications] = useState(loadNotifications);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    markAllRead();
  }, []);

  const clearAll = () => {
    localStorage.removeItem(NOTIF_KEY);
    setNotifications([]);
  };

  const filtered = filter==="all"
    ? notifications
    : notifications.filter(n=>n.type===filter);

  const unread = notifications.filter(n=>!n.read).length;

  return (
    <div style={{
      position:"fixed",top:0,right:0,bottom:0,width:420,
      background:T.base,borderLeft:`1px solid ${T.border}`,
      display:"flex",flexDirection:"column",zIndex:300,
      animation:"slideIn 0.25s ease",boxShadow:"-8px 0 32px rgba(0,0,0,0.4)",
    }}>
      {/* Header */}
      <div style={{ padding:"20px 24px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <div style={{ fontSize:16,fontWeight:700,color:T.text,marginBottom:4 }}>
            🔔 Notifications
          </div>
          <div style={{ fontSize:10,color:T.textDim }}>
            {notifications.length} total · Activity log
          </div>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          {notifications.length>0&&(
            <button onClick={clearAll} style={{ background:"none",border:`1px solid ${T.border}`,color:T.textDim,fontSize:9,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",padding:"4px 10px",borderRadius:6,cursor:"pointer",fontFamily:"var(--font-mono)" }}>Clear all</button>
          )}
          <button onClick={onClose} style={{ background:"none",border:`1px solid ${T.border}`,color:T.textMid,fontSize:18,width:32,height:32,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display:"flex",gap:4,padding:"10px 24px",borderBottom:`1px solid ${T.border}`,flexWrap:"wrap" }}>
        {["all","briefing","alert","schedule","success"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{
            background:filter===f?(TYPE_CONFIG[f]?.color||T.gold)+"22":"none",
            border:`1px solid ${filter===f?(TYPE_CONFIG[f]?.color||T.gold)+"55":T.border}`,
            color:filter===f?(TYPE_CONFIG[f]?.color||T.gold):T.textDim,
            fontSize:9,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",
            padding:"3px 10px",borderRadius:6,cursor:"pointer",fontFamily:"var(--font-mono)",
          }}>
            {f==="all"?`All (${notifications.length})`:f}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div style={{ flex:1,overflowY:"auto",padding:"12px 24px" }}>
        {filtered.length===0?(
          <div style={{ textAlign:"center",padding:"40px 0",color:T.textDim,fontSize:13 }}>
            No notifications yet.<br/>
            <span style={{ fontSize:11,color:T.textDim }}>Run agents to start logging activity.</span>
          </div>
        ):(
          filtered.map(n=>{
            const cfg = TYPE_CONFIG[n.type]||TYPE_CONFIG.system;
            return (
              <div key={n.id} style={{
                background:T.card,border:`1px solid ${T.border}`,
                borderLeft:`3px solid ${cfg.color}`,
                borderRadius:9,padding:"12px 14px",marginBottom:8,
                opacity:n.read?0.7:1,cursor:n.agentId?"pointer":"default",
                transition:"opacity 0.2s",
              }}
                onClick={()=>n.agentId&&onAgentClick&&onAgentClick(n.agentId)}
              >
                <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
                  <span style={{ fontSize:16,flexShrink:0 }}>{cfg.icon}</span>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:3 }}>
                      <div style={{ fontSize:12,fontWeight:600,color:T.text,lineHeight:1.3 }}>{n.title}</div>
                      <span style={{ fontSize:9,color:T.textDim,flexShrink:0,whiteSpace:"nowrap" }}>{n.timestamp}</span>
                    </div>
                    {n.detail&&<div style={{ fontSize:11,color:T.textMid,lineHeight:1.5 }}>{n.detail}</div>}
                    <div style={{ fontSize:9,color:cfg.color,marginTop:4,letterSpacing:"0.08em",textTransform:"uppercase" }}>{cfg.label}{n.agentId?" · Click to open":""}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ padding:"12px 24px",borderTop:`1px solid ${T.border}`,fontSize:10,color:T.textDim }}>
        Last 50 notifications stored locally
      </div>
    </div>
  );
}

