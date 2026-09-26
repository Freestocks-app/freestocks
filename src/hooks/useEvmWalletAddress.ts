"use client";

import { usePrivy } from "@privy-io/react-auth";

/**
 * The user's verified embedded EVM wallet address, or undefined if none
 * exists yet. Mirrors useSolanaWalletAddress.ts exactly, filtering
 * chainType "ethereum" instead of "solana" - same underlying
 * user.linkedAccounts shape, one Privy account can hold both wallet types.
 */
export function useEvmWalletAddress(): string | undefined {
  const { user } = usePrivy();

  const evmWallet = user?.linkedAccounts?.find(
    (account) =>
      account.type === "wallet" &&
      "chainType" in account &&
      (account as { chainType?: string }).chainType === "ethereum" &&
      "walletClientType" in account &&
      (account as { walletClientType?: string }).walletClientType === "privy"
  );

  return evmWallet && "address" in evmWallet
    ? (evmWallet as { address: string }).address
    : undefined;
}
