import { describe, it, expect } from "vitest";
import { TOP10, preStocksFeatured, allCashoutStocks, allPriceSymbols, getIssuerBadge } from "./tokenized-stocks";

describe("tokenized-stocks", () => {
  it("preStocksFeatured has unique mints", () => {
    const mints = preStocksFeatured.map((s) => s.mint);
    expect(new Set(mints).size).toBe(mints.length);
  });

  it("preStocksFeatured has unique symbols", () => {
    const symbols = preStocksFeatured.map((s) => s.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it("preStocksFeatured mints don't collide with TOP10 mints", () => {
    const top10Mints = new Set(TOP10.map((s) => s.mint));
    for (const stock of preStocksFeatured) {
      expect(top10Mints.has(stock.mint)).toBe(false);
    }
  });

  it("preStocksFeatured symbols don't collide with TOP10 symbols", () => {
    const top10Symbols = new Set(TOP10.map((s) => s.symbol));
    for (const stock of preStocksFeatured) {
      expect(top10Symbols.has(stock.symbol)).toBe(false);
    }
  });

  it("every preStocksFeatured entry is tagged issuer: prestocks", () => {
    for (const stock of preStocksFeatured) {
      expect(stock.issuer).toBe("prestocks");
    }
  });

  it("every TOP10 entry is tagged issuer: xstocks", () => {
    for (const stock of TOP10) {
      expect(stock.issuer).toBe("xstocks");
    }
  });

  it("allCashoutStocks combines both issuer families", () => {
    expect(allCashoutStocks.length).toBe(TOP10.length + preStocksFeatured.length);
  });

  it("allPriceSymbols includes both xStocks and PreStocks symbols", () => {
    expect(allPriceSymbols).toContain("AAPL");
    expect(allPriceSymbols).toContain("OPENAI");
    expect(allPriceSymbols).toContain("ANTHROPIC");
    expect(allPriceSymbols.length).toBe(allCashoutStocks.length);
  });

  it("getIssuerBadge returns distinct output per issuer", () => {
    const xstocksBadge = getIssuerBadge("xstocks");
    const prestocksBadge = getIssuerBadge("prestocks");

    expect(xstocksBadge.name).not.toBe(prestocksBadge.name);
    expect(xstocksBadge.color).not.toBe(prestocksBadge.color);
  });
});
