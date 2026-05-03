import { supabaseServer } from "../lib/supabase-server";
import ListingsClient from "./ListingsClient";
import { type Listing } from "../components/ListingCard";

const VALID_CATEGORIES = ["Home", "Car", "Equipment", "Boat", "Office"] as const;
type Category = (typeof VALID_CATEGORIES)[number];

function toCategory(val: string | null | undefined): Category {
  if (val && (VALID_CATEGORIES as readonly string[]).includes(val)) {
    return val as Category;
  }
  return "Home";
}

function formatEndsIn(endTime: string | null): string | undefined {
  if (!endTime) return undefined;
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return undefined; // auction ended — treat as fixed
  const totalMinutes = Math.floor(diff / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h >= 48) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface DbListing {
  id: string;
  title: string;
  location: string | null;
  category: string | null;
  image_url: string | null;
  price_base: number | null;
  current_bid: number | null;
  auction_end_time: string | null;
  status: string | null;
  rating: number | null;
  review_count: number | null;
  bids_count: number | null;
  host: string | null;
}

function rowToListing(row: DbListing): Listing {
  const endsIn = formatEndsIn(row.auction_end_time);
  const isAuction = !!endsIn; // only live if auction hasn't ended

  return {
    id: String(row.id),
    title: row.title,
    location: row.location ?? "Location TBD",
    category: toCategory(row.category),
    imageUrl:
      row.image_url ??
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    type: isAuction ? "auction" : "fixed",
    price: isAuction ? undefined : (row.price_base ?? undefined),
    startingBid: isAuction ? (row.price_base ?? undefined) : undefined,
    currentBid: isAuction ? (row.current_bid ?? row.price_base ?? undefined) : undefined,
    endsIn,
    rating: row.rating ?? 4.8,
    reviewCount: row.review_count ?? 0,
    bidsCount: row.bids_count ?? 0,
    host: row.host ?? "Host",
  };
}

export default async function ListingsPage() {
  const { data, error } = await supabaseServer
    .from("listings")
    .select(
      "id, title, location, category, image_url, price_base, current_bid, auction_end_time, status, rating, review_count, bids_count, host"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[listings] fetch error:", error.code, error.message);
  }

  // Surface fetch errors in dev so they don't silently produce empty pages
  if (error && process.env.NODE_ENV === "development") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-8 font-mono text-sm">
        <div className="max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-bold text-red-700">Supabase fetch error</p>
          <p className="mt-1 text-red-600">{error.message}</p>
          <p className="mt-2 text-xs text-red-400">code: {error.code}</p>
        </div>
      </div>
    );
  }

  const listings: Listing[] = (data ?? []).map(rowToListing);

  return <ListingsClient listings={listings} />;
}
