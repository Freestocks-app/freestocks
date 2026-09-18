"use client";

import { useEffect, useState } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  mapTokenAccountsToBalances,
  getUsdcBalance,
  SOLANA_RPC_URL,
  TOKEN_PROGRAM_ID_STRING,
  type TokenBalance,
  type ParsedTokenAccount,
} from "@/lib/wallet-balances";

const TOKEN_PROGRAM_ID = new PublicKey(TOKEN_PROGRAM_ID_STRING);

interface UseWalletBalancesResult {
  solBalance: number | null;
  usdcBalance: number | null;
  tokenBalances: TokenBalance[];
  loading: boolean;
  error: string | null;
}

interface LoadedFor {
  address: string;
  solBalance: number;
  usdcBalance: number;
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

        const accounts = tokenAccounts.value as unknown as ParsedTokenAccount[];
        setLoaded({
          address: address as string,
          solBalance: lamports / LAMPORTS_PER_SOL,
          usdcBalance: getUsdcBalance(accounts),
          tokenBalances: mapTokenAccountsToBalances(accounts),
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
    return { solBalance: null, usdcBalance: null, tokenBalances: [], loading: false, error: null };
  }

  const isLoadedForCurrentAddress = loaded?.address === address;
  const errorForCurrentAddress = errored?.address === address ? errored.message : null;

  return {
    solBalance: isLoadedForCurrentAddress ? loaded!.solBalance : null,
    usdcBalance: isLoadedForCurrentAddress ? loaded!.usdcBalance : null,
    tokenBalances: isLoadedForCurrentAddress ? loaded!.tokenBalances : [],
    loading: !isLoadedForCurrentAddress && !errorForCurrentAddress,
    error: errorForCurrentAddress,
  };
}
