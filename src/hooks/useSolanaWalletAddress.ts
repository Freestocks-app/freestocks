"use client";

import { usePrivy } from "@privy-io/react-auth";

/**
 * The user's verified embedded Solana wallet address, or undefined if none
 * exists yet. Shared lookup used by Trade, Onramp, and Send/Receive (and
 * originally duplicated ad hoc in WalletConnectPrompt/PrivyUnlockFlow).
 */
export function useSolanaWalletAddress(): string | undefined {
  const { user } = usePrivy();

  const solanaWallet = user?.linkedAccounts?.find(
    (account) =>
      account.type === "wallet" &&
      "chainType" in account &&
      (account as { chainType?: string }).chainType === "solana" &&
      "walletClientType" in account &&
      (account as { walletClientType?: string }).walletClientType === "privy"
  );

  return solanaWallet && "address" in solanaWallet
    ? (solanaWallet as { address: string }).address
    : undefined;
}
