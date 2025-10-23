import { NextRequest, NextResponse } from "next/server";

type ChatRequest = { message: string };

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const message = body?.message || "";

    const llmUrl = process.env.LLM_API_URL;
    const llmKey = process.env.LLM_API_KEY;

    if (llmUrl) {
      // Proxy to an external Llama-like endpoint if configured.
      // Many self-hosted LLaMA UIs (text-generation-webui, ollama, llama.cpp wrappers)
      // expose a simple HTTP endpoint you can POST to without an API key.
      // Configure LLM_API_URL to point to that endpoint (e.g. http://localhost:8080/api/generate)
      const res = await fetch(llmUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Only send Authorization header if a key is provided
          ...(llmKey ? { Authorization: `Bearer ${llmKey}` } : {}),
        },
        // Some servers use { input } whereas others expect { prompt } or { prompt: { text } }.
        // Send a generic payload and let the remote handle it.
        body: JSON.stringify({
          input: message,
          prompt: message,
          text: message,
        }),
      });

      // Try to parse and normalize common shapes from LLM servers.
      let json;
      try {
        json = await res.json();
      } catch (err) {
        // Not JSON (some endpoints stream plain text). Fall back to text.
        const txt = await res.text();
        return NextResponse.json({ output: txt });
      }

      // Common response shapes:
      // { output: '...' }
      // { text: '...' }
      // { results: [{ output: '...' }]} or { generations: [{ text: '...' }] }
      const output =
        json.output ||
        json.text ||
        json.results?.[0]?.output ||
        json.results?.[0]?.text ||
        json.generations?.[0]?.text ||
        JSON.stringify(json);

      return NextResponse.json({ output });
    }

    // Simple fallback: echo with a helpful prefix
    const output = `(LLM fallback) I received your message: "${message}"`;
    return NextResponse.json({ output });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Chat failed" },
      { status: 500 }
    );
  }
}
