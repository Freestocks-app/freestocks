/**
 * On-chain SPL token amount conversions. The equivalent of this codebase's
 * integer-cents rule (see AGENTS.md) for Solana amounts: raw base units
 * (bigint) only in swap/send math, human-readable numbers only at the UI
 * edge. Never use floats for on-chain amounts - floating point cannot
 * represent base-unit integers exactly once decimals get large (SOL has 9,
 * xStocks have 8), and a rounding error here moves real money.
 */

/**
 * Converts a human-entered amount string (e.g. "25.5") into raw base units.
 * Truncates (does not round) any precision beyond `decimals` - a swap must
 * never send more than the user actually typed.
 */
export function toBaseUnits(uiAmount: string, decimals: number): bigint {
  const trimmed = uiAmount.trim();
  if (!trimmed || !/^\d*\.?\d*$/.test(trimmed) || trimmed === ".") {
    throw new Error(`Invalid amount: "${uiAmount}"`);
  }

  const [wholePart, fractionalPart = ""] = trimmed.split(".");
  const paddedFraction = (fractionalPart + "0".repeat(decimals)).slice(0, decimals);
  const combined = `${wholePart || "0"}${paddedFraction}`;

  return BigInt(combined);
}

/** Converts raw base units back into a human-readable number for display. */
export function fromBaseUnits(raw: bigint | string, decimals: number): number {
  const value = typeof raw === "bigint" ? raw : BigInt(raw);
  const divisor = 10 ** decimals;
  return Number(value) / divisor;
}
