import { createBrowserClient } from "@supabase/ssr";

// Singleton browser client — safe to import in client components.
// Preserves existing `supabase` export used by BidPanel realtime subscriptions.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);