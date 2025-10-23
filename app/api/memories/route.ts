import { getMemoriesGrouped } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const grouped = await getMemoriesGrouped();
    return NextResponse.json({ grouped });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch memories" },
      { status: 500 }
    );
  }
}
