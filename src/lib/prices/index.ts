import { TOP10, type StockPrice } from "@/lib/tokenized-stocks";
import { fetchPythPrices } from "./pyth";
import { fetchPreStocksPrices } from "./prestocks";

const CACHE_TTL_SECONDS = 60;

interface DexScreenerPair {
  priceUsd: string;
  priceChange?: {
    h24?: number;
  };
}

async function fetchDexScreenerPrice(mint: string): Promise<{ price: number; changePercent: number } | null> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/tokens/v1/solana/${mint}`,
      { next: { revalidate: CACHE_TTL_SECONDS } }
    );
    if (!res.ok) return null;
    const pairs: DexScreenerPair[] = await res.json();
    if (!pairs || pairs.length === 0) return null;

    const pair = pairs[0];
    const price = parseFloat(pair.priceUsd) || 0;
    const changePercent = pair.priceChange?.h24 ?? 0;

    return { price, changePercent };
  } catch {
    return null;
  }
}

/**
 * Merges Pyth Hermes prices (preferred) with DexScreener prices (fallback,
 * and always the source of 24h % change — Hermes doesn't return that).
 * Never throws; stocks with no price from either source are simply omitted.
 */
export async function getMergedPrices(): Promise<Record<string, StockPrice>> {
  const prices: Record<string, StockPrice> = {};

  const pythPrices = await fetchPythPrices(TOP10.map((s) => s.symbol));

  await Promise.allSettled(
    TOP10.map(async (stock) => {
      const dexScreenerData = await fetchDexScreenerPrice(stock.mint);
      const pythPrice = pythPrices[stock.symbol];

      const price = pythPrice?.price ?? dexScreenerData?.price ?? 0;
      const changePercent = dexScreenerData?.changePercent ?? 0;

      if (price > 0) {
        prices[stock.symbol] = {
          symbol: stock.symbol,
          price,
          change: 0,
          changePercent,
        };
      }
    })
  );

  return prices;
}

/**
 * Prices for every cashout-eligible symbol (xStocks + PreStocks) - used by
 * the wallet balance view to show a USD-equivalent value per holding.
 * PreStocks entries never have a changePercent (see fetchPreStocksPrices).
 */
export async function getAllPrices(): Promise<Record<string, StockPrice>> {
  const [xstocksPrices, prestocksPrices] = await Promise.all([
    getMergedPrices(),
    fetchPreStocksPrices(),
  ]);

  return { ...xstocksPrices, ...prestocksPrices };
}
