import { db } from "@/lib/db/drizzle";
import { getUser } from "@/lib/db/queries";
import { memories } from "@/lib/db/schema";
import * as dev from "@/lib/devMemories";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: any) {
  try {
    const user = await getUser();
    if (!user)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const id = Number(params.id);
    const body = await req.json();
    const { content, category, tags } = body || {};

    // B2C app: don't require team membership; rely on user context
    if (process.env.USE_LOCAL_MEMORIES === "1") {
      const updated = await dev.updateMemory(id, {
        content: content ?? "",
        category: category ?? "general",
        tags: Array.isArray(tags) ? tags.slice(0, 3) : [],
      });

      if (!updated)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

      return NextResponse.json({ memory: updated });
    }

    try {
      const [updated] = await db
        .update(memories)
        .set({
          content: content ?? "",
          category: category ?? "general",
          tags: tags ? JSON.stringify(tags.slice(0, 3)) : JSON.stringify([]),
        })
        .where(eq(memories.id, id))
        .returning();

      return NextResponse.json({ memory: updated });
    } catch (error_: unknown) {
      // fallback to dev store (log error for debugging)
      // eslint-disable-next-line no-console
      console.debug("DB update failed, falling back to dev store", error_);
      const updated = await dev.updateMemory(id, {
        content: content ?? "",
        category: category ?? "general",
        tags: Array.isArray(tags) ? tags.slice(0, 3) : [],
      });

      if (!updated)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

      return NextResponse.json({ memory: updated });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update memory" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: any) {
  try {
    const user = await getUser();
    if (!user)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const id = Number(params.id);
    if (process.env.USE_LOCAL_MEMORIES === "1") {
      const ok = await dev.deleteMemory(id);
      return NextResponse.json({ ok });
    }

    try {
      await db.delete(memories).where(eq(memories.id, id));
      return NextResponse.json({ ok: true });
    } catch (error_: unknown) {
      // eslint-disable-next-line no-console
      console.debug("DB delete failed, falling back to dev store", error_);
      const ok = await dev.deleteMemory(id);
      return NextResponse.json({ ok });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete memory" },
      { status: 500 }
    );
  }
}
