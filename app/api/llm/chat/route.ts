import { getSession } from "@/lib/auth/session";
import { client, db } from "@/lib/db/drizzle";
import {
  getMemoriesGrouped,
  getNearestMemoriesForUser,
  getUser,
} from "@/lib/db/queries";
import { memories } from "@/lib/db/schema";
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

async function extractMemoryFromMessage(
  message: string
): Promise<{ content: string; tags: string[] } | null> {
  const extractPrompt = `
    You are an extraction agent. Analyze the user message and decide if it contains a NEW PERSONAL FACT.

    STEP 1 — CLASSIFY the message type:
    - PERSONAL_FACT → factual statement about the user's life, identity, relationships, preferences, or experiences.
    - GENERIC_STATEMENT → opinions, feelings, reflections, or analysis about the conversation (not factual).
    - COMMAND_OR_QUESTION → questions, instructions, or meta-communication with the assistant.

    STEP 2 — If type is not PERSONAL_FACT, return:
    Extract: NONE

    STEP 3 — If PERSONAL_FACT, output:
    Extract: [concise fact]
    Tags: [tag1, tag2, tag3]

    Message: "${message}"
    `;

  try {
    const output = await callLLM(extractPrompt);
    const lines = output.trim().split("\n");
    const extractLine = lines.find((line) => line.startsWith("Extract:"));
    const tagsLine = lines.find((line) => line.startsWith("Tags:"));

    if (extractLine) {
      let cleaned = extractLine.replace("Extract:", "").trim();
      cleaned = cleaned.replace(/^["']/, "").replace(/["']$/, "");
      if (
        cleaned === "NONE" ||
        cleaned === "" ||
        cleaned.toLowerCase().includes("none")
      ) {
        return null;
      }

      let tags: string[] = [];
      if (tagsLine) {
        const tagsText = tagsLine.replace("Tags:", "").trim();
        tags = tagsText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }

      return { content: cleaned, tags };
    }
    return null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.debug("Memory extraction failed", error);
    return null;
  }
}

function shouldIgnoreMemory(extracted: {
  content: string;
  tags: string[];
}): boolean {
  const c = extracted.content.toLowerCase();

  const genericPatterns = [
    /\banalyzing\b/,
    /\bthinking\b/,
    /\basking\b/,
    /\bchecking\b/,
    /\btesting\b/,
    /\btrying\b/,
    /\bmessage\b/,
    /\bthis chat\b/,
    /\bconversation\b/,
    /\bai\b/,
    /\bassistant\b/,
  ];

  const metaTags = ["none", "meta", "action", "ai", "system"];

  if (genericPatterns.some((rx) => rx.test(c))) return true;
  if (metaTags.some((t) => extracted.tags.includes(t))) return true;
  if (c.length < 10) return true; // evita ruído tipo "User happy"
  return false;
}

async function validateMemoryWithClassifier(extracted: {
  content: string;
  tags: string[];
}): Promise<boolean> {
  // Optional binary validation using Hugging Face API
  if (!process.env.HUGGING_FACE_TOKEN) return true; // Skip if no token

  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
      {
        headers: { Authorization: `Bearer ${process.env.HUGGING_FACE_TOKEN}` },
        method: "POST",
        body: JSON.stringify({
          inputs: extracted.content,
          parameters: {
            candidate_labels: [
              "personal_fact",
              "meta_comment",
              "action",
              "question",
            ],
          },
        }),
      }
    );
    const data = await res.json();
    return data?.labels?.[0] === "personal_fact";
  } catch (error) {
    // eslint-disable-next-line no-console
    console.debug("Classifier validation failed", error);
    return true; // Allow if classifier fails
  }
}

