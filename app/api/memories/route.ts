import { getMemoriesGrouped, getUser, getTeamForUser } from "@/lib/db/queries";
import { db } from "@/lib/db/drizzle";
import { memories } from "@/lib/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const grouped = await getMemoriesGrouped();

    // build flat items list with parsed tags
    const items: any[] = [];
    for (const cat of Object.keys(grouped)) {
      for (const it of grouped[cat]) {
        items.push(it);
      }
    }

    return NextResponse.json({ grouped, items });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch memories" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const { title, content, category, tags } = body || {};

    const team = await getTeamForUser();
    const teamId = team?.id || 1;

    const [row] = await db.insert(memories).values({
      teamId,
      userId: user.id,
      title: title || null,
      content: content || "",
      category: category || "general",
      tags: tags ? JSON.stringify(tags.slice(0, 3)) : JSON.stringify([]),
    }).returning();

    return NextResponse.json({ memory: row });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create memory" }, { status: 500 });
  }
}
