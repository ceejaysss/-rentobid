import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingById } from "../../data/listings";
import { supabaseServer } from "../../lib/supabase-server";
import { createClient } from "../../lib/supabase/server";
import BidPanel from "./BidPanel";
import DemandBadge from "../../components/DemandBadge";
import AuctionUpsellBanner from "../../components/AuctionUpsellBanner";
import NavbarUserMenu from "../../components/NavbarUserMenu";

const UPSELL_THRESHOLD = 15;

const categoryColors: Record<string, string> = {
  Home: "bg-violet-50 text-violet-700",
  Car: "bg-blue-50 text-blue-700",
  Equipment: "bg-amber-50 text-amber-700",
  Boat: "bg-cyan-50 text-cyan-700",
  Office: "bg-emerald-50 text-emerald-700",
};

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = getListingById(id);

  if (!listing) notFound();

  // Run session lookup, stats query, and ownership check in parallel
  const supabaseSSR = await createClient();
  const [
    { data: { user } },
    { data: statsRow },
    { data: ownerRow },
  ] = await Promise.all([
    supabaseSSR.auth.getUser(),
    supabaseServer.from("listing_stats").select("views_today").eq("listing_id", id).maybeSingle(),
    supabaseServer.from("listing_owners").select("user_id").eq("listing_id", id).maybeSingle(),
  ]);

  const viewsToday = statsRow?.views_today ?? 0;
  const isOwner = !!user && ownerRow?.user_id === user.id;

  const [mainImage, ...thumbs] = listing.gallery;

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      {/* Navigation */}
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
            <button className="hidden text-sm font-medium text-gray-700 transition-colors hover:text-black md:block">
              How it works
            </button>
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
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/listings" className="transition-colors hover:text-black">
              Listings
            </Link>
            <span>/</span>
            <span className="text-black">{listing.title}</span>
          </div>

          {/* Gallery */}
          <div className="mb-10 grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl">
            {/* Main image */}
            <div className="relative col-span-4 row-span-2 aspect-[16/9] sm:col-span-2">
              <Image
                src={mainImage}
                alt={listing.title}
                fill
                priority
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
              />
              {listing.type === "auction" && (
                <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                  <span className="text-xs font-medium text-white">
                    Live auction · ends in {listing.endsIn}
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {thumbs.slice(0, 2).map((src, i) => (
              <div
                key={i}
                className="relative hidden aspect-auto sm:block"
              >
                <Image
                  src={src}
                  alt={`${listing.title} photo ${i + 2}`}
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
            {/* Left: details */}
            <div className="flex flex-col gap-8">
              {/* Header */}
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${categoryColors[listing.category] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {listing.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <svg viewBox="0 0 32 32" fill="currentColor" className="h-3 w-3 text-gray-700" aria-hidden="true">
                      <path d="M15.094 1.579l-4.124 8.885-9.86 1.27a1 1 0 0 0-.542 1.736l7.293 6.565-1.965 9.852a1 1 0 0 0 1.483 1.061L16 26.233l8.625 4.715a1 1 0 0 0 1.483-1.06l-1.965-9.853 7.293-6.565a1 1 0 0 0-.541-1.735l-9.86-1.271-4.124-8.885a1 1 0 0 0-1.817 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {listing.rating.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-400">
                      ({listing.reviewCount} reviews)
                    </span>
                  </div>
                </div>

                <DemandBadge views={viewsToday} />

                <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
                  {listing.title}
                </h1>

                <div className="mt-2 flex items-center gap-1.5 text-gray-500">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 shrink-0" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  <span className="text-sm">{listing.location}</span>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-gray-100" />

              {/* Description */}
              <div>
                <h2 className="mb-3 text-lg font-semibold text-black">About this listing</h2>
                <p className="leading-7 text-gray-600">{listing.description}</p>
              </div>

              {/* Divider */}
              <hr className="border-gray-100" />

              {/* Features */}
              <div>
                <h2 className="mb-4 text-lg font-semibold text-black">What&apos;s included</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {listing.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3"
                    >
                      <svg
                        className="h-4 w-4 shrink-0 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <hr className="border-gray-100" />

              {/* Host */}
              <div>
                <h2 className="mb-4 text-lg font-semibold text-black">Hosted by {listing.host}</h2>
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={listing.hostAvatar}
                      alt={listing.host}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-black">{listing.host}</p>
                    <p className="text-sm text-gray-500">
                      Hosting on RentoBid since {listing.hostSince} ·{" "}
                      <span className="text-black">{listing.reviewCount} reviews</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: bid panel */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
              {isOwner && listing.type === "fixed" && viewsToday >= UPSELL_THRESHOLD && (
                <AuctionUpsellBanner listingId={id} views={viewsToday} />
              )}
              <div className="relative rounded-3xl border border-gray-200 p-6 shadow-sm">
                <BidPanel listing={listing} />
              </div>
            </div>
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
            <p className="text-sm text-gray-500">© 2026 RentoBid. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
