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

  const listing = getListingById(listingId);
  if (!listing) {
    return Response.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.type !== "auction") {
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
