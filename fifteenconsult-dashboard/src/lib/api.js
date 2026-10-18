/**
 * api.js — talks to our own server proxy (/api/chat), which holds the
 * Anthropic key server-side and enables the web_search tool for every agent.
 * The key is NO LONGER shipped to the browser.
 *
 * Accepts an optional attachment: an image OR a PDF.
 *   attachment = { base64, mediaType, name? }
 *   - image  → mediaType like "image/png", "image/jpeg"
 *   - pdf    → mediaType "application/pdf"
 *
 * When an agent uses web search, the sources it relied on are collected from
 * the stream and appended as a "Sources" list so briefings stay citeable.
 */

// Remove lone/unpaired UTF-16 surrogates (e.g. an emoji cut in half by a
// .slice()). The Anthropic API rejects these as invalid JSON. No lookbehind.
function sanitizeUnicode(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[\uD800-\uDFFF]/g, (ch, i, s) => {
    const code = ch.charCodeAt(0);
    if (code <= 0xDBFF) {
      const next = s.charCodeAt(i + 1);
      return (next >= 0xDC00 && next <= 0xDFFF) ? ch : "";
    } else {
      const prev = s.charCodeAt(i - 1);
      return (prev >= 0xD800 && prev <= 0xDBFF) ? ch : "";
    }
  });
}

export async function callClaudeAPI(systemPrompt, userMessage, onChunk, attachment = null) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: sanitizeUnicode(systemPrompt),
      userMessage: sanitizeUnicode(userMessage),
      attachment: attachment && attachment.base64 ? attachment : null,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `API error ${response.status}`);
  }

  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText  = "";
  let buffer    = "";              // holds a partial trailing line between reads
  const sources = [];              // { url, title } collected from web search
  const seenUrls = new Set();

  const addSource = (url, title) => {
    if (!url || seenUrls.has(url)) return;
    seenUrls.add(url);
    sources.push({ url, title: title || url });
  };

  const handleEvent = (parsed) => {
    // Streamed answer text
    if (parsed.type === "content_block_delta") {
      if (parsed.delta?.type === "text_delta" && parsed.delta.text) {
        fullText += parsed.delta.text;
        onChunk(fullText);
      } else if (parsed.delta?.text) {           // older/simple shape
        fullText += parsed.delta.text;
        onChunk(fullText);
      } else if (parsed.delta?.type === "citations_delta" && parsed.delta.citation) {
        const c = parsed.delta.citation;
        addSource(c.url, c.title);
      }
      return;
    }
    // A finished web search returns its results as a content block
    if (parsed.type === "content_block_start") {
      const block = parsed.content_block;
      if (block?.type === "web_search_tool_result" && Array.isArray(block.content)) {
        block.content.forEach((r) => addSource(r.url, r.title));
      }
      // Some responses attach citations directly on a text block
      if (block?.type === "text" && Array.isArray(block.citations)) {
        block.citations.forEach((c) => addSource(c.url, c.title));
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";    // keep the last, possibly-incomplete line
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try { handleEvent(JSON.parse(data)); } catch {}
    }
  }

  // Append a Sources list if the agent searched and we didn't already print one.
  // Plain text (no markdown) to match how the dashboard renders agent output.
  if (sources.length && !/\nSources:\s*\n/i.test(fullText)) {
    const list = sources.map((s) => `- ${s.title} (${s.url})`).join("\n");
    fullText = `${fullText.trimEnd()}\n\nSources:\n${list}`;
    onChunk(fullText);
  }

  return fullText;
}
