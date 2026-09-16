import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ORIGINAL_ENV = process.env.PYTH_API_KEY;

describe("fetchPythPrices", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.PYTH_API_KEY = ORIGINAL_ENV;
  });

  it("returns {} without calling fetch when PYTH_API_KEY is unset", async () => {
    delete process.env.PYTH_API_KEY;
    const { fetchPythPrices } = await import("./pyth");

    const result = await fetchPythPrices(["AAPL"]);

    expect(result).toEqual({});
    expect(fetch).not.toHaveBeenCalled();
  });

  it("converts price * 10^expo correctly for a mocked Hermes response", async () => {
    process.env.PYTH_API_KEY = "test-key";
    const { fetchPythPrices, PYTH_FEED_IDS } = await import("./pyth");

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        parsed: [
          {
            id: PYTH_FEED_IDS.AAPL,
            price: { price: "15000000000", expo: -8, publish_time: 1700000000 },
          },
        ],
      }),
    });

    const result = await fetchPythPrices(["AAPL"]);

    expect(result.AAPL.price).toBeCloseTo(150.0, 5);
    expect(result.AAPL.publishTime).toBe(1700000000);
  });

  it("handles a negative-price-shaped exponent for a different symbol", async () => {
    process.env.PYTH_API_KEY = "test-key";
    const { fetchPythPrices, PYTH_FEED_IDS } = await import("./pyth");

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        parsed: [
          {
            id: PYTH_FEED_IDS.TSLA,
            price: { price: "42050000", expo: -5, publish_time: 1700000001 },
          },
        ],
      }),
    });

    const result = await fetchPythPrices(["TSLA"]);

    expect(result.TSLA.price).toBeCloseTo(420.5, 5);
  });

  it("returns {} when Hermes responds non-200", async () => {
    process.env.PYTH_API_KEY = "test-key";
    const { fetchPythPrices } = await import("./pyth");

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });

    const result = await fetchPythPrices(["AAPL"]);

    expect(result).toEqual({});
  });

  it("returns {} when Hermes returns an empty parsed array", async () => {
    process.env.PYTH_API_KEY = "test-key";
    const { fetchPythPrices } = await import("./pyth");

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ parsed: [] }),
    });

    const result = await fetchPythPrices(["AAPL"]);

    expect(result).toEqual({});
  });

  it("returns {} when fetch throws", async () => {
    process.env.PYTH_API_KEY = "test-key";
    const { fetchPythPrices } = await import("./pyth");

    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network error"));

    const result = await fetchPythPrices(["AAPL"]);

    expect(result).toEqual({});
  });

  it("returns {} for symbols with no known feed ID", async () => {
    process.env.PYTH_API_KEY = "test-key";
    const { fetchPythPrices } = await import("./pyth");

    const result = await fetchPythPrices(["UNKNOWN_SYMBOL"]);

    expect(result).toEqual({});
    expect(fetch).not.toHaveBeenCalled();
  });
});
