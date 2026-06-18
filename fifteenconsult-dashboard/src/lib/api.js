/**
 * api.js — Anthropic Claude API with streaming
 * API key loaded from environment variable VITE_ANTHROPIC_API_KEY
 * Accepts an optional attachment: an image OR a PDF.
 *   attachment = { base64, mediaType, name? }
 *   - image  → mediaType like "image/png", "image/jpeg"
 *   - pdf    → mediaType "application/pdf"
 */

// Remove lone/unpaired UTF-16 surrogates (e.g. an emoji cut in half by a
// .slice()). The Anthropic API rejects these as invalid JSON
// ("no low surrogate in string"). No lookbehind — safe on all browsers.
function sanitizeUnicode(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[\uD800-\uDFFF]/g, (ch, i, s) => {
    const code = ch.charCodeAt(0);
    if (code <= 0xDBFF) {
      // high surrogate — keep only if immediately followed by a low surrogate
      const next = s.charCodeAt(i + 1);
      return (next >= 0xDC00 && next <= 0xDFFF) ? ch : "";
    } else {
      // low surrogate — keep only if immediately preceded by a high surrogate
      const prev = s.charCodeAt(i - 1);
      return (prev >= 0xD800 && prev <= 0xDBFF) ? ch : "";
    }
  });
}

export async function callClaudeAPI(systemPrompt, userMessage, onChunk, attachment = null) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "No API key found. Add VITE_ANTHROPIC_API_KEY to your Vercel environment variables.\n\n" +
      "Go to: Vercel → Project → Settings → Environment Variables\n" +
      "Key: VITE_ANTHROPIC_API_KEY\n" +
      "Value: your Anthropic API key from console.anthropic.com"
    );
  }

  // Build the user content. If a PDF or image is attached, send a content array.
  const safeMessage = sanitizeUnicode(userMessage);
  let userContent = safeMessage;
  if (attachment && attachment.base64) {
    const isPdf = attachment.mediaType === "application/pdf";
    const block = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: attachment.base64 } }
      : { type: "image",    source: { type: "base64", media_type: attachment.mediaType, data: attachment.base64 } };
    userContent = [block, { type: "text", text: safeMessage }];
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: sanitizeUnicode(systemPrompt),
      messages: [{ role: "user", content: userContent }],
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText  = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split("\n");
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "content_block_delta" && parsed.delta?.text) {
          fullText += parsed.delta.text;
          onChunk(fullText);
        }
      } catch {}
    }
  }
  return fullText;
}
