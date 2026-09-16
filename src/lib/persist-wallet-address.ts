/**
 * Fire-and-forget persistence of a just-verified Solana wallet address, so
 * it's available server-side on future page loads (e.g. for the header's
 * portfolio value) without requiring a fresh Privy session every time.
 * Never throws - failure here must never block the wallet/redeem flow the
 * user is already in the middle of.
 */
export function persistWalletAddress(address: string): void {
  fetch("/api/user/wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  }).catch((err) => {
    console.error("Failed to persist wallet address:", err);
  });
}
