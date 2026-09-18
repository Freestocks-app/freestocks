/**
 * Non-xStock Solana token constants needed for Trade/Send (USDC as the
 * quote currency, wrapped SOL as a Jupiter routing leg). Kept separate from
 * `tokenized-stocks.ts`, which is scoped to xStocks/PreStocks only.
 */

export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDC_DECIMALS = 6;

/** Wrapped SOL mint - used as a Jupiter routing leg, not for display. */
export const NATIVE_SOL_MINT = "So11111111111111111111111111111111111111";
export const SOL_DECIMALS = 9;
