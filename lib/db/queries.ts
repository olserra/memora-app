import { verifyToken } from "@/lib/auth/session";
import { and, desc, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "./drizzle";
import { activityLogs, memories, users } from "./schema";

export async function getMemoriesGrouped() {
  const user = await getUser();
  if (!user) throw new Error("User not authenticated");

  // B2C: fetch memories belonging to the authenticated user
  const rows = await db
    .select()
    .from(memories)
    .where(eq(memories.userId, user.id))
    .orderBy(desc(memories.createdAt));

  const grouped: Record<string, any[]> = {};
  for (const r of rows) {
    const cat = r.category || "general";
    const item = {
      ...r,
      tags: r.tags ? JSON.parse(r.tags as unknown as string) : [],
    };
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  return grouped;
}

export async function getUser() {
  const sessionCookie = (await cookies()).get("session");
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== "number"
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

// Team-related functions removed for B2C refactor. If needed later, reintroduce
// user-scoped subscription helpers.

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }
  // Teams were removed in the B2C migration. Return null for compatibility.
  return null;
}
