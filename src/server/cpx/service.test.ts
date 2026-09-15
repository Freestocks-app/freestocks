import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/lib/db/schema";
import { CpxService } from "./service";
import { LedgerService } from "../ledger/service";
import { ReferralService } from "../referral/service";
import { computeCpxSecureHash } from "./verify";

describe("CpxService", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle>;
  let ledger: LedgerService;
  let referral: ReferralService;
  let cpx: CpxService;
  const SECRET = "test-cpx-secret-12345";

  beforeEach(async () => {
    client = new PGlite();

    await client.exec(`
      CREATE TABLE "user" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        email_verified BOOLEAN NOT NULL DEFAULT false,
        image TEXT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      )
    `);

    await client.exec(`
      CREATE TABLE user_balance (
        user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
        balance_cents INTEGER NOT NULL DEFAULT 0
      )
    `);

    await client.exec(`
      CREATE TABLE "transaction" (
        id TEXT PRIMARY KEY,
        tx_id TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        amount_cents INTEGER NOT NULL,
        source TEXT NOT NULL,
        metadata TEXT,
        created_at TIMESTAMP NOT NULL
      )
    `);

    await client.exec(`
      CREATE TABLE user_referral_code (
        user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
        code TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.exec(`
      CREATE TABLE referral_link (
        referee_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
        referrer_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    db = drizzle(client, { schema });
    ledger = new LedgerService(db);
    referral = new ReferralService(db);
    cpx = new CpxService(ledger, SECRET, referral);

    await client.exec(`
      INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
      VALUES
        ('user-abc', 'Test User', 'test@example.com', false, NOW(), NOW()),
        ('referrer-1', 'Referrer', 'referrer@example.com', false, NOW(), NOW())
    `);
  });

  afterEach(async () => {
    await client.close();
  });

  describe("processCallback", () => {
    it("should process valid callback and credit user", async () => {
      const url = new URL(
        "https://app.freestocks.com/api/cpx/callback?status=1&trans_id=tx123&user_id=user-abc&amount_usd=5.00"
      );
      const result = await cpx.processCallback({ url, mockVerify: true });

      expect(result.success).toBe(true);
      expect(result.credited).toBe(true);

      const balance = await ledger.getBalance("user-abc");
      expect(balance).toBe(500);
    });

    it("should reject invalid secure_hash", async () => {
      const url = new URL(
        "https://app.freestocks.com/api/cpx/callback?status=1&trans_id=tx123&user_id=user-abc&amount_usd=5.00&secure_hash=invalid"
      );
      const result = await cpx.processCallback({ url, mockVerify: false });

      expect(result.success).toBe(false);
      expect(result.error).toBe("invalid_signature");
    });

    it("should accept a correctly computed secure_hash", async () => {
      const hash = computeCpxSecureHash("tx123", SECRET);
      const url = new URL(
        `https://app.freestocks.com/api/cpx/callback?status=1&trans_id=tx123&user_id=user-abc&amount_usd=5.00&secure_hash=${hash}`
      );
      const result = await cpx.processCallback({ url, mockVerify: false });

      expect(result.success).toBe(true);
      expect(result.credited).toBe(true);
    });

    it("should handle duplicate TX (idempotent)", async () => {
      const url = new URL(
        "https://app.freestocks.com/api/cpx/callback?status=1&trans_id=tx-dup&user_id=user-abc&amount_usd=5.00"
      );

      await cpx.processCallback({ url, mockVerify: true });
      const result = await cpx.processCallback({ url, mockVerify: true });

      expect(result.success).toBe(true);
      expect(result.credited).toBe(false);
      expect(result.duplicate).toBe(true);

      expect(await ledger.getBalance("user-abc")).toBe(500);
    });

    it("should reject missing user_id", async () => {
      const url = new URL(
        "https://app.freestocks.com/api/cpx/callback?status=1&trans_id=tx123&amount_usd=5.00"
      );
      const result = await cpx.processCallback({ url, mockVerify: true });

      expect(result.success).toBe(false);
      expect(result.error).toBe("missing_user_id");
    });

    it("should reject missing trans_id", async () => {
      const url = new URL(
        "https://app.freestocks.com/api/cpx/callback?status=1&user_id=user-abc&amount_usd=5.00"
      );
      const result = await cpx.processCallback({ url, mockVerify: true });

      expect(result.success).toBe(false);
      expect(result.error).toBe("missing_transaction_id");
    });

    it("should reject missing amount", async () => {
      const url = new URL(
        "https://app.freestocks.com/api/cpx/callback?status=1&trans_id=tx123&user_id=user-abc"
      );
      const result = await cpx.processCallback({ url, mockVerify: true });

      expect(result.success).toBe(false);
      expect(result.error).toBe("missing_amount");
    });

    it("should handle user not found", async () => {
      const url = new URL(
        "https://app.freestocks.com/api/cpx/callback?status=1&trans_id=tx123&user_id=nonexistent&amount_usd=5.00"
      );
      const result = await cpx.processCallback({ url, mockVerify: true });

      expect(result.success).toBe(false);
      expect(result.error).toBe("user_not_found");
    });
  });

  describe("chargeback handling (status=2)", () => {
    it("should debit on status=2 after a prior credit", async () => {
      const creditUrl = new URL(
        "https://app.freestocks.com/api/cpx/callback?status=1&trans_id=tx-credit&user_id=user-abc&amount_usd=10.00"
      );
      await cpx.processCallback({ url: creditUrl, mockVerify: true });
      expect(await ledger.getBalance("user-abc")).toBe(1000);

      const chargebackUrl = new URL(
        "https://app.freestocks.com/api/cpx/callback?status=2&trans_id=tx-credit&user_id=user-abc&amount_usd=10.00"
      );
      const result = await cpx.processCallback({ url: chargebackUrl, mockVerify: true });

      expect(result.success).toBe(true);
      expect(result.debited).toBe(true);
      expect(await ledger.getBalance("user-abc")).toBe(0);
    });

    it("should not go below zero on chargeback", async () => {
      const chargebackUrl = new URL(
        "https://app.freestocks.com/api/cpx/callback?status=2&trans_id=tx-no-balance&user_id=user-abc&amount_usd=100.00"
      );
      const result = await cpx.processCallback({ url: chargebackUrl, mockVerify: true });

      expect(result.success).toBe(true);
      expect(result.debited).toBe(true);
      expect(await ledger.getBalance("user-abc")).toBe(0);
    });
  });

  describe("referral commission integration", () => {
    it("credits the referrer 5% when a referred user earns via CPX", async () => {
      const code = await referral.getOrCreateReferralCode("referrer-1");
      await referral.attribute("user-abc", code);

      const url = new URL(
        "https://app.freestocks.com/api/cpx/callback?status=1&trans_id=tx-ref&user_id=user-abc&amount_usd=10.00"
      );
      await cpx.processCallback({ url, mockVerify: true });

      expect(await ledger.getBalance("user-abc")).toBe(1000);
      expect(await ledger.getBalance("referrer-1")).toBe(50);
    });
  });

  describe("calculateAmountCents", () => {
    it("should convert amount_usd to cents", () => {
      expect(cpx.calculateAmountCents("5.00", null)).toBe(500);
      expect(cpx.calculateAmountCents("0.50", null)).toBe(50);
      expect(cpx.calculateAmountCents("10.99", null)).toBe(1099);
    });

    it("should prefer amount_usd over amount_local", () => {
      expect(cpx.calculateAmountCents("0.80", "80")).toBe(80);
    });

    it("should fall back to amount_local", () => {
      expect(cpx.calculateAmountCents(null, "1.50")).toBe(150);
    });

    it("should return 0 for invalid values", () => {
      expect(cpx.calculateAmountCents(null, null)).toBe(0);
      expect(cpx.calculateAmountCents("invalid", null)).toBe(0);
    });
  });
});
