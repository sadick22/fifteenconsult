import { isFirebaseEnabled, cloudSave } from "../lib/firebase.js";
import { useState, useRef, useEffect, useCallback } from "react";
import { callClaudeAPI } from "../lib/api.js";
import { getDateContext } from "../lib/dateContext.js";
import { TEAM, TEAM_ROSTER, OUTPUT_STYLE_RULES, HANDOFF_PROTOCOL, DESIGN_STUDIO_MODULE } from "../data/team.js";
import { addHandoff, pendingFor, markHandoffDone, subscribeHandoffs } from "../lib/handoffs.js";
import { formatMemoryBlock } from "../lib/memory.js";

const T = {
  base:     "var(--bg-base)", card:     "var(--bg-card)",
  cardHover:"var(--bg-hover)", border:   "var(--border)",
  text:     "var(--text)", textMid:  "var(--text-mid)",
  textDim:  "var(--text-dim)", gold:     "var(--gold)",
  green:    "var(--green)", red:      "var(--red)",
  amber:    "var(--amber)", blue:     "var(--blue)",
  userBg:   "var(--bg-hover)", agentBg:  "var(--bg-base)",
};

const CHAT_STORAGE_KEY = "fc_chats_v1";

function loadChats() {
  try { return JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || "{}"); }
  catch { return {}; }
}
function saveChats(chats) {
  try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chats)); } catch {}
  if (isFirebaseEnabled()) cloudSave("chats", "all_chats", chats).catch(()=>{});
}

// Suggested follow-up questions per agent role
const SUGGESTED_QUESTIONS = {
  nadia: [
    "Write a LinkedIn post about real estate marketing in Qatar",
    "Draft this week's email newsletter",
    "Give me 5 content ideas for the next 2 weeks",
    "Write a case study highlight for Coreo Real Estate",
    "What content should we post today?",
  ],
  tariq: [
    "What are the top 3 SEO fixes for fifteenconsult.com?",
    "Write an SEO blog brief for Nadia",
    "Which keywords should we target first?",
    "How do we rank for 'marketing consultancy Qatar'?",
    "Check our Core Web Vitals and give recommendations",
  ],
  sara: [
    "Write today's LinkedIn post",
    "Plan this week's content calendar",
    "What hashtags should we use for GCC audiences?",
    "Draft an Instagram carousel about our services",
    "Who should we engage with on LinkedIn today?",
  ],
  kwame: [
    "Research 5 Real Estate prospects in Qatar",
    "Write a cold outreach message for a property developer",
    "What's the pipeline status this week?",
    "Draft a follow-up message for a cold lead",
    "Find 5 SaaS companies entering GCC that need marketing",
  ],
  amara: [
    "Design brief for a LinkedIn post template",
    "Brief the Fifteen Framework visual explainer",
    "What's wrong with our current brand consistency?",
    "Design brief for the FifteenConsult pitch deck cover",
    "Brief an ad creative for Hassan to test",
  ],
  hassan: [
    "Write 3 LinkedIn ad copy variations",
    "How do we reduce our cost per lead?",
    "Set up a retargeting campaign brief",
    "What's the best audience to target for Real Estate clients?",
    "A/B test idea for this week",
  ],
  malik: [
    "Build a media plan for FifteenConsult's lead generation in Qatar",
    "What advertising platforms should we prioritise in Nigeria?",
    "Write 3 ad creative briefs for LinkedIn campaigns",
    "Analyse the advertising landscape for real estate in GCC",
    "How should we approach Snapchat advertising for B2B in Qatar?",
  ],
  david: [
    "What are the top 3 business opportunities for FifteenConsult right now in GCC?",
    "Analyse our competitive position against the top agencies in Qatar",
    "Build a revenue model for FifteenConsult for next quarter",
    "What West African market should we enter first and why?",
    "Identify upsell opportunities across our 5 existing clients",
  ],
  sofia: [
    "Give me my morning briefing — news, insights, and what I need to focus on today",
    "What skills should I be developing as a marketing consultancy founder?",
    "What are the most important trends in marketing and advertising right now?",
    "Help me prepare for a client pitch meeting",
    "Review my week — what went well and what should I improve?",
  ],
  amani: [
    "Give me this morning's executive briefing",
    "Review the team's outputs from this week and flag any issues",
    "What is the single most important marketing priority for FifteenConsult right now?",
    "Are our agents aligned with the Fifteen Framework?",
    "What strategic opportunities are we missing in GCC and West Africa?",
  ],
  zara: [
    "What are our top 3 metrics this week?",
    "Which marketing channel is performing best?",
    "Generate a quick performance summary",
    "What should we focus on to improve conversions?",
    "How is our LinkedIn growth tracking vs target?",
  ],
};

