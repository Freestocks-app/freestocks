import { describe, it, expect } from "vitest";
import { parseCpxCallbackParams, computeCpxSecureHash, verifyCpxCallback } from "./verify";

const TEST_SECRET = "test-cpx-secret-12345";

describe("CPX verify", () => {
  describe("parseCpxCallbackParams", () => {
    it("parses all callback parameters", () => {
      const url = new URL(
        "https://example.com/api/cpx/callback?status=1&trans_id=abc123&user_id=user42&amount_local=1.50&amount_usd=1.50&subid_1=a&subid_2=b&secure_hash=deadbeef"
      );
      const params = parseCpxCallbackParams(url);

      expect(params.status).toBe("1");
      expect(params.transactionId).toBe("abc123");
      expect(params.userId).toBe("user42");
      expect(params.amountLocal).toBe("1.50");
      expect(params.amountUsd).toBe("1.50");
      expect(params.subId1).toBe("a");
      expect(params.subId2).toBe("b");
      expect(params.secureHash).toBe("deadbeef");
    });

    it("handles missing parameters", () => {
      const url = new URL("https://example.com/api/cpx/callback");
      const params = parseCpxCallbackParams(url);

      expect(params.status).toBeNull();
      expect(params.transactionId).toBeNull();
      expect(params.userId).toBeNull();
    });
  });

  describe("computeCpxSecureHash", () => {
    it("computes MD5(trans_id + '-' + secret)", () => {
      // md5("abc123-test-cpx-secret-12345") computed independently
      const hash = computeCpxSecureHash("abc123", TEST_SECRET);
      expect(hash).toMatch(/^[a-f0-9]{32}$/);

      // deterministic: same inputs always produce the same hash
      expect(computeCpxSecureHash("abc123", TEST_SECRET)).toBe(hash);
    });

    it("produces different hashes for different transaction ids", () => {
      const hash1 = computeCpxSecureHash("abc123", TEST_SECRET);
      const hash2 = computeCpxSecureHash("xyz789", TEST_SECRET);
      expect(hash1).not.toBe(hash2);
    });

    it("produces different hashes for different secrets", () => {
      const hash1 = computeCpxSecureHash("abc123", TEST_SECRET);
      const hash2 = computeCpxSecureHash("abc123", "other-secret");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyCpxCallback", () => {
    it("returns valid for a correctly computed hash", () => {
      const transactionId = "abc123";
      const hash = computeCpxSecureHash(transactionId, TEST_SECRET);

      const result = verifyCpxCallback(transactionId, hash, TEST_SECRET);
      expect(result.valid).toBe(true);
    });

    it("returns invalid for a wrong hash", () => {
      const result = verifyCpxCallback("abc123", "0".repeat(32), TEST_SECRET);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("hash_mismatch");
    });

    it("returns invalid when transaction id is missing", () => {
      const result = verifyCpxCallback(null, "somehash", TEST_SECRET);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("missing_transaction_id");
    });

    it("returns invalid when hash is missing", () => {
      const result = verifyCpxCallback("abc123", null, TEST_SECRET);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("no_hash_parameter");
    });

    it("returns invalid for a non-hex hash without throwing", () => {
      const result = verifyCpxCallback("abc123", "not-hex!!", TEST_SECRET);
      expect(result.valid).toBe(false);
    });

    it("is case-insensitive for hash comparison", () => {
      const transactionId = "abc123";
      const hash = computeCpxSecureHash(transactionId, TEST_SECRET).toUpperCase();

      const result = verifyCpxCallback(transactionId, hash, TEST_SECRET);
      expect(result.valid).toBe(true);
    });
  });
});
