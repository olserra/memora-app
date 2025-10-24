import dotenv from "dotenv";
import { client } from "../lib/db/drizzle";

dotenv.config();

async function fetchEmbedding(
  embedUrl: string,
  embedKey: string,
  text: string
) {
  const res = await fetch(embedUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${embedKey}`,
    },
    body: JSON.stringify({ inputs: text }),
  });
  if (!res.ok) throw new Error(`Embedding request failed: ${res.status}`);
  const j = await res.json();
  if (Array.isArray(j) && typeof j[0] === "number")
    return j as number[];
  if (Array.isArray(j.embedding) && typeof j.embedding[0] === "number")
    return j.embedding as number[];
  if (Array.isArray(j) && Array.isArray(j[0])) return j[0] as number[];
  throw new Error("Unexpected embedding response shape");
}

try {
  const embedUrl =
    process.env.EMBEDDING_API_URL ||
    "https://api-inference.huggingface.co/embeddings/sentence-transformers/all-MiniLM-L6-v2";
  const embedKey =
    process.env.EMBEDDING_API_KEY || process.env.HUGGING_FACE_TOKEN;
  if (!embedUrl || !embedKey) {
    console.error(
      "Set EMBEDDING_API_URL and EMBEDDING_API_KEY or HUGGING_FACE_TOKEN in env"
    );
    process.exit(1);
  }

  const batchSize = 25;
  while (true) {
    const rows: { id: number; content: string }[] = await client.unsafe(
      `SELECT id, content FROM memories WHERE embedding IS NULL LIMIT ${batchSize}`
    );
    if (!rows || rows.length === 0) break;

    for (const r of rows) {
      try {
        const vec = await fetchEmbedding(embedUrl, embedKey, r.content);
        // Parameterized update: pass the vector and the id as parameters.
        await client.unsafe(
          `UPDATE memories SET embedding = $1::vector WHERE id = $2`,
          [vec, r.id]
        );
        console.log("Backfilled embedding for id", r.id);
      } catch (err) {
        console.error("Failed to embed id", r.id, err);
      }
    }
  }

  console.log("Backfill finished");
} catch (e) {
  console.error(e);
  process.exit(1);
}
