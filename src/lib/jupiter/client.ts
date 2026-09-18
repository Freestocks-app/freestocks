/**
 * Jupiter Swap API (v1/Swap V2) - USDC <-> SPL token quotes and swap
 * transaction building. Called directly via fetch (no SDK), matching this
 * codebase's existing pattern for external price/quote APIs (see
 * src/lib/prices/pyth.ts). CORS is open (verified: `access-control-allow-
 * origin: *`), so this is safe to call directly from the browser.
 *
 * Unlike pyth.ts, errors here are NOT swallowed to an empty/fallback value -
 * a Trade quote or swap failure must surface to the caller, never let the UI
 * silently proceed with stale or missing data when real money is involved.
 *
 * @see https://developers.jup.ag/docs/api-reference/swap/quote
 * @see https://developers.jup.ag/docs/api-reference/swap/swap
 */

const JUPITER_QUOTE_URL = "https://api.jup.ag/swap/v1/quote";
const JUPITER_SWAP_URL = "https://api.jup.ag/swap/v1/swap";

const JUPITER_API_KEY = process.env.NEXT_PUBLIC_JUPITER_API_KEY;

function jupiterHeaders(): HeadersInit {
  return JUPITER_API_KEY ? { "x-api-key": JUPITER_API_KEY } : {};
}

export interface JupiterQuoteParams {
  inputMint: string;
  outputMint: string;
  /** Raw base-unit integer amount, as a string - never a float. */
  amount: string;
  slippageBps: number;
}

/**
 * Only the fields this app actually reads are typed explicitly; the rest of
 * Jupiter's response (routePlan, contextSlot, etc.) is passed through
 * opaquely and must be forwarded verbatim to /swap.
 */
export interface JupiterQuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  /** Minimum output after slippage - what to actually show the user. */
  otherAmountThreshold: string;
  priceImpactPct: string;
  slippageBps: number;
  [key: string]: unknown;
}

export async function getJupiterQuote(params: JupiterQuoteParams): Promise<JupiterQuoteResponse> {
  const query = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount,
    slippageBps: String(params.slippageBps),
  });

  const res = await fetch(`${JUPITER_QUOTE_URL}?${query.toString()}`, {
    headers: jupiterHeaders(),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Jupiter quote request failed: ${res.status} ${body}`.slice(0, 500));
  }

  const data = await res.json();
  if (!data || typeof data.outAmount !== "string") {
    throw new Error("Jupiter quote response missing outAmount");
  }

  return data as JupiterQuoteResponse;
}

export interface JupiterSwapParams {
  /** Pass the full quote object back unmodified. */
  quoteResponse: JupiterQuoteResponse;
  userPublicKey: string;
}

export interface JupiterSwapResponse {
  /** Base64-encoded versioned transaction. */
  swapTransaction: string;
}

export async function getJupiterSwapTransaction(
  params: JupiterSwapParams
): Promise<JupiterSwapResponse> {
  const res = await fetch(JUPITER_SWAP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...jupiterHeaders() },
    body: JSON.stringify({
      quoteResponse: params.quoteResponse,
      userPublicKey: params.userPublicKey,
      wrapAndUnwrapSol: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Jupiter swap request failed: ${res.status} ${body}`.slice(0, 500));
  }

  const data = await res.json();
  if (!data || typeof data.swapTransaction !== "string") {
    throw new Error("Jupiter swap response missing swapTransaction");
  }

  return data as JupiterSwapResponse;
}
