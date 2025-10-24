import dotenv from "dotenv";
import { client } from "../lib/db/drizzle";

dotenv.config();

async function embedText(text: string) {
  const embedUrl =
    process.env.EMBEDDING_API_URL ||
    "https://api-inference.huggingface.co/embeddings/sentence-transformers/all-MiniLM-L6-v2";
  const embedKey =
    process.env.EMBEDDING_API_KEY || process.env.HUGGING_FACE_TOKEN;
  if (!embedUrl || !embedKey)
    throw new Error(
      "Set EMBEDDING_API_URL and EMBEDDING_API_KEY or HUGGING_FACE_TOKEN in env"
    );

  const res = await fetch(embedUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${embedKey}`,
    },
    body: JSON.stringify({ inputs: [text] }),
  });
  if (!res.ok) throw new Error(`Embedding request failed: ${res.status}`);
  const j = await res.json();
  if (Array.isArray(j.embedding) && typeof j.embedding[0] === "number")
    return j.embedding as number[];
  if (Array.isArray(j) && Array.isArray(j[0])) return j[0] as number[];
  throw new Error("Unexpected embedding response shape");
}

function buildPromptFromMemories(memRows: any[], userQuestion: string) {
  if (!memRows || memRows.length === 0) return userQuestion;
  const chunks = memRows.map(
    (r: any, i: number) => `Memory ${i + 1} (id:${r.id}): ${r.content}`
  );
  const context = chunks.join("\n---\n");
  return `You are a helpful assistant that answers questions using only the user's memories provided below. If the answer is not contained in the memories, say you don't know.\n\nContext:\n${context}\n\nQuestion: ${userQuestion}`;
}

async function retrieveTopMemoriesForUser(
  userId: number,
  vec: number[],
  limit = 5
) {
  const sql = `SELECT id, title, content, user_id, (embedding <-> $1::vector) AS distance
               FROM memories
               WHERE user_id = $2 AND embedding IS NOT NULL
               ORDER BY distance
               LIMIT $3`;
  const rows = await client.unsafe(sql, [vec, userId, limit]);
  return rows as any[];
}

async function callLLM(prompt: string) {
  const llmUrl = process.env.LLM_API_URL;
  const llmKey = process.env.LLM_API_KEY || process.env.HUGGING_FACE_TOKEN;
  if (!llmUrl)
    throw new Error("Set LLM_API_URL and LLM_API_KEY or HUGGING_FACE_TOKEN");

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
    const t = await res.text();
    throw new Error(`LLM request failed: ${res.status} ${t}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return await res.text();
  const json = await res.json();
  // normalize similar to server
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

async function main() {
  const userId = Number(process.env.TEST_USER_ID ?? "");
  if (!userId)
    throw new Error(
      "Set TEST_USER_ID env to the user id you want to test (numeric)"
    );

  const question =
    process.argv.slice(2).join(" ") || "Tell me about my trips to Paris";
  console.log("Question:", question);

  const vec = await embedText(question);
  const rows = await retrieveTopMemoriesForUser(userId, vec, 5);
  console.log(
    "Retrieved memories:",
    rows.map((r) => ({ id: r.id, title: r.title }))
  );

  const prompt = buildPromptFromMemories(rows, question);
  console.log("Prompt length:", prompt.length);

  const out = await callLLM(prompt);
  console.log("LLM output:\n", out);
}

try {
  await main();
} catch (e) {
  console.error(e);
  process.exit(1);
}
