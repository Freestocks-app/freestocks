import { allCashoutStocks, type Issuer } from "@/lib/tokenized-stocks";
import { USDC_MINT } from "@/lib/solana-tokens";

export const TOKEN_PROGRAM_ID_STRING = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

export interface TokenBalance {
  symbol: string;
  name: string;
  logo: string;
  issuer: Issuer;
  uiAmount: number;
}

export interface ParsedTokenAccount {
  account: {
    data: {
      parsed: {
        info: {
          mint: string;
          tokenAmount: {
            uiAmount: number | null;
          };
        };
      };
    };
  };
}

/**
 * Map raw parsed SPL token accounts (from getParsedTokenAccountsByOwner)
 * against every known cashout-eligible mint (xStocks + PreStocks),
 * defaulting to 0 for any mint the wallet has no token account for yet.
 *
 * Kept in a plain (non "use client") module so it can be reused both
 * client-side (useWalletBalances.ts) and server-side (the header's
 * portfolio value calculation, src/server/wallet/portfolio.ts).
 */
export function mapTokenAccountsToBalances(accounts: ParsedTokenAccount[]): TokenBalance[] {
  const byMint = new Map<string, number>();
  for (const { account } of accounts) {
    const { mint, tokenAmount } = account.data.parsed.info;
    byMint.set(mint, tokenAmount.uiAmount ?? 0);
  }

  return allCashoutStocks.map((stock) => ({
    symbol: stock.symbol,
    name: stock.name,
    logo: stock.logo,
    issuer: stock.issuer,
    uiAmount: byMint.get(stock.mint) ?? 0,
  }));
}

/**
 * USDC balance from the same parsed token accounts response - not part of
 * `allCashoutStocks` (that list is "cashout-eligible stocks," not "every
 * wallet asset"), so it's read out separately rather than folded in there.
 */
export function getUsdcBalance(accounts: ParsedTokenAccount[]): number {
  for (const { account } of accounts) {
    const { mint, tokenAmount } = account.data.parsed.info;
    if (mint === USDC_MINT) {
      return tokenAmount.uiAmount ?? 0;
    }
  }
  return 0;
}
