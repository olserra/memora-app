import postgres from 'postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

const client = postgres(process.env.DATABASE_URL!);

try {
  await client`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`;
  console.log('Migration applied successfully');
} catch (error) {
  console.error('Migration failed:', error);
} finally {
  await client.end();
}