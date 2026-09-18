import { v4 as uuidv4 } from "uuid";
import * as schema from "@/lib/db/schema";
import type { DrizzleDB } from "@/server/ledger/service";

function isUniqueViolation(error: unknown): boolean {
  const err = error as { code?: string; cause?: { code?: string } };
  const errorStr = String(error);
  const code = err?.code || err?.cause?.code || "";
  return (
    code === "23505" ||
    errorStr.includes("unique") ||
    errorStr.includes("UNIQUE") ||
    errorStr.includes("duplicate key")
  );
}

export interface LogTradeParams {
  userId: string;
  /** Solana transaction signature - naturally unique, gives dedupe for free. */
  txId: string;
  side: "buy" | "sell";
  symbol: string;
  mint: string;
  tokenAmountRaw: string;
  tokenDecimals: number;
  usdcAmountRaw: string;
  /** USD value of the trade at execution, integer cents. */
  usdAmountCents: number;
  priceImpactPct: number;
  slippageBps: number;
}

export interface LogTradeResult {
  success: boolean;
  duplicate?: boolean;
}

/**
 * Logs a completed on-chain swap into the existing `transaction` table for
 * history/audit purposes only - this is NOT the source of truth for any
 * balance (Trade never touches the off-chain userBalance ledger; balances
 * are always read live from chain). Logging is optimistic: called after the
 * client-side swap has already succeeded on-chain.
 */
export async function logTrade(db: DrizzleDB, params: LogTradeParams): Promise<LogTradeResult> {
  const {
    userId,
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
  } = params;

  try {
    await db.insert(schema.transaction).values({
      id: uuidv4(),
      txId,
      userId,
      amountCents: usdAmountCents,
      source: "trade",
      metadata: JSON.stringify({
        side,
        symbol,
        mint,
        tokenAmountRaw,
        tokenDecimals,
        usdcAmountRaw,
        priceImpactPct,
        slippageBps,
      }),
      createdAt: new Date(),
    });
    return { success: true };
  } catch (error: unknown) {
    if (isUniqueViolation(error)) {
      return { success: false, duplicate: true };
    }
    throw error;
  }
}
