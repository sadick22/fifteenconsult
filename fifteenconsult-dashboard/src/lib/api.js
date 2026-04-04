/**
 * Calls the Anthropic Claude API with streaming.
 * The API key is injected by the Claude.ai environment — do NOT add it here.
 *
 * @param {string} systemPrompt  - The agent's persona system prompt
 * @param {string} userMessage   - The trigger message
 * @param {function} onChunk     - Called with the full accumulated text on each streamed chunk
 * @returns {Promise<string>}    - Final full text
 */
export async function callClaudeAPI(systemPrompt, userMessage, onChunk) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

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
      } catch {
        // partial JSON chunk — skip
      }
    }
  }

  return fullText;
}