const HANDOFF_IDS = ["amani","david","malik","hassan","kwame","sara","nadia","tariq","zara","amara","sofia"];
const firstNameOfId = (id) => { const m = TEAM.find(x => x.id === id); return m ? m.name.split(" ")[0] : id; };

// Detect a [[HANDOFF]] ... [[/HANDOFF]] block at the end of an agent reply.
function parseHandoff(text) {
  if (!text) return null;
  const m = text.match(/\[\[HANDOFF\]\]([\s\S]*?)\[\[\/HANDOFF\]\]/i);
  if (!m) return null;
  const inner = m[1];
  const toMatch = inner.match(/to:\s*([^\n]+)/i);
  const sumMatch = inner.match(/summary:\s*([\s\S]*?)\s*$/i);
  if (!toMatch) return null;
  const recipients = [...new Set(
    toMatch[1].split(",")
      .map(p => p.trim().toLowerCase().split(/\s+/)[0])
      .filter(p => HANDOFF_IDS.includes(p))
  )];
  if (!recipients.length) return null;
  const summary = (sumMatch ? sumMatch[1] : "").trim();
  const cleanedBody = text.slice(0, m.index).trim();
  return { recipients, summary, cleanedBody };
}

// Strip markdown symbols agents sometimes emit so chat reads as clean plain text
function cleanAgentText(s) {
  if (!s) return s;
  return s
    .replace(/\[\[HANDOFF\]\][\s\S]*?\[\[\/HANDOFF\]\]/gi, "") // machine handoff block
    .replace(/\[\[\/?HANDOFF\]\]/gi, "")                       // stray markers
    .replace(/\*\*/g, "")            // bold markers **
    .replace(/__/g, "")              // underscore bold
    .replace(/^#{1,6}\s*/gm, "")      // # headings at line start
    .replace(/^\s*[-=]{3,}\s*$/gm, "")// --- or === divider lines
    .replace(/`{1,3}/g, "");         // backticks / code fences
}

function ChatMessage({ msg, color }) {
  const isUser  = msg.role === "user";
  const isError = msg.role === "error";
  const [copied, setCopied] = useState(false);
  const display = isUser ? msg.content : cleanAgentText(msg.content);

  const handleCopy = () => {
    navigator.clipboard.writeText(display).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 16,
      animation: "fadeUp 0.2s ease",
    }}>
      {/* Agent avatar */}
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: color + "22", border: `1px solid ${color}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, flexShrink: 0, marginRight: 10, marginTop: 2,
        }}>
          {msg.emoji || "🤖"}
        </div>
      )}

      <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{
          background: isUser ? T.userBg : isError ? "#f8717118" : T.agentBg,
          border: `1px solid ${isUser ? T.border : isError ? T.red + "44" : T.border}`,
          borderRadius: isUser ? "12px 12px 2px 12px" : "2px 12px 12px 12px",
          padding: "11px 15px",
          position: "relative",
        }}>
          {/* Streaming cursor */}
          {msg.streaming && (
            <span style={{
              display: "inline-block", width: 8, height: 16,
              background: color, marginLeft: 2, verticalAlign: "middle",
              animation: "pulse 0.8s infinite",
            }}/>
          )}
          <pre style={{
            fontSize: 13, color: isUser ? T.text : isError ? T.red : T.textMid,
            lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)",
            margin: 0,
          }}>
            {display}
            {msg.streaming && <span style={{ color, animation: "pulse 0.8s infinite" }}>▌</span>}
          </pre>
        </div>

        {/* Message footer */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, paddingLeft: isUser ? 0 : 0 }}>
          <span style={{ fontSize: 9, color: T.textDim }}>{msg.timestamp}</span>
          {!isUser && !msg.streaming && msg.content && (
            <button onClick={handleCopy} style={{
              background: "none", border: "none", color: copied ? color : T.textDim,
              fontSize: 9, cursor: "pointer", fontFamily: "var(--font-mono)",
              letterSpacing: "0.1em", padding: "0 4px", transition: "color 0.2s",
            }}>
              {copied ? "✓ copied" : "copy"}
            </button>
          )}
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: T.gold + "22", border: `1px solid #C8A96E44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, flexShrink: 0, marginLeft: 10, marginTop: 2,
          color: T.gold, fontWeight: 700,
        }}>
          S
        </div>
      )}
    </div>
  );
}

export default function AgentChat({ member, lastOutput }) {
  const dateCtx = getDateContext();
  const [messages, setMessages] = useState(() => {
    const fresh = loadChats();
    return fresh[member.id] || [];
  });
  const [input, setInput]       = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const imageRef   = useRef(null);
  const [pendingImage, setPendingImage] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [pendingHandoff, setPendingHandoff] = useState(null);
  const [pendingInbox, setPendingInbox] = useState(() => pendingFor(member.id));
  const [designMode, setDesignMode] = useState(false);
  const isDesigner = member.id === "sara" || member.id === "amara";
  const [expandedHandoffs, setExpandedHandoffs] = useState(() => new Set());

  // Reload messages when switching between agents
  const switchingRef = useRef(false);
  useEffect(() => {
    switchingRef.current = true;
    const fresh = loadChats();
    setMessages(fresh[member.id] || []);
    setInput("");
    setShowSuggestions(true);
    // Allow saves again after state settles
    setTimeout(() => { switchingRef.current = false; }, 100);
  }, [member.id]);

  // Keep the inbox (pending handoffs to this agent) live
  useEffect(() => {
    setPendingInbox(pendingFor(member.id));
    setExpandedHandoffs(new Set());
    setDesignMode(false);
    const off = subscribeHandoffs(() => setPendingInbox(pendingFor(member.id)));
    return off;
  }, [member.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Persist messages — use ref to prevent saving old agent's messages to new agent
  const memberIdRef = useRef(member.id);
  useEffect(() => {
    memberIdRef.current = member.id;
  }, [member.id]);

  useEffect(() => {
    // Block saves during agent switching or with empty messages on load
    if (switchingRef.current) return;
    if (memberIdRef.current !== member.id) return;
    const all = loadChats();
    all[member.id] = messages.slice(-50);
    saveChats(all);
  }, [messages]);



  const ts = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  // Build conversation context for Claude
  const buildSystemPrompt = useCallback(() => {
    const dateBlock = `Today is ${dateCtx.dayOfWeek}, ${dateCtx.dayOfMonth} ${dateCtx.month} ${dateCtx.year}. Week ${dateCtx.weekNum}. ${dateCtx.daysLeftInMonth} days left in month. Q${dateCtx.currentQuarter}.`;

    const outputContext = lastOutput?.text
      ? `\n\nYOUR LATEST BRIEFING OUTPUT (for context):\n${lastOutput.text.slice(0, 800)}`
      : "";

    const inboxContext = pendingInbox.length
      ? `\n\n---\nYOUR INBOX — handoffs routed to you (these stay open until Sadick marks them done):\n${pendingInbox.map((h,i)=>{
          const from = firstNameOfId(h.from);
          const full = expandedHandoffs.has(h.id) ? `\n   FULL CONTENT:\n${h.body}` : "";
          return `${i+1}. From ${from}: ${h.summary}${full}`;
        }).join("\n")}\nIf Sadick asks for the full content of an item you only have the summary for, tell him to click "Pull full" on that item in your inbox.`
      : "";

    const memBlock = formatMemoryBlock(member.id);
    const memContext = memBlock ? `\n\n---\n${memBlock}` : "";
    const designContext = (designMode && isDesigner) ? `\n\n---\n${DESIGN_STUDIO_MODULE}` : "";

    return `${member.systemPrompt}\n\n---\n${TEAM_ROSTER}\n---\n${OUTPUT_STYLE_RULES}\n---\n${HANDOFF_PROTOCOL}\n\nDATE CONTEXT: ${dateBlock}${outputContext}${inboxContext}${memContext}${designContext}\n\nYou are now in a direct chat with Sadick, the co-founder of FifteenConsult. Respond conversationally but stay in character as ${member.name}. Be concise, direct, and actionable. When producing content (posts, emails, briefs), produce it immediately — don't ask for permission. FifteenConsult is a marketing consultancy seeking clients in Qatar/GCC, not running campaigns for others.`;
  }, [member, lastOutput, dateCtx, pendingInbox, expandedHandoffs, designMode, isDesigner]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isPdf = file.type === "application/pdf";
    const isImg = file.type.startsWith("image/");
    if (!isPdf && !isImg) { alert("Please upload an image or a PDF file."); return; }
    const capMB = isPdf ? 10 : 5;
    if (file.size > capMB * 1024 * 1024) { alert(`File must be under ${capMB}MB.`); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(",")[1];
      setPendingImage({ base64, mediaType: file.type, preview: isImg ? ev.target.result : null, name: file.name, isPdf });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isTyping) return;
    setShowSuggestions(false);

    const userMsg = {
      role: "user", content: text.trim(),
      timestamp: ts(), id: Date.now(),
    };

    // Add user message
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Add streaming placeholder
    const agentMsgId = Date.now() + 1;
    const agentMsg = {
      role: "assistant", content: "",
      timestamp: ts(), id: agentMsgId,
      emoji: member.emoji, streaming: true,
    };
    setMessages(prev => [...prev, agentMsg]);

    // Build conversation history for API
    const history = messages
      .filter(m => m.role === "user" || m.role === "assistant")
      .slice(-10) // Last 10 messages for context
      .map(m => ({ role: m.role, content: m.content }));

    history.push({ role: "user", content: text.trim() });

    const imageToSend = pendingImage;
    if (pendingImage) setPendingImage(null);

    try {
      const finalReply = await callClaudeAPI(
        buildSystemPrompt(),
        // Pass full conversation as the user message with history context
        history.length > 1
          ? `[Previous conversation context]\n${history.slice(0,-1).map(m=>`${m.role==="user"?"Sadick":"Me"}: ${m.content}`).join("\n")}\n\n[Current message]\nSadick: ${text.trim()}`
          : text.trim(),
        (partial) => {
          setMessages(prev => prev.map(m =>
            m.id === agentMsgId ? { ...m, content: partial } : m
          ));
        },
        imageToSend
      );
      // Detect a handoff block; if present, strip it from the visible reply
      const ho = parseHandoff(finalReply);
      setMessages(prev => prev.map(m =>
        m.id === agentMsgId ? { ...m, content: ho ? ho.cleanedBody : m.content, streaming: false } : m
      ));
      if (ho) {
        setPendingHandoff({ from: member.id, to: ho.recipients, summary: ho.summary, body: ho.cleanedBody });
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === agentMsgId
          ? { ...m, content: `Error: ${err.message}`, streaming: false, role: "error" }
          : m
      ));
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  }, [messages, isTyping, buildSystemPrompt, member]);

  const clearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
    const all = loadChats();
    delete all[member.id];
    saveChats(all);
  };

  const suggestions = SUGGESTED_QUESTIONS[member.id] || [];

  return (
    <div style={ expanded ? {
      position: "fixed", inset: 0, zIndex: 1000, marginTop: 0,
      background: T.card, border: "none", borderRadius: 0, overflow: "hidden",
      display: "flex", flexDirection: "column", height: "100vh",
    } : {
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 12, overflow: "hidden", marginTop: 20,
      display: "flex", flexDirection: "column", height: 520,
    }}>
      {/* Chat header */}
      <div style={{
        padding: "14px 18px", borderBottom: `1px solid ${T.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: member.color + "20", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{member.emoji}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
              Chat with {member.name.split(" ")[0]}
            </div>
            <div style={{ fontSize: 10, color: member.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {member.role} · {messages.length} messages
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isDesigner && (
            <button onClick={()=>{ const next=!designMode; setDesignMode(next); if(next&&!input.trim()) setInput("Design a carousel about: "); }}
              title="Design Studio — art-director mode for posts & carousels"
              style={{
                background: designMode ? member.color : "none", border: `1px solid ${designMode?member.color:T.border}`,
                color: designMode ? "#000" : T.textDim,
                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-mono)",
              }}>🎨 Design Studio</button>
          )}
          <button onClick={()=>setExpanded(v=>!v)} title={expanded?"Collapse chat":"Expand chat"} style={{
            background: expanded ? member.color : "none", border: `1px solid ${expanded?member.color:T.border}`,
            color: expanded ? "#000" : T.textDim,
            fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-mono)",
          }}>{expanded ? "✕ Close" : "⛶ Expand"}</button>
          {messages.length > 0 && (
            <button onClick={clearChat} style={{
              background: "none", border: `1px solid ${T.border}`, color: T.textDim,
              fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-mono)",
            }}>Clear chat</button>
          )}
          <div style={{
            fontSize: 10, color: isTyping ? member.color : T.green,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: isTyping ? member.color : T.green,
              display: "inline-block",
              animation: isTyping ? "pulse 1s infinite" : "none",
            }}/>
            {isTyping ? "Typing..." : "Online"}
          </div>
        </div>
      </div>

      {/* Inbox — pending handoffs routed to this agent */}
      {pendingInbox.length > 0 && (
        <div style={{ flexShrink: 0, maxHeight: 184, overflowY: "auto", borderBottom: `1px solid ${T.border}`, background: `${member.color}0c` }}>
          <div style={{ padding: "9px 16px 5px", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: member.color, fontWeight: 700 }}>
            📥 Inbox · {pendingInbox.length} pending handoff{pendingInbox.length > 1 ? "s" : ""}
          </div>
          {pendingInbox.map(h => {
            const open = expandedHandoffs.has(h.id);
            return (
              <div key={h.id} style={{ padding: "4px 16px 11px" }}>
                <div style={{ fontSize: 11, color: T.text, lineHeight: 1.5 }}>
                  <span style={{ color: member.color, fontWeight: 600 }}>{firstNameOfId(h.from)}</span>
                  <span style={{ color: T.textDim }}> sent: </span>{h.summary}
                </div>
                {open && (
                  <pre style={{ fontSize: 11, color: T.textMid, whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", margin: "7px 0 0", background: T.base, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10, maxHeight: 160, overflowY: "auto" }}>{h.body}</pre>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button onClick={() => setExpandedHandoffs(prev => { const n = new Set(prev); n.has(h.id) ? n.delete(h.id) : n.add(h.id); return n; })}
                    style={{ background: "none", border: `1px solid ${member.color}55`, color: member.color, fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 11px", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-mono)" }}>
                    {open ? "Hide full" : "Pull full"}
                  </button>
                  <button onClick={() => markHandoffDone(h.id)}
                    style={{ background: "none", border: `1px solid ${T.border}`, color: T.textDim, fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 11px", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-mono)" }}
                    onMouseEnter={e => { e.currentTarget.style.color = T.green; e.currentTarget.style.borderColor = T.green; }}
                    onMouseLeave={e => { e.currentTarget.style.color = T.textDim; e.currentTarget.style.borderColor = T.border; }}>
                    ✓ Mark done
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Design Studio mode banner */}
      {designMode && isDesigner && (
        <div style={{ flexShrink: 0, padding: "9px 16px", borderBottom: `1px solid ${member.color}55`, background: `${member.color}12`, fontSize: 11, color: T.textMid, display: "flex", alignItems: "center", gap: 8 }}>
          <span>🎨</span>
          <span><strong style={{ color: member.color }}>Design Studio on.</strong> Describe a post or carousel — {member.name.split(" ")[0]} will return a full, copy-paste-ready Canva spec (slides, brand tokens, caption, hashtags).</span>
        </div>
      )}

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>

        {/* Empty state */}
        {messages.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 20, paddingBottom: 16 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{member.emoji}</div>
            <div style={{ fontSize: 13, color: T.textMid, marginBottom: 4 }}>
              Chat directly with {member.name.split(" ")[0]}
            </div>
            <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.7 }}>
              Ask follow-up questions, request specific content,<br/>
              or dive deeper into anything from the briefing.
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map(msg => (
          <ChatMessage key={msg.id} msg={msg} color={member.color} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      {showSuggestions && messages.length === 0 && suggestions.length > 0 && (
        <div style={{ padding: "0 18px 12px", flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: T.textDim, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
            Suggested questions
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {suggestions.map((q, i) => (
              <button key={i} onClick={() => sendMessage(q)} style={{
                background: member.color + "0e",
                border: `1px solid ${member.color}33`,
                color: member.color, fontSize: 10,
                padding: "5px 12px", borderRadius: 20,
                cursor: "pointer", fontFamily: "var(--font-mono)",
                transition: "all 0.15s", textAlign: "left",
              }}
                onMouseEnter={e => e.currentTarget.style.background = member.color + "22"}
                onMouseLeave={e => e.currentTarget.style.background = member.color + "0e"}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {pendingHandoff && (
        <div style={{ padding:"12px 14px",borderTop:`1px solid ${member.color}55`,background:`${member.color}0e`,flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
            <div style={{ fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:member.color,fontWeight:700 }}>
              📤 Ready to hand off → {pendingHandoff.to.map(firstNameOfId).join(", ")}
            </div>
            <span style={{ fontSize:9,color:T.textDim }}>review &amp; edit before sending</span>
          </div>
          <input
            value={pendingHandoff.summary}
            onChange={e=>setPendingHandoff(p=>({ ...p, summary:e.target.value }))}
            placeholder="One-line summary your colleague will see in their inbox…"
            style={{ width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",fontSize:12,color:T.text,fontFamily:"var(--font-mono)",outline:"none",marginBottom:8,boxSizing:"border-box" }}
          />
          <div style={{ display:"flex",gap:8 }}>
            <button
              onClick={()=>{
                const names = pendingHandoff.to.map(firstNameOfId).join(", ");
                pendingHandoff.to.forEach(to => addHandoff({ from:pendingHandoff.from, to, type:"note", summary:pendingHandoff.summary, body:pendingHandoff.body }));
                setPendingHandoff(null);
                setMessages(prev => [...prev, { role:"system", emoji:"📤", content:`Sent to ${names}. They'll see it in their inbox, and you'll get an alert.`, timestamp:ts(), id:Date.now() }]);
              }}
              disabled={!pendingHandoff.summary.trim()}
              style={{ background:pendingHandoff.summary.trim()?member.color:"transparent",color:pendingHandoff.summary.trim()?"#000":T.textDim,border:`1px solid ${pendingHandoff.summary.trim()?member.color:T.border}`,borderRadius:6,padding:"6px 16px",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",cursor:pendingHandoff.summary.trim()?"pointer":"not-allowed",fontFamily:"var(--font-mono)" }}>
              Send to {pendingHandoff.to.map(firstNameOfId).join(", ")}
            </button>
            <button onClick={()=>setPendingHandoff(null)} style={{ background:"none",border:`1px solid ${T.border}`,color:T.textDim,borderRadius:6,padding:"6px 14px",fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",fontFamily:"var(--font-mono)" }}>Discard</button>
          </div>
        </div>
      )}
      {pendingImage && (
        <div style={{ padding:"8px 14px",borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10,background:T.card,flexShrink:0 }}>
          {pendingImage.isPdf ? (
            <div style={{ width:40,height:40,borderRadius:6,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>📄</div>
          ) : (
            <img src={pendingImage.preview} alt="preview" style={{ width:40,height:40,objectFit:"cover",borderRadius:6,border:`1px solid ${T.border}` }}/>
          )}
          <div style={{ flex:1,fontSize:11,color:T.textMid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
            📎 {pendingImage.isPdf ? `PDF ready — ${pendingImage.name}` : "Image ready"} — sends with your next message
          </div>
          <button onClick={()=>setPendingImage(null)} style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:18,lineHeight:1 }}>×</button>
        </div>
      )}
      {/* Input area */}
      <div style={{
        padding: "12px 18px", borderTop: `1px solid ${T.border}`,
        display: "flex", gap: 10, flexShrink: 0, background: T.base,
      }}>
        <input ref={imageRef} type="file" accept=".pdf,image/*" onChange={handleImageUpload} style={{ display:"none" }}/>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder={`Ask ${member.name.split(" ")[0]} anything... (Enter to send, Shift+Enter for new line)`}
          rows={2}
          disabled={isTyping}
          style={{
            flex: 1, background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 8, padding: "10px 13px", fontSize: 12,
            color: isTyping ? T.textDim : T.text,
            fontFamily: "var(--font-mono)", outline: "none",
            resize: "none", lineHeight: 1.6, transition: "border 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = member.color}
          onBlur={e => e.target.style.borderColor = T.border}
        />
        <button
          onClick={()=>imageRef.current?.click()}
          title="Upload an image or PDF (PNG, JPG, GIF, PDF)"
          style={{ background:"none",border:`1px solid ${pendingImage?member.color:T.border}`,borderRadius:8,padding:"0 12px",fontSize:16,cursor:"pointer",color:pendingImage?member.color:T.textDim,flexShrink:0,alignSelf:"stretch",transition:"all 0.2s" }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=member.color}
          onMouseLeave={e=>{ if(!pendingImage) e.currentTarget.style.borderColor=T.border; }}
        >📎</button>
        <button
          onClick={() => sendMessage(input)}
          disabled={(!input.trim() && !pendingImage) || isTyping}
          style={{
            background: (!input.trim() && !pendingImage) || isTyping ? "transparent" : member.color,
            color: (!input.trim() && !pendingImage) || isTyping ? T.textDim : "#000",
            border: `1px solid ${(!input.trim() && !pendingImage) || isTyping ? T.border : member.color}`,
            borderRadius: 8, padding: "0 18px", fontSize: 11,
            fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            cursor: (!input.trim() && !pendingImage) || isTyping ? "not-allowed" : "pointer",
            fontFamily: "var(--font-mono)", transition: "all 0.2s",
            flexShrink: 0, alignSelf: "stretch",
          }}
        >
          {isTyping ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
