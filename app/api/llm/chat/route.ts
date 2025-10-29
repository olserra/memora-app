import { getSession } from "@/lib/auth/session";
import { client, db } from "@/lib/db/drizzle";
import {
  getMemoriesGrouped,
  getNearestMemoriesForUser,
  getUser,
} from "@/lib/db/queries";
import { memories } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

type ChatRequest = {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
};

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
  if (memRows.length === 0) return userQuestion;

  const chunks = memRows.map((r: any) => r.content);
  const context = `\n\nRelevant memories:\n${chunks.join("\n")}`;

  return `${context}\n\nUser question: ${userQuestion}\n\nAnswer naturally based on the memories above. Don't mention memory IDs, tags, or repeat the question back.`;
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
    body: JSON.stringify({ inputs: [text] }),
  });
  if (!res.ok) {
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

async function checkDuplicate(
  userId: number,
  content: string,
  vec?: number[]
): Promise<boolean> {
  if (!vec) return false;
  try {
    const similar = await getNearestMemoriesForUser(userId, vec, 1);
    if (similar?.[0]) {
      const distance = similar[0].distance ?? 1;
      return distance < 0.15;
    }
  } catch (err) {
    console.debug("Duplicate check failed", err);
  }
  return false;
}

async function callLLM(prompt: string, userName?: string | null) {
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
          {
            role: "system",
            content: `You are Memora, a helpful AI assistant that remembers personal information.

**Response Guidelines:**
- Answer naturally and conversationally
- Don't mention memory IDs, tags, or technical details
- Don't repeat or acknowledge what the user just asked
- Don't use phrases like "yes", "you're asking about", "I can help with that"
- Be direct and concise
- When recalling preferences, just state them: "You like X and Y"

**Memory Saving:**
Save [MEMORY: fact | tag1, tag2, tag3] ONLY for:
- Personal facts (name, age, location, job, relationships)
- Preferences (food, music, hobbies)
- Goals, plans, important dates
- Experiences, stories, past events

DO NOT save for greetings, questions, or requests for information.

Examples:
User: "I like pasta"
Assistant: "Got it! [MEMORY: User likes pasta | food, preference, italian]"

User: "What do I like to drink?"
Assistant: "You like Pisco sauer and Negroni."`,
          },
          { role: "user", content: prompt },
        ],
      }
    : {
        inputs: `You are Memora, a polite, concise AI assistant designed to help users remember personal information.

**CRITICAL RULES FOR MEMORY SAVING:**

Save [MEMORY: fact | tag1, tag2, tag3] for:
- Personal facts (name, age, location, job, relationships)
- Preferences (food, music, hobbies, dislikes)
- Goals, plans, important dates
- Experiences, stories, past events
- Skills, knowledge areas, expertise

DO NOT save for:
- Greetings, pleasantries
- Questions about time, weather, facts
- Requests for help or information
- Meta conversation about the chat itself
- Generic statements without personal context

**Examples:**
User: "I like pasta"
Assistant: "Nice! [MEMORY: User likes pasta | food, preference, italian]"

User: "My girlfriend is Carla"
Assistant: "That's nice! [MEMORY: User's girlfriend is named Carla | relationship, personal, name]"

User: "What time is it?"
Assistant: "I don't have access to real-time information, but you can check your device's clock."

User: "How do I cook pasta?"
Assistant: "Here's how to cook pasta: boil water, add salt, cook 8-10 minutes..."

Save memories ONLY for relevant personal information.

User: ${prompt}
Memora:`,
      };
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

    const user = await getUser();
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 401 });

    let prompt = message;
    let retrievedMemories: any[] = [];

    // 1. SEMPRE tentar vector search primeiro
    const vec = await embedText(message);
    console.debug("embedText returned length:", vec?.length ?? 0);

    if (vec && vec.length > 0) {
      try {
        const rows = await getNearestMemoriesForUser(user.id, vec, 10);
        console.debug(
          `getNearestMemoriesForUser returned ${rows?.length ?? 0} rows`
        );

        if (rows && rows.length > 0) {
          retrievedMemories = rows;
        }
      } catch (error_) {
        console.debug("Vector search failed", error_);
      }
    }

    // 2. Se vector search retornou poucas memórias (<3), buscar todas como fallback
    if (retrievedMemories.length < 3) {
      try {
        const grouped = await getMemoriesGrouped();
        const allItems: any[] = [];
        for (const cat of Object.keys(grouped)) {
          for (const it of grouped[cat]) allItems.push(it);
        }

        if (allItems.length > 0) {
          retrievedMemories = allItems;
          console.debug("Using full memory fallback:", allItems.length);
        }
      } catch (err) {
        console.debug("Full memory fallback failed", err);
      }
    }

    // 3. Construir prompt com memórias encontradas
    if (retrievedMemories.length > 0) {
      prompt = buildPromptFromMemories(retrievedMemories, message);
    }

    if (prompt === message) {
      console.debug("embedText returned length:", vec?.length ?? 0);
      if (vec && vec.length > 0) {
        try {
          const rows = await getNearestMemoriesForUser(user.id, vec, 10);
          console.debug(
            `getNearestMemoriesForUser returned ${
              rows?.length ?? 0
            } rows for user ${user.id}`,
            rows
          );
          if (rows && rows.length > 0) {
            prompt = buildPromptFromMemories(rows, message);
          }
        } catch (error_) {
          console.debug("Memory retrieval failed", error_);
        }
      }
    }

    try {
      let output = await callLLM(prompt, user.name);

      console.debug("LLM raw output:", output);

      const memoryRegex = /\[MEMORY:\s*(.*?)\s*\|\s*(.*?)\]/g;
      let memoryMatch;
      const savedMemories = [];

      while ((memoryMatch = memoryRegex.exec(output)) !== null) {
        const memoryContent = memoryMatch[1].trim();
        const tagsText = memoryMatch[2].trim();
        const tags = tagsText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 3);

        const memVec = await embedText(memoryContent);
        if (memVec && (await checkDuplicate(user.id, memoryContent, memVec))) {
          console.debug("Skipping duplicate memory:", memoryContent);
          continue;
        }

        if (memoryContent && memoryContent.length >= 10) {
          console.debug("Attempting to save memory:", memoryContent, tags);
          try {
            const inserted = await db
              .insert(memories)
              .values({
                userId: user.id,
                content: memoryContent,
                category: "personal",
                tags: JSON.stringify(tags),
              })
              .returning({ id: memories.id });

            if (inserted[0]) {
              console.debug("Memory saved with ID:", inserted[0].id);
              if (memVec) {
                const vecStr = "[" + memVec.join(",") + "]";
                await client.unsafe(
                  `UPDATE memories SET embedding = $1::vector WHERE id = $2`,
                  [vecStr, inserted[0].id]
                );
                console.debug("Embedding saved for memory:", inserted[0].id);
              }
              savedMemories.push(inserted[0].id);
            }
          } catch (memError) {
            console.error("Failed to save memory:", memError);
          }
        }
      }

      console.debug("Total memories saved:", savedMemories.length);

      output = output.replaceAll(/\[MEMORY:[^\]]*\]/g, "").trim();

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
