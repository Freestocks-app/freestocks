import { Contract, JsonRpcProvider, formatUnits } from "ethers";
import { BASE_STOCKS, USDC_ADDRESS, USDC_DECIMALS } from "@/lib/uniswap/constants";
import { ERC20_ABI } from "@/lib/uniswap/client";

export interface EvmTokenBalance {
  symbol: string;
  name: string;
  tokenSymbol: string;
  uiAmount: number;
  decimals: number;
}

/**
 * Base-chain equivalent of src/lib/wallet-balances.ts (Solana). Functions
 * here take a `provider` param rather than constructing one internally, so
 * they're unit-testable with a stub provider/Contract - no live RPC call
 * needed in tests, mirroring the existing wallet-balances.test.ts approach.
 */

/** Native ETH balance, in ETH (not wei). */
export async function getEthBalance(provider: JsonRpcProvider, address: string): Promise<number> {
  const wei = await provider.getBalance(address);
  return Number(formatUnits(wei, 18));
}

/** USDC ERC20 balance, in UI units (already divided by USDC_DECIMALS). */
export async function getUsdcBalanceEvm(provider: JsonRpcProvider, address: string): Promise<number> {
  const usdc = new Contract(USDC_ADDRESS, ERC20_ABI, provider);
  const raw = (await usdc.balanceOf(address)) as bigint;
  return Number(formatUnits(raw, USDC_DECIMALS));
}

/**
 * Balance for every BASE_STOCKS token, defaulting to 0 for unheld tokens -
 * mirrors mapTokenAccountsToBalances's shape/behavior on the Solana side.
 */
export async function getBaseStockBalances(
  provider: JsonRpcProvider,
  address: string
): Promise<EvmTokenBalance[]> {
  const balances = await Promise.all(
    BASE_STOCKS.map(async (stock) => {
      const contract = new Contract(stock.address, ERC20_ABI, provider);
      let uiAmount = 0;
      try {
        const raw = (await contract.balanceOf(address)) as bigint;
        uiAmount = Number(formatUnits(raw, stock.decimals));
      } catch {
        // A brand-new wallet with no token account for this mint yet -
        // default to 0 rather than letting one failed call break the
        // whole balance list.
        uiAmount = 0;
      }
      return {
        symbol: stock.symbol,
        name: stock.name,
        tokenSymbol: stock.tokenSymbol,
        uiAmount,
        decimals: stock.decimals,
      };
    })
  );
  return balances;
}

/** Convenience: fetches ETH, USDC, and every BASE_STOCKS balance in parallel. */
export async function fetchAllEvmBalances(
  provider: JsonRpcProvider,
  address: string
): Promise<{
  ethBalance: number;
  usdcBalance: number;
  tokenBalances: EvmTokenBalance[];
}> {
  const [ethBalance, usdcBalance, tokenBalances] = await Promise.all([
    getEthBalance(provider, address),
    getUsdcBalanceEvm(provider, address),
    getBaseStockBalances(provider, address),
  ]);
  return { ethBalance, usdcBalance, tokenBalances };
}
