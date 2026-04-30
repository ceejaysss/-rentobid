import { supabase } from "../lib/supabase";

export type Bid = {
  id: string;
  listingId: string;
  amount: number;
  createdAt: Date;
};

type BidRow = {
  id: string;
  listing_id: string;
  amount: number;
  created_at: string;
};

function rowToBid(row: BidRow): Bid {
  return {
    id: row.id,
    listingId: row.listing_id,
    amount: row.amount,
    createdAt: new Date(row.created_at),
  };
}

export async function getBidsByListingId(listingId: string): Promise<Bid[]> {
  const { data, error } = await supabase
    .from("bids")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToBid);
}

export async function getHighestBid(listingId: string): Promise<Bid | null> {
  const { data, error } = await supabase
    .from("bids")
    .select("*")
    .eq("listing_id", listingId)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToBid(data) : null;
}

export async function createBid(
  listingId: string,
  amount: number
): Promise<Bid> {
  const payload = {
    listing_id: String(listingId),
    amount: Number(amount),
  };

  const { data, error } = await supabase
    .from("bids")
    .insert([payload])
    .select()
    .maybeSingle(); // ✅ FIXED

  if (error) throw error;

  if (!data) throw new Error("No data returned from insert");

  return rowToBid(data);
}