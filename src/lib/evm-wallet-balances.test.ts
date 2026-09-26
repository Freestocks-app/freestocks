import { describe, it, expect, vi } from "vitest";
import { parseUnits } from "ethers";
import { getEthBalance } from "./evm-wallet-balances";
import { BASE_STOCKS } from "@/lib/uniswap/constants";

const ADDRESS = "0x1111111111111111111111111111111111111111";

/** A stub JsonRpcProvider - only getBalance is used directly by our code. */
function stubProvider(ethWei: bigint) {
  return { getBalance: vi.fn().mockResolvedValue(ethWei) } as never;
}

describe("getEthBalance", () => {
  it("converts wei to ETH", async () => {
    const provider = stubProvider(parseUnits("1.5", 18));
    expect(await getEthBalance(provider, ADDRESS)).toBe(1.5);
  });

  it("returns 0 for a zero balance", async () => {
    const provider = stubProvider(BigInt(0));
    expect(await getEthBalance(provider, ADDRESS)).toBe(0);
  });
});

describe("getUsdcBalanceEvm", () => {
  it("converts raw USDC base units (6 decimals) to UI amount", async () => {
    vi.doMock("ethers", async () => {
      const actual = await vi.importActual<typeof import("ethers")>("ethers");
      return {
        ...actual,
        Contract: vi.fn().mockImplementation(function (this: unknown) {
          return { balanceOf: vi.fn().mockResolvedValue(BigInt(10_000_000)) };
        }),
      };
    });
    vi.resetModules();
    const { getUsdcBalanceEvm: freshGetUsdcBalanceEvm } = await import("./evm-wallet-balances");

    const result = await freshGetUsdcBalanceEvm({} as never, ADDRESS);
    expect(result).toBe(10);

    vi.doUnmock("ethers");
  });
});

describe("getBaseStockBalances", () => {
  it("returns every BASE_STOCKS entry, defaulting to 0 for unheld tokens", async () => {
    vi.doMock("ethers", async () => {
      const actual = await vi.importActual<typeof import("ethers")>("ethers");
      return {
        ...actual,
        Contract: vi.fn().mockImplementation(function (this: unknown) {
          return { balanceOf: vi.fn().mockResolvedValue(BigInt(0)) };
        }),
      };
    });
    vi.resetModules();
    const { getBaseStockBalances: freshGetBaseStockBalances } = await import("./evm-wallet-balances");

    const result = await freshGetBaseStockBalances({} as never, ADDRESS);

    expect(result).toHaveLength(BASE_STOCKS.length);
    expect(result.every((r) => r.uiAmount === 0)).toBe(true);
    expect(result.map((r) => r.symbol)).toEqual(BASE_STOCKS.map((s) => s.symbol));

    vi.doUnmock("ethers");
  });

  it("defaults to 0 (not a throw) when a contract call rejects", async () => {
    vi.doMock("ethers", async () => {
      const actual = await vi.importActual<typeof import("ethers")>("ethers");
      return {
        ...actual,
        Contract: vi.fn().mockImplementation(function (this: unknown) {
          return { balanceOf: vi.fn().mockRejectedValue(new Error("no token account")) };
        }),
      };
    });
    vi.resetModules();
    const { getBaseStockBalances: freshGetBaseStockBalances } = await import("./evm-wallet-balances");

    const result = await freshGetBaseStockBalances({} as never, ADDRESS);

    expect(result.every((r) => r.uiAmount === 0)).toBe(true);

    vi.doUnmock("ethers");
  });
});

describe("fetchAllEvmBalances", () => {
  it("fetches ETH, USDC, and token balances together", async () => {
    vi.doMock("ethers", async () => {
      const actual = await vi.importActual<typeof import("ethers")>("ethers");
      return {
        ...actual,
        Contract: vi.fn().mockImplementation(function (this: unknown) {
          return { balanceOf: vi.fn().mockResolvedValue(BigInt(0)) };
        }),
      };
    });
    vi.resetModules();
    const { fetchAllEvmBalances: freshFetchAllEvmBalances } = await import("./evm-wallet-balances");

    const provider = stubProvider(parseUnits("2", 18));
    const result = await freshFetchAllEvmBalances(provider, ADDRESS);

    expect(result.ethBalance).toBe(2);
    expect(result.usdcBalance).toBe(0);
    expect(result.tokenBalances).toHaveLength(BASE_STOCKS.length);

    vi.doUnmock("ethers");
  });
});
