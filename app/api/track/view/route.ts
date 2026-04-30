import { type NextRequest } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const listingId = String(body.listingId ?? "");
  const sessionId = String(body.sessionId ?? "");
  const userId    = body.userId ? String(body.userId) : null;

  if (!listingId || !sessionId) {
    return Response.json({ error: "listingId and sessionId required" }, { status: 400 });
  }

  // ON CONFLICT (listing_id, session_id) DO NOTHING — enforced by the DB unique index.
  // data is non-empty if a row was inserted; empty array if the conflict was hit.
  const { data, error } = await supabaseServer
    .from("listing_views")
    .upsert(
      { listing_id: listingId, session_id: sessionId, user_id: userId },
      { onConflict: "listing_id,session_id", ignoreDuplicates: true }
    )
    .select("id");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!Array.isArray(data) || data.length === 0) {
    return Response.json({ recorded: false });
  }

  await supabaseServer.rpc("increment_listing_view", { p_listing_id: listingId });

  return Response.json({ recorded: true });
}
