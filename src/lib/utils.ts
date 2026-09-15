/**
 * Format cents to a dollar string with two decimal places.
 * @param cents - Integer cents (e.g., 1234 = $12.34)
 * @returns Formatted string like "$12.34"
 */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Format cents to a dollar string without the $ symbol.
 * @param cents - Integer cents
 * @returns Formatted string like "12.34"
 */
export function formatCentsRaw(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Convert dollars to cents (integer).
 * @param dollars - Dollar amount (e.g., 12.34)
 * @returns Integer cents (e.g., 1234)
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Validate a Solana base58 address.
 * Solana addresses are 32-44 characters, base58 encoded (no 0, O, I, l).
 * @param address - The address string to validate
 * @returns true if valid Solana address format
 */
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * Validate an Ethereum/EVM address (0x + 40 hex chars).
 * @param address - The address string to validate
 * @returns true if valid EVM address format
 */
export function isValidEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate either Solana or EVM wallet address.
 * @param address - The address string to validate
 * @returns true if valid wallet address format
 */
export function isValidWalletAddress(address: string): boolean {
  return isValidSolanaAddress(address) || isValidEvmAddress(address);
}

export const QA_BYPASS_COOKIE = "fs_qa_bypass";

/**
 * Check if the app is in "Coming Soon" mode.
 * Production sets NEXT_PUBLIC_COMING_SOON=true to gate the sign-up flow.
 * Preview/Development deployments leave it unset to keep the full app usable.
 *
 * The gate can be bypassed per-browser via the QA_BYPASS_COOKIE, set by
 * visiting the hidden, Basic-Auth-protected QA path (see middleware.ts) —
 * this lets a tester reach /sign-in, /sign-up etc. on production without
 * making the public landing page's sign-up CTA live for everyone else.
 */
export function isComingSoon(): boolean {
  if (process.env.NEXT_PUBLIC_COMING_SOON !== "true") {
    return false;
  }
  if (typeof document !== "undefined" && document.cookie.includes(`${QA_BYPASS_COOKIE}=1`)) {
    return false;
  }
  return true;
}
