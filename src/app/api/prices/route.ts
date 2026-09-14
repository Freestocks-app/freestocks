import { NextResponse } from "next/server";
import { TOP10, type StockPrice } from "@/lib/tokenized-stocks";

const CACHE_TTL_SECONDS = 60;

interface DexScreenerPair {
  priceUsd: string;
  priceChange?: {
    h24?: number;
  };
}

async function fetchXStockPrice(mint: string): Promise<{ price: number; changePercent: number } | null> {
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

export async function GET() {
  const prices: Record<string, StockPrice> = {};

  await Promise.allSettled(
    TOP10.map(async (stock) => {
      const priceData = await fetchXStockPrice(stock.mint);
      if (priceData && priceData.price > 0) {
        prices[stock.symbol] = {
          symbol: stock.symbol,
          price: priceData.price,
          change: 0,
          changePercent: priceData.changePercent,
        };
      }
    })
  );

  const successCount = Object.keys(prices).length;

  return NextResponse.json(
    { prices, fetchedAt: new Date().toISOString(), count: successCount },
    {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${CACHE_TTL_SECONDS * 2}`,
      },
    }
  );
}
