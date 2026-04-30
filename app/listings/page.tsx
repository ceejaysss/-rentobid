"use client";
import Link from "next/link";
import ListingCard from "../components/ListingCard";
import { LISTINGS } from "../data/listings";
import NavbarUserMenu from "../components/NavbarUserMenu";

const CATEGORIES = ["All", "Home", "Car", "Equipment", "Boat", "Office"] as const;

export default function ListingsPage() {
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
              className="hidden text-sm font-medium text-black underline underline-offset-4 md:block"
            >
              Browse listings
            </Link>
            <NavbarUserMenu />
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-20">
        {/* Page header */}
        <div className="border-b border-gray-100 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-black">
                  Browse listings
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {LISTINGS.length} listings available ·{" "}
                  {LISTINGS.filter((l) => l.type === "auction").length} live auctions
                </p>
              </div>

              {/* Sort control */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="sort"
                  className="text-sm font-medium text-gray-700"
                >
                  Sort by
                </label>
                <select
                  id="sort"
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-black outline-none transition-colors hover:border-gray-300 focus:ring-2 focus:ring-black/10"
                >
                  <option>Ending soon</option>
                  <option>Lowest price</option>
                  <option>Highest rated</option>
                  <option>Most bids</option>
                </select>
              </div>
            </div>

            {/* Category filter tabs */}
            <div className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`shrink-0 rounded-full border px-5 py-2 text-sm font-medium transition-all ${
                    cat === "All"
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Listings grid */}
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {LISTINGS.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {/* Load more */}
          <div className="mt-16 flex justify-center">
            <button className="rounded-full border border-gray-200 bg-white px-8 py-3 text-sm font-medium text-black transition-all hover:border-gray-300 hover:bg-gray-50">
              Load more listings
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-100 bg-white py-12">
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
