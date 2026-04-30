"use client";

import { useState } from "react";
import { trackListingInterest } from "../lib/tracking";

const PACKAGES = [
  { id: "credits_10",  credits: 10,  price: "$5",  priceAmount: 500,  badge: null           },
  { id: "credits_50",  credits: 50,  price: "$20", priceAmount: 2000, badge: "Most popular"  },
  { id: "credits_100", credits: 100, price: "$35", priceAmount: 3500, badge: "Best value"    },
] as const;

interface Props {
  userId: string;
  listingId: string;
  onClose: () => void;
}

export default function CreditModal({ userId, listingId, onClose }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy(packageId: string) {
    setLoading(packageId);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, userId }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Checkout failed");
      // Fire-and-forget before redirect. keepalive:true ensures the request
      // survives page navigation and is not cancelled by the browser.
      void trackListingInterest(listingId, "buy_credits", { package_id: packageId });
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-gray-900">Buy bid credits</h2>
        <p className="mt-1 text-sm text-gray-500">
          1 credit = 1 bid. Credits never expire.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3">
          {PACKAGES.map((pkg) => {
            const isLoading = loading === pkg.id;
            return (
              <button
                key={pkg.id}
                onClick={() => handleBuy(pkg.id)}
                disabled={!!loading}
                className={`flex items-center justify-between rounded-xl border-2 px-5 py-4 text-left transition-all ${
                  isLoading
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-gray-900"
                } disabled:cursor-not-allowed`}
              >
                <div>
                  <p className="flex items-center gap-2 font-semibold text-gray-900">
                    {pkg.credits} credits
                    {pkg.badge && (
                      <span className="rounded-full bg-black px-2.5 py-0.5 text-xs font-medium text-white">
                        {pkg.badge}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-400">
                    ${(pkg.priceAmount / 100 / pkg.credits).toFixed(2)} per credit
                  </p>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {isLoading ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                  ) : (
                    pkg.price
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          Powered by Stripe · Secured payment
        </p>
      </div>
    </div>
  );
}
