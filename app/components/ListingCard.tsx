import Image from "next/image";
import Link from "next/link";

export type Listing = {
  id: string;
  title: string;
  location: string;
  category: "Home" | "Car" | "Equipment" | "Boat" | "Office";
  imageUrl: string;
  type: "auction" | "fixed";
  currentBid?: number;
  price?: number;
  startingBid?: number;
  rating: number;
  reviewCount: number;
  bidsCount?: number;
  endsIn?: string;
  host: string;
};

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M16 28C16 28 3 20.364 3 11.5a6.5 6.5 0 0 1 13-0.012A6.5 6.5 0 0 1 29 11.5C29 20.364 16 28 16 28z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      className="h-3 w-3"
      aria-hidden="true"
    >
      <path d="M15.094 1.579l-4.124 8.885-9.86 1.27a1 1 0 0 0-.542 1.736l7.293 6.565-1.965 9.852a1 1 0 0 0 1.483 1.061L16 26.233l8.625 4.715a1 1 0 0 0 1.483-1.06l-1.965-9.853 7.293-6.565a1 1 0 0 0-.541-1.735l-9.86-1.271-4.124-8.885a1 1 0 0 0-1.817 0z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
      />
    </svg>
  );
}

const categoryColors: Record<Listing["category"], string> = {
  Home: "bg-violet-50 text-violet-700",
  Car: "bg-blue-50 text-blue-700",
  Equipment: "bg-amber-50 text-amber-700",
  Boat: "bg-cyan-50 text-cyan-700",
  Office: "bg-emerald-50 text-emerald-700",
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const isAuction = listing.type === "auction";

  return (
    // Outer wrapper is a plain div so the heart button is NOT inside the <a>.
    // Nesting <button> inside <a> is invalid HTML and causes browsers to
    // reparse the DOM, producing erratic click/scroll behaviour.
    <div className="group relative flex flex-col">
      <Link
        href={`/listings/${listing.id}`}
        className="flex flex-col"
        aria-label={listing.title}
      >
        {/* Image container */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100">
          <Image
            src={listing.imageUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

          {/* Category badge — top left */}
          <div className="absolute left-3 top-3">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${categoryColors[listing.category]}`}
            >
              {listing.category}
            </span>
          </div>

          {/* Auction badge */}
          {isAuction && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
              <span className="text-xs font-medium text-white">
                Live · {listing.endsIn}
              </span>
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="mt-3 flex flex-col gap-1">
          {/* Title + rating */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 flex-1 text-sm font-semibold text-gray-900">
              {listing.title}
            </h3>
            <div className="flex shrink-0 items-center gap-1">
              <StarIcon />
              <span className="text-xs font-medium text-gray-700">
                {listing.rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">
                ({listing.reviewCount})
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-gray-500">
            <PinIcon />
            <span className="line-clamp-1 text-xs">{listing.location}</span>
          </div>

          {/* Price / bid */}
          <div className="mt-1 flex items-end justify-between">
            {isAuction ? (
              <div>
                <p className="text-xs text-gray-400">Current bid</p>
                <p className="text-base font-semibold text-gray-900">
                  ${listing.currentBid!.toLocaleString()}
                  <span className="text-xs font-normal text-gray-500"> /mo</span>
                </p>
              </div>
            ) : (
              <div>
                <p className="text-base font-semibold text-gray-900">
                  ${listing.price!.toLocaleString()}
                  <span className="text-xs font-normal text-gray-500"> /mo</span>
                </p>
              </div>
            )}

            {isAuction && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                {listing.bidsCount} bids
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Heart/save button — sibling to Link, not a child, to keep valid HTML */}
      <button
        type="button"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm backdrop-blur-sm transition-all hover:scale-110 hover:text-rose-500"
        aria-label="Save listing"
      >
        <HeartIcon />
      </button>
    </div>
  );
}
