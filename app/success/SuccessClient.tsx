"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Props {
  sessionId: string | null;
}

type Phase = "verifying" | "polling" | "confirmed" | "timeout" | "error";

export default function SuccessClient({ sessionId }: Props) {
  const [phase, setPhase] = useState<Phase>("verifying");
  const [creditsAdded, setCreditsAdded] = useState<number | null>(null);
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setPhase("error");
      setErrorMsg("No session ID found in URL.");
      return;
    }

    let cancelled = false;

    async function run() {
      // Step 1: verify the session to learn how many credits were purchased and the userId
      let creditsFromSession = 0;
      let userId: string | null = null;

      try {
        const vRes = await fetch(`/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`);
        const vJson = await vRes.json();

        if (!vRes.ok || vJson.error) {
          throw new Error(vJson.error ?? "Could not verify payment");
        }
        if (vJson.status !== "paid") {
          throw new Error("Payment not confirmed yet — please contact support if this persists.");
        }

        creditsFromSession = vJson.creditsAdded ?? 0;
        userId = vJson.userId ?? null;
        if (!cancelled) setCreditsAdded(creditsFromSession);
      } catch (err) {
        if (!cancelled) {
          setPhase("error");
          setErrorMsg(err instanceof Error ? err.message : "Verification failed");
        }
        return;
      }

      if (!userId) {
        if (!cancelled) setPhase("confirmed");
        return;
      }

      // Step 2: poll credits until the webhook-driven balance arrives (max ~12 s)
      if (!cancelled) setPhase("polling");
      const MAX_POLLS = 12;
      let attempt = 0;
      let lastKnownBalance = 0;

      const poll = setInterval(async () => {
        attempt++;
        try {
          const cRes = await fetch(`/api/credits?userId=${encodeURIComponent(userId!)}`);
          const cJson = await cRes.json();
          const balance: number = cJson.credits ?? 0;

          if (!cancelled) setNewBalance(balance);

          // Webhook has fired when balance exceeds balance-before-purchase.
          // We don't have the before-balance, but we can stop once it's stable.
          if (attempt === 1) {
            lastKnownBalance = balance;
          } else if (balance !== lastKnownBalance || attempt >= MAX_POLLS) {
            clearInterval(poll);
            if (!cancelled) setPhase(attempt >= MAX_POLLS && balance === lastKnownBalance ? "timeout" : "confirmed");
            return;
          }
        } catch {
          // transient fetch error — keep polling
        }
      }, 1000);

      return () => clearInterval(poll);
    }

    run();
    return () => { cancelled = true; };
  }, [sessionId]);

  // ─── render ───────────────────────────────────────────────────────────────

  if (phase === "verifying" || phase === "polling") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
        <div className="mx-auto max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {phase === "verifying" ? "Verifying payment…" : "Confirming credits…"}
          </h1>
          <p className="mt-2 text-sm text-gray-500">This only takes a moment.</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
        <div className="mx-auto max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <span className="text-2xl">✕</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-gray-500">{errorMsg}</p>
          <Link
            href="/listings"
            className="mt-8 inline-block rounded-xl bg-black px-8 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Back to listings
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "timeout") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
        <div className="mx-auto max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Payment received</h1>
          <p className="mt-2 text-sm text-gray-500">
            Your credits are being processed and will appear shortly.
            {creditsAdded !== null && (
              <span> ({creditsAdded} credits purchased)</span>
            )}
          </p>
          <Link
            href="/listings"
            className="mt-8 inline-block rounded-xl bg-black px-8 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Back to listings
          </Link>
        </div>
      </div>
    );
  }

  // confirmed
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="mx-auto max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Payment successful</h1>

        {creditsAdded !== null && (
          <p className="mt-3 text-lg font-semibold text-gray-900">
            +{creditsAdded} credits added
          </p>
        )}

        {newBalance !== null && (
          <p className="mt-1 text-sm text-gray-500">
            New balance: <span className="font-semibold text-gray-900">{newBalance} credits</span>
          </p>
        )}

        <p className="mt-3 text-sm text-gray-500">
          Ready to bid. Credits never expire.
        </p>

        <Link
          href="/listings"
          className="mt-8 inline-block rounded-xl bg-black px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
        >
          Back to listings
        </Link>
      </div>
    </div>
  );
}
