import { db } from "@/lib/db/drizzle";
import { getTeamForUser, getUser } from "@/lib/db/queries";
import { memories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const id = Number(params.id);
    const body = await req.json();
    const { title, content, category, tags } = body || {};

    await getTeamForUser();

    const [updated] = await db
      .update(memories)
      .set({
        title: title ?? null,
        content: content ?? "",
        category: category ?? "general",
        tags: tags ? JSON.stringify(tags.slice(0, 3)) : JSON.stringify([]),
      })
      .where(eq(memories.id, id))
      .returning();

    return NextResponse.json({ memory: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update memory" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const id = Number(params.id);
    await db.delete(memories).where(eq(memories.id, id));

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete memory" },
      { status: 500 }
    );
  }
}
