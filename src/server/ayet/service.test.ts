import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/lib/db/schema";
import { AyetService } from "./service";
import { LedgerService } from "../ledger/service";

describe("AyetService", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle>;
  let ledger: LedgerService;
  let ayet: AyetService;
  const API_KEY = "test-ayet-api-key-12345";

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

    db = drizzle(client, { schema });
    ledger = new LedgerService(db);
    ayet = new AyetService(ledger, API_KEY);

    await client.exec(`
      INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
      VALUES ('user-abc', 'Test User', 'test@example.com', false, NOW(), NOW())
    `);
  });

  afterEach(async () => {
    await client.close();
  });

  describe("processCallback", () => {
    it("should process valid callback and credit user", async () => {
      const url = new URL(
        "https://app.freestocks.com/api/ayet/callback?transaction_id=tx123&payout_usd=5.00&external_identifier=user-abc"
      );
      const result = await ayet.processCallback({
        url,
        securityHash: "valid",
        mockVerify: true,
      });

      expect(result.success).toBe(true);
      expect(result.credited).toBe(true);

      const balance = await ledger.getBalance("user-abc");
      expect(balance).toBe(500);
    });

    it("should reject invalid HMAC", async () => {
      const url = new URL(
        "https://app.freestocks.com/api/ayet/callback?transaction_id=tx123&payout_usd=5.00&external_identifier=user-abc"
      );
      const result = await ayet.processCallback({
        url,
        securityHash: "invalid-hash",
        mockVerify: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("invalid_signature");
    });

    it("should reject missing hash header", async () => {
      const url = new URL(
        "https://app.freestocks.com/api/ayet/callback?transaction_id=tx123&payout_usd=5.00&external_identifier=user-abc"
      );
      const result = await ayet.processCallback({
        url,
        securityHash: null,
        mockVerify: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("invalid_signature");
    });

    it("should handle duplicate TX (idempotent)", async () => {
      const url = new URL(
        "https://app.freestocks.com/api/ayet/callback?transaction_id=tx-dup&payout_usd=5.00&external_identifier=user-abc"
      );
      
      await ayet.processCallback({
        url,
        securityHash: "valid",
        mockVerify: true,
      });

      const result = await ayet.processCallback({
        url,
        securityHash: "valid",
        mockVerify: true,
      });

      expect(result.success).toBe(true);
      expect(result.credited).toBe(false);
      expect(result.duplicate).toBe(true);

      const balance = await ledger.getBalance("user-abc");
      expect(balance).toBe(500);
    });

    it("should reject missing user ID", async () => {
      const url = new URL(
        "https://app.freestocks.com/api/ayet/callback?transaction_id=tx123&payout_usd=5.00"
      );
      const result = await ayet.processCallback({
        url,
        securityHash: "valid",
        mockVerify: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("missing_user_id");
    });

    it("should reject missing transaction ID", async () => {
      const url = new URL(
        "https://app.freestocks.com/api/ayet/callback?payout_usd=5.00&external_identifier=user-abc"
      );
      const result = await ayet.processCallback({
        url,
        securityHash: "valid",
        mockVerify: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("missing_transaction_id");
    });

    it("should reject missing payout", async () => {
      const url = new URL(
        "https://app.freestocks.com/api/ayet/callback?transaction_id=tx123&external_identifier=user-abc"
      );
      const result = await ayet.processCallback({
        url,
        securityHash: "valid",
        mockVerify: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("missing_payout");
    });

    it("should handle user not found", async () => {
      const url = new URL(
        "https://app.freestocks.com/api/ayet/callback?transaction_id=tx123&payout_usd=5.00&external_identifier=nonexistent"
      );
      const result = await ayet.processCallback({
        url,
        securityHash: "valid",
        mockVerify: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("user_not_found");
    });
  });

  describe("chargeback handling", () => {
    it("should process chargeback with is_chargeback=1", async () => {
      const creditUrl = new URL(
        "https://app.freestocks.com/api/ayet/callback?transaction_id=tx-credit&payout_usd=10.00&external_identifier=user-abc"
      );
      await ayet.processCallback({
        url: creditUrl,
        securityHash: "valid",
        mockVerify: true,
      });

      expect(await ledger.getBalance("user-abc")).toBe(1000);

      const chargebackUrl = new URL(
        "https://app.freestocks.com/api/ayet/callback?transaction_id=tx-credit&payout_usd=10.00&external_identifier=user-abc&is_chargeback=1"
      );
      const result = await ayet.processCallback({
        url: chargebackUrl,
        securityHash: "valid",
        mockVerify: true,
      });

      expect(result.success).toBe(true);
      expect(result.debited).toBe(true);

      expect(await ledger.getBalance("user-abc")).toBe(0);
    });

    it("should process chargeback with r- prefix transaction_id", async () => {
      const creditUrl = new URL(
        "https://app.freestocks.com/api/ayet/callback?transaction_id=tx-original&payout_usd=8.00&external_identifier=user-abc"
      );
      await ayet.processCallback({
        url: creditUrl,
        securityHash: "valid",
        mockVerify: true,
      });

      expect(await ledger.getBalance("user-abc")).toBe(800);

      const chargebackUrl = new URL(
        "https://app.freestocks.com/api/ayet/callback?transaction_id=r-tx-original&payout_usd=8.00&external_identifier=user-abc"
      );
      const result = await ayet.processCallback({
        url: chargebackUrl,
        securityHash: "valid",
        mockVerify: true,
      });

      expect(result.success).toBe(true);
      expect(result.debited).toBe(true);

      expect(await ledger.getBalance("user-abc")).toBe(0);
    });

    it("should not go below zero on chargeback", async () => {
      const chargebackUrl = new URL(
        "https://app.freestocks.com/api/ayet/callback?transaction_id=tx-no-balance&payout_usd=100.00&external_identifier=user-abc&is_chargeback=1"
      );
      const result = await ayet.processCallback({
        url: chargebackUrl,
        securityHash: "valid",
        mockVerify: true,
      });

      expect(result.success).toBe(true);
      expect(result.debited).toBe(true);

      expect(await ledger.getBalance("user-abc")).toBe(0);
    });

    it("should handle duplicate chargeback (idempotent)", async () => {
      const creditUrl = new URL(
        "https://app.freestocks.com/api/ayet/callback?transaction_id=tx-dup-cb&payout_usd=5.00&external_identifier=user-abc"
      );
      await ayet.processCallback({
        url: creditUrl,
        securityHash: "valid",
        mockVerify: true,
      });

      const chargebackUrl = new URL(
        "https://app.freestocks.com/api/ayet/callback?transaction_id=tx-dup-cb&payout_usd=5.00&external_identifier=user-abc&is_chargeback=1"
      );
      
      await ayet.processCallback({
        url: chargebackUrl,
        securityHash: "valid",
        mockVerify: true,
      });

      const result = await ayet.processCallback({
        url: chargebackUrl,
        securityHash: "valid",
        mockVerify: true,
      });

      expect(result.success).toBe(true);
      expect(result.debited).toBe(false);
      expect(result.duplicate).toBe(true);
    });
  });

  describe("calculateAmountCents", () => {
    it("should convert payout_usd to cents", () => {
      expect(ayet.calculateAmountCents("5.00", null)).toBe(500);
      expect(ayet.calculateAmountCents("0.50", null)).toBe(50);
      expect(ayet.calculateAmountCents("10.99", null)).toBe(1099);
    });

    it("should prefer payout_usd over currency_amount", () => {
      expect(ayet.calculateAmountCents("0.80", "80")).toBe(80);
    });

    it("should use currency_amount as cents if payout_usd is missing", () => {
      expect(ayet.calculateAmountCents(null, "150")).toBe(150);
    });

    it("should return 0 for invalid values", () => {
      expect(ayet.calculateAmountCents(null, null)).toBe(0);
      expect(ayet.calculateAmountCents("invalid", null)).toBe(0);
    });
  });
});
