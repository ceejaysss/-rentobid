import { createClient } from "@supabase/supabase-js";

/*
 Run once in the Supabase dashboard (SQL editor):

 CREATE TABLE IF NOT EXISTS user_credits (
   user_id    TEXT        PRIMARY KEY,
   credits    INTEGER     NOT NULL DEFAULT 0,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );
 ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
*/

// Service role key bypasses RLS. Import only in server-side code (API routes).
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
