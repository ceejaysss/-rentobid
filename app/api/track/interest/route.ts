import { type NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";
import { TRACKING_CONFIG, type InterestAction } from "../../../lib/tracking";

const VALID_ACTIONS = new Set<InterestAction>([
  "offer_sent",
  "contact_clicked",
  "bid_attempt",
  "buy_credits",
]);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const listingId  = String(body.listingId  ?? "");
  const sessionId  = String(body.sessionId  ?? "");
  const action     = String(body.action     ?? "") as InterestAction;
  const userId     = body.userId   ? String(body.userId) : null;
  const metadata   = body.metadata ?? null;

  if (!listingId || !sessionId) {
    return Response.json({ error: "listingId and sessionId required" }, { status: 400 });
  }
  if (!VALID_ACTIONS.has(action)) {
    return Response.json({ error: "invalid action_type" }, { status: 400 });
  }

  const cutoff = new Date(
    Date.now() - TRACKING_CONFIG.INTEREST_DEDUP_HOURS * 60 * 60 * 1000
  ).toISOString();

  // Dedup: skip if this session already logged this action for this listing in the window
  const { data: recent } = await supabaseServer
    .from("listing_interest")
    .select("id")
    .eq("listing_id", listingId)
    .eq("session_id", sessionId)
    .eq("action_type", action)
    .gte("created_at", cutoff)
    .limit(1)
    .maybeSingle();

  if (recent) {
    return Response.json({ recorded: false });
  }

  const { error: insertError } = await supabaseServer
    .from("listing_interest")
    .insert({
      listing_id:  listingId,
      session_id:  sessionId,
      user_id:     userId,
      action_type: action,
      metadata:    metadata,
    });

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  await supabaseServer.rpc("increment_listing_interest", { p_listing_id: listingId });

  return Response.json({ recorded: true });
}
