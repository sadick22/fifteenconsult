import { useState, useEffect } from "react";
import {
  fetchHubSpotPipeline, pushContactToHubSpot,
  fetchMailerLiteStats, createMailerLiteDraft,
  fetchLinkedInStats, fetchGA4Stats,
  fetchInstagramProfile, fetchInstagramPosts,
  fetchTikTokInsights,
  fetchMetaAdsPerformance, fetchMetaAdsAnomalies,
  fetchPageSpeed, fetchGSCOverview, fetchGSCKeywords,
  getGA4SetupSteps, getMetaSetupSteps,
  getConnectionStatuses,
} from "../lib/integrations.js";

const INTEGRATIONS = [
  { id:"hubspot",    name:"HubSpot CRM",           icon:"🟠", color:"#ff7a59", agentName:"Kwame",   description:"Pipeline · Push leads",       envKeys:["VITE_HUBSPOT_API_KEY"] },
  { id:"mailerlite", name:"MailerLite",             icon:"💚", color:"#09c269", agentName:"Nadia",   description:"Subscribers · Push drafts",    envKeys:["VITE_MAILERLITE_API_KEY"] },
  { id:"linkedin",   name:"LinkedIn Pages",         icon:"💼", color:"#0077b5", agentName:"Sara",    description:"Followers · Post engagement",  envKeys:["VITE_LINKEDIN_ACCESS_TOKEN","VITE_LINKEDIN_ORG_ID"] },
  { id:"ga4",        name:"Google Analytics 4",     icon:"📊", color:"#4285f4", agentName:"Zara",    description:"Traffic · Conversions",        envKeys:["VITE_GA4_MEASUREMENT_ID","VITE_GA4_API_SECRET"], setupGuide:true },
  { id:"meta",       name:"Meta Ads",               icon:"📱", color:"#1877f2", agentName:"Hassan/Malik", description:"Ad spend · CPL · ROAS",   envKeys:["META_AD_ACCOUNT_ID"] },
  { id:"make",       name:"Make.com",               icon:"⚙️", color:"#6d00cc", agentName:"All",     description:"Automation · Webhooks",        envKeys:["VITE_MAKE_WEBHOOK_URL"], setupGuide:true },
  { id:"instagram",  name:"Instagram",              icon:"📸", color:"#E1306C", agentName:"Sara",    description:"Followers · Engagement · Posts", envKeys:["INSTAGRAM_ACCESS_TOKEN","INSTAGRAM_ACCOUNT_ID"] },
  { id:"tiktok",     name:"TikTok Business",        icon:"🎵", color:"#69C9D0", agentName:"Sara/Malik", description:"Views · Engagement · Ads",    envKeys:["TIKTOK_ACCESS_TOKEN"] },
  { id:"trends",     name:"Google Trends",            icon:"📈", color:"#4285f4", agentName:"Tariq/Nadia", description:"Search interest · GCC keyword trends" },
  { id:"schema",     name:"Structured Data Tester",   icon:"🏷", color:"#34a853", agentName:"Tariq",   description:"Schema markup · Meta tags · Rich results" },
  { id:"pagespeed",  name:"PageSpeed Insights",      icon:"⚡", color:"#34a853", agentName:"Tariq",   description:"Core Web Vitals · Performance scores" },
  { id:"gsc",        name:"Google Search Console",   icon:"🔍", color:"#4285f4", agentName:"Tariq",   description:"Keyword rankings · Click data · Impressions" },
  { id:"semrush",    name:"Semrush",                 icon:"📊", color:"#FF642D", agentName:"Tariq",   description:"Keyword research · Competitor analysis · Backlinks" },
  { id:"adadvisor",  name:"AdAdvisor",              icon:"🎯", color:"#FF6B35", agentName:"Hassan/Malik", description:"Meta Ads Intelligence",      envKeys:["VITE_ADADVISOR_CONNECTED"] },
];

// ── SHARED ────────────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return <div style={{ fontSize:10,color:"var(--text-dim)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10 }}>{children}</div>;
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background:"var(--bg-base)",borderRadius:8,padding:"10px 12px",border:"1px solid var(--border)" }}>
      <div style={{ fontSize:9,color:"var(--text-dim)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:18,fontWeight:700,color:color||"var(--text)" }}>{value}</div>
    </div>
  );
}

function SetupStep({ step, done }) {
  return (
    <div style={{ display:"flex",gap:12,padding:"12px 0",borderBottom:"1px solid var(--border)" }}>
      <div style={{ width:24,height:24,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,background:done?"#4ade8018":"var(--bg-base)",border:`1px solid ${done?"#4ade80":"var(--border)"}`,color:done?"#4ade80":"var(--text-dim)" }}>
        {done?"✓":step.step}
      </div>
      <div>
        <div style={{ fontSize:12,fontWeight:600,color:done?"#4ade80":"var(--text)",marginBottom:3 }}>{step.title}</div>
        <div style={{ fontSize:11,color:"var(--text-dim)",lineHeight:1.6 }}>{step.detail}</div>
      </div>
    </div>
  );
}

function NotConnectedMsg({ envKeys, docsHint }) {
  return (
    <div style={{ padding:"14px 0" }}>
      <div style={{ fontSize:12,color:"var(--text-dim)",lineHeight:1.8,marginBottom:12 }}>
        Add these environment variables to Vercel to connect:
      </div>
      {envKeys.map(k => (
        <div key={k} style={{ background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:7,padding:"8px 14px",fontFamily:"var(--font-mono)",fontSize:12,color:"var(--text)",marginBottom:6 }}>
          {k}
        </div>
      ))}
      {docsHint && <div style={{ fontSize:11,color:"var(--text-dim)",marginTop:8,lineHeight:1.6 }}>{docsHint}</div>}
    </div>
  );
}

