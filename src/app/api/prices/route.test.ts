import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { TOP10 } from "@/lib/tokenized-stocks";

vi.mock("@/lib/prices/pyth", () => ({
  fetchPythPrices: vi.fn(),
}));

vi.mock("@/lib/prices/prestocks", () => ({
  fetchPreStocksPrices: vi.fn(),
}));

const ORIGINAL_FETCH = global.fetch;

function makeRequest(url = "https://example.com/api/prices"): NextRequest {
  return new NextRequest(url);
}

describe("GET /api/prices", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("prefers the Pyth price when available, but still uses DexScreener for changePercent", async () => {
    const { fetchPythPrices } = await import("@/lib/prices/pyth");
    (fetchPythPrices as ReturnType<typeof vi.fn>).mockResolvedValue({
      AAPL: { price: 150.0, publishTime: 1700000000 },
    });

    (fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
      if (url.includes(TOP10[0].mint)) {
        return {
          ok: true,
          json: async () => [{ priceUsd: "148.50", priceChange: { h24: 1.23 } }],
        };
      }
      return { ok: true, json: async () => [] };
    });

    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.prices.AAPL.price).toBe(150.0);
    expect(body.prices.AAPL.changePercent).toBe(1.23);
  });

  it("falls back to DexScreener's price when Pyth has nothing for a symbol", async () => {
    const { fetchPythPrices } = await import("@/lib/prices/pyth");
    (fetchPythPrices as ReturnType<typeof vi.fn>).mockResolvedValue({});

    (fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
      if (url.includes(TOP10[0].mint)) {
        return {
          ok: true,
          json: async () => [{ priceUsd: "148.50", priceChange: { h24: -0.5 } }],
        };
      }
      return { ok: true, json: async () => [] };
    });

    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.prices.AAPL.price).toBe(148.5);
    expect(body.prices.AAPL.changePercent).toBe(-0.5);
  });

  it("keeps the same response shape as before (prices, fetchedAt, count)", async () => {
    const { fetchPythPrices } = await import("@/lib/prices/pyth");
    (fetchPythPrices as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => [] });

    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body).toHaveProperty("prices");
    expect(body).toHaveProperty("fetchedAt");
    expect(body).toHaveProperty("count");
    expect(body.count).toBe(Object.keys(body.prices).length);
  });

  it("omits a symbol entirely when neither Pyth nor DexScreener has a price", async () => {
    const { fetchPythPrices } = await import("@/lib/prices/pyth");
    (fetchPythPrices as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => [] });

    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.prices.AAPL).toBeUndefined();
  });

  it("includes PreStocks prices only when ?all=1 is passed", async () => {
    const { fetchPythPrices } = await import("@/lib/prices/pyth");
    const { fetchPreStocksPrices } = await import("@/lib/prices/prestocks");
    (fetchPythPrices as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (fetchPreStocksPrices as ReturnType<typeof vi.fn>).mockResolvedValue({
      OPENAI: { symbol: "OPENAI", price: 1000, change: 0, changePercent: 0 },
    });
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => [] });

    const { GET } = await import("./route");

    const withoutAll = await (await GET(makeRequest())).json();
    expect(withoutAll.prices.OPENAI).toBeUndefined();

    const withAll = await (await GET(makeRequest("https://example.com/api/prices?all=1"))).json();
    expect(withAll.prices.OPENAI.price).toBe(1000);
  });
});
