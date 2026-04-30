"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { type ListingDetail } from "../../data/listings";
import { getBidsByListingId, type Bid } from "../../data/bids";
import { supabase } from "../../lib/supabase";
import CreditModal from "../../components/CreditModal";
import { trackListingView, trackListingInterest } from "../../lib/tracking";

// ─── helpers ─────────────────────────────────────────────────────────────────

function parseEndsInToSeconds(endsIn: string): number {
  let total = 0;
  const days = endsIn.match(/(\d+)d/);
  const hours = endsIn.match(/(\d+)h/);
  const minutes = endsIn.match(/(\d+)m/);
  if (days) total += parseInt(days[1]) * 86400;
  if (hours) total += parseInt(hours[1]) * 3600;
  if (minutes) total += parseInt(minutes[1]) * 60;
  return total || 3600;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getOrCreateUsername(): string {
  if (typeof window === "undefined") return "User0000";
  let name = localStorage.getItem("rtb_username");
  if (!name) {
    name = "User" + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem("rtb_username", name);
  }
  return name;
}

function usernameFromId(id: string): string {
  const n = parseInt(id.replace(/-/g, "").slice(0, 4), 16) % 9000 + 1000;
  return "User" + n;
}

async function fetchCredits(userId: string): Promise<number> {
  try {
    const res = await fetch(`/api/credits?userId=${encodeURIComponent(userId)}`);
    const json = await res.json();
    return typeof json.credits === "number" ? json.credits : 10;
  } catch {
    return 10;
  }
}

async function deductCredit(userId: string): Promise<number | null> {
  try {
    const res = await fetch("/api/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const json = await res.json();
    return typeof json.credits === "number" ? json.credits : null;
  } catch {
    return null;
  }
}

// ─── types ────────────────────────────────────────────────────────────────────

type AugmentedBid = Bid & { displayName: string };

// ─── constants ────────────────────────────────────────────────────────────────

const RESET_SECONDS = 120;
const MIN_FIXED_INCREMENT = 50;

// ─── component ────────────────────────────────────────────────────────────────

export default function BidPanel({ listing }: { listing: ListingDetail }) {
  const isAuction = listing.type === "auction";

  // ── core (preserved)
  const [currentBid, setCurrentBid] = useState(listing.currentBid ?? 0);
  const [bidsCount, setBidsCount] = useState(listing.bidsCount ?? 0);
  const [inputValue, setInputValue] = useState("");
  const [, startTransition] = useTransition();
  const inFlight = useRef(false);
  const seenIds = useRef(new Set<string>());

  // ── timer
  const [secondsLeft, setSecondsLeft] = useState(
    isAuction ? parseEndsInToSeconds(listing.endsIn!) : 0
  );

  // ── realtime status
  const [liveConnected, setLiveConnected] = useState(false);

  // ── social proof
  const [recentBids, setRecentBids] = useState<AugmentedBid[]>([]);
  const [newestBidId, setNewestBidId] = useState<string | null>(null);

  // ── competitive tension
  const [myHighestBid, setMyHighestBid] = useState<number | null>(null);
  const myHighestBidRef = useRef<number | null>(null);
  const [outbidFlash, setOutbidFlash] = useState(false);

  // ── animation
  const [bidFlash, setBidFlash] = useState(false);

  // ── monetisation
  const [credits, setCredits] = useState(10);
  const [showCreditModal, setShowCreditModal] = useState(false);

  // ── toast
  const [toast, setToast] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  // ── identity
  const myUsername = useRef("");

  // ── fixed mode
  const [offerValue, setOfferValue] = useState("");
  const [offerSent, setOfferSent] = useState(false);

  // ─── init identity + fetch credits from server ────────────────────────────
  useEffect(() => {
    const username = getOrCreateUsername();
    myUsername.current = username;
    fetchCredits(username).then(setCredits);
    trackListingView(listing.id);
  }, [listing.id]);

  // keep ref in sync so realtime handler can read without stale closure
  useEffect(() => {
    myHighestBidRef.current = myHighestBid;
  }, [myHighestBid]);

  // ─── derived ──────────────────────────────────────────────────────────────
  const minIncrement = Math.max(MIN_FIXED_INCREMENT, Math.floor(currentBid * 0.01));
  const minBid = currentBid + minIncrement;
  const auctionEnded = isAuction && secondsLeft === 0;
  const endingSoon = secondsLeft > 0 && secondsLeft <= 30;
  const isHighestBidder = myHighestBid !== null && myHighestBid >= currentBid;
  const askPrice = listing.price ?? 0;
  const offerBelow = Math.round(askPrice * 0.95 / 50) * 50;

  // ─── helpers ──────────────────────────────────────────────────────────────
  const showToast = useCallback(
    (type: "success" | "error" | "warning", message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), 3500);
    },
    []
  );

  const resetTimer = useCallback(() => setSecondsLeft(RESET_SECONDS), []);

  const flashBid = useCallback(() => {
    setBidFlash(true);
    setTimeout(() => setBidFlash(false), 600);
  }, []);

  // ─── initial data load ────────────────────────────────────────────────────
  useEffect(() => {
    async function loadInitial() {
      try {
        const bids = await getBidsByListingId(listing.id);
        if (bids.length === 0) return;
        const maxAmount = Math.max(...bids.map((b) => b.amount));
        setCurrentBid((prev) => Math.max(prev, maxAmount));
        setBidsCount(bids.length);
        bids.forEach((b) => seenIds.current.add(b.id));
        setRecentBids(
          bids.slice(0, 5).map((b) => ({ ...b, displayName: usernameFromId(b.id) }))
        );
      } catch {
        // non-fatal: UI retains static defaults
      }
    }
    loadInitial();
  }, [listing.id]);

  // ─── realtime subscription (preserved + extended) ─────────────────────────
  useEffect(() => {
    if (!isAuction) return;

    const channel = supabase
      .channel("bids-" + listing.id)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
          filter: `listing_id=eq.${listing.id}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            listing_id: string;
            amount: number;
          };

          if (seenIds.current.has(row.id)) return;
          seenIds.current.add(row.id);

          const incoming = row.amount;

          // outbid detection
          if (
            myHighestBidRef.current !== null &&
            incoming > myHighestBidRef.current
          ) {
            setOutbidFlash(true);
            setTimeout(() => setOutbidFlash(false), 4000);
          }

          setCurrentBid((prev) => Math.max(prev, incoming));
          setBidsCount((c) => c + 1);
          resetTimer();
          flashBid();

          const newBid: AugmentedBid = {
            id: row.id,
            listingId: row.listing_id,
            amount: incoming,
            createdAt: new Date(),
            displayName: usernameFromId(row.id),
          };
          setNewestBidId(row.id);
          setRecentBids((prev) => [newBid, ...prev].slice(0, 5));
        }
      )
      .subscribe((status) => {
        setLiveConnected(status === "SUBSCRIBED");
      });

    return () => {
      setLiveConnected(false);
      supabase.removeChannel(channel);
    };
  }, [isAuction, listing.id, resetTimer, flashBid]);

  // ─── countdown ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuction || secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [isAuction, secondsLeft]);

  // ─── auction bid handler ──────────────────────────────────────────────────
  function handlePlaceBid() {
    if (inFlight.current) return;

    const amount = parseFloat(inputValue.replace(/,/g, ""));

    if (isNaN(amount) || amount <= 0) {
      showToast("error", "Enter a valid amount");
      return;
    }
    if (amount < minBid) {
      showToast("error", `Minimum bid is $${minBid.toLocaleString()} (+$${minIncrement} increment)`);
      return;
    }
    if (credits < 1) {
      showToast("warning", "You're out of bid credits — buy more to continue");
      return;
    }

    void trackListingInterest(listing.id, "bid_attempt", { amount });

    // optimistic update (preserved)
    setCurrentBid(amount);
    setBidsCount((c) => c + 1);
    setInputValue("");
    setMyHighestBid(amount);
    setOutbidFlash(false);
    resetTimer();
    flashBid();

    // Optimistic credit deduction — server call confirms/corrects below
    setCredits((c) => Math.max(0, c - 1));

    const tempId = "temp-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
    const optimisticBid: AugmentedBid = {
      id: tempId,
      listingId: listing.id,
      amount,
      createdAt: new Date(),
      displayName: myUsername.current + " (you)",
    };
    setNewestBidId(tempId);
    setRecentBids((prev) => [optimisticBid, ...prev].slice(0, 5));

    inFlight.current = true;

    startTransition(async () => {
      try {
        // Server-side credit deduction (authoritative)
        const confirmedCredits = await deductCredit(myUsername.current);
        if (confirmedCredits !== null) setCredits(confirmedCredits);

        const res = await fetch("/api/bids", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId: listing.id, amount }),
        });
        if (!res.ok) throw new Error("Bid rejected by server");
        const { bid } = await res.json();

        seenIds.current.add(bid.id);
        setRecentBids((prev) =>
          prev.map((b) => (b.id === tempId ? { ...b, id: bid.id } : b))
        );
        setNewestBidId(bid.id);
      } catch {
        showToast("error", "Failed to place bid — please try again");
      } finally {
        inFlight.current = false;
      }
    });
  }

  // ─── offer handler (fixed mode) ───────────────────────────────────────────
  function handleMakeOffer() {
    const amount = parseFloat(offerValue.replace(/,/g, ""));
    if (isNaN(amount) || amount <= 0) {
      showToast("error", "Enter a valid offer amount");
      return;
    }
    if (amount < askPrice * 0.7) {
      showToast("error", `Minimum offer is $${Math.round(askPrice * 0.7).toLocaleString()}`);
      return;
    }
    trackListingInterest(listing.id, "offer_sent", { offer_amount: amount });
    setOfferSent(true);
  }

  // ─── timer display ────────────────────────────────────────────────────────
  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  const timerStr = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* Pricing mode indicator */}
      <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-gray-100 p-1">
        <div
          className={`flex flex-col items-center rounded-lg px-3 py-2.5 text-center transition-colors ${
            !isAuction ? "bg-white shadow-sm" : "opacity-40"
          }`}
        >
          <span className="text-xs font-semibold text-gray-900">Fixed Rent</span>
          <span className="mt-0.5 text-[10px] text-gray-500">stable, no bidding</span>
        </div>
        <div
          className={`flex flex-col items-center rounded-lg px-3 py-2.5 text-center transition-colors ${
            isAuction ? "bg-white shadow-sm" : "opacity-40"
          }`}
        >
          <span className="text-xs font-semibold text-gray-900">Auction Mode</span>
          <span className="mt-0.5 text-[10px] text-gray-500">tenants compete</span>
        </div>
      </div>

      {/* ── Fixed pricing panel ────────────────────────────────────────────── */}
      {!isAuction && (
        <div className="flex flex-col gap-4">

          {/* Price */}
          <div>
            <p className="text-3xl font-bold tabular-nums text-gray-900">
              ${askPrice.toLocaleString()}
              <span className="ml-1 text-base font-normal text-gray-500">/ month</span>
            </p>
            <p className="mt-1 text-sm text-gray-400">Fixed rate · set by host</p>
          </div>

          {/* Offer form / success state */}
          {offerSent ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3.5">
              <p className="text-sm font-semibold text-green-800">Offer sent</p>
              <p className="mt-0.5 text-xs text-green-700">
                The host will respond within 24 hours.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={offerValue}
                onChange={(e) => setOfferValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleMakeOffer()}
                placeholder={`$${askPrice.toLocaleString()} or make an offer`}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base font-medium text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
              />
              {/* Quick-fill suggestions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setOfferValue(askPrice.toLocaleString())}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
                >
                  ${askPrice.toLocaleString()} — ask
                </button>
                {offerBelow > 0 && offerBelow < askPrice && (
                  <button
                    onClick={() => setOfferValue(offerBelow.toLocaleString())}
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
                  >
                    ${offerBelow.toLocaleString()} — offer less
                  </button>
                )}
              </div>
              <button
                onClick={handleMakeOffer}
                className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800 active:scale-[0.98]"
              >
                Make an offer
              </button>
            </div>
          )}

          {/* Contact host — secondary action */}
          <button
            onClick={() => trackListingInterest(listing.id, "contact_clicked")}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
          >
            Contact host
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            toast.type === "success"
              ? "bg-black text-white"
              : toast.type === "warning"
              ? "border border-amber-200 bg-amber-50 text-amber-800"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* ── Auction panel (unchanged) ──────────────────────────────────────── */}
      {isAuction && (
        <>
          {/* Credits bar */}
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5">
            <span className="text-xs text-gray-500">
              <span className="font-semibold text-gray-900">{credits}</span> bid{" "}
              {credits === 1 ? "credit" : "credits"} remaining
            </span>
            <button
              onClick={() => setShowCreditModal(true)}
              className="text-xs font-semibold text-black underline underline-offset-2 hover:no-underline"
            >
              Buy credits
            </button>
          </div>

          {/* Timer */}
          <div
            className={`rounded-xl px-4 py-3 text-center transition-colors duration-500 ${
              auctionEnded
                ? "bg-gray-100"
                : endingSoon
                ? "border border-red-200 bg-red-50"
                : "bg-gray-50"
            }`}
          >
            {auctionEnded ? (
              <p className="font-semibold text-gray-500">Auction ended</p>
            ) : (
              <>
                {endingSoon && (
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-red-500">
                    Ending soon
                  </p>
                )}
                <p
                  className={`font-mono text-2xl font-bold tabular-nums ${
                    endingSoon ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {timerStr}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {endingSoon ? "Bid now or lose it" : "Timer resets with each bid"}
                </p>
              </>
            )}
          </div>

          {/* Current bid + count */}
          <div>
            <p
              className={`text-3xl font-bold tabular-nums transition-colors duration-300 ${
                bidFlash ? "text-green-600" : "text-gray-900"
              }`}
            >
              ${currentBid.toLocaleString()}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-gray-500">{bidsCount} bids</span>
              {liveConnected && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                  live
                </span>
              )}
            </div>
          </div>

          {/* Bidder status */}
          {myHighestBid !== null && (
            <div
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors duration-300 ${
                outbidFlash
                  ? "border-red-200 bg-red-50 text-red-700"
                  : isHighestBidder
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {outbidFlash
                ? "⚡ You've been outbid — act fast"
                : isHighestBidder
                ? "✓ You are the highest bidder"
                : "You've been outbid"}
            </div>
          )}

          {/* Bid form */}
          {!auctionEnded && (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePlaceBid()}
                placeholder={`$${minBid.toLocaleString()}`}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base font-medium text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
              />
              <p className="text-xs text-gray-400">
                Min bid:{" "}
                <span className="font-semibold text-gray-600">
                  ${minBid.toLocaleString()}
                </span>
                <span className="ml-1 text-gray-400">
                  (+${minIncrement.toLocaleString()} increment)
                </span>
              </p>

              <button
                onClick={handlePlaceBid}
                className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
                  credits < 1
                    ? "cursor-not-allowed bg-gray-100 text-gray-400"
                    : endingSoon
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {credits < 1 ? "No credits remaining" : endingSoon ? "⚡ Bid now" : "Place bid"}
              </button>
            </div>
          )}

          {/* Recent activity */}
          {recentBids.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Recent activity
              </p>
              <div className="flex flex-col gap-1.5">
                {recentBids.map((bid) => (
                  <div
                    key={bid.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors duration-500 ${
                      bid.id === newestBidId
                        ? "border border-green-200 bg-green-50"
                        : "bg-gray-50"
                    }`}
                  >
                    <span className="max-w-[140px] truncate text-gray-600">
                      {bid.displayName}
                    </span>
                    <span className="font-semibold text-gray-900">
                      ${bid.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Credit purchase modal */}
      {showCreditModal && (
        <CreditModal
          userId={myUsername.current}
          listingId={listing.id}
          onClose={() => {
            setShowCreditModal(false);
            // Re-fetch credits in case user completed a purchase before closing
            fetchCredits(myUsername.current).then(setCredits);
          }}
        />
      )}
    </div>
  );
}
