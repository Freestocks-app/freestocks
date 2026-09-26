"use client";

import { useEffect, useState } from "react";
import { getProvider } from "@/lib/uniswap/client";
import { fetchAllEvmBalances, type EvmTokenBalance } from "@/lib/evm-wallet-balances";

interface UseEvmWalletBalancesResult {
  ethBalance: number | null;
  usdcBalance: number | null;
  tokenBalances: EvmTokenBalance[];
  loading: boolean;
  error: string | null;
}

interface LoadedFor {
  address: string;
  ethBalance: number;
  usdcBalance: number;
  tokenBalances: EvmTokenBalance[];
}

interface ErrorFor {
  address: string;
  message: string;
}

/** Base-chain equivalent of useWalletBalances.ts - same cancelled-flag/loaded-by-address-guard shape. */
export function useEvmWalletBalances(address: string | undefined): UseEvmWalletBalancesResult {
  const [loaded, setLoaded] = useState<LoadedFor | null>(null);
  const [errored, setErrored] = useState<ErrorFor | null>(null);

  useEffect(() => {
    if (!address) {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const provider = getProvider();
        const { ethBalance, usdcBalance, tokenBalances } = await fetchAllEvmBalances(
          provider,
          address as string
        );

        if (cancelled) return;

        setLoaded({ address: address as string, ethBalance, usdcBalance, tokenBalances });
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
    return { ethBalance: null, usdcBalance: null, tokenBalances: [], loading: false, error: null };
  }

  const isLoadedForCurrentAddress = loaded?.address === address;
  const errorForCurrentAddress = errored?.address === address ? errored.message : null;

  return {
    ethBalance: isLoadedForCurrentAddress ? loaded!.ethBalance : null,
    usdcBalance: isLoadedForCurrentAddress ? loaded!.usdcBalance : null,
    tokenBalances: isLoadedForCurrentAddress ? loaded!.tokenBalances : [],
    loading: !isLoadedForCurrentAddress && !errorForCurrentAddress,
    error: errorForCurrentAddress,
  };
}
