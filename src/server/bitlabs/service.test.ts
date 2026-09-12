import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/lib/db/schema";
import { BitLabsService } from "./service";
import { LedgerService } from "../ledger/service";

describe("BitLabsService", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle>;
  let ledger: LedgerService;
  let bitlabs: BitLabsService;
  const SECRET = "test-secret-key-12345";

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
    bitlabs = new BitLabsService(ledger, SECRET);

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
      const result = await bitlabs.processCallback({
        fullUrl:
          "https://app.freestocks.com/api/bitlabs/callback?uid=user-abc&val=5.00&tx=tx123&hash=valid",
        mockVerify: true,
      });

      expect(result.success).toBe(true);
      expect(result.credited).toBe(true);

      const balance = await ledger.getBalance("user-abc");
      expect(balance).toBe(500);
    });

    it("should reject invalid HMAC", async () => {
      const result = await bitlabs.processCallback({
        fullUrl:
          "https://app.freestocks.com/api/bitlabs/callback?uid=user-abc&val=5.00&tx=tx123&hash=invalid",
        mockVerify: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("invalid_signature");
    });

    it("should handle duplicate TX (idempotent)", async () => {
      await bitlabs.processCallback({
        fullUrl:
          "https://app.freestocks.com/api/bitlabs/callback?uid=user-abc&val=5.00&tx=tx-dup&hash=valid",
        mockVerify: true,
      });

      const result = await bitlabs.processCallback({
        fullUrl:
          "https://app.freestocks.com/api/bitlabs/callback?uid=user-abc&val=5.00&tx=tx-dup&hash=valid",
        mockVerify: true,
      });

      expect(result.success).toBe(true);
      expect(result.credited).toBe(false);
      expect(result.duplicate).toBe(true);

      const balance = await ledger.getBalance("user-abc");
      expect(balance).toBe(500);
    });

    it("should reject missing user ID", async () => {
      const result = await bitlabs.processCallback({
        fullUrl:
          "https://app.freestocks.com/api/bitlabs/callback?val=5.00&tx=tx123&hash=valid",
        mockVerify: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("missing_user_id");
    });

    it("should reject missing TX ID", async () => {
      const result = await bitlabs.processCallback({
        fullUrl:
          "https://app.freestocks.com/api/bitlabs/callback?uid=user-abc&val=5.00&hash=valid",
        mockVerify: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("missing_tx_id");
    });

    it("should reject missing value", async () => {
      const result = await bitlabs.processCallback({
        fullUrl:
          "https://app.freestocks.com/api/bitlabs/callback?uid=user-abc&tx=tx123&hash=valid",
        mockVerify: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("missing_value");
    });

    it("should prefer VALUE:USD over val for amount", async () => {
      const result = await bitlabs.processCallback({
        fullUrl:
          "https://app.freestocks.com/api/bitlabs/callback?uid=user-abc&val=100&VALUE:USD=0.80&tx=tx-usd&hash=valid",
        mockVerify: true,
      });

      expect(result.success).toBe(true);

      const balance = await ledger.getBalance("user-abc");
      expect(balance).toBe(80);
    });

    it("should handle user not found", async () => {
      const result = await bitlabs.processCallback({
        fullUrl:
          "https://app.freestocks.com/api/bitlabs/callback?uid=nonexistent&val=5.00&tx=tx123&hash=valid",
        mockVerify: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("user_not_found");
    });
  });

  describe("calculateAmountCents", () => {
    it("should convert dollar string to cents", () => {
      expect(bitlabs.calculateAmountCents("5.00", null)).toBe(500);
      expect(bitlabs.calculateAmountCents("0.50", null)).toBe(50);
      expect(bitlabs.calculateAmountCents("10.99", null)).toBe(1099);
    });

    it("should prefer USD value when both provided", () => {
      expect(bitlabs.calculateAmountCents("100", "0.80")).toBe(80);
    });

    it("should return 0 for invalid values", () => {
      expect(bitlabs.calculateAmountCents(null, null)).toBe(0);
      expect(bitlabs.calculateAmountCents("invalid", null)).toBe(0);
    });
  });
});
