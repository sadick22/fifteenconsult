import { useState, useRef, useEffect, useMemo, useCallback } from "react";

/* ============================================================================
   FIFTEENCONSULT — ORBITAL COMMAND CENTER
   The gold core is FifteenConsult; the agents orbit it in three meaningful
   rings. Hover pauses the system and expands an agent's live readout at the
   planet. Click enters their workspace. Tilted plane gives real depth; agents
   fly out from the core on load; energy pulses run along the lines of agents
   that need you.
   Props:
     agents     — [{ id, name, role, ring(0|1|2), task, alert, level('red'|'amber'|null) }]
     onOpenAgent(agent) — called when a planet is opened
   ========================================================================== */

const GOLD  = "#C8A96E";
const CREAM = "#E5D2A8";
const SLATE = "#9FB2C9";
const TEXT  = "#e8e4d9";
const RED   = "#f87171";

const TILT = 0.46; // vertical squash of the orbital plane → perspective

const RINGS = [
  { tint: GOLD,  label: "Leadership & Strategy", vel:  0.085, rf: 0.21 },
  { tint: CREAM, label: "Growth Engine",         vel: -0.056, rf: 0.33 },
  { tint: SLATE, label: "Foundation & Craft",    vel:  0.038, rf: 0.45 },
];
const PHASE = [-Math.PI/2, -Math.PI/2 + 0.45, -Math.PI/2 + 0.22];
const easeOut = p => 1 - Math.pow(1 - p, 3);

// Fallback demo data so the component renders standalone
const DEMO_AGENTS = [
  { id:"amani",  name:"Amani Osei",      role:"Chief Marketing Officer", ring:0, task:"Synthesising the weekly board brief", alert:true,  level:"amber" },
  { id:"david",  name:"David Mensah",    role:"Business Development",     ring:0, task:"3 prospect replies awaiting",        alert:true,  level:"red"   },
  { id:"malik",  name:"Malik Al-Rashid", role:"Advertising Director",     ring:0, task:"Q3 campaign concept ready",          alert:false, level:null    },
  { id:"kwame",  name:"Kwame Asante",    role:"Lead Generation",          ring:1, task:"12 new prospects researched",        alert:false, level:null    },
  { id:"hassan", name:"Hassan Al-Amin",  role:"Paid Ads Manager",         ring:1, task:"CPL trending down 14%",              alert:false, level:null    },
  { id:"sara",   name:"Sara Mensah",     role:"Social Media",             ring:1, task:"4 posts scheduled · 1 to approve",   alert:true,  level:"amber" },
  { id:"nadia",  name:"Nadia Al-Hassan", role:"Content Manager",          ring:1, task:"Newsletter draft pending review",     alert:false, level:null    },
  { id:"tariq",  name:"Tariq Osman",     role:"SEO Specialist",           ring:2, task:"Schema fix recommended",             alert:false, level:null    },
  { id:"zara",   name:"Zara Nkosi",      role:"Analytics",                ring:2, task:"Clarity flags rage-clicks",          alert:true,  level:"amber" },
  { id:"amara",  name:"Amara Diallo",    role:"Brand & Design",           ring:2, task:"Carousel set ready in Canva",        alert:false, level:null    },
  { id:"sofia",  name:"Sofia Martins",   role:"Executive Assistant",      ring:2, task:"Morning brief delivered",           alert:false, level:null    },
];

const alertColorOf = a => (a.level === "red" ? RED : GOLD);
const alertRgba    = a => (a.level === "red" ? "rgba(248,113,113,0.5)" : "rgba(200,169,110,0.5)");

