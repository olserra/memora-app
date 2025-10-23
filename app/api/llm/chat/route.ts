import { getSession } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";

type ChatRequest = { message: string };

function isOpenAIUrl(url: string) {
  return url.includes("api.openai.com") || url.includes("/v1/chat/completions");
}

function buildPayload(isOpenAI: boolean, message: string) {
  if (isOpenAI) {
    return {
      model: process.env.LLM_MODEL || "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    };
  }
  return { input: message, prompt: message, text: message };
}

function normalizeOutput(json: any) {
  let output: string | undefined =
    json.output ||
    json.text ||
    json.results?.[0]?.output ||
    json.results?.[0]?.text ||
    json.generations?.[0]?.text;

  if (!output && Array.isArray(json.choices) && json.choices.length > 0) {
    const choice = json.choices[0];
    output = choice?.message?.content ?? choice?.text ?? choice?.delta?.content;
  }

  if (!output) output = JSON.stringify(json);
  return output;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const message = body?.message || "";

    // Require an authenticated session to use the chat endpoint.
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // Dev mock mode for authenticated users
    if (process.env.LLM_DEV_MOCK === "1") {
      const mock = `(dev mock) I received your message: "${message}"`;
      return NextResponse.json({ output: mock });
    }

    const llmUrl = process.env.LLM_API_URL;
    const llmKey = process.env.LLM_API_KEY;

    if (!llmUrl) {
      console.warn(
        "LLM chat request received but no LLM_API_URL is configured"
      );
      return NextResponse.json(
        {
          error:
            "No LLM configured. Set LLM_API_URL (and optionally LLM_API_KEY) in the environment to enable chat.",
        },
        { status: 500 }
      );
    }

    const isOpenAI = isOpenAIUrl(llmUrl);
    if (isOpenAI && !llmKey) {
      return NextResponse.json(
        {
          error:
            "LLM provider (OpenAI) requires LLM_API_KEY to be set in the environment.",
        },
        { status: 500 }
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (llmKey) headers["Authorization"] = `Bearer ${llmKey}`;

    const payload = buildPayload(isOpenAI, message);

    const res = await fetch(llmUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const txt = await res.text();
      return NextResponse.json({ output: txt });
    }

    const json = await res.json();
    const output = normalizeOutput(json);
    return NextResponse.json({ output });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Chat failed" },
      { status: 500 }
    );
  }
}
