"use client";

import { useEffect, useRef } from "react";
import { usePrivy, useCreateWallet } from "@privy-io/react-auth";

/**
 * The user's verified embedded EVM wallet address, or undefined if none
 * exists yet. Mirrors useSolanaWalletAddress.ts exactly, filtering
 * chainType "ethereum" instead of "solana" - same underlying
 * user.linkedAccounts shape, one Privy account can hold both wallet types.
 *
 * `embeddedWallets.ethereum.createOnLogin: "all-users"` (PrivyProvider.tsx)
 * only creates the wallet at the moment of login - accounts that were
 * already logged in before EVM support was added (pre-dating this
 * config) never got one and never will just by revisiting the page. This
 * hook covers that gap by calling createWallet() once, client-side, if
 * the user is authenticated but has no EVM wallet yet.
 */
// TEMP-DEMO-RECORDING-MOCK: hardcoded fake address so the Base cashout UI
// can be screen-recorded while Privy's demo-hack.freestocks.app origin
// approval is still propagating. MUST be reverted to `null` (or the whole
// block removed) before this file is ever committed/pushed again.
const RECORDING_MOCK_ADDRESS: string | null = "0x000000000000000000000000000000000000dEaD";

export function useEvmWalletAddress(): string | undefined {
  const { user, ready, authenticated } = usePrivy();
  const { createWallet } = useCreateWallet();
  const attemptedRef = useRef(false);

  const evmWallet = user?.linkedAccounts?.find(
    (account) =>
      account.type === "wallet" &&
      "chainType" in account &&
      (account as { chainType?: string }).chainType === "ethereum" &&
      "walletClientType" in account &&
      (account as { walletClientType?: string }).walletClientType === "privy"
  );

  const address =
    evmWallet && "address" in evmWallet ? (evmWallet as { address: string }).address : undefined;

  useEffect(() => {
    if (!ready || !authenticated || address || attemptedRef.current) return;
    attemptedRef.current = true;
    createWallet().catch(() => {
      // Backfill best-effort - if this fails (e.g. wallet already exists
      // in a race, or a transient error), the user stays on the "Setting
      // up your Base wallet…" state and can retry by reloading.
    });
  }, [ready, authenticated, address, createWallet]);

  if (RECORDING_MOCK_ADDRESS) {
    return RECORDING_MOCK_ADDRESS;
  }

  return address;
}
