# Frontend — How Memories & Tags Work

This document explains how the frontend currently handles memories and tags, where to find the relevant components, the data shapes expected by the API, and integration notes for the backend team. Use this as the source-of-truth when integrating the frontend with a backend agent.

## High-level overview

- The frontend is a Next.js app (app router) with a simple client-side UI for viewing, creating, editing, and deleting "memories".
- Main UI pieces:
  - `components/dashboard/MemoriesPanel.tsx` — the list/grid view, search, tag filters, and opens the editor.
  - `components/dashboard/MemoryEditor.tsx` — modal editor that creates/edits/deletes memories.
  - `app/(dashboard)/dashboard/memories/page.tsx` — page that mounts `MemoriesPanel`.
- Data is fetched from REST endpoints under `/api/memories`. The chat endpoint (`/api/llm/chat`) can also create memories server-side based on LLM output (see below).

## Files to look at (quick links)

- Frontend components:
  - `components/dashboard/MemoriesPanel.tsx`
  - `components/dashboard/MemoryEditor.tsx`
- Server-side API routes that the frontend calls:
  - `app/api/memories/route.ts` (POST and GET)
  - `app/api/memories/[id]/route.ts` (PUT, DELETE)
  - `app/api/llm/chat/route.ts` (chat endpoint; also extracts and persists memories when LLM emits memory markers)
- DB schema (server-side): `lib/db/schema.ts` — shows memories table and tags storage.
- Dev-mode fallback storage: `lib/devMemories.ts` (file-based JSON store used when `USE_LOCAL_MEMORIES=1`).

## UI behavior & client-side contract

### MemoryEditor (create / update / delete)

- Location: `components/dashboard/MemoryEditor.tsx`.
- Inputs:
  - `content` (string) — the memory text the user wants to save.
  - `tagsStr` (string) — comma-separated tags typed by the user (example: "work, ideas, personal").
- Client-side processing:
  - Tags are split by comma, trimmed, filtered, and limited to the first 3 tags.
  - When saving:
    - If editing an existing memory (has `id`) the editor sends PUT to `/api/memories/:id` with JSON body `{ content, tags }` (tags is an array of strings).
    - If creating a new memory the editor sends POST to `/api/memories` with JSON body `{ content, tags }`.
  - When deleting, the editor calls DELETE `/api/memories/:id`.
- UX constraints enforced in the editor:
  - Max 3 tags.
  - A preview of up to the first 3 tags is shown.
  - Keyboard shortcuts: Esc to close, Cmd/Ctrl+Enter to save.

### MemoriesPanel (list & filter)

- Location: `components/dashboard/MemoriesPanel.tsx`.
- Fetching: Uses `useSWR('/api/memories')`.
- Expected GET response shape (from API): { grouped: Record<string, Memory[]>, items: Memory[] }
  - `items` is used to populate the UI grid/list.
  - `grouped` is available for server-side grouping if needed.
- Memory objects used by UI include at least:
  - `id` (number)
  - `content` (string)
  - `tags` (string[]) — note: the frontend expects an array of strings already parsed (server parses JSON tags before returning)
  - `category` (string)
  - `createdAt` / `created_at` (string/date)
- Tag-filtering: the UI builds a unique tag list from `items` by extracting `m.tags || []` for each memory.
- Searching: filters by title/content/tags (client-side).

## Server API contract (what frontend expects)

### GET /api/memories

- Purpose: return a list of memories for the authenticated user.
- Expected response (JSON):
  - `{ grouped: { [category]: Memory[] }, items: Memory[] }`
  - Important: `Memory.tags` must be an array (server currently parses JSON-encoded tags into an array before returning).

### POST /api/memories

- Purpose: create a new memory.
- Request payload (JSON):
  - `{ content: string, category?: string, tags?: string[] }`
  - `tags` should be an array; the frontend sends up to 3 tags.
- Response: `{ memory: Memory }` where Memory is the newly created row.
- Embeddings: If server env vars for embeddings are configured (EMBEDDING_API_URL / EMBEDDING_API_KEY), the server will attempt to call the embedding endpoint and then store the vector in the DB `embedding` column (vector type). This is optional and non-fatal if embedding fails.

### PUT /api/memories/:id

- Purpose: update a memory.
- Request payload (JSON): `{ content: string, category?: string, tags?: string[] }`.
- Response: `{ memory: Memory }`.

### DELETE /api/memories/:id

- Purpose: delete a memory.
- Response: `{ ok: true }` on success.

## How tags are stored in the DB

- In the SQL schema (`lib/db/schema.ts`) tags are stored as `text('tags')` (a text column).
- The server code serializes tags via `JSON.stringify(tags)` when inserting/updating the DB.
- When retrieving rows in server-side queries (`getMemoriesGrouped()` in `lib/db/queries.ts`), the server parses `r.tags` with `JSON.parse(r.tags)` and returns an array to the frontend.

Implication for backend integrations: if you write records directly into the DB, store `tags` as a JSON-encoded string (e.g. `'["work","ideas"]'`) so existing code reads them properly. If you provide a backend API to create memories, accept `tags` as an array and write JSON-encoded text to the `tags` column.

