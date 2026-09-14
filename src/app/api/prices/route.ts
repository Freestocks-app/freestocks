import { NextResponse } from "next/server";
import { TOP10, type StockPrice } from "@/lib/tokenized-stocks";

const CACHE_TTL_SECONDS = 60;

interface BackedPriceResponse {
  price: number;
  change24h?: number;
  changePercent24h?: number;
}

async function fetchXStockPrice(tokenSymbol: string): Promise<BackedPriceResponse | null> {
  try {
    const res = await fetch(
      `https://api.backed.fi/api/v2/public/assets/${tokenSymbol}/price-data`,
      { next: { revalidate: CACHE_TTL_SECONDS } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      price: data.price ?? data.lastPrice ?? 0,
      change24h: data.change24h ?? data.priceChange24h ?? 0,
      changePercent24h: data.changePercent24h ?? data.priceChangePercent24h ?? 0,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const prices: Record<string, StockPrice> = {};

  const results = await Promise.allSettled(
    TOP10.map(async (stock) => {
      const priceData = await fetchXStockPrice(stock.tokenSymbol);
      if (priceData) {
        prices[stock.symbol] = {
          symbol: stock.symbol,
          price: priceData.price,
          change: priceData.change24h ?? 0,
          changePercent: priceData.changePercent24h ?? 0,
        };
      }
    })
  );

  const successCount = results.filter(r => r.status === "fulfilled").length;

  return NextResponse.json(
    { prices, fetchedAt: new Date().toISOString(), count: successCount },
    {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${CACHE_TTL_SECONDS * 2}`,
      },
    }
  );
}
