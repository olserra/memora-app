import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { client } from "../lib/db/drizzle";

dotenv.config();

async function main() {
  const migrationsDir = path.join(process.cwd(), "lib/db/migrations");
  const files = await fs.readdir(migrationsDir);
  files.sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    if (!file.endsWith(".sql")) continue;
    console.log("Applying", file);
    const content = await fs.readFile(path.join(migrationsDir, file), "utf8");
    const parts = content.split("--> statement-breakpoint");
    for (const p of parts) {
      const stmt = p.trim();
      if (!stmt) continue;
      try {
        // client.unsafe allows executing raw SQL strings
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await client.unsafe(stmt);
      } catch (err) {
        console.error("Migration statement failed:", err);
      }
    }
  }

  console.log("Migrations finished");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
