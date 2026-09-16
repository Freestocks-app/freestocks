import { preStocksFeatured, type StockPrice } from "@/lib/tokenized-stocks";

const PRESTOCKS_API_URL = "https://prestocks.com/api/prestocks";
const CACHE_TTL_SECONDS = 60;

interface PreStocksApiEntry {
  symbol: string;
  tokenPrice: number;
}

/**
 * PreStocks doesn't expose a 24h change figure in its public API - only a
 * current price. Unlike getMergedPrices() (xStocks), changePercent here is
 * always 0; callers should not render a change badge for these prices.
 */
export async function fetchPreStocksPrices(): Promise<Record<string, StockPrice>> {
  const prices: Record<string, StockPrice> = {};
  const featuredSymbols = new Set(preStocksFeatured.map((s) => s.symbol));

  try {
    const res = await fetch(PRESTOCKS_API_URL, { next: { revalidate: CACHE_TTL_SECONDS } });
    if (!res.ok) return prices;

    const data: PreStocksApiEntry[] = await res.json();
    if (!Array.isArray(data)) return prices;

    for (const entry of data) {
      if (!featuredSymbols.has(entry.symbol)) continue;
      const price = Number(entry.tokenPrice);
      if (!Number.isFinite(price) || price <= 0) continue;

      prices[entry.symbol] = {
        symbol: entry.symbol,
        price,
        change: 0,
        changePercent: 0,
      };
    }
  } catch {
    // Return whatever we have (possibly empty) - PreStocks USD values are
    // a nice-to-have on the wallet view, never block rendering on them.
  }

  return prices;
}
