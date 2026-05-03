import { type NextRequest } from "next/server";
import { getListingById } from "../../data/listings";
import { supabaseServer } from "../../lib/supabase-server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const listingId = String(body.listingId ?? "");
  const amount = Number(body.amount);

  if (!listingId || isNaN(amount) || amount <= 0) {
    return Response.json({ error: "listingId and amount required" }, { status: 400 });
  }

  // Resolve listing: Supabase first (real UUID listings), then static mock data
  let isAuction = false;
  let found = false;

  const { data: row } = await supabaseServer
    .from("listings")
    .select("auction_end_time")
    .eq("id", listingId)
    .maybeSingle();

  if (row) {
    found = true;
    const endsAt = row.auction_end_time ? new Date(row.auction_end_time) : null;
    isAuction = !!endsAt && endsAt > new Date();
  } else {
    const staticListing = getListingById(listingId);
    if (staticListing) {
      found = true;
      isAuction = staticListing.type === "auction";
    }
  }

  if (!found) {
    return Response.json({ error: "Listing not found" }, { status: 404 });
  }

  if (!isAuction) {
    return Response.json(
      { error: "Bidding is not allowed on fixed-price listings" },
      { status: 403 }
    );
  }

  const { data, error } = await supabaseServer
    .from("bids")
    .insert([{ listing_id: listingId, amount }])
    .select()
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "No data returned" }, { status: 500 });

  return Response.json({
    bid: {
      id: data.id,
      listingId: data.listing_id,
      amount: data.amount,
      createdAt: data.created_at,
    },
  });
}
