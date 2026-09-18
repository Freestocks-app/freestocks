import { describe, it, expect } from "vitest";
import { mapTokenAccountsToBalances, getUsdcBalance } from "./wallet-balances";
import { TOP10, allCashoutStocks } from "@/lib/tokenized-stocks";
import { USDC_MINT } from "@/lib/solana-tokens";

function account(mint: string, uiAmount: number | null) {
  return {
    account: {
      data: {
        parsed: {
          info: {
            mint,
            tokenAmount: { uiAmount },
          },
        },
      },
    },
  };
}

describe("mapTokenAccountsToBalances", () => {
  it("returns every cashout-eligible stock (xStocks + PreStocks) with 0 balance when the wallet has no token accounts", () => {
    const result = mapTokenAccountsToBalances([]);
    expect(result).toHaveLength(allCashoutStocks.length);
    expect(result.every((r) => r.uiAmount === 0)).toBe(true);
  });

  it("maps a matching xStocks mint to its real balance", () => {
    const aapl = TOP10.find((s) => s.symbol === "AAPL")!;
    const result = mapTokenAccountsToBalances([account(aapl.mint, 3.5)]);
    const found = result.find((r) => r.symbol === "AAPL");
    expect(found?.uiAmount).toBe(3.5);
  });

  it("maps a matching PreStocks mint to its real balance", () => {
    const openai = allCashoutStocks.find((s) => s.symbol === "OPENAI")!;
    const result = mapTokenAccountsToBalances([account(openai.mint, 12)]);
    const found = result.find((r) => r.symbol === "OPENAI");
    expect(found?.uiAmount).toBe(12);
  });

  it("defaults null uiAmount to 0", () => {
    const aapl = TOP10.find((s) => s.symbol === "AAPL")!;
    const result = mapTokenAccountsToBalances([account(aapl.mint, null)]);
    const found = result.find((r) => r.symbol === "AAPL");
    expect(found?.uiAmount).toBe(0);
  });

  it("ignores mints not in the known cashout stock list", () => {
    const result = mapTokenAccountsToBalances([account("UnknownMintAddress111", 100)]);
    expect(result).toHaveLength(allCashoutStocks.length);
    expect(result.every((r) => r.uiAmount === 0)).toBe(true);
  });
});

describe("getUsdcBalance", () => {
  it("returns 0 when the wallet has no token accounts", () => {
    expect(getUsdcBalance([])).toBe(0);
  });

  it("returns the USDC balance when a matching account exists", () => {
    expect(getUsdcBalance([account(USDC_MINT, 42.5)])).toBe(42.5);
  });

  it("defaults null uiAmount to 0", () => {
    expect(getUsdcBalance([account(USDC_MINT, null)])).toBe(0);
  });

  it("ignores non-USDC mints", () => {
    const aapl = TOP10.find((s) => s.symbol === "AAPL")!;
    expect(getUsdcBalance([account(aapl.mint, 100)])).toBe(0);
  });
});
