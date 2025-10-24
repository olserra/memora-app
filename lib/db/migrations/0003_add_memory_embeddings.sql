-- Migration: add pgvector extension and embedding column for memories
-- Creates the vector extension if not present and adds an `embedding` column
-- to the existing `memories` table. This uses 384 dimensions (recommended for
-- sentence-transformers/all-MiniLM-L6-v2). Adjust the dimension if you pick
-- a different embedding model.

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE IF EXISTS memories
  ADD COLUMN IF NOT EXISTS embedding vector(384);
