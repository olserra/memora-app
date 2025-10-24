import { getSession } from "@/lib/auth/session";
import { client } from "@/lib/db/drizzle";
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
  if (Array.isArray(j.embedding) && typeof j.embedding[0] === "number")
    return j.embedding as number[];
  if (Array.isArray(j) && Array.isArray(j[0])) return j[0] as number[];
  return undefined;
}

async function retrieveTopMemoriesForUser(
  userId: number,
  vec: number[],
  limit = 5
) {
  if (!vec || vec.length === 0) return [];
  const vecLiteral = `ARRAY[${vec.map(Number).join(",")} ]::vector`;
  const sql = `SELECT id, title, content, user_id, (embedding <-> ${vecLiteral}) AS distance
               FROM memories
               WHERE user_id = ${userId} AND embedding IS NOT NULL
               ORDER BY distance
               LIMIT ${limit}`;
  const rows = await client.unsafe(sql);
  return rows as any[];
}

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

    // Build prompt using nearest memories when available
    let prompt = message;
    const vec = await embedText(message);
    if (vec && vec.length > 0) {
      try {
        const rows = await retrieveTopMemoriesForUser(session.user.id, vec, 5);
        if (rows && rows.length > 0)
          prompt = buildPromptFromMemories(rows, message);
      } catch (error_) {
        // non-fatal
        // eslint-disable-next-line no-console
        console.debug("Memory retrieval failed", error_);
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
