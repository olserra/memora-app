import { verifyToken } from "@/lib/auth/session";
import { and, desc, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { client, db } from "./drizzle";
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

/**
 * Retrieve nearest memories for a given user by vector similarity using the
 * low-level `client.unsafe` call. This centralizes the retrieval logic used
 * by the chat handler and scripts. Returns an array of rows with at least
 * { id, content, user_id, distance } fields when embedding exists.
 */
export async function getNearestMemoriesForUser(
  userId: number,
  vec: number[],
  limit = 10
) {
  if (!vec || vec.length === 0) return [];
  const vecStr = "[" + vec.join(",") + "]";

  const sql = `SELECT id, content, user_id, category, tags,
               1 - (embedding <=> $1::vector) AS distance
               FROM memories
               WHERE user_id = $2 AND embedding IS NOT NULL
               ORDER BY embedding <=> $1::vector
               LIMIT $3`;

  const rows = await client.unsafe(sql, [vecStr, userId, limit]);

  return (rows as any[]).filter((r: any) => r.distance > 0.65);
}

export async function getUser() {
  const sessionCookie = (await cookies()).get("session");
  if (!sessionCookie?.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (!sessionData?.user || typeof sessionData.user.id !== "number") {
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
