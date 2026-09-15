"use client";

import { useEffect, useState } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOP10 } from "@/lib/tokenized-stocks";

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

export interface TokenBalance {
  symbol: string;
  name: string;
  logo: string;
  uiAmount: number;
}

interface ParsedTokenAccount {
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
 * against the known xStocks mint list, defaulting to 0 for any mint the
 * wallet has no token account for yet.
 */
export function mapTokenAccountsToBalances(accounts: ParsedTokenAccount[]): TokenBalance[] {
  const byMint = new Map<string, number>();
  for (const { account } of accounts) {
    const { mint, tokenAmount } = account.data.parsed.info;
    byMint.set(mint, tokenAmount.uiAmount ?? 0);
  }

  return TOP10.map((stock) => ({
    symbol: stock.symbol,
    name: stock.name,
    logo: stock.logo,
    uiAmount: byMint.get(stock.mint) ?? 0,
  }));
}

interface UseWalletBalancesResult {
  solBalance: number | null;
  tokenBalances: TokenBalance[];
  loading: boolean;
  error: string | null;
}

interface LoadedFor {
  address: string;
  solBalance: number;
  tokenBalances: TokenBalance[];
}

interface ErrorFor {
  address: string;
  message: string;
}

export function useWalletBalances(address: string | undefined): UseWalletBalancesResult {
  const [loaded, setLoaded] = useState<LoadedFor | null>(null);
  const [errored, setErrored] = useState<ErrorFor | null>(null);

  useEffect(() => {
    if (!address) {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const connection = new Connection(SOLANA_RPC_URL);
        const owner = new PublicKey(address as string);

        const [lamports, tokenAccounts] = await Promise.all([
          connection.getBalance(owner),
          connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }),
        ]);

        if (cancelled) return;

        setLoaded({
          address: address as string,
          solBalance: lamports / LAMPORTS_PER_SOL,
          tokenBalances: mapTokenAccountsToBalances(tokenAccounts.value as unknown as ParsedTokenAccount[]),
        });
      } catch {
        if (!cancelled) {
          setErrored({ address: address as string, message: "Couldn't load wallet balances. Please try again." });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [address]);

  if (!address) {
    return { solBalance: null, tokenBalances: [], loading: false, error: null };
  }

  const isLoadedForCurrentAddress = loaded?.address === address;
  const errorForCurrentAddress = errored?.address === address ? errored.message : null;

  return {
    solBalance: isLoadedForCurrentAddress ? loaded!.solBalance : null,
    tokenBalances: isLoadedForCurrentAddress ? loaded!.tokenBalances : [],
    loading: !isLoadedForCurrentAddress && !errorForCurrentAddress,
    error: errorForCurrentAddress,
  };
}
