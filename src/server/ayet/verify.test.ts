import { describe, it, expect } from "vitest";
import {
  parseAyetCallbackParams,
  buildSortedQueryString,
  computeAyetHmac,
  verifyAyetCallback,
  computeHmacForTesting,
} from "./verify";

const TEST_API_KEY = "test-ayet-api-key-12345";

describe("Ayet verify", () => {
  describe("parseAyetCallbackParams", () => {
    it("parses all callback parameters", () => {
      const url = new URL(
        "https://example.com/api/ayet/callback?transaction_id=abc123&payout_usd=1.50&external_identifier=user42&currency_amount=150&is_chargeback=0"
      );
      const params = parseAyetCallbackParams(url);

      expect(params.transactionId).toBe("abc123");
      expect(params.payoutUsd).toBe("1.50");
      expect(params.externalIdentifier).toBe("user42");
      expect(params.currencyAmount).toBe("150");
      expect(params.isChargeback).toBe(false);
    });

    it("detects chargeback from is_chargeback=1", () => {
      const url = new URL(
        "https://example.com/api/ayet/callback?transaction_id=abc123&payout_usd=1.50&external_identifier=user42&is_chargeback=1"
      );
      const params = parseAyetCallbackParams(url);

      expect(params.isChargeback).toBe(true);
    });

    it("detects chargeback from r- prefix on transaction_id", () => {
      const url = new URL(
        "https://example.com/api/ayet/callback?transaction_id=r-abc123&payout_usd=1.50&external_identifier=user42"
      );
      const params = parseAyetCallbackParams(url);

      expect(params.transactionId).toBe("r-abc123");
      expect(params.isChargeback).toBe(true);
    });

    it("handles missing optional parameters", () => {
      const url = new URL(
        "https://example.com/api/ayet/callback?transaction_id=abc123&external_identifier=user42"
      );
      const params = parseAyetCallbackParams(url);

      expect(params.transactionId).toBe("abc123");
      expect(params.payoutUsd).toBe(null);
      expect(params.externalIdentifier).toBe("user42");
      expect(params.currencyAmount).toBe(null);
      expect(params.isChargeback).toBe(false);
    });
  });

  describe("buildSortedQueryString", () => {
    it("sorts query params alphabetically", () => {
      const url = new URL(
        "https://example.com/callback?zebra=1&apple=2&mango=3"
      );
      const result = buildSortedQueryString(url);

      expect(result).toBe("apple=2&mango=3&zebra=1");
    });

    it("URL-encodes special characters", () => {
      const url = new URL(
        "https://example.com/callback?user=john%20doe&amount=10%2B5"
      );
      const result = buildSortedQueryString(url);

      expect(result).toBe("amount=10%2B5&user=john%20doe");
    });

    it("handles empty query string", () => {
      const url = new URL("https://example.com/callback");
      const result = buildSortedQueryString(url);

      expect(result).toBe("");
    });
  });

  describe("computeAyetHmac", () => {
    it("computes HMAC-SHA256 hash", () => {
      const queryString = "external_identifier=user42&payout_usd=1.50&transaction_id=abc123";
      const hash = computeAyetHmac(queryString, TEST_API_KEY);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(hash).toBe(computeHmacForTesting(queryString, TEST_API_KEY));
    });

    it("produces different hashes for different inputs", () => {
      const hash1 = computeAyetHmac("query1", TEST_API_KEY);
      const hash2 = computeAyetHmac("query2", TEST_API_KEY);

      expect(hash1).not.toBe(hash2);
    });

    it("produces different hashes for different keys", () => {
      const queryString = "same=query";
      const hash1 = computeAyetHmac(queryString, "key1");
      const hash2 = computeAyetHmac(queryString, "key2");

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyAyetCallback", () => {
    it("returns valid for correct hash", () => {
      const url = new URL(
        "https://example.com/callback?external_identifier=user42&payout_usd=1.50&transaction_id=abc123"
      );
      const queryString = buildSortedQueryString(url);
      const validHash = computeHmacForTesting(queryString, TEST_API_KEY);

      const result = verifyAyetCallback(url, validHash, TEST_API_KEY);

      expect(result.valid).toBe(true);
      expect(result.computedHash).toBe(validHash);
      expect(result.providedHash).toBe(validHash);
    });

    it("returns invalid for missing hash", () => {
      const url = new URL(
        "https://example.com/callback?transaction_id=abc123"
      );

      const result = verifyAyetCallback(url, null, TEST_API_KEY);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("no_hash_header");
    });

    it("returns invalid for wrong hash", () => {
      const url = new URL(
        "https://example.com/callback?transaction_id=abc123"
      );
      const wrongHash = "0000000000000000000000000000000000000000000000000000000000000000";

      const result = verifyAyetCallback(url, wrongHash, TEST_API_KEY);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("hash_mismatch");
      expect(result.providedHash).toBe(wrongHash);
    });

    it("handles case-insensitive hash comparison", () => {
      const url = new URL(
        "https://example.com/callback?transaction_id=abc123"
      );
      const queryString = buildSortedQueryString(url);
      const validHash = computeHmacForTesting(queryString, TEST_API_KEY);

      const resultUpper = verifyAyetCallback(url, validHash.toUpperCase(), TEST_API_KEY);
      const resultLower = verifyAyetCallback(url, validHash.toLowerCase(), TEST_API_KEY);

      expect(resultUpper.valid).toBe(true);
      expect(resultLower.valid).toBe(true);
    });
  });
});
