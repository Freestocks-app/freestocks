import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("getJupiterQuote", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds the correct request URL and params", async () => {
    const { getJupiterQuote } = await import("./client");

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ inAmount: "1000000", outAmount: "461484", otherAmountThreshold: "459177" }),
    });

    await getJupiterQuote({
      inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      outputMint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
      amount: "1000000",
      slippageBps: 50,
    });

    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain("https://api.jup.ag/swap/v1/quote?");
    expect(calledUrl).toContain("inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
    expect(calledUrl).toContain("outputMint=Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh");
    expect(calledUrl).toContain("amount=1000000");
    expect(calledUrl).toContain("slippageBps=50");
  });

  it("returns the parsed quote response on success", async () => {
    const { getJupiterQuote } = await import("./client");
    const mockResponse = {
      inputMint: "in",
      outputMint: "out",
      inAmount: "1000000",
      outAmount: "461484",
      otherAmountThreshold: "459177",
      priceImpactPct: "0.0005",
      slippageBps: 50,
    };

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await getJupiterQuote({
      inputMint: "in",
      outputMint: "out",
      amount: "1000000",
      slippageBps: 50,
    });

    expect(result).toEqual(mockResponse);
  });

  it("throws when the HTTP response is not ok", async () => {
    const { getJupiterQuote } = await import("./client");

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "Bad request",
    });

    await expect(
      getJupiterQuote({ inputMint: "in", outputMint: "out", amount: "1", slippageBps: 50 })
    ).rejects.toThrow(/400/);
  });

  it("throws when the response is missing outAmount", async () => {
    const { getJupiterQuote } = await import("./client");

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ someOtherField: true }),
    });

    await expect(
      getJupiterQuote({ inputMint: "in", outputMint: "out", amount: "1", slippageBps: 50 })
    ).rejects.toThrow(/outAmount/);
  });

  it("propagates a network-level rejection", async () => {
    const { getJupiterQuote } = await import("./client");

    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network error"));

    await expect(
      getJupiterQuote({ inputMint: "in", outputMint: "out", amount: "1", slippageBps: 50 })
    ).rejects.toThrow("network error");
  });
});

describe("getJupiterSwapTransaction", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs the quote response and user public key", async () => {
    const { getJupiterSwapTransaction } = await import("./client");
    const quoteResponse = { inAmount: "1000000", outAmount: "461484" };

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ swapTransaction: "base64tx" }),
    });

    await getJupiterSwapTransaction({
      quoteResponse: quoteResponse as never,
      userPublicKey: "9y3HTmkotEieVaYqvyDmtSnZHQuf79ZaRVuYf8i1VwsT",
    });

    const [url, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://api.jup.ag/swap/v1/swap");
    expect(options.method).toBe("POST");
    const body = JSON.parse(options.body);
    expect(body.quoteResponse).toEqual(quoteResponse);
    expect(body.userPublicKey).toBe("9y3HTmkotEieVaYqvyDmtSnZHQuf79ZaRVuYf8i1VwsT");
    expect(body.wrapAndUnwrapSol).toBe(true);
  });

  it("returns the swap transaction on success", async () => {
    const { getJupiterSwapTransaction } = await import("./client");

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ swapTransaction: "base64tx" }),
    });

    const result = await getJupiterSwapTransaction({
      quoteResponse: {} as never,
      userPublicKey: "abc",
    });

    expect(result).toEqual({ swapTransaction: "base64tx" });
  });

  it("throws when the HTTP response is not ok", async () => {
    const { getJupiterSwapTransaction } = await import("./client");

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal error",
    });

    await expect(
      getJupiterSwapTransaction({ quoteResponse: {} as never, userPublicKey: "abc" })
    ).rejects.toThrow(/500/);
  });

  it("throws when the response is missing swapTransaction", async () => {
    const { getJupiterSwapTransaction } = await import("./client");

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await expect(
      getJupiterSwapTransaction({ quoteResponse: {} as never, userPublicKey: "abc" })
    ).rejects.toThrow(/swapTransaction/);
  });
});
