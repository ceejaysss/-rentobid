"use client";

import { useState, useTransition } from "react";
import { startAuction } from "../actions/startAuction";

interface Props {
  listingId: string;
  views: number;
}

export default function AuctionUpsellBanner({ listingId, views }: Props) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await startAuction(listingId);
      if (result.success) {
        setDone(true);
        setOpen(false);
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3.5">
        <p className="text-sm font-semibold text-green-800">Auction scheduled</p>
        <p className="mt-0.5 text-xs text-green-700">
          Your listing will switch to auction mode. Expect your first bids within hours.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-base">
            🔥
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              {views} people viewed this today
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              High demand. Switch to auction mode to let tenants compete and drive the price up.
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="mt-3 w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 active:bg-amber-700"
        >
          Start an auction
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          onClick={() => !isPending && setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              disabled={isPending}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-gray-900">Switch to auction mode?</h2>
            <p className="mt-2 text-sm text-gray-500">
              Your listing will go live as an auction. Tenants compete, and the highest
              qualified bid wins. You approve the winner before anything is confirmed.
            </p>

            <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3">
              <ul className="space-y-1.5 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Tenants compete — price goes up
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Auction runs for 48 hours
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> You approve the winning bidder
                </li>
              </ul>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Starting…
                  </span>
                ) : (
                  "Start auction"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