// ── HUBSPOT PANEL ─────────────────────────────────────────────────────────────
function HubSpotPanel({ connected }) {
  const [data,setData]             = useState(null);
  const [loading,setLoading]       = useState(false);
  const [form,setForm]             = useState({ firstName:"",lastName:"",email:"",company:"",notes:"" });
  const [pushing,setPushing]       = useState(false);
  const [pushResult,setPushResult] = useState(null);

  const load = async () => { setLoading(true); setData(await fetchHubSpotPipeline()); setLoading(false); };
  useEffect(() => { if(connected) load(); },[connected]);

  const handlePush = async () => {
    if(!form.email) return;
    setPushing(true);
    const r = await pushContactToHubSpot(form);
    setPushResult(r);
    setPushing(false);
    if(r.success) setForm({ firstName:"",lastName:"",email:"",company:"",notes:"" });
    setTimeout(()=>setPushResult(null),4000);
  };

  if(!connected) return <NotConnectedMsg envKeys={["VITE_HUBSPOT_API_KEY"]} docsHint="Get your key: HubSpot → Settings → Integrations → Private Apps"/>;

  return (
    <div>
      <SectionLabel>Live Pipeline <button onClick={load} style={{ background:"none",border:"none",color:"#ff7a59",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)",marginLeft:8 }}>↻ Refresh</button></SectionLabel>
      {loading ? <div style={{ fontSize:12,color:"var(--text-dim)",marginBottom:16 }}>Loading from HubSpot...</div>
      : data?.error ? <div style={{ fontSize:11,color:"#f87171",marginBottom:16 }}>⚠ {data.error}</div>
      : data ? (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:20 }}>
          <StatBox label="Total Contacts" value={data.totalContacts?.toLocaleString()||"—"} color="#ff7a59"/>
          <StatBox label="Open Deals"     value={data.openDeals||"—"}                       color="#ff7a59"/>
          <StatBox label="Total Deals"    value={data.totalDeals||"—"}                       color="var(--text)"/>
          <StatBox label="Deals Won"      value={data.wonDeals||"—"}                         color="#4ade80"/>
        </div>
      ) : null}

      <SectionLabel>Push New Lead to HubSpot</SectionLabel>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8 }}>
        {[["firstName","First name"],["lastName","Last name"],["email","Email *"],["company","Company"]].map(([k,p])=>(
          <input key={k} value={form[k]} onChange={e=>setForm(v=>({...v,[k]:e.target.value}))} placeholder={p}
            style={{ background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:7,padding:"8px 12px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none" }}
            onFocus={e=>e.target.style.borderColor="#ff7a59"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
        ))}
      </div>
      <input value={form.notes} onChange={e=>setForm(v=>({...v,notes:e.target.value}))} placeholder="Notes (optional)"
        style={{ width:"100%",background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:7,padding:"8px 12px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none",marginBottom:10 }}
        onFocus={e=>e.target.style.borderColor="#ff7a59"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
      <div style={{ display:"flex",gap:10,alignItems:"center" }}>
        <button onClick={handlePush} disabled={!form.email||pushing} style={{ background:!form.email||pushing?"transparent":"#ff7a59",color:!form.email||pushing?"#ff7a59":"#000",border:"1px solid #ff7a59",borderRadius:7,padding:"8px 20px",fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",cursor:!form.email||pushing?"not-allowed":"pointer",fontFamily:"var(--font-mono)" }}>
          {pushing?"Pushing...":"Push to HubSpot"}
        </button>
        {pushResult?.success && <span style={{ fontSize:11,color:"#4ade80" }}>✓ Created in HubSpot</span>}
        {pushResult?.error   && <span style={{ fontSize:11,color:"#f87171" }}>⚠ {pushResult.error}</span>}
      </div>
    </div>
  );
}

// ── MAILERLITE PANEL ──────────────────────────────────────────────────────────
function MailerLitePanel({ connected }) {
  const [data,setData]             = useState(null);
  const [loading,setLoading]       = useState(false);
  const [draft,setDraft]           = useState({ subject:"",content:"" });
  const [pushing,setPushing]       = useState(false);
  const [pushResult,setPushResult] = useState(null);

  const load = async () => { setLoading(true); setData(await fetchMailerLiteStats()); setLoading(false); };
  useEffect(() => { if(connected) load(); },[connected]);

  const handlePush = async () => {
    if(!draft.subject) return;
    setPushing(true);
    const r = await createMailerLiteDraft(draft);
    setPushResult(r);
    setPushing(false);
    setTimeout(()=>setPushResult(null),5000);
  };

  if(!connected) return <NotConnectedMsg envKeys={["VITE_MAILERLITE_API_KEY"]} docsHint="Get your key: MailerLite → Integrations → API"/>;

  return (
    <div>
      <SectionLabel>Live Stats <button onClick={load} style={{ background:"none",border:"none",color:"#09c269",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)",marginLeft:8 }}>↻ Refresh</button></SectionLabel>
      {loading ? <div style={{ fontSize:12,color:"var(--text-dim)",marginBottom:16 }}>Loading from MailerLite...</div>
      : data?.error ? <div style={{ fontSize:11,color:"#f87171",marginBottom:16 }}>⚠ {data.error}</div>
      : data ? (
        <>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:data.lastCampaignName?8:20 }}>
            <StatBox label="Subscribers"    value={data.totalSubscribers?.toLocaleString()||"—"} color="#09c269"/>
            <StatBox label="Last Open Rate" value={data.openRate||"—"}                           color="#09c269"/>
            <StatBox label="Last CTR"       value={data.clickRate||"—"}                          color="var(--text)"/>
          </div>
          {data.lastCampaignName && <div style={{ fontSize:11,color:"var(--text-dim)",marginBottom:16 }}>Last: <span style={{ color:"var(--text-mid)" }}>{data.lastCampaignName}</span></div>}
        </>
      ) : null}

      <SectionLabel>Push Newsletter Draft</SectionLabel>
      <input value={draft.subject} onChange={e=>setDraft(p=>({...p,subject:e.target.value}))} placeholder="Subject line *"
        style={{ width:"100%",background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:7,padding:"8px 12px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none",marginBottom:8 }}
        onFocus={e=>e.target.style.borderColor="#09c269"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
      <textarea value={draft.content} onChange={e=>setDraft(p=>({...p,content:e.target.value}))} placeholder="Paste Nadia's newsletter content here" rows={4}
        style={{ width:"100%",background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:7,padding:"8px 12px",fontSize:12,color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none",resize:"vertical",lineHeight:1.6,marginBottom:8 }}
        onFocus={e=>e.target.style.borderColor="#09c269"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
      <div style={{ display:"flex",gap:10,alignItems:"center",flexWrap:"wrap" }}>
        <button onClick={handlePush} disabled={!draft.subject||pushing} style={{ background:!draft.subject||pushing?"transparent":"#09c269",color:!draft.subject||pushing?"#09c269":"#000",border:"1px solid #09c269",borderRadius:7,padding:"8px 20px",fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",cursor:!draft.subject||pushing?"not-allowed":"pointer",fontFamily:"var(--font-mono)" }}>
          {pushing?"Creating...":"Create Draft in MailerLite"}
        </button>
        {pushResult?.success && <span style={{ fontSize:11,color:"#4ade80" }}>✓ Draft created! {pushResult.url&&<a href={pushResult.url} target="_blank" rel="noreferrer" style={{ color:"#09c269",marginLeft:4 }}>Open →</a>}</span>}
        {pushResult?.error   && <span style={{ fontSize:11,color:"#f87171" }}>⚠ {pushResult.error}</span>}
      </div>
    </div>
  );
}

// ── INSTAGRAM PANEL ──────────────────────────────────────────────────────────────
function InstagramPanel({ connected }) {
  const [profile,setProfile] = useState(null);
  const [posts,setPosts]     = useState(null);
  const [loading,setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [p,po] = await Promise.all([fetchInstagramProfile(), fetchInstagramPosts()]);
    setProfile(p); setPosts(po);
    setLoading(false);
  };
  useEffect(() => { if(connected) load(); },[connected]);

  if(!connected) return (
    <div>
      <NotConnectedMsg
        envKeys={["INSTAGRAM_ACCESS_TOKEN","INSTAGRAM_ACCOUNT_ID"]}
        docsHint="Setup: developers.facebook.com → Create App → Instagram Graph API → Get long-lived token + Account ID"
      />
      <div style={{ background:"#E1306C18",border:"1px solid #E1306C44",borderRadius:8,padding:"12px 16px",marginTop:12 }}>
        <div style={{ fontSize:11,color:"#E1306C",fontWeight:600,marginBottom:4 }}>📋 Quick Setup (10 minutes)</div>
        <div style={{ fontSize:11,color:"var(--text-dim)",lineHeight:1.8 }}>
          1. Go to developers.facebook.com → My Apps → Create App → Business<br/>
          2. Add "Instagram Graph API" product<br/>
          3. Connect your @fifteenconsult Instagram Business account<br/>
          4. Generate a long-lived user access token<br/>
          5. Get your Instagram Business Account ID from the API Explorer<br/>
          6. Add both to Vercel as server-side env vars (no VITE_ prefix)
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <SectionLabel>Live Stats — @fifteenconsult
        <button onClick={load} style={{ background:"none",border:"none",color:"#E1306C",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)",marginLeft:8 }}>↻ Refresh</button>
      </SectionLabel>
      {loading ? <div style={{ fontSize:12,color:"var(--text-dim)" }}>Loading from Instagram...</div>
      : profile?.error ? <div style={{ fontSize:11,color:"#f87171" }}>⚠ {profile.error}</div>
      : profile ? (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16 }}>
          <StatBox label="Followers"  value={profile.followers?.toLocaleString()||"—"} color="#E1306C"/>
          <StatBox label="Following"  value={profile.following?.toLocaleString()||"—"} color="var(--text)"/>
          <StatBox label="Posts"      value={profile.posts?.toLocaleString()||"—"}     color="var(--text)"/>
        </div>
      ) : null}
      {posts && !posts.error && (
        <>
          <SectionLabel>Recent Post Engagement</SectionLabel>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
            <StatBox label="Avg Engagement" value={posts.avgEngagement||"—"} color="#E1306C"/>
            <StatBox label="Total Likes"    value={posts.totalLikes?.toLocaleString()||"—"} color="var(--text)"/>
          </div>
          {(posts.posts||[]).slice(0,3).map((p,i) => (
            <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--border)",fontSize:11 }}>
              <span style={{ color:"var(--text-mid)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"65%" }}>
                {p.caption?.slice(0,50)||"[No caption]"}...
              </span>
              <span style={{ color:"#E1306C",fontWeight:600,flexShrink:0 }}>❤️ {p.like_count||0}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── TIKTOK PANEL ──────────────────────────────────────────────────────────────
function TikTokPanel({ connected }) {
  const [data,setData]       = useState(null);
  const [loading,setLoading] = useState(false);

  const load = async () => { setLoading(true); setData(await fetchTikTokInsights()); setLoading(false); };
  useEffect(() => { if(connected) load(); },[connected]);

  if(!connected) return (
    <div>
      <NotConnectedMsg
        envKeys={["TIKTOK_ACCESS_TOKEN","TIKTOK_ADVERTISER_ID"]}
        docsHint="Setup: business.tiktok.com → Developer Tools → App Management → Create App → Generate access token with analytics permissions"
      />
    </div>
  );

  return (
    <div>
      <SectionLabel>Live TikTok Business Stats (Last 30 days)
        <button onClick={load} style={{ background:"none",border:"none",color:"#69C9D0",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)",marginLeft:8 }}>↻ Refresh</button>
      </SectionLabel>
      {loading ? <div style={{ fontSize:12,color:"var(--text-dim)" }}>Loading from TikTok...</div>
      : data?.error ? <div style={{ fontSize:11,color:"#f87171" }}>⚠ {data.error}</div>
      : data ? (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10 }}>
          <StatBox label="Total Spend"       value={`$${data.totalSpend}`}                    color="#69C9D0"/>
          <StatBox label="Impressions"       value={data.totalImpressions?.toLocaleString()||"—"} color="var(--text)"/>
          <StatBox label="Clicks"            value={data.totalClicks?.toLocaleString()||"—"}  color="var(--text)"/>
          <StatBox label="Avg CTR"           value={data.avgCTR||"—"}                         color="#69C9D0"/>
        </div>
      ) : null}
    </div>
  );
}
// ── TRENDS PANEL ─────────────────────────────────────────────────────────────────────
function TrendsPanel() {
  return (
    <div>
      <div style={{ background:"#4285f418",border:"1px solid #4285f444",borderRadius:8,padding:"12px 16px",marginBottom:14 }}>
        <div style={{ fontSize:11,color:"#4285f4",fontWeight:600,marginBottom:4 }}>📈 Google Trends — Free, No Setup</div>
        <div style={{ fontSize:11,color:"var(--text-dim)",lineHeight:1.7 }}>
          Google Trends data is available to Tariq and Nadia via web fetch. No API key needed for manual use.
        </div>
      </div>
      <div style={{ background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:8,padding:"14px 16px",marginBottom:12 }}>
        <div style={{ fontSize:11,color:"var(--text)",fontWeight:600,marginBottom:8 }}>How Tariq uses Google Trends:</div>
        {["Track search interest for 'marketing consultancy Qatar' over time","Compare keyword popularity: 'marketing agency' vs 'marketing consultancy'","Identify seasonal patterns in GCC business searches","Find rising keywords in Nigeria and Ghana for West Africa expansion","Spot trending topics for Nadia's content calendar"].map((item,i) => (
          <div key={i} style={{ fontSize:11,color:"var(--text-dim)",padding:"4px 0",borderBottom:"1px solid var(--border)",display:"flex",gap:8 }}>
            <span style={{ color:"#4285f4" }}>→</span> {item}
          </div>
        ))}
      </div>
      <a href="https://trends.google.com/trends/explore?geo=QA&q=marketing%20consultancy%20qatar,marketing%20agency%20doha" target="_blank" rel="noopener noreferrer"
        style={{ display:"block",background:"#4285f418",border:"1px solid #4285f444",borderRadius:8,padding:"10px 14px",fontSize:11,color:"#4285f4",fontWeight:600,textDecoration:"none",textAlign:"center" }}>
        → Open Google Trends for FifteenConsult Keywords ↗
      </a>
    </div>
  );
}

// ── SCHEMA PANEL ─────────────────────────────────────────────────────────────────────
function SchemaPanel() {
  const [data,setData]       = useState(null);
  const [loading,setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/schematest?url=https://fifteenconsult.com");
      setData(await r.json());
    } catch(e) { setData({ error: e.message }); }
    setLoading(false);
  };
  useEffect(() => { load(); },[]);

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
        <SectionLabel>Structured Data — fifteenconsult.com</SectionLabel>
        <button onClick={load} style={{ background:"none",border:"none",color:"#34a853",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)" }}>↻ Refresh</button>
      </div>
      {loading ? <div style={{ fontSize:12,color:"var(--text-dim)" }}>Scanning fifteenconsult.com...</div>
      : data?.error ? <div style={{ fontSize:11,color:"#f87171" }}>⚠ {data.error}</div>
      : data ? (
        <>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16 }}>
            <StatBox label="Schema Score" value={`${data.score}/100`} color={data.score>=70?"#4ade80":data.score>=40?"#fbbf24":"#f87171"}/>
            <StatBox label="Schemas Found" value={data.schemas?.count||0} color="var(--text)"/>
          </div>
          {data.meta && (
            <>
              <SectionLabel>Meta Tags</SectionLabel>
              {[
                { label:"Title", value: `"${data.meta.title?.slice(0,50)}"`, ok: data.meta.titleLength > 0 && data.meta.titleLength <= 60 },
                { label:"Description", value: data.meta.hasMetaDesc ? "✓ Present" : "✗ MISSING", ok: data.meta.hasMetaDesc },
                { label:"Canonical", value: data.meta.hasCanonical ? "✓ Present" : "✗ Missing", ok: data.meta.hasCanonical },
                { label:"Open Graph", value: data.meta.hasOG ? "✓ Present" : "✗ Missing", ok: data.meta.hasOG },
              ].map((m,i) => (
                <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--border)",fontSize:11 }}>
                  <span style={{ color:"var(--text-dim)" }}>{m.label}</span>
                  <span style={{ color:m.ok?"#4ade80":"#f87171",fontWeight:600 }}>{m.value}</span>
                </div>
              ))}
            </>
          )}
          {data.recommendations?.length > 0 && (
            <>
              <SectionLabel style={{ marginTop:14 }}>Recommendations for Tariq</SectionLabel>
              {data.recommendations.map((r,i) => (
                <div key={i} style={{ fontSize:11,color:"var(--text-dim)",padding:"5px 0",borderBottom:"1px solid var(--border)" }}>{r}</div>
              ))}
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

// ── PAGESPEED PANEL ──────────────────────────────────────────────────────────────────
function PageSpeedPanel() {
  const [mobile,setMobile]   = useState(null);
  const [desktop,setDesktop] = useState(null);
  const [loading,setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [m,d] = await Promise.all([fetchPageSpeed("mobile"), fetchPageSpeed("desktop")]);
    setMobile(m); setDesktop(d);
    setLoading(false);
  };
  useEffect(() => { load(); },[]);

  const ScoreBox = ({ score, label }) => {
    const color = score >= 90 ? "#34a853" : score >= 50 ? "#fbbc04" : "#ea4335";
    return (
      <div style={{ textAlign:"center",background:"var(--bg-base)",borderRadius:8,padding:"10px 6px",border:`2px solid ${color}44` }}>
        <div style={{ fontSize:26,fontWeight:700,color }}>{score}</div>
        <div style={{ fontSize:9,color:"var(--text-dim)",marginTop:2 }}>{label}</div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
        <SectionLabel>fifteenconsult.com — Live Performance Scores</SectionLabel>
        <button onClick={load} style={{ background:"none",border:"none",color:"#34a853",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)" }}>↻ Refresh</button>
      </div>
      {loading ? <div style={{ fontSize:12,color:"var(--text-dim)" }}>Running PageSpeed analysis on fifteenconsult.com...</div>
      : mobile?.error ? <div style={{ fontSize:11,color:"#f87171",lineHeight:1.7 }}>⚠ {mobile.error}</div>
      : mobile ? (
        <>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16 }}>
            <div>
              <div style={{ fontSize:10,color:"var(--text-dim)",marginBottom:8 }}>📱 MOBILE</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
                {Object.entries(mobile.scores||{}).map(([k,v]) => <ScoreBox key={k} score={v} label={k.replace(/([A-Z])/g," $1").trim()}/>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize:10,color:"var(--text-dim)",marginBottom:8 }}>🖥 DESKTOP</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
                {Object.entries(desktop?.scores||{}).map(([k,v]) => <ScoreBox key={k} score={v} label={k.replace(/([A-Z])/g," $1").trim()}/>)}
              </div>
            </div>
          </div>
          <SectionLabel>Core Web Vitals (Mobile)</SectionLabel>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16 }}>
            {Object.entries(mobile.coreWebVitals||{}).map(([k,v]) => (
              <StatBox key={k} label={k.toUpperCase()} value={v} color="var(--text)"/>
            ))}
          </div>
          {(mobile.opportunities||[]).length > 0 && (
            <>
              <SectionLabel>🔧 Top Opportunities</SectionLabel>
              {mobile.opportunities.map((o,i) => (
                <div key={i} style={{ fontSize:11,padding:"5px 0",borderBottom:"1px solid var(--border)",display:"flex",gap:8 }}>
                  <span style={{ color:o.impact==="high"?"#f87171":"#fbbf24",flexShrink:0 }}>→</span>
                  <span style={{ color:"var(--text-mid)" }}>{o.title}{o.savings?` (${o.savings})`:""}</span>
                </div>
              ))}
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

// ── GSC PANEL ─────────────────────────────────────────────────────────────────────
function GSCPanel() {
  const [overview,setOverview] = useState(null);
  const [keywords,setKeywords] = useState(null);
  const [tab,setTab]           = useState("keywords");
  const [loading,setLoading]   = useState(false);

  const load = async () => {
    setLoading(true);
    const [o,k] = await Promise.all([fetchGSCOverview(), fetchGSCKeywords()]);
    setOverview(o); setKeywords(k);
    setLoading(false);
  };
  useEffect(() => { load(); },[]);

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
        <SectionLabel>Google Search Console — fifteenconsult.com</SectionLabel>
        <button onClick={load} style={{ background:"none",border:"none",color:"#4285f4",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)" }}>↻ Refresh</button>
      </div>
      <div style={{ display:"flex",gap:6,marginBottom:14 }}>
        {["keywords","pages"].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{ background:tab===t?"#4285f418":"none",border:`1px solid ${tab===t?"#4285f4":"var(--border)"}`,color:tab===t?"#4285f4":"var(--text-dim)",fontSize:10,fontWeight:tab===t?700:400,padding:"5px 14px",borderRadius:7,cursor:"pointer",fontFamily:"var(--font-mono)",textTransform:"uppercase" }}>{t}</button>
        ))}
      </div>
      {loading ? <div style={{ fontSize:12,color:"var(--text-dim)" }}>Loading from Search Console...</div>
      : tab==="keywords" && keywords?.error ? (
        <div style={{ lineHeight:1.8 }}>
          <div style={{ fontSize:11,color:"#f87171",marginBottom:8 }}>⚠ {keywords.error}</div>
          <div style={{ background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:8,padding:"12px 14px",fontSize:11,color:"var(--text-dim)" }}>
            <strong style={{ color:"var(--text)" }}>To connect Google Search Console:</strong><br/>
            Add these to Vercel env vars (reuse your GA4 OAuth credentials):<br/>
            <code style={{ color:"#4ade80" }}>GSC_CLIENT_ID</code> = same as GA4_CLIENT_ID<br/>
            <code style={{ color:"#4ade80" }}>GSC_CLIENT_SECRET</code> = same as GA4_CLIENT_SECRET<br/>
            <code style={{ color:"#4ade80" }}>GSC_REFRESH_TOKEN</code> = new token from OAuth Playground with Search Console scope
          </div>
        </div>
      )
      : tab==="keywords" && keywords?.keywords ? (
        <>
          <div style={{ fontSize:10,color:"var(--text-dim)",marginBottom:10 }}>Period: {keywords.period}</div>
          {keywords.keywords.map((k,i) => (
            <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid var(--border)",fontSize:11 }}>
              <span style={{ color:"var(--text-mid)",flex:1 }}>{k.keyword}</span>
              <span style={{ color:typeof k.position==="number"&&k.position<=5?"#4ade80":typeof k.position==="number"&&k.position<=10?"#fbbf24":"#f87171",fontWeight:700,marginLeft:12 }}>
                {typeof k.position==="number"?`#${k.position}`:k.position}
              </span>
              <span style={{ color:"var(--text-dim)",marginLeft:10 }}>{k.clicks} clicks</span>
            </div>
          ))}
        </>
      )
      : tab==="pages" && overview?.topPages ? (
        <>
          <div style={{ fontSize:10,color:"var(--text-dim)",marginBottom:10 }}>Period: {overview.period}</div>
          {overview.topPages.map((p,i) => (
            <div key={i} style={{ padding:"7px 0",borderBottom:"1px solid var(--border)",fontSize:11 }}>
              <div style={{ color:"#4285f4",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.page}</div>
              <div style={{ display:"flex",gap:14,color:"var(--text-dim)" }}>
                <span>{p.clicks} clicks</span><span>{p.impressions.toLocaleString()} impressions</span><span>Pos #{p.position}</span>
              </div>
            </div>
          ))}
        </>
      ) : null}
    </div>
  );
}

// ── SEMRUSH PANEL ─────────────────────────────────────────────────────────────────
function SemrushPanel() {
  return (
    <div>
      <div style={{ background:"#FF642D18",border:"1px solid #FF642D44",borderRadius:8,padding:"12px 16px",marginBottom:14 }}>
        <div style={{ fontSize:11,color:"#FF642D",fontWeight:600,marginBottom:4 }}>📊 Semrush — Connect via Claude.ai</div>
        <div style={{ fontSize:11,color:"var(--text-dim)",lineHeight:1.7 }}>
          Connect your Semrush account in <strong>Claude.ai → Settings → Integrations → Semrush</strong>. Once connected, Tariq uses it directly in briefings for live keyword and competitor data.
        </div>
      </div>
      <div style={{ background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:8,padding:"14px 16px" }}>
        <div style={{ fontSize:11,color:"var(--text)",fontWeight:600,marginBottom:8 }}>What Tariq gets from Semrush:</div>
        {["Live keyword rankings for GCC target keywords","Competitor keyword gap — what BPG and MCN rank for","Backlink opportunities and referring domain analysis","Site audit — technical SEO issues","Domain authority tracking","Content gap analysis"].map((item,i) => (
          <div key={i} style={{ fontSize:11,color:"var(--text-dim)",padding:"4px 0",borderBottom:"1px solid var(--border)",display:"flex",gap:8 }}>
            <span style={{ color:"#FF642D" }}>→</span> {item}
          </div>
        ))}
      </div>
    </div>
  );
}


// ── ADADVISOR PANEL ───────────────────────────────────────────────────────────
function AdAdvisorPanel({ connected }) {
  return (
    <div>
      <div style={{ padding:"14px 0" }}>
        <div style={{ fontSize:12,color:"var(--text-mid)",lineHeight:1.8,marginBottom:16 }}>
          AdAdvisor connects your Meta Ads account directly to AI — giving Hassan and Malik live campaign data, creative insights, and competitor ad intelligence.
        </div>
        <div style={{ background:"#FF6B3518",border:"1px solid #FF6B3544",borderRadius:8,padding:"14px 16px",marginBottom:12 }}>
          <div style={{ fontSize:11,color:"#FF6B35",fontWeight:600,marginBottom:6 }}>✅ Your AdAdvisor account is connected</div>
          <div style={{ fontSize:11,color:"var(--text-dim)",lineHeight:1.8 }}>
            AdAdvisor MCP is active in your Claude account. Hassan and Malik can access live Meta campaign data, performance metrics, and ad creative analysis directly in their briefings.
          </div>
        </div>
        <div style={{ background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:8,padding:"14px 16px" }}>
          <div style={{ fontSize:11,color:"var(--text)",fontWeight:600,marginBottom:8 }}>What AdAdvisor gives your agents:</div>
          {[
            "Live Meta campaign performance (spend, ROAS, CPL, CTR)",
            "Creative performance analysis — which ad formats are winning",
            "Competitor ad library — what other brands in your space are running",
            "Audience insights — who is engaging with your ads",
            "Anomaly detection — alerts when performance drops",
          ].map((item,i) => (
            <div key={i} style={{ fontSize:11,color:"var(--text-dim)",padding:"4px 0",borderBottom:"1px solid var(--border)",display:"flex",gap:8 }}>
              <span style={{ color:"#FF6B35" }}>→</span> {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── LINKEDIN PANEL ────────────────────────────────────────────────────────────
function LinkedInPanel({ connected }) {
  const [data,setData]     = useState(null);
  const [loading,setLoading] = useState(false);

  const load = async () => { setLoading(true); setData(await fetchLinkedInStats()); setLoading(false); };
  useEffect(() => { if(connected) load(); },[connected]);

  if(!connected) return (
    <div>
      <NotConnectedMsg
        envKeys={["VITE_LINKEDIN_ACCESS_TOKEN","VITE_LINKEDIN_ORG_ID"]}
        docsHint="LinkedIn Developer Portal → Create App → Request r_organization_social + rw_organization_admin permissions. Your Org ID is in your LinkedIn company page URL."
      />
      <div style={{ background:"#0077b518",border:"1px solid #0077b544",borderRadius:8,padding:"12px 16px",marginTop:12 }}>
        <div style={{ fontSize:11,color:"#0077b5",fontWeight:600,marginBottom:4 }}>📌 Note on LinkedIn API</div>
        <div style={{ fontSize:11,color:"var(--text-dim)",lineHeight:1.7 }}>
          LinkedIn's API requires a verified business app and approval for follower analytics. The process takes 1–5 business days. Apply at developers.linkedin.com.
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <SectionLabel>Live Stats <button onClick={load} style={{ background:"none",border:"none",color:"#0077b5",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)",marginLeft:8 }}>↻ Refresh</button></SectionLabel>
      {loading ? <div style={{ fontSize:12,color:"var(--text-dim)" }}>Loading from LinkedIn...</div>
      : data?.error ? <div style={{ fontSize:11,color:"#f87171" }}>⚠ {data.error}</div>
      : data ? (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10 }}>
          <StatBox label="LinkedIn Followers" value={data.totalFollowers?.toLocaleString()||"—"} color="#0077b5"/>
          <StatBox label="Recent Posts"       value={data.postsCount||"—"}                       color="var(--text)"/>
        </div>
      ) : null}
    </div>
  );
}

// ── GA4 PANEL ─────────────────────────────────────────────────────────────────
function GA4Panel({ connected }) {
  const [data,setData]       = useState(null);
  const [loading,setLoading] = useState(false);
  const setup = getGA4SetupSteps();
  const completedSteps = setup.steps.filter(s=>s.done).length;

  const load = async () => { setLoading(true); setData(await fetchGA4Stats()); setLoading(false); };
  useEffect(() => { if(connected) load(); },[connected]);

  if (!connected) return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <SectionLabel>Setup Progress</SectionLabel>
        <span style={{ fontSize:10,color:"#4285f4",fontWeight:700 }}>{completedSteps}/{setup.steps.length} steps done</span>
      </div>
      <div style={{ background:"var(--bg-base)",borderRadius:8,height:4,marginBottom:16,overflow:"hidden" }}>
        <div style={{ width:`${(completedSteps/setup.steps.length)*100}%`,height:"100%",background:"#4285f4",borderRadius:4,transition:"width 0.8s ease" }}/>
      </div>
      {setup.steps.map(s=><SetupStep key={s.step} step={s} done={s.done}/>)}
      <div style={{ marginTop:16,padding:"12px 16px",background:"#4285f418",border:"1px solid #4285f444",borderRadius:8 }}>
        <div style={{ fontSize:11,color:"#4285f4",fontWeight:600,marginBottom:4 }}>Once connected, Zara will show:</div>
        <div style={{ fontSize:11,color:"var(--text-dim)",lineHeight:1.8 }}>
          • Live sessions, bounce rate, avg time on page<br/>
          • Traffic sources (organic, social, paid, direct)<br/>
          • Top pages on fifteenconsult.com<br/>
          • Contact form conversion rate
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <SectionLabel>Live Stats — fifteenconsult.com (Last 30 days)
        <button onClick={load} style={{ background:"none",border:"none",color:"#4285f4",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)",marginLeft:8 }}>↻ Refresh</button>
      </SectionLabel>
      {loading ? <div style={{ fontSize:12,color:"var(--text-dim)",marginBottom:16 }}>Loading from GA4...</div>
      : data?.error ? <div style={{ fontSize:11,color:"#f87171",marginBottom:16 }}>⚠ {data.error}</div>
      : data ? (
        <>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:16 }}>
            <StatBox label="Sessions"      value={data.sessions?.toLocaleString()||"—"} color="#4285f4"/>
            <StatBox label="Active Users"  value={data.users?.toLocaleString()||"—"}    color="#4285f4"/>
            <StatBox label="Bounce Rate"   value={data.bounceRate||"—"}                 color="var(--text)"/>
            <StatBox label="Avg Duration"  value={data.avgDuration||"—"}               color="var(--text)"/>
          </div>
          {data.sources?.length>0&&(
            <div style={{ marginBottom:16 }}>
              <SectionLabel>Traffic Sources</SectionLabel>
              {data.sources.map((s,i)=>(
                <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--border)",fontSize:12 }}>
                  <span style={{ color:"var(--text-mid)" }}>{s.channel}</span>
                  <span style={{ color:"#4285f4",fontWeight:600 }}>{s.sessions} sessions</span>
                </div>
              ))}
            </div>
          )}
          {data.topPages?.length>0&&(
            <div>
              <SectionLabel>Top Pages</SectionLabel>
              {data.topPages.map((p,i)=>(
                <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--border)",fontSize:12 }}>
                  <span style={{ color:"var(--text-mid)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"70%" }}>{p.path}</span>
                  <span style={{ color:"#4285f4",fontWeight:600 }}>{p.views} views</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

// ── META PANEL ────────────────────────────────────────────────────────────────
function MetaPanel({ connected }) {
  const [perf,setPerf]       = useState(null);
  const [anomalies,setAnom]  = useState(null);
  const [loading,setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [p,a] = await Promise.all([fetchMetaAdsPerformance(), fetchMetaAdsAnomalies()]);
    setPerf(p); setAnom(a);
    setLoading(false);
  };
  useEffect(() => { if(connected) load(); },[connected]);

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
        <SectionLabel>Meta Ads — Official MCP</SectionLabel>
        <button onClick={load} style={{ background:"none",border:"none",color:"#1877f2",fontSize:10,cursor:"pointer",fontFamily:"var(--font-mono)" }}>↻ Refresh</button>
      </div>
      <div style={{ background:"#1877f218",border:"1px solid #1877f244",borderRadius:8,padding:"10px 14px",marginBottom:14 }}>
        <div style={{ fontSize:11,color:"#1877f2",fontWeight:600,marginBottom:3 }}>✅ Official Meta Ads MCP Connected</div>
        <div style={{ fontSize:10,color:"var(--text-dim)" }}>Ad Account: 932655362719996 · 29 tools available · Pending account activation</div>
      </div>
      {loading ? (
        <div style={{ fontSize:12,color:"var(--text-dim)" }}>Checking Meta Ads status...</div>
      ) : perf?.pending ? (
        <div>
          <div style={{ background:"#fbbf2418",border:"1px solid #fbbf2444",borderRadius:8,padding:"12px 16px",marginBottom:12 }}>
            <div style={{ fontSize:11,color:"#fbbf24",fontWeight:600,marginBottom:4 }}>⏳ Pending Account Activation</div>
            <div style={{ fontSize:11,color:"var(--text-dim)",lineHeight:1.7 }}>
              Meta is rolling out MCP access gradually. Your account is queued — this activates automatically, check back in a few days.
            </div>
          </div>
          <div style={{ background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:8,padding:"14px 16px" }}>
            <div style={{ fontSize:11,color:"var(--text)",fontWeight:600,marginBottom:8 }}>Once activated, Hassan + Malik will see:</div>
            {["Live spend, impressions, clicks, CTR per campaign","ROAS and CPL vs QAR 150 target","Performance anomaly detection","Industry benchmark comparison","Auction ranking analysis"].map((item,i) => (
              <div key={i} style={{ fontSize:11,color:"var(--text-dim)",padding:"4px 0",borderBottom:"1px solid var(--border)",display:"flex",gap:8 }}>
                <span style={{ color:"#1877f2" }}>→</span> {item}
              </div>
            ))}
          </div>
        </div>
      ) : perf?.error ? (
        <div style={{ fontSize:11,color:"#f87171" }}>⚠ {perf.error}</div>
      ) : perf ? (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
          <StatBox label="Ad Spend"    value={`$${perf.spend||"—"}`}                        color="#1877f2"/>
          <StatBox label="ROAS"        value={perf.roas||"—"}                               color="#4ade80"/>
          <StatBox label="CTR"         value={perf.ctr||"—"}                               color="var(--text)"/>
          <StatBox label="Impressions" value={perf.impressions?.toLocaleString()||"—"}      color="var(--text)"/>
          <StatBox label="Clicks"      value={perf.clicks?.toLocaleString()||"—"}           color="var(--text)"/>
          <StatBox label="CPM"         value={`$${perf.cpm||"—"}`}                         color="var(--text)"/>
        </div>
      ) : null}
    </div>
  );
}

// ── MAKE PANEL ────────────────────────────────────────────────────────────────
function MakePanel() {
  return (
    <div>
      <SectionLabel>Automation Layer</SectionLabel>
      <div style={{ fontSize:12,color:"var(--text-mid)",lineHeight:1.8,marginBottom:16 }}>
        Make.com connects FifteenConsult's dashboard to any platform via webhooks — automating tasks agents recommend.
      </div>
      {[
        { title:"Kwame books a call", action:"→ HubSpot deal created automatically + calendar invite sent" },
        { title:"Nadia finishes a LinkedIn post", action:"→ Scheduled in Buffer/Hootsuite automatically" },
        { title:"Hassan detects high CPL", action:"→ Slack alert + pause ad campaign in Meta" },
        { title:"Zara's weekly report runs", action:"→ PDF emailed to you every Friday at 5pm" },
        { title:"New contact in HubSpot", action:"→ Added to MailerLite segment automatically" },
      ].map((w,i)=>(
        <div key={i} style={{ background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:8,padding:"12px 14px",marginBottom:8 }}>
          <div style={{ fontSize:12,fontWeight:600,color:"var(--text)",marginBottom:3 }}>{w.title}</div>
          <div style={{ fontSize:11,color:"#6d00cc" }}>{w.action}</div>
        </div>
      ))}
      <div style={{ marginTop:12,padding:"12px 16px",background:"#6d00cc18",border:"1px solid #6d00cc44",borderRadius:8 }}>
        <div style={{ fontSize:11,color:"#6d00cc",lineHeight:1.7 }}>
          Add <code style={{ background:"var(--bg-card)",padding:"2px 6px",borderRadius:4 }}>VITE_MAKE_WEBHOOK_URL</code> to Vercel to trigger Make scenarios from the dashboard. Get your webhook URL from Make → Scenarios → Webhooks.
        </div>
      </div>
    </div>
  );
}

// ── MAIN PANEL ────────────────────────────────────────────────────────────────
export default function IntegrationsPanel({ onClose }) {
  const [activeId, setActiveId] = useState("hubspot");
  const statuses = getConnectionStatuses();
  const active   = INTEGRATIONS.find(i=>i.id===activeId);
  const connected = statuses[activeId];
  const connectedCount = Object.values(statuses).filter(Boolean).length;

  return (
    <div style={{ position:"fixed",top:0,right:0,bottom:0,width:600,background:"var(--bg-base)",borderLeft:"1px solid var(--border)",display:"flex",flexDirection:"column",zIndex:300,animation:"slideIn 0.25s ease",boxShadow:"-8px 0 32px rgba(0,0,0,0.4)" }}>
      {/* Header */}
      <div style={{ padding:"20px 24px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:17,fontWeight:700,color:"var(--text)",marginBottom:5 }}>🔌 External Connections</div>
          <div style={{ display:"flex",gap:8 }}>
            <span style={{ fontSize:10,color:"#4ade80",background:"#4ade8018",padding:"2px 10px",borderRadius:10,fontWeight:700 }}>{connectedCount} connected</span>
            <span style={{ fontSize:10,color:"var(--text-dim)",background:"var(--bg-card)",padding:"2px 10px",borderRadius:10 }}>{INTEGRATIONS.length-connectedCount} pending</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background:"none",border:"1px solid var(--border)",color:"var(--text-mid)",fontSize:18,width:32,height:32,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
      </div>

      <div style={{ display:"flex",flex:1,overflow:"hidden" }}>
        {/* Integration list */}
        <div style={{ width:176,borderRight:"1px solid var(--border)",overflowY:"auto",flexShrink:0 }}>
          {INTEGRATIONS.map(intg=>{
            const isActive    = activeId===intg.id;
            const isConnected = statuses[intg.id];
            return (
              <div key={intg.id} onClick={()=>setActiveId(intg.id)} style={{ padding:"13px 14px",cursor:"pointer",borderLeft:isActive?`3px solid ${intg.color}`:"3px solid transparent",background:isActive?intg.color+"12":"transparent",borderBottom:"1px solid var(--border)",transition:"all 0.15s" }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3 }}>
                  <span style={{ fontSize:15 }}>{intg.icon}</span>
                  <span style={{ fontSize:11,fontWeight:isActive?600:400,color:isActive?intg.color:"var(--text-mid)",lineHeight:1.3 }}>{intg.name}</span>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:5,paddingLeft:23 }}>
                  <span style={{ width:5,height:5,borderRadius:"50%",background:intg.setupGuide?"var(--text-dim)":isConnected?"#4ade80":"#f87171",display:"inline-block" }}/>
                  <span style={{ fontSize:9,color:"var(--text-dim)" }}>{intg.setupGuide?"setup guide":isConnected?"● live":"not set"}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail */}
        <div style={{ flex:1,overflow:"auto",padding:"20px 22px" }}>
          {active&&(
            <>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
                <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                  <span style={{ fontSize:22 }}>{active.icon}</span>
                  <div>
                    <div style={{ fontSize:14,fontWeight:700,color:"var(--text)" }}>{active.name}</div>
                    <div style={{ fontSize:10,color:active.color,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:2 }}>{active.agentName} · {active.description}</div>
                  </div>
                </div>
                <span style={{ fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:active.setupGuide?"var(--text-dim)":connected?"#4ade80":"#f87171",background:active.setupGuide?"var(--bg-card)":connected?"#4ade8018":"#f8717118",padding:"3px 10px",borderRadius:10 }}>
                  {active.setupGuide?"Setup Guide":connected?"● Live":"Not connected"}
                </span>
              </div>

              {activeId==="hubspot"    && <HubSpotPanel    connected={connected}/>}
              {activeId==="mailerlite" && <MailerLitePanel connected={connected}/>}
              {activeId==="linkedin"   && <LinkedInPanel   connected={connected}/>}
              {activeId==="instagram"  && <InstagramPanel  connected={connected}/>}
              {activeId==="tiktok"     && <TikTokPanel     connected={connected}/>}
              {activeId==="adadvisor"  && <AdAdvisorPanel  connected={connected}/>}
              {activeId==="pagespeed"  && <PageSpeedPanel  connected={connected}/>}
              {activeId==="trends"     && <TrendsPanel/>}
              {activeId==="schema"     && <SchemaPanel/>}
              {activeId==="gsc"        && <GSCPanel         connected={connected}/>}
              {activeId==="semrush"    && <SemrushPanel     connected={connected}/>}
              {activeId==="ga4"        && <GA4Panel connected={connected}/>}
              {activeId==="meta"       && <MetaPanel       connected={connected}/>}
              {activeId==="make"       && <MakePanel/>}
            </>
          )}
        </div>
      </div>

      <div style={{ padding:"12px 22px",borderTop:"1px solid var(--border)",fontSize:10,color:"var(--text-dim)",lineHeight:1.6 }}>
        API keys stored securely as Vercel environment variables — never in code. Redeploy after adding each key.
      </div>
    </div>
  );
}
