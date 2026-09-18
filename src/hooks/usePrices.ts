"use client";

import { useEffect, useState } from "react";
import type { StockPrice } from "@/lib/tokenized-stocks";

/** Live prices for every cashout-eligible stock, shared by My Wallet and Trade. */
export function usePrices(): { prices: Record<string, StockPrice>; loading: boolean } {
  const [prices, setPrices] = useState<Record<string, StockPrice>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/prices?all=1")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setPrices(data.prices ?? {});
      })
      .catch(() => {
        // Prices are a nice-to-have on these views - fall back to showing
        // no live price rather than blocking the screen.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { prices, loading };
}
