/**
 * Uniswap v3 quote + swap-transaction-building for Base mainnet. Direct
 * contract calls via ethers (no Trading API key) - matches this
 * codebase's existing pattern of calling external protocols directly
 * rather than through a hosted API (see src/lib/jupiter/client.ts for the
 * Solana-side equivalent).
 *
 * Unlike jupiter/client.ts, this never touches an HTTP API of Uniswap's -
 * it's pure on-chain reads (Quoter) and unsigned-transaction building
 * (SwapRouter02). Signing/sending happens in the UI layer via Privy's
 * useSendTransaction.
 */

import { Contract, JsonRpcProvider, Interface, type TransactionRequest } from "ethers";
import {
  BASE_RPC_URL,
  UNISWAP_QUOTER_V2,
  UNISWAP_SWAP_ROUTER_02,
} from "./constants";

const QUOTER_V2_ABI = [
  "function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
];

const SWAP_ROUTER_02_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)",
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
];

let provider: JsonRpcProvider | null = null;
/** Shared singleton provider - reused by evm-wallet-balances.ts too, don't construct a second instance. */
export function getProvider(): JsonRpcProvider {
  if (!provider) {
    provider = new JsonRpcProvider(BASE_RPC_URL, undefined, { staticNetwork: true });
  }
  return provider;
}

export interface UniswapQuoteParams {
  tokenIn: string;
  tokenOut: string;
  /** Raw base-unit integer amount, as a string - never a float. */
  amountIn: string;
  fee: number;
}

export interface UniswapQuoteResult {
  amountOut: string;
  gasEstimate: string;
}

/**
 * Reads a live quote from QuoterV2. This is a read-only eth_call - it
 * never requires a signer and never costs gas, even though QuoterV2 is
 * technically a state-mutating function on-chain (it works by reverting
 * with the result; ethers' `.staticCall`/read pattern via a Contract with
 * only a provider handles this correctly).
 */
export async function getUniswapQuote(params: UniswapQuoteParams): Promise<UniswapQuoteResult> {
  const quoter = new Contract(UNISWAP_QUOTER_V2, QUOTER_V2_ABI, getProvider());

  const result = await quoter.quoteExactInputSingle.staticCall({
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    amountIn: BigInt(params.amountIn),
    fee: params.fee,
    sqrtPriceLimitX96: BigInt(0),
  });

  return {
    amountOut: (result[0] as bigint).toString(),
    gasEstimate: (result[3] as bigint).toString(),
  };
}

/** Checks the current ERC20 allowance a wallet has granted to SwapRouter02. */
export async function getSwapRouterAllowance(token: string, owner: string): Promise<bigint> {
  const erc20 = new Contract(token, ERC20_ABI, getProvider());
  return (await erc20.allowance(owner, UNISWAP_SWAP_ROUTER_02)) as bigint;
}

/** Builds an unsigned approve() transaction for the token to allow SwapRouter02 to spend it. */
export function buildApproveTransaction(token: string, amount: string): TransactionRequest {
  const iface = new Interface(ERC20_ABI);
  const data = iface.encodeFunctionData("approve", [UNISWAP_SWAP_ROUTER_02, BigInt(amount)]);
  return { to: token, data };
}

export interface UniswapSwapParams {
  tokenIn: string;
  tokenOut: string;
  fee: number;
  recipient: string;
  amountIn: string;
  /** Minimum acceptable output, in raw base units - the slippage floor. */
  amountOutMinimum: string;
}

/**
 * Builds an unsigned swap transaction against SwapRouter02. Does not sign
 * or send - the caller (UI layer) does that via the connected wallet.
 * SwapRouter02's exactInputSingle has no `deadline` field (unlike the
 * original SwapRouter) - confirmed from the installed
 * @uniswap/swap-router-contracts IV3SwapRouter ABI directly.
 */
export function buildSwapTransaction(params: UniswapSwapParams): TransactionRequest {
  const iface = new Interface(SWAP_ROUTER_02_ABI);
  const data = iface.encodeFunctionData("exactInputSingle", [
    {
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      fee: params.fee,
      recipient: params.recipient,
      amountIn: BigInt(params.amountIn),
      amountOutMinimum: BigInt(params.amountOutMinimum),
      sqrtPriceLimitX96: BigInt(0),
    },
  ]);
  return { to: UNISWAP_SWAP_ROUTER_02, data };
}
