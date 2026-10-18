/**
 * /api/chat.js
 * Server-side proxy for the Anthropic Messages API.
 *
 * Why this exists:
 *  - Keeps the Anthropic API key on the server (process.env.ANTHROPIC_API_KEY),
 *    so it is never shipped to the browser.
 *  - Enables Anthropic's built-in web_search tool for every agent, so they can
 *    pull live, citeable sources. The model decides on its own when a query
 *    needs a search and when it does not.
 *
 * The client sends { system, userMessage, attachment? } and receives the raw
 * Anthropic SSE stream, which src/lib/api.js already knows how to read.
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Prefer the server-only key; fall back to the old name so nothing breaks
  // before the Vercel env var is renamed.
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "No API key configured. In Vercel → Project → Settings → Environment Variables, " +
        "add ANTHROPIC_API_KEY with your key from console.anthropic.com, then redeploy.",
    });
  }

  // Body is JSON-parsed by Vercel for Node functions; fall back just in case.
  let body = req.body;
  if (!body || typeof body !== "object") {
    try {
      const raw = await new Promise((resolve, reject) => {
        let d = "";
        req.on("data", (c) => (d += c));
        req.on("end", () => resolve(d));
        req.on("error", reject);
      });
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  }

  const { system = "", userMessage = "", attachment = null, maxWebSearches = 5 } = body;

  // Build the user content. Optional image or PDF attachment rides along.
  let userContent = userMessage;
  if (attachment && attachment.base64) {
    const isPdf = attachment.mediaType === "application/pdf";
    const block = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: attachment.base64 } }
      : { type: "image",    source: { type: "base64", media_type: attachment.mediaType, data: attachment.base64 } };
    userContent = [block, { type: "text", text: userMessage }];
  }

  const upstreamBody = {
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    system,
    messages: [{ role: "user", content: userContent }],
    tools: [
      { type: "web_search_20250305", name: "web_search", max_uses: maxWebSearches },
    ],
    stream: true,
  };

  let upstream;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(upstreamBody),
    });
  } catch (err) {
    return res.status(502).json({ error: `Upstream request failed: ${err.message}` });
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "");
    let msg = `Anthropic API error ${upstream.status}`;
    try { msg = JSON.parse(errText).error?.message || msg; } catch {}
    return res.status(upstream.status || 502).json({ error: msg });
  }

  // Stream the Anthropic SSE straight through to the browser unchanged.
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const reader = upstream.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
      if (typeof res.flush === "function") res.flush();
    }
  } catch (err) {
    // Client likely disconnected; nothing else to do.
  } finally {
    res.end();
  }
}
