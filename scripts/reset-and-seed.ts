import dotenv from "dotenv";
import { db } from "../lib/db/drizzle";
import { memories, users } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/auth/session";

dotenv.config();

async function run() {
  const email = "olserra@gmail.com";

  // ensure user exists
  let userRes = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let user;
  if (userRes.length === 0) {
    const passwordHash = await hashPassword("changeme");
    const [created] = await db.insert(users).values({
      name: "Otávio",
      email,
      passwordHash,
      role: "member",
    }).returning();
    user = created;
    console.log("Created user", email);
  } else {
    user = userRes[0];
  }

  // Truncate memories table (fast and ensures clean state)
  try {
    // ensure old team_id column is removed (some DBs may still have it)
    try {
      await db.execute('ALTER TABLE "memories" DROP COLUMN IF EXISTS team_id');
      console.log('Dropped team_id column from memories (if it existed).');
    } catch (e) {
      console.debug('Failed to drop team_id column (non-fatal)', e);
    }

    await db.execute('TRUNCATE TABLE "memories" RESTART IDENTITY CASCADE');
    console.log("Truncated memories table.");
  } catch (e) {
    // fallback: delete all rows
    console.debug("TRUNCATE failed, falling back to delete", e);
    await db.delete(memories);
  }

  // load seed data from lib/devMemoriesSeed.json
  // use dynamic import to respect ESM
  try {
    // path relative to project root
    // @ts-ignore
    const raw = await import("../lib/devMemoriesSeed.json");
    const data = raw.default || raw;
    if (Array.isArray(data) && data.length > 0) {
      for (const m of data) {
        await db.insert(memories).values({
          userId: user.id,
          title: m.title || null,
          content: m.content || "",
          tags: JSON.stringify(m.tags || []),
          category: m.category || "general",
        });
      }
      console.log(`Inserted ${data.length} memories for ${email}`);
    } else {
      console.log("No seed data found in lib/devMemoriesSeed.json");
    }
  } catch (e) {
    console.error("Failed to load seed file:", e);
    process.exit(1);
  }
}

try {
  await run();
  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}