function buildPromptFromMemories(memRows: any[], userQuestion: string) {
  let context = "";
  if (memRows && memRows.length > 0) {
    const chunks = memRows.map(
      (r: any, i: number) => `Memory ${i + 1} (id:${r.id}): ${r.content}`
    );
    context = `\n\nExisting Memories:\n${chunks.join("\n---\n")}`;
  }

  const prompt = `${context}\n\nQuestion: ${userQuestion}`;
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
    body: JSON.stringify({ inputs: [text] }),
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
            content: `You are Memora, a polite, concise, and kind AI assistant designed to help users remember and manage their personal memories. Use any existing memories provided in the conversation to help answer the user's questions accurately.

You MUST save new memories for ANY personal information the user shares. Look at the content and decide if it's worth remembering.

**Always save:**
- Names, relationships, preferences, facts about the user
- Anything that could be useful to remember for future conversations

**How to save:**
Include [MEMORY: concise fact | tag1, tag2, tag3] in your response. Extract the key information and provide exactly 3 relevant tags.

**Examples:**
User: "My girlfriend is Carla"
Assistant: "That's nice! [MEMORY: User's girlfriend is named Carla | relationship, personal, name]"

User: "I love hiking"
Assistant: "Hiking is fun! [MEMORY: User loves hiking | hobby, interest, activity]"

User: "I'm 25 years old"
Assistant: "Cool! [MEMORY: User is 25 years old | personal, age, fact]"

User: "Hello"
Assistant: "Hi there!" (no memory)

Save memories for relevant personal information.`,
          },
          { role: "user", content: prompt },
        ],
      }
    : {
        inputs: `You are Memora, a polite, concise, and kind AI assistant designed to help users remember and manage their personal memories. Use any existing memories provided in the conversation to help answer the user's questions accurately.

You MUST save new memories for ANY personal information the user shares. Look at the content and decide if it's worth remembering.

**Always save:**
- Names, relationships, preferences, facts about the user
- Anything that could be useful to remember for future conversations

**How to save:**
Include [MEMORY: concise fact | tag1, tag2, tag3] in your response. Extract the key information and provide exactly 3 relevant tags.

**Examples:**
User: "My girlfriend is Carla"
Assistant: "That's nice! [MEMORY: User's girlfriend is named Carla | relationship, personal, name]"

User: "I love hiking"
Assistant: "Hiking is fun! [MEMORY: User loves hiking | hobby, interest, activity]"

User: "I'm 25 years old"
Assistant: "Cool! [MEMORY: User is 25 years old | personal, age, fact]"

User: "Hello"
Assistant: "Hi there!" (no memory)

Save memories for relevant personal information.

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

    // Extract and save memory if any
    const extracted = await extractMemoryFromMessage(message);
    if (extracted && !shouldIgnoreMemory(extracted)) {
      // Optional: Add classifier validation for extra robustness
      const isValid = await validateMemoryWithClassifier(extracted);
      if (isValid) {
        try {
          const inserted = await db
            .insert(memories)
            .values({
              userId: session.user.id,
              title: extracted.content,
              content: extracted.content,
              category: "personal",
              tags: JSON.stringify(extracted.tags),
            })
            .returning({ id: memories.id });
          if (inserted[0]) {
            const vec = await embedText(extracted.content);
            if (vec) {
              const vecStr = "[" + vec.join(",") + "]";
              try {
                await client.unsafe(
                  `UPDATE memories SET embedding = $1::vector WHERE id = $2`,
                  [vecStr, inserted[0].id]
                );
                // Log embedding dimensionality for debugging
                // eslint-disable-next-line no-console
                console.debug(
                  `Saved embedding for memory id=${inserted[0].id} dims=${vec.length}`
                );
              } catch (e) {
                // eslint-disable-next-line no-console
                console.debug(
                  "Failed to update embedding for inserted memory:",
                  e
                );
              }
            }
          }
        } catch (memError) {
          // eslint-disable-next-line no-console
          console.debug("Failed to save extracted memory", memError);
        }
      }
    }

    // Dev mock bypass

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
      // Log embedding dimensionality returned by embedText
      // eslint-disable-next-line no-console
      console.debug("embedText returned length:", vec?.length ?? 0);
      if (vec && vec.length > 0) {
        try {
          const rows = await getNearestMemoriesForUser(session.user.id, vec, 5);
          // Log number of rows retrieved for debugging
          // eslint-disable-next-line no-console
          console.debug(
            `getNearestMemoriesForUser returned ${rows?.length ?? 0} rows for user ${session.user.id}`,
            Array.isArray(rows) ? rows.slice(0, 3) : rows
          );
          if (rows && rows.length > 0) {
            prompt = buildPromptFromMemories(rows, message);
          } else {
            // eslint-disable-next-line no-console
            console.warn(`No memories retrieved for user ${session.user.id}`);
          }
        } catch (error_) {
          // non-fatal
          // eslint-disable-next-line no-console
          console.debug("Memory retrieval failed", error_);
        }
      }
    }

    try {
      let output = await callLLM(prompt, user.name);

      // Remove any memory markers from the response
      output = output.replaceAll(/\[MEMORY:[^\]]*\]/g, "").trim();

      // Check for memory saving marker
      const memoryRegex = /\[MEMORY:\s*(.*?)\s*\|\s*(.*?)\]/;
      const memoryMatch = memoryRegex.exec(output);
      if (memoryMatch) {
        const memoryContent = memoryMatch[1].trim();
        const tagsText = memoryMatch[2].trim();
        const tags = tagsText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        if (memoryContent) {
          const extracted = { content: memoryContent, tags };
          if (!shouldIgnoreMemory(extracted)) {
            // Optional: Add classifier validation for extra robustness
            const isValid = await validateMemoryWithClassifier(extracted);
            if (isValid) {
              try {
                // Create memory using internal DB call
                const inserted = await db
                  .insert(memories)
                  .values({
                    userId: session.user.id,
                    title: memoryContent,
                    content: memoryContent,
                    category: "general",
                    tags: JSON.stringify(tags),
                  })
                  .returning({ id: memories.id });
                if (inserted[0]) {
                  const vec = await embedText(memoryContent);
                  if (vec) {
                    const vecStr = "[" + vec.join(",") + "]";
                    await client.unsafe(
                      `UPDATE memories SET embedding = $1::vector WHERE id = $2`,
                      [vecStr, inserted[0].id]
                    );
                  }
                }
              } catch (memError) {
                // Non-fatal, log but continue
                // eslint-disable-next-line no-console
                console.debug("Failed to save memory", memError);
              }
            }
          }
        }
        // Remove the marker from the response (in case it wasn't removed above)
        output = output.replace(memoryRegex, "").trim();
      }

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
