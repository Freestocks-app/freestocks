import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ORIGINAL_FETCH = global.fetch;

describe("fetchPreStocksPrices", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.unstubAllGlobals();
  });

  it("maps featured PreStocks symbols to their tokenPrice", async () => {
    const { fetchPreStocksPrices } = await import("./prestocks");

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => [
        { symbol: "OPENAI", tokenPrice: 1083.05 },
        { symbol: "ANTHROPIC", tokenPrice: 965.17 },
        { symbol: "KALSHI", tokenPrice: 848.0 },
      ],
    });

    const result = await fetchPreStocksPrices();

    expect(result.OPENAI.price).toBe(1083.05);
    expect(result.ANTHROPIC.price).toBe(965.17);
  });

  it("ignores symbols not in the featured set", async () => {
    const { fetchPreStocksPrices } = await import("./prestocks");

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => [{ symbol: "KALSHI", tokenPrice: 848.0 }],
    });

    const result = await fetchPreStocksPrices();

    expect(result.KALSHI).toBeUndefined();
  });

  it("always returns changePercent 0 (PreStocks has no 24h change data)", async () => {
    const { fetchPreStocksPrices } = await import("./prestocks");

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => [{ symbol: "OPENAI", tokenPrice: 1083.05 }],
    });

    const result = await fetchPreStocksPrices();

    expect(result.OPENAI.changePercent).toBe(0);
  });

  it("returns {} when the API responds non-200", async () => {
    const { fetchPreStocksPrices } = await import("./prestocks");
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });

    const result = await fetchPreStocksPrices();

    expect(result).toEqual({});
  });

  it("returns {} when fetch throws", async () => {
    const { fetchPreStocksPrices } = await import("./prestocks");
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network error"));

    const result = await fetchPreStocksPrices();

    expect(result).toEqual({});
  });

  it("skips entries with a non-finite or non-positive price", async () => {
    const { fetchPreStocksPrices } = await import("./prestocks");

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => [
        { symbol: "OPENAI", tokenPrice: NaN },
        { symbol: "ANTHROPIC", tokenPrice: -5 },
      ],
    });

    const result = await fetchPreStocksPrices();

    expect(result.OPENAI).toBeUndefined();
    expect(result.ANTHROPIC).toBeUndefined();
  });
});
