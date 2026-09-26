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

/** Public marketing hosts that stay on the Coming Soon LP when the flag is on. */
export const COMING_SOON_HOSTS = new Set(["freestocks.app", "www.freestocks.app"]);

/**
 * The ETHGlobal Tokyo demo domain - a separate alias on the same
 * Production deployment (same DB, same everything) as www/demo, kept
 * distinct only so the two hackathon submissions don't visibly share a
 * demo link. On this host only, the Trade screen defaults to/leads with
 * the Ethereum (Base/Uniswap) side rather than Solana - everywhere else
 * (www.freestocks.app, demo.freestocks.app, local dev) stays Solana-first
 * for the Stocklana submission.
 */
export const ETHGLOBAL_DEMO_HOST = "demo-hack.freestocks.app";

// TEMP-DEMO-RECORDING-MOCK: force every host to render as the ETHGlobal
// demo (Base) screen, for recording on a Vercel Preview URL while
// demo-hack.freestocks.app's Privy origin approval is still propagating.
// MUST be reverted to `false` (or the whole block removed) before this
// file is ever committed/pushed again.
const FORCE_ETHGLOBAL_DEMO_FOR_RECORDING = true;

export function isEthGlobalDemoHost(hostname: string): boolean {
  if (FORCE_ETHGLOBAL_DEMO_FOR_RECORDING) {
    return true;
  }
  const host = hostname.split(":")[0]?.toLowerCase() ?? "";
  return host === ETHGLOBAL_DEMO_HOST;
}

/**
 * True when this hostname should show the Coming Soon LP.
 * demo.freestocks.app, *.vercel.app, localhost stay full-app even if
 * NEXT_PUBLIC_COMING_SOON=true on Production.
 */
export function isComingSoonHost(hostname: string): boolean {
  const host = hostname.split(":")[0]?.toLowerCase() ?? "";
  return COMING_SOON_HOSTS.has(host);
}

/**
 * Check if the app is in "Coming Soon" mode.
 * Production sets NEXT_PUBLIC_COMING_SOON=true to gate signup on the public
 * marketing domain only (freestocks.app / www). Judge/demo hosts like
 * demo.freestocks.app and vercel.app aliases stay fully open.
 *
 * The gate can be bypassed per-browser via the QA_BYPASS_COOKIE, set by
 * visiting the hidden, Basic-Auth-protected QA path (see middleware.ts).
 *
 * Coming Soon is shown ONLY if the flag is true AND the host is one of
 * COMING_SOON_HOSTS. A missing/unknown host never defaults to Coming
 * Soon - it defaults to the full app, same as an unlisted host.
 *
 * - Client Components: omit `hostname` - falls back to
 *   window.location.hostname automatically.
 * - Server Components: MUST pass `hostname` explicitly (e.g. from
 *   headers().get("host") in next/headers) - there is no window here,
 *   so without it this always resolves as "full app", never Coming Soon.
 */
export function isComingSoon(hostname?: string): boolean {
  if (process.env.NEXT_PUBLIC_COMING_SOON !== "true") {
    return false;
  }

  if (typeof document !== "undefined" && document.cookie.includes(`${QA_BYPASS_COOKIE}=1`)) {
    return false;
  }

  const host = hostname ?? (typeof window !== "undefined" ? window.location.hostname : undefined);
  if (!host) {
    return false;
  }

  return isComingSoonHost(host);
}
