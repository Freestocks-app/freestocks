import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db, ensureDbInitialized } from "@/lib/db";
import { logTrade } from "@/server/trade/service";
import { allCashoutStocks } from "@/lib/tokenized-stocks";

interface ConfirmTradeBody {
  txId?: string;
  side?: string;
  symbol?: string;
  mint?: string;
  tokenAmountRaw?: string;
  tokenDecimals?: number;
  usdcAmountRaw?: string;
  usdAmountCents?: number;
  priceImpactPct?: number;
  slippageBps?: number;
}

/**
 * Logs a completed swap for history/audit purposes only, after the client
 * has already signed and sent it on-chain. Never trusted as the source of
 * truth for any balance - balances are always read live from chain.
 */
export async function POST(request: NextRequest) {
  await ensureDbInitialized();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ConfirmTradeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    txId,
    side,
    symbol,
    mint,
    tokenAmountRaw,
    tokenDecimals,
    usdcAmountRaw,
    usdAmountCents,
    priceImpactPct,
    slippageBps,
  } = body;

  if (!txId || typeof txId !== "string") {
    return NextResponse.json({ error: "txId is required" }, { status: 400 });
  }
  if (side !== "buy" && side !== "sell") {
    return NextResponse.json({ error: "side must be 'buy' or 'sell'" }, { status: 400 });
  }
  const stock = allCashoutStocks.find((s) => s.symbol === symbol && s.mint === mint);
  if (!stock) {
    return NextResponse.json({ error: "Unknown symbol/mint" }, { status: 400 });
  }
  if (
    !tokenAmountRaw ||
    typeof tokenAmountRaw !== "string" ||
    typeof tokenDecimals !== "number" ||
    !usdcAmountRaw ||
    typeof usdcAmountRaw !== "string" ||
    typeof usdAmountCents !== "number" ||
    !Number.isFinite(usdAmountCents) ||
    usdAmountCents < 0 ||
    typeof priceImpactPct !== "number" ||
    typeof slippageBps !== "number"
  ) {
    return NextResponse.json({ error: "Invalid trade amount fields" }, { status: 400 });
  }

  const result = await logTrade(db, {
    userId: session.user.id,
    txId,
    side,
    symbol: stock.symbol,
    mint: stock.mint,
    tokenAmountRaw,
    tokenDecimals,
    usdcAmountRaw,
    usdAmountCents,
    priceImpactPct,
    slippageBps,
  });

  return NextResponse.json({ success: result.success, duplicate: result.duplicate ?? false });
}
