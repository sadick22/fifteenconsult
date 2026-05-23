import { useState } from "react";
import { COPY_FORMATS } from "../lib/copyFormats.js";

const T = {
  base:    "var(--bg-base)", card:    "var(--bg-card)",
  border:  "var(--border)", text:    "var(--text)",
  textMid: "var(--text-mid)", textDim: "var(--text-dim)",
  gold:    "var(--gold)", green:   "var(--green)",
  amber:   "var(--amber)",
};

export default function CopyToolbar({ agentId, outputText, color, timestamp }) {
  const [copied, setCopied]       = useState(null); // format id that was just copied
  const [preview, setPreview]     = useState(null); // format id being previewed
  const [previewText, setPreviewText] = useState("");

  const formats = COPY_FORMATS[agentId] || COPY_FORMATS.nadia;

  const handleCopy = (format) => {
    if (!outputText) return;
    const transformed = format.transform(outputText);
    navigator.clipboard.writeText(transformed).then(() => {
      setCopied(format.id);
      setTimeout(() => setCopied(null), 2500);
    });
  };

  const handlePreview = (format) => {
    if (!outputText) return;
    if (preview === format.id) {
      setPreview(null);
      setPreviewText("");
      return;
    }
    setPreview(format.id);
    setPreviewText(format.transform(outputText));
  };

  if (!outputText) return null;

  return (
    <div style={{ marginTop: 16 }}>

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 10,
      }}>
        <div style={{ fontSize: 10, color: T.textDim, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Copy Output As
        </div>
        <div style={{ fontSize: 9, color: T.textDim }}>
          Click format to copy · Eye icon to preview
        </div>
      </div>

      {/* Format buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {formats.map(format => {
          const isCopied   = copied === format.id;
          const isPreviewing = preview === format.id;
          const isRaw      = format.id === "raw";

          return (
            <div key={format.id} style={{ display: "flex", gap: 0 }}>
              {/* Copy button */}
              <button
                onClick={() => handleCopy(format)}
                title={format.description}
                style={{
                  background: isCopied
                    ? color + "33"
                    : isRaw ? T.base : color + "12",
                  border: `1px solid ${isCopied ? color : isPreviewing ? color + "66" : T.border}`,
                  borderRight: "none",
                  borderRadius: "8px 0 0 8px",
                  color: isCopied ? color : T.textMid,
                  fontSize: 11, fontWeight: isCopied ? 700 : 500,
                  padding: "7px 13px",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: 6,
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => {
                  if (!isCopied) {
                    e.currentTarget.style.background = color + "22";
                    e.currentTarget.style.borderColor = color + "55";
                    e.currentTarget.style.color = color;
                  }
                }}
                onMouseLeave={e => {
                  if (!isCopied) {
                    e.currentTarget.style.background = isRaw ? T.base : color + "12";
                    e.currentTarget.style.borderColor = isPreviewing ? color + "66" : T.border;
                    e.currentTarget.style.color = T.textMid;
                  }
                }}
              >
                <span style={{ fontSize: 13 }}>{format.icon}</span>
                <span>{isCopied ? "✓ Copied!" : format.label}</span>
              </button>

              {/* Preview toggle */}
              <button
                onClick={() => handlePreview(format)}
                title="Preview formatted output"
                style={{
                  background: isPreviewing ? color + "22" : T.base,
                  border: `1px solid ${isPreviewing ? color : T.border}`,
                  borderLeft: `1px solid ${T.border}`,
                  borderRadius: "0 8px 8px 0",
                  color: isPreviewing ? color : T.textDim,
                  fontSize: 11, padding: "7px 9px",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  if (!isPreviewing) {
                    e.currentTarget.style.background = color + "12";
                    e.currentTarget.style.color = color;
                  }
                }}
                onMouseLeave={e => {
                  if (!isPreviewing) {
                    e.currentTarget.style.background = T.base;
                    e.currentTarget.style.color = T.textDim;
                  }
                }}
              >
                {isPreviewing ? "▲" : "👁"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Preview panel */}
      {preview && previewText && (
        <div style={{
          marginTop: 14,
          background: T.base,
          border: `1px solid ${color}33`,
          borderLeft: `3px solid ${color}`,
          borderRadius: 10,
          overflow: "hidden",
          animation: "fadeUp 0.2s ease",
        }}>
          <div style={{
            padding: "10px 16px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13 }}>
                {formats.find(f => f.id === preview)?.icon}
              </span>
              <span style={{ fontSize: 11, color, fontWeight: 600 }}>
                {formats.find(f => f.id === preview)?.label} Preview
              </span>
              <span style={{ fontSize: 10, color: T.textDim }}>
                — {formats.find(f => f.id === preview)?.description}
              </span>
            </div>
            <button
              onClick={() => handleCopy(formats.find(f => f.id === preview))}
              style={{
                background: color + "22",
                border: `1px solid ${color}44`,
                color, fontSize: 9, fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase",
                padding: "4px 14px", borderRadius: 6,
                cursor: "pointer", fontFamily: "var(--font-mono)",
                transition: "all 0.2s",
              }}
            >
              {copied === preview ? "✓ Copied!" : "Copy This"}
            </button>
          </div>
          <pre style={{
            padding: "14px 16px",
            fontSize: 11, color: T.textMid,
            lineHeight: 1.8, whiteSpace: "pre-wrap",
            fontFamily: "var(--font-mono)",
            margin: 0, maxHeight: 300, overflowY: "auto",
          }}>
            {previewText}
          </pre>
        </div>
      )}
    </div>
  );
}

