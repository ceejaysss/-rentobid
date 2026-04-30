CREATE TABLE IF NOT EXISTS listing_upgrade_requests (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  TEXT        NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE listing_upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Service role only; no direct client access
CREATE POLICY "No direct access" ON listing_upgrade_requests FOR ALL USING (false);