## Memory creation from the chat LLM (server-side)

- Endpoint: `app/api/llm/chat/route.ts` (server-side).
- Flow:
  1. Incoming chat message is embedded (if embedding service configured) and used for vector search to retrieve relevant memories.
  2. The server builds a prompt including retrieved memories and asks the configured LLM for a response.
  3. The LLM is instructed to include memory markers in this exact format when it decides a memory should be saved:
     - `[MEMORY: <content> | tag1, tag2, tag3]` (tags optional but recommended). Example:
       - `Memora: "Great — I'll remember that. [MEMORY: User likes pasta | food, preference, italian]"`
  4. The server scans the LLM output using the regex `/\[MEMORY:\s*(.*?)\s*\|\s*(.*?)\]/g` to extract memory content and tags.
  5. Before saving a memory:
     - The server optionaly computes an embedding for the new memory content and checks for duplicates via `getNearestMemoriesForUser`. If the nearest memory is too similar (distance < 0.15), it will skip saving.
     - It requires memory content length >= 10 characters before saving.
     - Tags are parsed, trimmed, and limited to 3.
  6. If saved to DB, server stores tags as `JSON.stringify(tags)` and will attempt to persist the embedding.
  7. The server removes the memory markers from the final output before returning the assistant reply to the client.

Notes for backend integration: if your backend agent will act as the LLM or will pre-process LLM output, follow the same marker syntax so the server-side chat handler can detect and persist memories consistently. Alternatively, the backend can call the memories API directly with the same JSON shape `{ content, tags }`.

## Dev-mode fallback

- If `USE_LOCAL_MEMORIES=1` (environment variable), the server uses a local JSON file store (`dev-memories.json`) via `lib/devMemories.ts` instead of the database. This is helpful for local testing without a database.
- `lib/devMemories.ts` enforces the same rules as the API (tags limit to 3, categories, etc.).

## Edge cases & constraints (important)

- Tags: limited to the first 3 tags everywhere (client and server enforce this).
- Tag format: tags are plain strings; currently there is no dedicated tag table — tags are stored as JSON on each memory row.
- Minimum memory length for server-side LLM-saved memories: server requires >= 10 characters.
- Duplicate detection: server uses vector similarity to skip near-duplicates (threshold ~0.15). If embeddings are not available, duplicate detection is not performed.
- Auth: API endpoints require an authenticated user session (`getUser()`), so calls from the frontend rely on cookies/session.

## Example requests/responses

- Create memory (client → server):
  POST /api/memories
  Request body:

  ```json
  {
    "content": "I love hiking in the Blue Ridge mountains.",
    "tags": ["hiking", "travel"]
  }
  ```

  Successful response:

  ```json
  {
    "memory": {
      "id": 123,
      "userId": 1,
      "content": "I love hiking in the Blue Ridge mountains.",
      "tags": ["hiking", "travel"],
      "category": "general",
      "createdAt": "2025-10-29T12:34:56.789Z"
    }
  }
  ```

- GET memories (client):
  GET /api/memories
  Response:

  ```json
  {
    "grouped": {
      "general": [
        /* memory objects */
      ]
    },
    "items": [
      /* flat array of memory objects (tags as arrays) */
    ]
  }
  ```

- LLM memory marker example (server-side):
  - LLM output: "Nice! [MEMORY: User likes pasta | food, preference, italian]"
  - Server extracts and saves a memory with content `User likes pasta` and tags `['food','preference','italian']` (trimmed, max 3).

## Integration checklist for backend agent

- Ensure your agent/endpoint uses the same memory shape when creating memories (POST `/api/memories` with `{ content, tags }`).
- If writing to DB directly, store `tags` as a JSON string (`JSON.stringify(tags)`), and ensure timestamps/IDs are consistent with the `memories` table definition in `lib/db/schema.ts`.
- If your agent will emit LLM outputs with memory markers, use the exact marker format `[MEMORY: <content> | tag1, tag2]` to allow the server's chat handler to detect and persist them.
- If you plan to rely on embeddings for deduplication or vector search, ensure embedding/vector storage is compatible with the current approach (the code expects a `vector`-type column named `embedding` and uses `embedding <=> $1::vector`).

## Where to modify if you need changes

- To change tag limits or parsing: edit `components/dashboard/MemoryEditor.tsx` (client-side) and `/app/api/memories` + `/app/api/memories/[id]` (server-side) to keep behavior consistent.
- To change the LLM marker protocol: edit `app/api/llm/chat/route.ts` regex and prompt system message. Keep frontend unaffected but coordinate with backend LLM agent.

## Final notes

- There is already an internal doc `/.github/instructions/memory.md` describing the memory extraction rules and examples; this frontend doc focuses on how the UI interacts with the backend and storage conventions. Share both with your backend co-founder so your agents agree on the marker format, request shapes, and embedding expectations.

If you'd like, I can also create a short Postman/cURL collection with sample requests or add a tiny OpenAPI fragment that describes the memory endpoints for the backend team. Let me know which you'd prefer.
