import { client } from './lib/db/drizzle.js';

async function checkMemories() {
  try {
    const rows = await client.unsafe('SELECT id, title, content, embedding FROM memories WHERE user_id = 1 LIMIT 5');
    console.log('Memories for user 1:', rows);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMemories();
