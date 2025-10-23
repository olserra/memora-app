import { NextRequest, NextResponse } from "next/server";

type ChatRequest = { message: string };

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const message = body?.message || "";

    const llmUrl = process.env.LLM_API_URL;
    const llmKey = process.env.LLM_API_KEY;

    if (llmUrl) {
      // Proxy to external Llama-like endpoint if configured
      const res = await fetch(llmUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(llmKey ? { Authorization: `Bearer ${llmKey}` } : {}),
        },
        body: JSON.stringify({ input: message }),
      });

      const json = await res.json();
      // Expect the remote to reply with { output: string } or similar
      const output = json.output || json.text || JSON.stringify(json);
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
