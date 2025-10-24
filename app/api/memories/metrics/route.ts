import { getMemoriesGrouped, getUser } from "@/lib/db/queries";
import * as dev from "@/lib/devMemories";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let memoriesList: any[] = [];

    if (process.env.USE_LOCAL_MEMORIES === "1") {
      memoriesList = await dev.listMemories();
    } else {
      const grouped = await getMemoriesGrouped();
      for (const cat in grouped) {
        memoriesList.push(...grouped[cat]);
      }
    }

    // Calculate metrics
    const totalMemories = memoriesList.length;

    const memoriesByCategory: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    const memoriesOverTime: Record<string, number> = {};
    let totalContentLength = 0;

    for (const memory of memoriesList) {
      // Category
      const category = memory.category || "general";
      memoriesByCategory[category] = (memoriesByCategory[category] || 0) + 1;

      // Tags
      const tags = memory.tags || [];
      for (const tag of tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }

      // Content length
      totalContentLength += memory.content?.length || 0;

      // Over time (last 30 days)
      const createdAt = new Date(memory.createdAt);
      const now = new Date();
      const diffDays = Math.floor(
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays <= 30) {
        const dateKey = createdAt.toISOString().split("T")[0];
        memoriesOverTime[dateKey] = (memoriesOverTime[dateKey] || 0) + 1;
      }
    }

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    const memoriesOverTimeArray = Object.entries(memoriesOverTime)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const averageContentLength =
      totalMemories > 0 ? Math.round(totalContentLength / totalMemories) : 0;

    const metrics = {
      totalMemories,
      memoriesByCategory,
      topTags,
      memoriesOverTime: memoriesOverTimeArray,
      averageContentLength,
      totalTags: Object.keys(tagCounts).length,
    };

    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
