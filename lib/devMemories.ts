import fs from "node:fs/promises";
import path from "node:path";

const STORAGE = path.join(process.cwd(), "dev-memories.json");

type Memory = {
  id: number;
  userId: number;
  content: string;
  tags: string[];
  category: string;
  createdAt: string;
};

async function readAll(): Promise<Memory[]> {
  try {
    const raw = await fs.readFile(STORAGE, "utf8");
    return JSON.parse(raw) as Memory[];
  } catch (error_: unknown) {
    // eslint-disable-next-line no-console
    console.debug("devMemories: readAll failed, returning empty list", error_);
    return [];
  }
}

async function writeAll(items: Memory[]) {
  await fs.writeFile(STORAGE, JSON.stringify(items, null, 2), "utf8");
}

export async function listMemories(): Promise<Memory[]> {
  const items = await readAll();
  // sort by createdAt desc
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return items;
}

export async function getMemory(id: number): Promise<Memory | null> {
  const items = await readAll();
  return items.find((i) => i.id === id) ?? null;
}

export async function createMemory(data: Partial<Memory>): Promise<Memory> {
  const items = await readAll();
  const id = items.length === 0 ? 1 : Math.max(...items.map((i) => i.id)) + 1;
  const now = new Date().toISOString();
  const mem: Memory = {
    id,
    userId: data.userId ?? 1,
    content: data.content ?? "",
    tags: Array.isArray(data.tags) ? data.tags.slice(0, 3) : [],
    category: data.category ?? "general",
    createdAt: now,
  };
  items.push(mem);
  await writeAll(items);
  return mem;
}

export async function updateMemory(
  id: number,
  data: Partial<Memory>
): Promise<Memory | null> {
  const items = await readAll();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  const existing = items[idx];
  const updated: Memory = {
    ...existing,
    content: data.content ?? existing.content,
    tags: Array.isArray(data.tags) ? data.tags.slice(0, 3) : existing.tags,
    category: data.category ?? existing.category,
  };
  items[idx] = updated;
  await writeAll(items);
  return updated;
}

export async function deleteMemory(id: number): Promise<boolean> {
  const items = await readAll();
  const newItems = items.filter((i) => i.id !== id);
  if (newItems.length === items.length) return false;
  await writeAll(newItems);
  return true;
}

export async function clearAll() {
  await writeAll([]);
}

// DevMemory alias intentionally removed; use Memory type
