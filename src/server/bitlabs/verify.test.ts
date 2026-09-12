import { describe, it, expect } from "vitest";
import {
  verifyBitlabsHmac,
  verifyBitlabsCallback,
  parseCallbackParams,
  extractHashFromUrl,
  computeHmacForTesting,
} from "./verify";

describe("BitLabs HMAC Verification", () => {
  const SECRET = "JLOIAUNMHFli7ZJOQVEzm98rzqnm9";

  describe("verifyBitlabsHmac", () => {
    it("should return true for valid HMAC", () => {
      const urlWithoutHash =
        "https://publisher.com/complete?uid=8cc877ee-af19-488d-b28d-216fb866b996&val=500";
      const hash = "dbcd6bb8ca677344592842a52b4fca9bec36cd4b";

      const result = verifyBitlabsHmac(urlWithoutHash, hash, SECRET);
      expect(result).toBe(true);
    });

    it("should return false for invalid HMAC", () => {
      const urlWithoutHash =
        "https://publisher.com/complete?uid=test&val=500";
      const hash = "invalidhash123";

      const result = verifyBitlabsHmac(urlWithoutHash, hash, SECRET);
      expect(result).toBe(false);
    });

    it("should return false for tampered URL", () => {
      const tamperedUrl =
        "https://publisher.com/complete?uid=8cc877ee-af19-488d-b28d-216fb866b996&val=1000";
      const hash = "dbcd6bb8ca677344592842a52b4fca9bec36cd4b";

      const result = verifyBitlabsHmac(tamperedUrl, hash, SECRET);
      expect(result).toBe(false);
    });

    it("should be case-insensitive for hash comparison", () => {
      const urlWithoutHash =
        "https://publisher.com/complete?uid=8cc877ee-af19-488d-b28d-216fb866b996&val=500";
      const hashUpper = "DBCD6BB8CA677344592842A52B4FCA9BEC36CD4B";

      const result = verifyBitlabsHmac(urlWithoutHash, hashUpper, SECRET);
      expect(result).toBe(true);
    });
  });

  describe("verifyBitlabsCallback (known BitLabs vector)", () => {
    it("should verify the exact BitLabs documentation example", () => {
      const fullUrl =
        "https://publisher.com/complete?uid=8cc877ee-af19-488d-b28d-216fb866b996&val=500&hash=dbcd6bb8ca677344592842a52b4fca9bec36cd4b";
      
      const result = verifyBitlabsCallback(fullUrl, SECRET);
      expect(result.valid).toBe(true);
      expect(result.providedHash).toBe("dbcd6bb8ca677344592842a52b4fca9bec36cd4b");
    });

    it("should reject callback with tampered value", () => {
      const fullUrl =
        "https://publisher.com/complete?uid=8cc877ee-af19-488d-b28d-216fb866b996&val=1000&hash=dbcd6bb8ca677344592842a52b4fca9bec36cd4b";
      
      const result = verifyBitlabsCallback(fullUrl, SECRET);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("hash_mismatch");
    });

    it("should reject callback with missing hash", () => {
      const fullUrl =
        "https://publisher.com/complete?uid=8cc877ee-af19-488d-b28d-216fb866b996&val=500";
      
      const result = verifyBitlabsCallback(fullUrl, SECRET);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("no_hash_parameter");
    });

    it("should handle URL-encoded VALUE:USD parameter", () => {
      const secret = "test-secret";
      const urlDecoded = "https://example.com/callback?uid=user1&VALUE:USD=1.50";
      const urlEncoded = "https://example.com/callback?uid=user1&VALUE%3AUSD=1.50";
      
      const hashForEncoded = computeHmacForTesting(urlEncoded, secret);
      const fullUrlDecoded = `${urlDecoded}&hash=${hashForEncoded}`;
      
      const result = verifyBitlabsCallback(fullUrlDecoded, secret);
      expect(result.valid).toBe(true);
    });

    it("should handle decoded URL when hash was computed on encoded", () => {
      const secret = "test-secret";
      const urlEncoded = "https://example.com/callback?uid=user1&VALUE%3AUSD=1.50";
      const urlDecoded = "https://example.com/callback?uid=user1&VALUE:USD=1.50";
      
      const hashForDecoded = computeHmacForTesting(urlDecoded, secret);
      const fullUrlEncoded = `${urlEncoded}&hash=${hashForDecoded}`;
      
      const result = verifyBitlabsCallback(fullUrlEncoded, secret);
      expect(result.valid).toBe(true);
    });
  });

  describe("extractHashFromUrl", () => {
    it("should extract hash from end of URL", () => {
      const fullUrl = "https://example.com/callback?uid=abc&val=100&hash=abc123def";
      const { urlWithoutHash, hash } = extractHashFromUrl(fullUrl);
      
      expect(urlWithoutHash).toBe("https://example.com/callback?uid=abc&val=100");
      expect(hash).toBe("abc123def");
    });

    it("should handle URL with no hash", () => {
      const fullUrl = "https://example.com/callback?uid=abc&val=100";
      const { urlWithoutHash, hash } = extractHashFromUrl(fullUrl);
      
      expect(urlWithoutHash).toBe(fullUrl);
      expect(hash).toBeNull();
    });

    it("should handle hash with extra parameters after (edge case)", () => {
      const fullUrl = "https://example.com/callback?uid=abc&hash=abc123&extra=foo";
      const { urlWithoutHash, hash } = extractHashFromUrl(fullUrl);
      
      expect(hash).toBe("abc123");
    });
  });

  describe("parseCallbackParams", () => {
    it("should parse standard callback params", () => {
      const url = new URL(
        "https://example.com/callback?uid=user123&val=5.00&tx=tx456"
      );

      const params = parseCallbackParams(url);
      expect(params).toEqual({
        userId: "user123",
        valueCurrency: "5.00",
        valueUsd: null,
        txId: "tx456",
      });
    });

    it("should parse BitLabs-style params with colons", () => {
      const url = new URL(
        "https://example.com/callback?uid=user123&VALUE:CURRENCY=10.50&VALUE:USD=8.40&TX=tx789"
      );

      const params = parseCallbackParams(url);
      expect(params).toEqual({
        userId: "user123",
        valueCurrency: "10.50",
        valueUsd: "8.40",
        txId: "tx789",
      });
    });

    it("should prefer USD value for amount calculation", () => {
      const url = new URL(
        "https://example.com/callback?uid=user123&val=100&VALUE:USD=0.80&tx=tx1"
      );

      const params = parseCallbackParams(url);
      expect(params.valueUsd).toBe("0.80");
    });

    it("should return nulls for missing params", () => {
      const url = new URL("https://example.com/callback");

      const params = parseCallbackParams(url);
      expect(params.userId).toBeNull();
      expect(params.txId).toBeNull();
    });
  });

  describe("computeHmacForTesting", () => {
    it("should compute correct HMAC for known vector", () => {
      const urlWithoutHash =
        "https://publisher.com/complete?uid=8cc877ee-af19-488d-b28d-216fb866b996&val=500";
      
      const hash = computeHmacForTesting(urlWithoutHash, SECRET);
      expect(hash).toBe("dbcd6bb8ca677344592842a52b4fca9bec36cd4b");
    });
  });
});
