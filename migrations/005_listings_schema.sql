-- Add columns that the UI needs but the base schema is missing
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location      TEXT         NOT NULL DEFAULT 'Location TBD';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS category      TEXT         NOT NULL DEFAULT 'Home';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS image_url     TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rating        NUMERIC(3,2) NOT NULL DEFAULT 4.80;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS review_count  INTEGER      NOT NULL DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS bids_count    INTEGER      NOT NULL DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS host          TEXT;

-- Public read on active listings
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'listings' AND policyname = 'Anyone can view active listings'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can view active listings"
      ON listings FOR SELECT USING (status = ''active'')';
  END IF;
END $$;

-- Insert 3 sample rows only when the table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM listings LIMIT 1) THEN
    INSERT INTO listings
      (title, description, location, category, image_url,
       price_base, current_bid, auction_end_time, status,
       rating, review_count, bids_count, host)
    VALUES
      (
        'Modern Loft in SoHo',
        'A stunning open-plan loft in the heart of SoHo. Soaring 14-foot ceilings, exposed brick, and floor-to-ceiling windows flood the space with natural light.',
        'New York City, NY', 'Home',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
        3500, 4200, NOW() + INTERVAL '2 hours 14 minutes', 'active',
        4.97, 142, 18, 'Marcus J.'
      ),
      (
        'Pacific Heights Victorian',
        'An immaculately restored Victorian in one of San Francisco''s most sought-after neighborhoods. Original hardwood floors, ornate crown moldings, and a private garden.',
        'San Francisco, CA', 'Home',
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
        5800, NULL, NULL, 'active',
        4.89, 98, 0, 'Claire R.'
      ),
      (
        'Tesla Model S Plaid',
        'The fastest production car ever built. 1,020 hp, 0-60 in 1.99 seconds. Tri-motor all-wheel drive, 396-mile range.',
        'Los Angeles, CA', 'Car',
        'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&q=80',
        800, 1100, NOW() + INTERVAL '45 minutes', 'active',
        4.95, 67, 24, 'Devon C.'
      );
  END IF;
END $$;
