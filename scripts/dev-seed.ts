import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  const src = path.join(process.cwd(), "lib", "devMemoriesSeed.json");
  const dest = path.join(process.cwd(), "dev-memories.json");
  const raw = await fs.readFile(src, "utf8");
  await fs.writeFile(dest, raw, "utf8");
  console.log("dev-memories.json seeded from lib/devMemoriesSeed.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
