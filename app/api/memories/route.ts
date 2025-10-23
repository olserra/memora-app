import { db } from "@/lib/db/drizzle";
import { getMemoriesGrouped, getUser } from "@/lib/db/queries";
import { memories } from "@/lib/db/schema";
import * as dev from "@/lib/devMemories";
import { NextResponse } from "next/server";

function makeGrouped(list: any[]) {
  const grouped: Record<string, any[]> = {};
  for (const it of list) {
    const cat = it.category || "general";
    const item = { ...it, tags: it.tags || [] };
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }
  return grouped;
}

export async function GET() {
  // makeGrouped is defined at module scope

  try {
    if (process.env.USE_LOCAL_MEMORIES === "1") {
      const list = await dev.listMemories();
      return NextResponse.json({ grouped: makeGrouped(list), items: list });
    }

    const grouped = await getMemoriesGrouped();
    const items: any[] = [];
    for (const cat of Object.keys(grouped)) {
      for (const it of grouped[cat]) items.push(it);
    }
    return NextResponse.json({ grouped, items });
  } catch (error_: unknown) {
    // fallback to dev store on error
    // eslint-disable-next-line no-console
    console.debug("DB fetch failed, falling back to dev store", error_);
    try {
      const list = await dev.listMemories();
      return NextResponse.json({ grouped: makeGrouped(list), items: list });
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message || "Failed to fetch memories" },
        { status: 500 }
      );
    }
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const { title, content, category, tags } = body || {};

    // B2C app: ignore teamId, use user context only
    // allow dev fallback via env or on DB errors
    if (process.env.USE_LOCAL_MEMORIES === "1") {
      const mem = await dev.createMemory({
        userId: user.id,
        title: title || null,
        content: content || "",
        category: category || "general",
        tags: Array.isArray(tags) ? tags.slice(0, 3) : [],
      });
      return NextResponse.json({ memory: mem });
    }

    try {
      const [row] = await db
        .insert(memories)
        .values({
          userId: user.id,
          title: title || null,
          content: content || "",
          category: category || "general",
          tags: tags ? JSON.stringify(tags.slice(0, 3)) : JSON.stringify([]),
        })
        .returning();

      return NextResponse.json({ memory: row });
    } catch (error_: unknown) {
      // fallback to local dev store (log for debugging)
      // eslint-disable-next-line no-console
      console.debug("DB insert failed, falling back to dev store", error_);
      const mem = await dev.createMemory({
        userId: user.id,
        title: title || null,
        content: content || "",
        category: category || "general",
        tags: Array.isArray(tags) ? tags.slice(0, 3) : [],
      });
      return NextResponse.json({ memory: mem });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create memory" },
      { status: 500 }
    );
  }
}
