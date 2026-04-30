"use client";

import { useState, useEffect, useRef } from "react";

// ── Config ────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 60_000;

export const DEMAND_THRESHOLDS = {
  HIGH_VIEWS_TODAY:  10,
  HIGH_INTEREST:      3,
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export type DemandSignals = {
  views:      number;
  interested: number;
  isHigh:     boolean;
  loading:    boolean;
};

const INITIAL: DemandSignals = {
  views:      0,
  interested: 0,
  isHigh:     false,
  loading:    true,
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDemandSignals(listingId: string): DemandSignals {
  const [signals, setSignals] = useState<DemandSignals>(INITIAL);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSignals() {
      try {
        const res = await fetch(
          `/api/demand-signals?listingId=${encodeURIComponent(listingId)}`
        );
        if (!res.ok) return;
        const data = await res.json() as { views: number; interested: number; isHigh: boolean };
        if (!cancelled) {
          setSignals({ ...data, loading: false });
        }
      } catch {
        // Network failure or server error — degrade gracefully, stop showing loader
        if (!cancelled) {
          setSignals((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    fetchSignals();
    timerRef.current = setInterval(fetchSignals, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [listingId]);

  return signals;
}
