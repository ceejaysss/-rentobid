-- Patch: enforce 30-minute dedup on listing_views at the DB level.
-- Run in Supabase SQL editor after 001_demand_signals.sql.

-- Add a generated column: floor(epoch_seconds / 1800) gives a unique integer
-- per 30-minute window. Same session + same listing + same bucket = duplicate.
ALTER TABLE listing_views
  ADD COLUMN IF NOT EXISTS time_bucket BIGINT
    GENERATED ALWAYS AS (floor(extract(epoch from created_at) / 1800)::BIGINT) STORED;

-- Unique constraint: at most one view per (session, listing, 30-min window).
-- Any concurrent insert that races past the application-layer check will be
-- rejected here with error code 23505 (unique_violation).
CREATE UNIQUE INDEX IF NOT EXISTS uq_listing_views_session_bucket
  ON listing_views (listing_id, session_id, time_bucket);