export default function OrbitalCommandCenter({ agents, onOpenAgent }) {
  const SRC = (agents && agents.length) ? agents : DEMO_AGENTS;

  const wrapRef   = useRef(null);
  const nodeEls   = useRef({});
  const lineEls   = useRef({});
  const cometEls  = useRef({});
  const nebulaRef = useRef(null);
  const farRef    = useRef(null);
  const animRef   = useRef([]);
  const geoRef    = useRef({ cx:0, cy:0, ringR:[0,0,0] });
  const pausedRef = useRef(false);
  const reduced   = useRef(false);
  const introRef  = useRef(0);

  const [geo, setGeo]           = useState({ w:0, h:0, cx:0, cy:0, ringR:[0,0,0], base:0 });
  const [hover, setHover]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [toast, setToast]       = useState(null);

  const layout = useMemo(() => {
    const byRing = [[],[],[]];
    SRC.forEach(a => byRing[Math.min(2, a.ring ?? 2)].push(a));
    const out = [];
    byRing.forEach((list, ri) =>
      list.forEach((a, i) =>
        out.push({ ...a, ring:ri, angle0: PHASE[ri] + (i * 2 * Math.PI) / list.length })));
    return out.map((a, gi) => ({ ...a, gi }));
  }, [SRC]);

  useEffect(() => {
    animRef.current = layout.map(a => ({ id:a.id, ring:a.ring, gi:a.gi, angle:a.angle0, alert:a.alert }));
    introRef.current = performance.now();
  }, [layout]);

  const farStars  = useMemo(() => makeStars(80, 0.3, 1.1), []);
  const nearStars = useMemo(() => makeStars(30, 0.9, 2.0), []);

  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    reduced.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const base = Math.min(r.width, r.height);
      const ringR = RINGS.map(rg => base * rg.rf);
      geoRef.current = { cx:r.width/2, cy:r.height/2, ringR };
      setGeo({ w:r.width, h:r.height, cx:r.width/2, cy:r.height/2, ringR, base });
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onPointerMove = useCallback((e) => {
    const r = wrapRef.current?.getBoundingClientRect(); if (!r) return;
    const nx = (e.clientX - r.left) / r.width  - 0.5;
    const ny = (e.clientY - r.top)  / r.height - 0.5;
    if (nebulaRef.current) nebulaRef.current.style.transform = `translate(${nx*-26}px, ${ny*-26}px)`;
    if (farRef.current)    farRef.current.style.transform    = `translate(${nx*-12}px, ${ny*-12}px)`;
  }, []);

  useEffect(() => {
    let raf, last = performance.now();
    const loop = (t) => {
      const dt = Math.min((t - last)/1000, 0.05); last = t;
      const g = geoRef.current;
      const move = !pausedRef.current && !reduced.current;
      const sinceIntro = t - introRef.current;

      for (const a of animRef.current) {
        if (move) a.angle += RINGS[a.ring].vel * dt;
        const Rx = g.ringR[a.ring] || 0;
        const Ry = Rx * TILT;

        let grow = 1, fade = 1;
        if (!reduced.current) {
          const p = (sinceIntro - 280 - a.gi * 55) / 720;
          if (p < 1) { const e = easeOut(Math.max(0, p)); grow = e; fade = Math.max(0, e); }
        }

        const x = g.cx + Rx * Math.cos(a.angle) * grow;
        const y = g.cy + Ry * Math.sin(a.angle) * grow;
        const depth = (Math.sin(a.angle) + 1) / 2;
        const ds = 0.82 + depth * 0.4;

        const node = nodeEls.current[a.id];
        if (node) {
          node.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${ds})`;
          node.style.zIndex = String(Math.round(20 + depth * 120));
          node.style.opacity = String((0.74 + depth * 0.26) * fade);
        }
        const line = lineEls.current[a.id];
        if (line) { line.setAttribute("x2", x); line.setAttribute("y2", y); line.style.opacity = String(fade); }

        const comet = cometEls.current[a.id];
        if (comet) {
          if (a.alert && move) {
            const f = ((t / 2600) + a.gi * 0.37) % 1;
            comet.setAttribute("cx", g.cx + (x - g.cx) * f);
            comet.setAttribute("cy", g.cy + (y - g.cy) * f);
            comet.style.opacity = String(0.85 * Math.sin(f * Math.PI) * fade);
          } else comet.style.opacity = "0";
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [geo.cx, geo.cy]);

  const livePos = useCallback((id) => {
    const a = animRef.current.find(n => n.id === id); const g = geoRef.current;
    if (!a) return { x:g.cx, y:g.cy };
    const Rx = g.ringR[a.ring] || 0;
    return { x: g.cx + Rx*Math.cos(a.angle), y: g.cy + Rx*TILT*Math.sin(a.angle) };
  }, []);

  const enter = useCallback((id) => { pausedRef.current = true; setHover({ id, ...livePos(id) }); }, [livePos]);
  const leave = useCallback(() => { if (!selected) pausedRef.current = false; setHover(null); }, [selected]);
  const open  = useCallback((a) => { pausedRef.current = true; setHover(null); setSelected(a); }, []);
  const close = useCallback(() => { setSelected(null); pausedRef.current = false; }, []);
  const enterWorkspace = useCallback((a) => {
    if (onOpenAgent) return onOpenAgent(a);
    setToast(`Routing to ${a.name.split(" ")[0]}'s workspace…`);
    setTimeout(() => setToast(null), 1800); close();
  }, [onOpenAgent, close]);

  const coreSize  = Math.max(120, geo.base * 0.19);
  const planetSize = (ring) => {
    const s = Math.max(34, geo.base * 0.05);
    return ring === 0 ? s * 1.12 : ring === 2 ? s * 0.94 : s;
  };

  const hoverAgent = hover ? SRC.find(a => a.id === hover.id) : null;
  const cardW = 224, cardH = 132;
  let cardLeft = 0, cardTop = 0, cardSide = "right";
  if (hover) {
    cardSide = hover.x > geo.cx ? "left" : "right";
    cardLeft = cardSide === "left" ? hover.x - cardW - 30 : hover.x + 30;
    cardTop  = Math.min(Math.max(hover.y - cardH/2, 12), geo.h - cardH - 12);
  }

  return (
    <div ref={wrapRef} style={S.wrap} onPointerMove={onPointerMove}>
      <style>{CSS}</style>

      <div ref={nebulaRef} className="oc-nebula" style={S.nebula} />
      <div ref={farRef} style={S.starLayer}>{farStars.map((s,i) => <Star key={i} s={s} />)}</div>
      <div style={S.starLayer}>{nearStars.map((s,i) => <Star key={i} s={s} />)}</div>

      <div style={{ ...S.floor, left:geo.cx, top:geo.cy + geo.base*0.04, width:geo.base*1.15, height:geo.base*0.5 }} />

      <svg style={S.svg} width={geo.w} height={geo.h}>
        {geo.ringR.map((R,i) => (
          <ellipse key={i} cx={geo.cx} cy={geo.cy} rx={R} ry={R*TILT} fill="none"
            stroke={RINGS[i].tint} strokeOpacity={0.18} strokeWidth={1}
            strokeDasharray="1.5 9" strokeLinecap="round"
            className="oc-orbit" style={{ animationDuration:`${64 + i*28}s`, animationDirection:i%2?"reverse":"normal" }}/>
        ))}
        {layout.map(a => (
          <line key={a.id} ref={el => (lineEls.current[a.id]=el)}
            x1={geo.cx} y1={geo.cy} x2={geo.cx} y2={geo.cy}
            stroke={a.alert ? alertColorOf(a) : "#6f7b94"} strokeOpacity={a.alert ? 0.28 : 0.10}
            strokeWidth={a.alert ? 1.2 : 1}/>
        ))}
        {layout.filter(a=>a.alert).map(a => (
          <circle key={a.id} ref={el => (cometEls.current[a.id]=el)} r={2.6} fill={alertColorOf(a)}
            style={{ filter:`drop-shadow(0 0 5px ${alertColorOf(a)})`, opacity:0 }}/>
        ))}
      </svg>

      <div style={{ ...S.coreWrap, width:coreSize, height:coreSize, left:geo.cx, top:geo.cy }}>
        <div className="oc-halo" style={S.halo}/>
        <div className="oc-ping" style={S.ping}/>
        <div className="oc-coredots" style={S.coreDots}/>
        <div className="oc-core" style={S.core}>
          <div className="oc-sheen" style={S.sheen}/>
          <div style={S.coreNum}>15</div>
          <div style={S.coreName}>FIFTEENCONSULT</div>
          <div style={S.coreSub}>COMMAND CENTER</div>
        </div>
      </div>

      {layout.map(a => {
        const size = planetSize(a.ring), tint = RINGS[a.ring].tint, isHover = hover?.id === a.id;
        const ac = alertColorOf(a);
        return (
          <div key={a.id} ref={el => (nodeEls.current[a.id]=el)} style={S.nodeWrap}>
            <span style={{ ...S.shadow, width:size*1.15, height:size*0.34, top:size*0.62 }}/>
            <button
              className={`oc-planet${a.alert ? " oc-alert":""}${isHover ? " oc-hl":""}`}
              onMouseEnter={() => enter(a.id)} onMouseLeave={leave}
              onFocus={() => enter(a.id)} onBlur={leave} onClick={() => open(a)}
              aria-label={`${a.name}, ${a.role}. ${a.task}. Open workspace.`}
              style={{ width:size, height:size, ["--tint"]:tint, ["--glow"]:`${tint}55`, ["--alertc"]:alertRgba(a), fontSize:size*0.42 }}>
              <span style={S.initial}>{a.name[0]}</span>
              {a.alert && <span className="oc-dot" style={{ background:ac, boxShadow:`0 0 8px ${ac}` }} />}
            </button>
          </div>
        );
      })}

      {hover && hoverAgent && (
        <div className="oc-card" style={{ ...S.card, left:cardLeft, top:cardTop, width:cardW }}>
          <span className="oc-card-stem" style={{ [cardSide==="left"?"right":"left"]:-7 }} />
          <div style={S.cardRole}>{RINGS[Math.min(2,hoverAgent.ring??2)].label}</div>
          <div style={S.cardName}>{hoverAgent.name}</div>
          <div style={{ ...S.cardTitle, color:RINGS[Math.min(2,hoverAgent.ring??2)].tint }}>{hoverAgent.role}</div>
          <div style={S.cardTask}>{hoverAgent.task}</div>
          <div style={S.cardFoot}>
            {hoverAgent.alert
              ? <span style={{ ...S.chip, color:alertColorOf(hoverAgent), borderColor:`${alertColorOf(hoverAgent)}66` }}>● needs you</span>
              : <span style={{ ...S.chip, color:"#7fd6a3", borderColor:"#2f6b4a" }}>● on track</span>}
            <span style={S.openHint}>Click to enter →</span>
          </div>
        </div>
      )}

      <div style={S.hudTL}>
        <div style={S.wordmark}>FIFTEEN<span style={{ color:GOLD }}>CONSULT</span></div>
        <div style={S.hudSub}>Agent Orchestration · Live</div>
      </div>
      <div style={S.hudTR}><span className="oc-status" /><span style={S.hudStatusTxt}>{SRC.length} AGENTS · ONLINE</span></div>
      <div style={S.legend}>
        {RINGS.map((r,i) => (
          <div key={i} style={S.legendRow}>
            <span style={{ ...S.legendDot, background:r.tint, boxShadow:`0 0 8px ${r.tint}` }}/>
            <span style={S.legendTxt}>{r.label}</span>
          </div>
        ))}
      </div>
      <div style={S.hint}>Hover a planet to inspect · Click to enter a workspace</div>

      {selected && (
        <div className="oc-overlay" style={S.overlay} onClick={close}>
          <div className="oc-focus" style={S.focus} onClick={e => e.stopPropagation()}>
            <div style={{ ...S.focusAvatar, ["--tint"]:RINGS[Math.min(2,selected.ring??2)].tint }}>{selected.name[0]}</div>
            <div style={S.focusRole}>{RINGS[Math.min(2,selected.ring??2)].label}</div>
            <div style={S.focusName}>{selected.name}</div>
            <div style={{ ...S.focusTitle, color:RINGS[Math.min(2,selected.ring??2)].tint }}>{selected.role}</div>
            <div style={S.focusDivider} />
            <div style={S.focusLabel}>CURRENT FOCUS</div>
            <div style={S.focusTask}>{selected.task}</div>
            {selected.alert && <div style={{ ...S.focusAlert, color:alertColorOf(selected) }}>● This agent is waiting on you</div>}
            <div style={S.focusBtns}>
              <button className="oc-btn-primary" style={S.btnPrimary} onClick={() => enterWorkspace(selected)}>Enter workspace →</button>
              <button className="oc-btn-ghost" style={S.btnGhost} onClick={close}>Back to orbit</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="oc-toast" style={S.toast}>{toast}</div>}
    </div>
  );
}

function Star({ s }) {
  return <span className="oc-star" style={{
    top:`${s.top}%`, left:`${s.left}%`, width:s.size, height:s.size,
    animationDelay:`${s.delay}s`, animationDuration:`${s.dur}s`, ["--base"]:s.base }}/>;
}
function makeStars(n, minBase, maxSize) {
  return Array.from({ length:n }, () => ({
    top:Math.random()*100, left:Math.random()*100, size:Math.random()*maxSize+0.4,
    delay:Math.random()*6, dur:Math.random()*3+2.5, base:Math.random()*0.35+minBase*0.3 }));
}

/* ---------------------------------- styles --------------------------------- */
const S = {
  wrap:{ position:"relative", width:"100%", height:"100%", minHeight:520, overflow:"hidden",
    borderRadius:16, border:"1px solid rgba(255,255,255,0.07)",
    background:"radial-gradient(ellipse 80% 70% at 50% 38%, #18223f 0%, #0b1124 52%, #050810 100%)",
    fontFamily:"'DM Mono', ui-monospace, monospace", color:TEXT, userSelect:"none" },
  nebula:{ position:"absolute", inset:"-10%", pointerEvents:"none", willChange:"transform",
    background:"radial-gradient(40% 40% at 28% 30%, rgba(120,90,180,0.10), transparent 70%), radial-gradient(36% 36% at 74% 66%, rgba(200,169,110,0.10), transparent 70%)",
    filter:"blur(8px)" },
  starLayer:{ position:"absolute", inset:0, pointerEvents:"none", willChange:"transform" },
  floor:{ position:"absolute", transform:"translate(-50%,-50%)", borderRadius:"50%", pointerEvents:"none",
    background:"radial-gradient(ellipse, rgba(200,169,110,0.10), transparent 68%)" },
  svg:{ position:"absolute", inset:0, overflow:"visible", pointerEvents:"none" },

  coreWrap:{ position:"absolute", transform:"translate(-50%,-50%)", display:"grid", placeItems:"center", pointerEvents:"none", zIndex:200 },
  halo:{ position:"absolute", inset:"-50%", borderRadius:"50%",
    background:"radial-gradient(circle, rgba(200,169,110,0.36) 0%, rgba(200,169,110,0.10) 38%, transparent 68%)" },
  ping:{ position:"absolute", inset:"0", borderRadius:"50%", border:`1px solid ${GOLD}` },
  coreDots:{ position:"absolute", inset:"-13%", borderRadius:"50%", border:`1px dotted ${GOLD}`, opacity:0.4 },
  core:{ position:"relative", width:"100%", height:"100%", borderRadius:"50%", overflow:"hidden",
    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
    background:"radial-gradient(circle at 38% 30%, #f6e7c6 0%, #d9b97b 30%, #b8965a 60%, #876a3a 100%)",
    boxShadow:"0 0 70px rgba(200,169,110,0.5), inset 0 2px 16px rgba(255,255,255,0.45), inset 0 -12px 30px rgba(70,48,16,0.6)" },
  sheen:{ position:"absolute", inset:"-40%", borderRadius:"50%",
    background:"conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.5) 40deg, transparent 90deg, transparent 360deg)",
    mixBlendMode:"soft-light" },
  coreNum:{ position:"relative", fontFamily:"'Cormorant Garamond', Georgia, serif", fontWeight:700, fontSize:"2.6rem", lineHeight:0.9, color:"#2a1f0d", letterSpacing:"-0.02em" },
  coreName:{ position:"relative", marginTop:4, fontSize:"0.5rem", letterSpacing:"0.28em", color:"#3a2b13", fontWeight:500 },
  coreSub:{ position:"relative", marginTop:2, fontSize:"0.4rem", letterSpacing:"0.34em", color:"#6a5326" },

  nodeWrap:{ position:"absolute", left:0, top:0, willChange:"transform, opacity", display:"grid", placeItems:"center" },
  shadow:{ position:"absolute", borderRadius:"50%", background:"radial-gradient(ellipse, rgba(0,0,0,0.5), transparent 70%)", pointerEvents:"none" },
  initial:{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontWeight:600, lineHeight:1, color:TEXT },

  card:{ position:"absolute", zIndex:300, padding:"13px 15px", background:"rgba(12,18,36,0.92)", backdropFilter:"blur(10px)",
    border:"1px solid rgba(200,169,110,0.28)", borderRadius:12, boxShadow:"0 18px 50px rgba(0,0,0,0.55)", pointerEvents:"none" },
  cardRole:{ fontSize:"0.56rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"#7d8aa3" },
  cardName:{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontWeight:600, fontSize:"1.4rem", lineHeight:1.05, color:TEXT, marginTop:3 },
  cardTitle:{ fontSize:"0.66rem", letterSpacing:"0.04em", marginTop:2, marginBottom:8 },
  cardTask:{ fontSize:"0.68rem", lineHeight:1.5, color:"#aeb6c6" },
  cardFoot:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 },
  chip:{ fontSize:"0.54rem", letterSpacing:"0.1em", textTransform:"uppercase", color:GOLD, border:`1px solid ${GOLD}66`, borderRadius:20, padding:"2px 8px" },
  openHint:{ fontSize:"0.54rem", color:"#6f7b94", letterSpacing:"0.08em" },

  hudTL:{ position:"absolute", top:18, left:20, pointerEvents:"none", zIndex:210 },
  wordmark:{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontWeight:700, fontSize:"1.2rem", letterSpacing:"0.02em", color:TEXT },
  hudSub:{ fontSize:"0.54rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"#6f7b94", marginTop:2 },
  hudTR:{ position:"absolute", top:22, right:22, display:"flex", alignItems:"center", gap:8, pointerEvents:"none", zIndex:210 },
  hudStatusTxt:{ fontSize:"0.54rem", letterSpacing:"0.18em", color:"#9aa6bd" },
  legend:{ position:"absolute", bottom:18, left:20, display:"flex", flexDirection:"column", gap:6, pointerEvents:"none", zIndex:210 },
  legendRow:{ display:"flex", alignItems:"center", gap:9 },
  legendDot:{ width:7, height:7, borderRadius:"50%" },
  legendTxt:{ fontSize:"0.54rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"#8b96ac" },
  hint:{ position:"absolute", bottom:20, right:20, fontSize:"0.54rem", letterSpacing:"0.12em", color:"#5f6b84", pointerEvents:"none", zIndex:210 },

  overlay:{ position:"absolute", inset:0, zIndex:500, display:"grid", placeItems:"center", background:"rgba(5,8,16,0.72)", backdropFilter:"blur(7px)" },
  focus:{ position:"relative", width:340, maxWidth:"86%", padding:"30px 28px 26px",
    background:"linear-gradient(160deg, rgba(20,28,52,0.96), rgba(10,15,30,0.96))",
    border:"1px solid rgba(200,169,110,0.3)", borderRadius:18, textAlign:"center", boxShadow:"0 30px 80px rgba(0,0,0,0.6)" },
  focusAvatar:{ width:78, height:78, margin:"0 auto 14px", borderRadius:"50%", display:"grid", placeItems:"center",
    fontFamily:"'Cormorant Garamond', Georgia, serif", fontWeight:600, fontSize:"2.2rem", color:TEXT,
    background:"radial-gradient(circle at 38% 32%, color-mix(in srgb, var(--tint) 45%, #1a2240), #11182e)",
    border:"1px solid var(--tint)", boxShadow:"0 0 30px var(--tint)" },
  focusRole:{ fontSize:"0.56rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"#7d8aa3" },
  focusName:{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontWeight:600, fontSize:"1.9rem", lineHeight:1.05, color:TEXT, marginTop:4 },
  focusTitle:{ fontSize:"0.72rem", letterSpacing:"0.05em", marginTop:3 },
  focusDivider:{ height:1, background:"linear-gradient(90deg, transparent, rgba(200,169,110,0.4), transparent)", margin:"18px 0 14px" },
  focusLabel:{ fontSize:"0.52rem", letterSpacing:"0.22em", color:"#6f7b94" },
  focusTask:{ fontSize:"0.82rem", lineHeight:1.55, color:"#c3cad8", marginTop:6 },
  focusAlert:{ fontSize:"0.62rem", letterSpacing:"0.08em", color:GOLD, marginTop:12 },
  focusBtns:{ display:"flex", flexDirection:"column", gap:9, marginTop:20 },
  btnPrimary:{ padding:"11px 18px", borderRadius:10, border:"none", cursor:"pointer", background:`linear-gradient(135deg, ${GOLD}, #b08e52)`, color:"#1a130a", fontFamily:"'DM Mono', monospace", fontSize:"0.72rem", letterSpacing:"0.06em", fontWeight:500 },
  btnGhost:{ padding:"9px 18px", borderRadius:10, cursor:"pointer", background:"transparent", border:"1px solid rgba(255,255,255,0.14)", color:"#9aa6bd", fontFamily:"'DM Mono', monospace", fontSize:"0.68rem", letterSpacing:"0.06em" },
  toast:{ position:"absolute", bottom:64, left:"50%", transform:"translateX(-50%)", zIndex:600, padding:"10px 18px", borderRadius:30, background:"rgba(200,169,110,0.14)", border:"1px solid rgba(200,169,110,0.4)", color:CREAM, fontSize:"0.7rem", letterSpacing:"0.06em" },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Mono:wght@300;400;500&display=swap');
.oc-star{ position:absolute; border-radius:50%; background:#fff; opacity:var(--base); animation:ocTwinkle linear infinite; }
@keyframes ocTwinkle{ 0%,100%{opacity:calc(var(--base)*0.5)} 50%{opacity:calc(var(--base) + 0.4)} }
.oc-nebula{ animation:ocDrift 26s ease-in-out infinite alternate; }
@keyframes ocDrift{ from{ transform:translate(0,0) } to{ transform:translate(14px,-10px) } }
.oc-orbit{ transform-box:fill-box; transform-origin:center; animation:ocDash linear infinite; }
@keyframes ocDash{ to{ stroke-dashoffset:-220; } }
.oc-halo{ animation:ocBreathe 6s ease-in-out infinite; }
@keyframes ocBreathe{ 0%,100%{transform:scale(1);opacity:0.85} 50%{transform:scale(1.1);opacity:1} }
.oc-ping{ animation:ocPing 4.2s ease-out infinite; opacity:0; }
@keyframes ocPing{ 0%{transform:scale(1);opacity:0.5} 70%{opacity:0} 100%{transform:scale(2.1);opacity:0} }
.oc-coredots{ animation:ocSpin 36s linear infinite; }
.oc-core{ animation:ocFloat 6s ease-in-out infinite; }
.oc-sheen{ animation:ocSpin 14s linear infinite; }
@keyframes ocFloat{ 0%,100%{transform:scale(1)} 50%{transform:scale(1.025)} }
@keyframes ocSpin{ to{ transform:rotate(360deg); } }
.oc-planet{ position:relative; display:grid; place-items:center; border-radius:50%; cursor:pointer; padding:0; color:${TEXT};
  background:radial-gradient(circle at 36% 28%, color-mix(in srgb, var(--tint) 32%, #161e38), #0c1324);
  border:1px solid color-mix(in srgb, var(--tint) 60%, transparent);
  box-shadow:0 0 0 1px rgba(255,255,255,0.03), 0 8px 20px rgba(0,0,0,0.5), 0 0 16px var(--glow);
  transition:transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s, border-color .3s; }
.oc-planet:hover, .oc-planet.oc-hl, .oc-planet:focus-visible{ transform:scale(1.18); outline:none; border-color:var(--tint);
  box-shadow:0 0 0 1px var(--tint), 0 12px 28px rgba(0,0,0,0.55), 0 0 34px var(--tint); }
.oc-alert{ animation:ocAlertPulse 2.2s ease-in-out infinite; }
@keyframes ocAlertPulse{ 0%,100%{ box-shadow:0 0 0 0 var(--alertc), 0 0 16px var(--glow); } 50%{ box-shadow:0 0 0 7px transparent, 0 0 28px var(--alertc); } }
.oc-dot{ position:absolute; top:-2px; right:-2px; width:11px; height:11px; border-radius:50%; border:2px solid #0b1124; }
.oc-card{ animation:ocCardIn .22s ease-out; }
.oc-card-stem{ position:absolute; top:50%; width:7px; height:7px; transform:translateY(-50%) rotate(45deg); background:rgba(12,18,36,0.92); border-left:1px solid rgba(200,169,110,0.28); border-bottom:1px solid rgba(200,169,110,0.28); }
@keyframes ocCardIn{ from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:translateY(0)} }
.oc-status{ width:8px; height:8px; border-radius:50%; background:#5fd39a; box-shadow:0 0 10px #5fd39a; animation:ocBlink 2s ease-in-out infinite; }
@keyframes ocBlink{ 0%,100%{opacity:1} 50%{opacity:0.35} }
.oc-overlay{ animation:ocFade .25s ease-out; } .oc-focus{ animation:ocPop .3s cubic-bezier(.2,.9,.3,1.1); }
@keyframes ocFade{ from{opacity:0} to{opacity:1} }
@keyframes ocPop{ from{opacity:0; transform:scale(.92) translateY(10px)} to{opacity:1; transform:scale(1) translateY(0)} }
.oc-btn-primary{ transition:filter .2s, transform .2s; } .oc-btn-primary:hover{ filter:brightness(1.08); transform:translateY(-1px); }
.oc-btn-ghost:hover{ border-color:rgba(255,255,255,0.3); color:${TEXT}; }
.oc-toast{ animation:ocToast .3s ease-out; }
@keyframes ocToast{ from{opacity:0; transform:translate(-50%,8px)} to{opacity:1; transform:translate(-50%,0)} }
@media (prefers-reduced-motion: reduce){
  .oc-star,.oc-orbit,.oc-halo,.oc-ping,.oc-coredots,.oc-core,.oc-sheen,.oc-alert,.oc-nebula,.oc-status{ animation:none !important; }
}
@media (max-width:720px){ .oc-card{ display:none; } }
`;
