/**
 * Uniswap v3 on Base mainnet (chainId 8453) - trading Coinbase's own
 * tokenized US equities (Base's "B20" tokens, e.g. AAPLc, TSLAc, NVDAc)
 * against native USDC. All Uniswap contract addresses below were verified
 * two ways: (1) sourced directly from Uniswap's own `sdks` GitHub repo
 * (`sdks/sdk-core/src/addresses.ts`, `BASE_ADDRESSES`), not scraped from a
 * block explorer; (2) cross-checked by comparing on-chain bytecode (via
 * RPC eth_getCode) against the equivalent, independently-confirmed
 * Ethereum Sepolia deployment - identical byte length, every differing
 * byte traces to a known cross-chain constant (deployed address,
 * dependency addresses), never an unexplained difference in actual logic.
 *
 * Tokenized stock addresses were extracted directly from base.org/stocks'
 * raw HTML (aria-label attributes pairing each ticker with its address),
 * then confirmed live on-chain via decimals() calls (all return 8).
 *
 * @see https://www.base.org/stocks
 * @see https://github.com/Uniswap/sdks/blob/main/sdks/sdk-core/src/addresses.ts
 */

import { xstockLogo } from "@/lib/tokenized-stocks";

export const BASE_CHAIN_ID = 8453;

export const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org";

export const BASE_BLOCK_EXPLORER = "https://basescan.org";

export const UNISWAP_V3_FACTORY = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";
export const UNISWAP_SWAP_ROUTER_02 = "0x2626664c2603336E57B271c5C0b26F421741e481";
export const UNISWAP_QUOTER_V2 = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
export const UNISWAP_NONFUNGIBLE_POSITION_MANAGER = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1";

/** Native USDC on Base, issued directly by Circle (not the bridged USDbC). */
export const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const USDC_DECIMALS = 6;

/**
 * Coinbase-issued tokenized US equities on Base ("B20" tokens). Decimals
 * verified live via on-chain decimals() calls - all return 8, NOT the
 * usual 18 for an ERC20 - do not assume 18.
 *
 * `poolFee` is NOT a guess or a uniform default - each value was found by
 * actually calling QuoterV2.quoteExactInputSingle live against Base
 * mainnet across every standard fee tier (100, 500, 3000, 10000) and
 * recording which one succeeds. Factory.getPool() alone is NOT sufficient
 * verification: several stocks have a pool contract deployed at more than
 * one fee tier, but only one of those pools actually has enough live
 * liquidity to serve a quote - the others revert ("Unexpected error" /
 * "SPL") despite existing. TSLA has no quotable pool at any standard tier
 * and is deliberately excluded from this list, not just untested.
 */
export interface BaseStock {
  symbol: string;
  name: string;
  tokenSymbol: string;
  address: string;
  decimals: number;
  /** The one fee tier (in hundredths of a bip) confirmed to actually serve a live quote. */
  poolFee: number;
  /**
   * PLACEHOLDER for the hackathon demo only: Coinbase's own base.org/stocks
   * page has no logo image for any individual stock (confirmed by reading
   * its raw HTML directly - each stock renders as a plain colored text
   * badge, e.g. "AAPLc", no <img> anywhere). Reusing xStocks' (Backed.fi's)
   * logo CDN here is a different issuer's branding, not Coinbase's - this
   * is a deliberate, explicit hackathon-only shortcut, not a permanent
   * choice. Replace with real Coinbase/B20 branding if this ships further.
   */
  logo: string;
}

export const BASE_STOCKS: BaseStock[] = [
  { symbol: "AAPL", name: "Apple", tokenSymbol: "AAPLc", address: "0xb200000000000000000000C2e324d24d7eEcd1fb", decimals: 8, poolFee: 3000, logo: xstockLogo("AAPLx") },
  { symbol: "NVDA", name: "NVIDIA", tokenSymbol: "NVDAc", address: "0xb20000000000000000000078ee7ce2fE4908108C", decimals: 8, poolFee: 3000, logo: xstockLogo("NVDAx") },
  { symbol: "META", name: "Meta", tokenSymbol: "METAc", address: "0xb2000000000000000000008bC8786B856E61707C", decimals: 8, poolFee: 3000, logo: xstockLogo("METAx") },
  { symbol: "GOOGL", name: "Alphabet", tokenSymbol: "GOOGLc", address: "0xb2000000000000000000002D0BA3164cc74f58B7", decimals: 8, poolFee: 3000, logo: xstockLogo("GOOGLx") },
  { symbol: "MSFT", name: "Microsoft", tokenSymbol: "MSFTc", address: "0xB200000000000000000000Ab99cFa739E253872B", decimals: 8, poolFee: 10000, logo: xstockLogo("MSFTx") },
  { symbol: "AMZN", name: "Amazon", tokenSymbol: "AMZNc", address: "0xb200000000000000000000d9192b6B456483C2E8", decimals: 8, poolFee: 10000, logo: xstockLogo("AMZNx") },
];

/**
 * NOT included in BASE_STOCKS: TSLAc
 * (0xb2000000000000000000001e800a7f5189430cD0) exists on-chain
 * (decimals() returns 8) but has no live-quotable Uniswap v3 pool against
 * USDC at any of the 100/500/3000/10000 fee tiers as of this check -
 * confirmed by calling QuoterV2 directly, every tier reverts. Re-verify
 * before re-adding rather than assuming this has changed.
 */
export const EXCLUDED_NO_LIQUIDITY = ["TSLA"];
