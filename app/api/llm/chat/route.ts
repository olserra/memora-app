import { getSession } from "@/lib/auth/session";
import {
  getMemoriesGrouped,
  getNearestMemoriesForUser,
} from "@/lib/db/queries";
import { NextRequest, NextResponse } from "next/server";

type ChatRequest = { message: string };

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

function buildPromptFromMemories(memRows: any[], userQuestion: string) {
  if (!memRows || memRows.length === 0) return userQuestion;

  const chunks = memRows.map(
    (r: any, i: number) => `Memory ${i + 1} (id:${r.id}): ${r.content}`
  );
  const context = chunks.join("\n---\n");
  const prompt = `You are a helpful assistant that answers questions using only the user's memories provided below. If the answer is not contained in the memories, say you don't know.

Context:
${context}

Question: ${userQuestion}`;
  return prompt;
}

async function embedText(text: string): Promise<number[] | undefined> {
  const embedUrl =
    process.env.EMBEDDING_API_URL ||
    "https://api-inference.huggingface.co/embeddings/sentence-transformers/all-MiniLM-L6-v2";
  const embedKey =
    process.env.EMBEDDING_API_KEY || process.env.HUGGING_FACE_TOKEN;
  if (!embedUrl || !embedKey) return undefined;

  const res = await fetch(embedUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${embedKey}`,
    },
    body: JSON.stringify({ inputs: text }),
  });
  if (!res.ok) {
    // non-fatal
    // eslint-disable-next-line no-console
    console.debug("Embedding request failed", await res.text());
    return undefined;
  }
  const j = await res.json();
  if (Array.isArray(j) && typeof j[0] === "number") return j as number[];
  if (Array.isArray(j.embedding) && typeof j.embedding[0] === "number")
    return j.embedding as number[];
  if (Array.isArray(j) && Array.isArray(j[0])) return j[0] as number[];
  return undefined;
}

// nearest-memory retrieval moved to `lib/db/queries.ts` as
// `getNearestMemoriesForUser` to centralize SQL and make testing easier.

async function callLLM(prompt: string) {
  const llmUrl = process.env.LLM_API_URL;
  const llmKey = process.env.LLM_API_KEY || process.env.HUGGING_FACE_TOKEN;
  if (!llmUrl) throw new Error("No LLM configured (LLM_API_URL missing)");

  const isOpenAI =
    llmUrl.includes("api.openai.com") ||
    llmUrl.includes("/v1/chat/completions");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (llmKey) headers.Authorization = `Bearer ${llmKey}`;

  const payload = isOpenAI
    ? {
        model: process.env.LLM_MODEL || "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
      }
    : { inputs: prompt };
  const res = await fetch(llmUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`LLM request failed: ${res.status} ${txt}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return await res.text();
  const json = await res.json();
  return normalizeOutput(json);
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const message = body?.message || "";

    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // Dev mock bypass
    if (process.env.LLM_DEV_MOCK === "1") {
      const mock = `(dev mock) I received your message: "${message}"`;
      return NextResponse.json({ output: mock });
    }

    // If the user explicitly asks to list or show memories, fetch them
    // directly (no embedding required). This avoids returning a generic
    // memory-jogging prompt when the user expects their stored memories.
    let prompt = message;
    const listIntentRe =
      /\bwhat\s+memories\b|\bshow\s+my\s+memories\b|\blist\s+my\s+memories\b|\bmy\s+memories\b/i;
    const knowAboutMeRe =
      /\bwhat.*know.*about.*me\b|\bo que.*sabe.*sobre.*mim\b/i;
    if (listIntentRe.test(message) || knowAboutMeRe.test(message)) {
      try {
        const grouped = await getMemoriesGrouped();
        // flatten grouped -> items
        const items: any[] = [];
        for (const cat of Object.keys(grouped)) {
          for (const it of grouped[cat]) items.push(it);
        }
        if (items.length > 0) {
          prompt = buildPromptFromMemories(items, message);
        }
      } catch (err) {
        // fall through to embedding-based retrieval below
        // eslint-disable-next-line no-console
        console.debug("Failed to fetch full memories for list intent", err);
      }
    }

    // Otherwise attempt embedding-based nearest-neighbor retrieval.
    if (prompt === message) {
      const vec = await embedText(message);
      if (vec && vec.length > 0) {
        try {
          const rows = await getNearestMemoriesForUser(session.user.id, vec, 5);
          if (rows && rows.length > 0)
            prompt = buildPromptFromMemories(rows, message);
        } catch (error_) {
          // non-fatal
          // eslint-disable-next-line no-console
          console.debug("Memory retrieval failed", error_);
        }
      }
    }

    try {
      const output = await callLLM(prompt);
      return NextResponse.json({ output });
    } catch (err: any) {
      return NextResponse.json(
        { error: err?.message || "LLM call failed" },
        { status: 500 }
      );
    }
  } catch (error_: any) {
    return NextResponse.json(
      { error: error_.message || "Chat failed" },
      { status: 500 }
    );
  }
}
