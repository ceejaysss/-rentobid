-- Migration: demand signals tracking
-- Tables: listing_views, listing_interest, listing_stats
-- Run in Supabase SQL editor

-- ── Raw view events ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS listing_views (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id  TEXT        NOT NULL,
  session_id  TEXT        NOT NULL,
  user_id     TEXT,                           -- NULL = anonymous
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dedup check: is there a recent view from this session for this listing?
CREATE INDEX IF NOT EXISTS idx_listing_views_dedup
  ON listing_views (listing_id, session_id, created_at DESC);

-- Cleanup job support: delete rows older than 90 days
CREATE INDEX IF NOT EXISTS idx_listing_views_cleanup
  ON listing_views (created_at);

-- ── Interest / intent events ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS listing_interest (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id  TEXT        NOT NULL,
  session_id  TEXT        NOT NULL,
  user_id     TEXT,                           -- NULL = anonymous
  action_type TEXT        NOT NULL,           -- 'offer_sent' | 'contact_clicked' | 'bid_attempt' | ...
  metadata    JSONB,                          -- extensible: { offer_amount, duration_seconds, ... }
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dedup check: recent action from this session for this listing + action type
CREATE INDEX IF NOT EXISTS idx_listing_interest_dedup
  ON listing_interest (listing_id, session_id, action_type, created_at DESC);

-- Funnel queries: conversion by listing + action
CREATE INDEX IF NOT EXISTS idx_listing_interest_funnel
  ON listing_interest (listing_id, action_type);

-- ── Denormalized counters (O(1) reads) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS listing_stats (
  listing_id      TEXT        NOT NULL PRIMARY KEY,
  views_today     INTEGER     NOT NULL DEFAULT 0,
  views_total     INTEGER     NOT NULL DEFAULT 0,
  interest_count  INTEGER     NOT NULL DEFAULT 0,
  last_reset_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Atomic increment functions ────────────────────────────────────────────────
-- Using INSERT ... ON CONFLICT to avoid read-then-write race conditions.
-- CURRENT_DATE comparison handles the lazy daily reset of views_today.

CREATE OR REPLACE FUNCTION increment_listing_view(p_listing_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO listing_stats (listing_id, views_today, views_total, last_reset_at, updated_at)
    VALUES (p_listing_id, 1, 1, NOW(), NOW())
  ON CONFLICT (listing_id) DO UPDATE SET
    views_today   = CASE
                      WHEN listing_stats.last_reset_at::date < CURRENT_DATE THEN 1
                      ELSE listing_stats.views_today + 1
                    END,
    views_total   = listing_stats.views_total + 1,
    last_reset_at = CASE
                      WHEN listing_stats.last_reset_at::date < CURRENT_DATE THEN NOW()
                      ELSE listing_stats.last_reset_at
                    END,
    updated_at    = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION increment_listing_interest(p_listing_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO listing_stats (listing_id, interest_count, updated_at)
    VALUES (p_listing_id, 1, NOW())
  ON CONFLICT (listing_id) DO UPDATE SET
    interest_count = listing_stats.interest_count + 1,
    updated_at     = NOW();
END;
$$;

-- ── RLS ───────────────────────────────────────────────────────────────────────
-- API routes use the service-role key (bypasses RLS).
-- These policies are defense-in-depth against direct anon client access.

ALTER TABLE listing_views    ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_stats    ENABLE ROW LEVEL SECURITY;

-- listing_stats: public reads (counts are intentionally visible)
CREATE POLICY "public_read_stats"
  ON listing_stats FOR SELECT USING (true);

-- listing_views + listing_interest: no direct client reads or writes
-- (default deny — no permissive policies)

-- ── Cleanup note ──────────────────────────────────────────────────────────────
-- Run periodically to keep listing_views bounded:
-- DELETE FROM listing_views WHERE created_at < NOW() - INTERVAL '90 days';
-- DELETE FROM listing_interest WHERE created_at < NOW() - INTERVAL '90 days';
