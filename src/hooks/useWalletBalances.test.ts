import { describe, it, expect } from "vitest";
import { mapTokenAccountsToBalances } from "./useWalletBalances";
import { TOP10 } from "@/lib/tokenized-stocks";

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
  it("returns all 10 stocks with 0 balance when the wallet has no token accounts", () => {
    const result = mapTokenAccountsToBalances([]);
    expect(result).toHaveLength(10);
    expect(result.every((r) => r.uiAmount === 0)).toBe(true);
  });

  it("maps a matching mint to its real balance", () => {
    const aapl = TOP10.find((s) => s.symbol === "AAPL")!;
    const result = mapTokenAccountsToBalances([account(aapl.mint, 3.5)]);
    const found = result.find((r) => r.symbol === "AAPL");
    expect(found?.uiAmount).toBe(3.5);
  });

  it("defaults null uiAmount to 0", () => {
    const aapl = TOP10.find((s) => s.symbol === "AAPL")!;
    const result = mapTokenAccountsToBalances([account(aapl.mint, null)]);
    const found = result.find((r) => r.symbol === "AAPL");
    expect(found?.uiAmount).toBe(0);
  });

  it("ignores mints not in the xStocks list", () => {
    const result = mapTokenAccountsToBalances([account("UnknownMintAddress111", 100)]);
    expect(result).toHaveLength(10);
    expect(result.every((r) => r.uiAmount === 0)).toBe(true);
  });
});
