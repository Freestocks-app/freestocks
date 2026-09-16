import { Connection, PublicKey } from "@solana/web3.js";
import {
  mapTokenAccountsToBalances,
  SOLANA_RPC_URL,
  TOKEN_PROGRAM_ID_STRING,
  type ParsedTokenAccount,
} from "@/lib/wallet-balances";
import { getAllPrices } from "@/lib/prices";
import { getWalletAddress } from "./service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDB = any;

const TOKEN_PROGRAM_ID = new PublicKey(TOKEN_PROGRAM_ID_STRING);

export interface PortfolioSummary {
  valueCents: number;
  stockCount: number;
}

/**
 * Server-side equivalent of WalletBalances.tsx's totalValueCents/heldStocks
 * calculation (src/components/WalletBalances.tsx), for the header's
 * Portfolio pill - computed without any client-side Privy session, using
 * the wallet address persisted via src/server/wallet/service.ts.
 *
 * Returns null (never throws) when there's no saved wallet yet, or on any
 * RPC/price failure - the header should simply omit the pill rather than
 * ever fail to render because of a flaky RPC call.
 */
export async function getPortfolioValueCents(
  db: DrizzleDB,
  userId: string
): Promise<PortfolioSummary | null> {
  try {
    const address = await getWalletAddress(db, userId);
    if (!address) return null;

    const connection = new Connection(SOLANA_RPC_URL);
    const owner = new PublicKey(address);

    const [tokenAccounts, prices] = await Promise.all([
      connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }),
      getAllPrices(),
    ]);

    const tokenBalances = mapTokenAccountsToBalances(
      tokenAccounts.value as unknown as ParsedTokenAccount[]
    );

    let valueCents = 0;
    let stockCount = 0;

    for (const token of tokenBalances) {
      if (token.uiAmount <= 0) continue;
      stockCount++;

      const price = prices[token.symbol]?.price;
      if (price) {
        valueCents += Math.round(token.uiAmount * price * 100);
      }
    }

    return { valueCents, stockCount };
  } catch (err) {
    console.error("[portfolio] Failed to compute portfolio value:", err);
    return null;
  }
}
