-- Maps static listing IDs to Supabase auth user IDs.
-- Populate manually: INSERT INTO listing_owners (listing_id, user_id) VALUES ('2', auth.uid());
CREATE TABLE IF NOT EXISTS listing_owners (
  listing_id  TEXT        NOT NULL,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (listing_id)
);

ALTER TABLE listing_owners ENABLE ROW LEVEL SECURITY;

-- Owners can read their own rows; service role handles writes
CREATE POLICY "Owners can read their own listings"
  ON listing_owners FOR SELECT
  USING (auth.uid() = user_id);
