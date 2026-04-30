import { type NextRequest } from "next/server";
import { supabaseServer } from "../../lib/supabase-server";
import { DEMAND_THRESHOLDS } from "../../hooks/useDemandSignals";

export async function GET(request: NextRequest) {
  const listingId = request.nextUrl.searchParams.get("listingId");

  if (!listingId) {
    return Response.json({ error: "listingId required" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("listing_stats")
    .select("views_today, interest_count")
    .eq("listing_id", listingId)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const views      = data?.views_today    ?? 0;
  const interested = data?.interest_count ?? 0;
  const isHigh     = views >= DEMAND_THRESHOLDS.HIGH_VIEWS_TODAY ||
                     interested >= DEMAND_THRESHOLDS.HIGH_INTEREST;

  return Response.json({ views, interested, isHigh });
}
