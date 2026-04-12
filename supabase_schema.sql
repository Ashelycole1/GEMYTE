-- ============================================================
-- GEMYTE — Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. document_chunks — text + embeddings from uploaded syllabi
CREATE TABLE IF NOT EXISTS document_chunks (
  id           BIGSERIAL PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  content      TEXT NOT NULL,
  embedding    VECTOR(768),
  source       TEXT,
  metadata     JSONB,
  user_id      TEXT
);

-- 3. knowledge_orbs — one row per uploaded doc, drives 3D orb rendering
CREATE TABLE IF NOT EXISTS knowledge_orbs (
  id           BIGSERIAL PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  title        TEXT NOT NULL,
  source       TEXT,
  color        TEXT DEFAULT '#3b82f6',
  user_id      TEXT NOT NULL
);

-- 4. user_profiles — XP and display info (keyed by Clerk user_id)
CREATE TABLE IF NOT EXISTS user_profiles (
  id           BIGSERIAL PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  user_id      TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url   TEXT,
  xp           INTEGER DEFAULT 0
);

-- 5. interactions — audit log of AI queries and uploads (used for XP)
CREATE TABLE IF NOT EXISTS interactions (
  id           BIGSERIAL PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  user_id      TEXT NOT NULL,
  type         TEXT,
  xp_awarded   INTEGER DEFAULT 0
);

-- 6. pgvector similarity search RPC
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count     INT
)
RETURNS TABLE (
  id         BIGINT,
  content    TEXT,
  source     TEXT,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    document_chunks.id,
    document_chunks.content,
    document_chunks.source,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- 7. increment_xp RPC
CREATE OR REPLACE FUNCTION increment_xp(user_id_param TEXT, xp_amount INT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE user_profiles
  SET xp = xp + xp_amount
  WHERE user_id = user_id_param;
END;
$$;

-- 7. Index for fast vector search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
