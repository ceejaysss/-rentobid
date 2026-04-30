// ── Config ────────────────────────────────────────────────────────────────────
// All tuneable values live here. No hardcoded numbers elsewhere.

export const TRACKING_CONFIG = {
  VIEW_DEDUP_MINUTES:      30,
  INTEREST_DEDUP_HOURS:    24,
  SESSION_KEY:             "rtb_sid",
  USERNAME_KEY:            "rtb_username",
} as const;

// ── Identity ──────────────────────────────────────────────────────────────────

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let sid = localStorage.getItem(TRACKING_CONFIG.SESSION_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem(TRACKING_CONFIG.SESSION_KEY, sid);
    }
    return sid;
  } catch {
    // localStorage unavailable (e.g. private browsing strict mode)
    // Ephemeral fallback: tracking degrades to best-effort, page still renders
    return "anon-" + crypto.randomUUID();
  }
}

export function getUserId(): string | null {
  // No Supabase Auth in this app yet — all users are anonymous.
  // Wire this to supabase.auth.getUser() once auth is added.
  return null;
}

// ── Tracking calls ────────────────────────────────────────────────────────────
// Both are fire-and-forget. Errors are swallowed — tracking must never
// affect page render or user-facing behaviour.

export async function trackListingView(listingId: string): Promise<void> {
  const sessionId = getOrCreateSessionId();
  if (!sessionId) return;
  const userId = getUserId();
  try {
    await fetch("/api/track/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, sessionId, userId }),
      keepalive: true,
    });
  } catch {
    // non-fatal
  }
}

export type InterestAction = "offer_sent" | "contact_clicked" | "bid_attempt" | "buy_credits";

export async function trackListingInterest(
  listingId: string,
  action: InterestAction,
  metadata?: Record<string, unknown>
): Promise<void> {
  const sessionId = getOrCreateSessionId();
  if (!sessionId) return;
  const userId = getUserId();
  try {
    await fetch("/api/track/interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, sessionId, userId, action, metadata }),
      keepalive: true,
    });
  } catch {
    // non-fatal
  }
}
