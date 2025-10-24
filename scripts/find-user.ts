import dotenv from "dotenv";
import { client } from "../lib/db/drizzle";

dotenv.config();

async function main() {
  const email = process.argv[2] || "olserra@gmail.com";
  try {
    const rows = await client.unsafe(
      "SELECT id, email FROM users WHERE email = $1 LIMIT 1",
      [email]
    );
    if (!rows || rows.length === 0) {
      console.log("User not found for email", email);
      process.exit(0);
    }
    console.log("Found user:", rows[0]);
  } catch (e) {
    console.error("DB query failed", e);
    process.exit(1);
  }
}

main();
