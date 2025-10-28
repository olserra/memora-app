import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local" });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function applyMigration() {
  try {
    await client.connect();
    await client.query(
      "ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL"
    );
    console.log("Migration applied successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.end();
  }
}

applyMigration();
