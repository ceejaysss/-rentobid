import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";
import { supabaseServer } from "../lib/supabase-server";
import NavbarUserMenu from "../components/NavbarUserMenu";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80";

const categoryColors: Record<string, string> = {
  Home: "bg-violet-50 text-violet-700",
  Car: "bg-blue-50 text-blue-700",
  Equipment: "bg-amber-50 text-amber-700",
  Boat: "bg-cyan-50 text-cyan-700",
  Office: "bg-emerald-50 text-emerald-700",
};

function formatEndsIn(endTime: string | null): string | undefined {
  if (!endTime) return undefined;
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return undefined;
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
  bids_count: number | null;
}

function getAuctionStatus(row: DbListing) {
  if (!row.auction_end_time) {
    return { label: "Fixed price", cls: "bg-gray-100 text-gray-600" } as const;
  }
  if (new Date(row.auction_end_time) > new Date()) {
    return { label: "Live auction", cls: "bg-green-50 text-green-700" } as const;
  }
  return { label: "Ended", cls: "bg-gray-100 text-gray-400" } as const;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-black">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function DashboardListingCard({ listing }: { listing: DbListing }) {
  const auctionStatus = getAuctionStatus(listing);
  const endsIn = formatEndsIn(listing.auction_end_time);
  const isLiveAuction = auctionStatus.label === "Live auction";
  const displayPrice = isLiveAuction
    ? (listing.current_bid ?? listing.price_base)
    : listing.price_base;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listing.image_url ?? DEFAULT_IMAGE}
          alt={listing.title}
          className="h-full w-full object-cover"
        />
        {/* Auction status badge */}
        <div className="absolute right-3 top-3">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${auctionStatus.cls}`}
          >
            {auctionStatus.label}
          </span>
        </div>
        {/* Category badge */}
        <div className="absolute left-3 top-3">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              categoryColors[listing.category ?? ""] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {listing.category ?? "—"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="line-clamp-1 text-sm font-semibold text-gray-900">
            {listing.title}
          </p>
          {listing.location && (
            <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
              {listing.location}
            </p>
          )}
        </div>

        {/* Price + bids row */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-400">
              {isLiveAuction ? "Current bid" : "Base price"}
            </p>
            <p className="text-base font-semibold text-gray-900">
              {displayPrice != null
                ? `$${displayPrice.toLocaleString()}`
                : "—"}
              <span className="text-xs font-normal text-gray-400"> /mo</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Bids</p>
            <p className="text-base font-semibold text-gray-900">
              {listing.bids_count ?? 0}
            </p>
          </div>
        </div>

        {/* Live auction countdown */}
        {endsIn && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-green-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            Ends in {endsIn}
          </p>
        )}

        {/* Action buttons */}
        <div className="mt-auto flex gap-2 border-t border-gray-100 pt-3">
          <Link
            href={`/listings/${listing.id}`}
            className="flex-1 rounded-xl border border-gray-200 py-2 text-center text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            View
          </Link>
          <Link
            href={`/listings/${listing.id}/edit`}
            className="flex-1 rounded-xl bg-black py-2 text-center text-xs font-medium text-white transition-colors hover:bg-gray-800"
          >
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) redirect("/auth/login");
  const user = authData.user;

  const { data: rows, error: listingsError } = await supabaseServer
    .from("listings")
    .select(
      "id, title, location, category, image_url, price_base, current_bid, auction_end_time, status, bids_count"
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (listingsError) {
    console.error("[dashboard] listings query failed:", listingsError.message);
  }

  const listings: DbListing[] = rows ?? [];

  // Compute stats from listings data
  const totalListings = listings.length;
  const activeAuctions = listings.filter(
    (l) => l.auction_end_time && new Date(l.auction_end_time) > new Date()
  ).length;
  const totalBids = listings.reduce(
    (sum, l) => sum + (l.bids_count ?? 0),
    0
  );

  // Views today from listing_stats — optional table, fails gracefully
  let viewsToday = 0;
  if (listings.length > 0) {
    const { data: statsRows, error: statsError } = await supabaseServer
      .from("listing_stats")
      .select("views_today")
      .in(
        "listing_id",
        listings.map((l) => l.id)
      );
    if (statsError) {
      console.error("[dashboard] listing_stats query failed:", statsError.message);
    }
    viewsToday = (statsRows ?? []).reduce(
      (sum, s) => sum + ((s.views_today as number) ?? 0),
      0
    );
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
              <span className="text-sm font-bold text-white">R</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-black">
              RentoBid
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/listings"
              className="hidden text-sm font-medium text-gray-700 transition-colors hover:text-black md:block"
            >
              Browse listings
            </Link>
            <NavbarUserMenu initialUser={user} />
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-20">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">

          {/* Page header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-black">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {displayName ? `Welcome back, ${displayName}` : "Welcome back"}
              </p>
            </div>
            <Link
              href="/listings/create"
              className="inline-flex items-center gap-2 self-start rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 sm:self-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Create new listing
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total listings" value={totalListings} />
            <StatCard label="Active auctions" value={activeAuctions} />
            <StatCard label="Total bids" value={totalBids} />
            <StatCard label="Views today" value={viewsToday} />
          </div>

          {/* Listings section */}
          <div className="mt-10">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black">
                Your listings
                {totalListings > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    ({totalListings})
                  </span>
                )}
              </h2>
            </div>

            {listings.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white py-24 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                    />
                  </svg>
                </div>
                <p className="text-base font-semibold text-gray-900">
                  No listings yet
                </p>
                <p className="mt-1 max-w-xs text-sm text-gray-500">
                  Post your first listing and start receiving bids from renters
                  in minutes.
                </p>
                <Link
                  href="/listings/create"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Post your first listing
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <DashboardListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 w-full border-t border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
                <span className="text-sm font-bold text-white">R</span>
              </div>
              <span className="text-lg font-semibold text-black">RentoBid</span>
            </div>
            <p className="text-sm text-gray-500">
              © 2026 RentoBid. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
