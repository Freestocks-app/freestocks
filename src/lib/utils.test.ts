import { describe, it, expect, afterEach, vi } from "vitest";
import {
  formatCents,
  formatCentsRaw,
  dollarsToCents,
  isValidSolanaAddress,
  isValidEvmAddress,
  isValidWalletAddress,
  isComingSoonHost,
  isComingSoon,
  QA_BYPASS_COOKIE,
} from "./utils";

describe("Money formatting utilities", () => {
  describe("formatCents", () => {
    it("should format cents to dollar string with $ prefix", () => {
      expect(formatCents(0)).toBe("$0.00");
      expect(formatCents(1)).toBe("$0.01");
      expect(formatCents(99)).toBe("$0.99");
      expect(formatCents(100)).toBe("$1.00");
      expect(formatCents(1234)).toBe("$12.34");
      expect(formatCents(12345)).toBe("$123.45");
    });

    it("should handle exact dollar amounts", () => {
      expect(formatCents(500)).toBe("$5.00");
      expect(formatCents(1000)).toBe("$10.00");
      expect(formatCents(10000)).toBe("$100.00");
    });

    it("should always show two decimal places", () => {
      expect(formatCents(500)).toBe("$5.00");
      expect(formatCents(510)).toBe("$5.10");
    });
  });

  describe("formatCentsRaw", () => {
    it("should format cents without $ prefix", () => {
      expect(formatCentsRaw(0)).toBe("0.00");
      expect(formatCentsRaw(1234)).toBe("12.34");
      expect(formatCentsRaw(500)).toBe("5.00");
    });
  });

  describe("dollarsToCents", () => {
    it("should convert dollars to integer cents", () => {
      expect(dollarsToCents(0)).toBe(0);
      expect(dollarsToCents(1)).toBe(100);
      expect(dollarsToCents(12.34)).toBe(1234);
      expect(dollarsToCents(5.0)).toBe(500);
    });

    it("should round floating point errors", () => {
      expect(dollarsToCents(0.1 + 0.2)).toBe(30);
      expect(dollarsToCents(19.99)).toBe(1999);
    });

    it("should handle partial cents by rounding", () => {
      expect(dollarsToCents(1.234)).toBe(123);
      expect(dollarsToCents(1.235)).toBe(124);
      expect(dollarsToCents(1.236)).toBe(124);
    });
  });
});

describe("Address validation utilities", () => {
  describe("isValidSolanaAddress", () => {
    const validSolanaAddresses = [
      "11111111111111111111111111111111",
      "So11111111111111111111111111111111111111112",
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
      "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    ];

    const invalidSolanaAddresses = [
      "",
      "abc",
      "1234567890123456789012345678901",
      "123456789012345678901234567890123456789012345",
      "0OIl111111111111111111111111111",
      "So1111111111111111111111111111111111111111O",
    ];

    it("should accept valid Solana addresses", () => {
      for (const address of validSolanaAddresses) {
        expect(isValidSolanaAddress(address), `Expected ${address} to be valid`).toBe(true);
      }
    });

    it("should reject invalid Solana addresses", () => {
      for (const address of invalidSolanaAddresses) {
        expect(isValidSolanaAddress(address), `Expected ${address} to be invalid`).toBe(false);
      }
    });

    it("should reject addresses with invalid base58 characters (0, O, I, l)", () => {
      expect(isValidSolanaAddress("0o11111111111111111111111111111111111111111")).toBe(false);
      expect(isValidSolanaAddress("O111111111111111111111111111111111111111111")).toBe(false);
      expect(isValidSolanaAddress("I111111111111111111111111111111111111111111")).toBe(false);
      expect(isValidSolanaAddress("l111111111111111111111111111111111111111111")).toBe(false);
    });
  });

  describe("isValidEvmAddress", () => {
    const validEvmAddresses = [
      "0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00",
      "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
      "0x0000000000000000000000000000000000000000",
      "0xffffffffffffffffffffffffffffffffffffffff",
    ];

    const invalidEvmAddresses = [
      "",
      "742d35Cc6634C0532925a3b844Bc9e7595f8fE00",
      "0x742d35Cc6634C0532925a3b844Bc9e7595f8fE0",
      "0x742d35Cc6634C0532925a3b844Bc9e7595f8fE000",
      "0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
      "0x",
    ];

    it("should accept valid EVM addresses", () => {
      for (const address of validEvmAddresses) {
        expect(isValidEvmAddress(address), `Expected ${address} to be valid`).toBe(true);
      }
    });

    it("should reject invalid EVM addresses", () => {
      for (const address of invalidEvmAddresses) {
        expect(isValidEvmAddress(address), `Expected ${address} to be invalid`).toBe(false);
      }
    });
  });

  describe("isValidWalletAddress", () => {
    it("should accept both Solana and EVM addresses", () => {
      expect(isValidWalletAddress("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")).toBe(true);
      expect(isValidWalletAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00")).toBe(true);
    });

    it("should reject invalid addresses", () => {
      expect(isValidWalletAddress("")).toBe(false);
      expect(isValidWalletAddress("invalid")).toBe(false);
      expect(isValidWalletAddress("0x123")).toBe(false);
    });
  });
});

describe("Coming Soon host gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("treats freestocks.app and www as marketing hosts", () => {
    expect(isComingSoonHost("freestocks.app")).toBe(true);
    expect(isComingSoonHost("www.freestocks.app")).toBe(true);
    expect(isComingSoonHost("WWW.FREESTOCKS.APP")).toBe(true);
  });

  it("keeps demo and vercel hosts off the marketing list", () => {
    expect(isComingSoonHost("demo.freestocks.app")).toBe(false);
    expect(isComingSoonHost("freestocks.vercel.app")).toBe(false);
    expect(isComingSoonHost("localhost")).toBe(false);
  });

  it("opens the full app on demo even when COMING_SOON=true", () => {
    vi.stubEnv("NEXT_PUBLIC_COMING_SOON", "true");
    vi.stubGlobal("document", { cookie: "" });
    vi.stubGlobal("window", { location: { hostname: "demo.freestocks.app" } });
    expect(isComingSoon()).toBe(false);
  });

  it("keeps Coming Soon on www when the flag is on", () => {
    vi.stubEnv("NEXT_PUBLIC_COMING_SOON", "true");
    vi.stubGlobal("document", { cookie: "" });
    vi.stubGlobal("window", { location: { hostname: "www.freestocks.app" } });
    expect(isComingSoon()).toBe(true);
  });

  it("respects the QA bypass cookie on marketing hosts", () => {
    vi.stubEnv("NEXT_PUBLIC_COMING_SOON", "true");
    vi.stubGlobal("document", { cookie: `${QA_BYPASS_COOKIE}=1; path=/` });
    vi.stubGlobal("window", { location: { hostname: "www.freestocks.app" } });
    expect(isComingSoon()).toBe(false);
  });
});
