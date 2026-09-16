import { NextResponse } from "next/server";
import { getMergedPrices } from "@/lib/prices";

const CACHE_TTL_SECONDS = 60;

export async function GET() {
  const prices = await getMergedPrices();
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
