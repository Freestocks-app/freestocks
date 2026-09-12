import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/lib/db/schema";
import { LedgerService } from "./service";

describe("LedgerService", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle>;
  let ledger: LedgerService;

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

    await client.exec(`
      INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
      VALUES ('user-1', 'Test User', 'test@example.com', false, NOW(), NOW())
    `);
  });

  afterEach(async () => {
    await client.close();
  });

  describe("getBalance", () => {
    it("should return 0 for new user with no balance record", async () => {
      const balance = await ledger.getBalance("user-1");
      expect(balance).toBe(0);
    });

    it("should return existing balance", async () => {
      await client.exec(`
        INSERT INTO user_balance (user_id, balance_cents)
        VALUES ('user-1', 1500)
      `);

      const balance = await ledger.getBalance("user-1");
      expect(balance).toBe(1500);
    });
  });

  describe("credit", () => {
    it("should create balance record and credit amount", async () => {
      const result = await ledger.credit({
        userId: "user-1",
        amountCents: 500,
        txId: "tx-1",
        source: "bitlabs",
      });

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(500);
    });

    it("should add to existing balance", async () => {
      await client.exec(`
        INSERT INTO user_balance (user_id, balance_cents)
        VALUES ('user-1', 1000)
      `);

      const result = await ledger.credit({
        userId: "user-1",
        amountCents: 500,
        txId: "tx-2",
        source: "bitlabs",
      });

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(1500);
    });

    it("should reject duplicate txId (idempotency)", async () => {
      await ledger.credit({
        userId: "user-1",
        amountCents: 500,
        txId: "tx-dup",
        source: "bitlabs",
      });

      const result = await ledger.credit({
        userId: "user-1",
        amountCents: 500,
        txId: "tx-dup",
        source: "bitlabs",
      });

      expect(result.success).toBe(false);
      expect(result.duplicate).toBe(true);

      const balance = await ledger.getBalance("user-1");
      expect(balance).toBe(500);
    });

    it("should record transaction with metadata", async () => {
      await ledger.credit({
        userId: "user-1",
        amountCents: 750,
        txId: "tx-meta",
        source: "bitlabs",
        metadata: { offerId: "offer-123" },
      });

      const txs = await ledger.getTransactions("user-1");
      expect(txs.length).toBe(1);
      expect(txs[0].amountCents).toBe(750);
      expect(txs[0].source).toBe("bitlabs");
    });
  });

  describe("getTransactions", () => {
    it("should return transactions ordered by created time", async () => {
      await ledger.credit({
        userId: "user-1",
        amountCents: 100,
        txId: "tx-first",
        source: "bitlabs",
      });

      await ledger.credit({
        userId: "user-1",
        amountCents: 200,
        txId: "tx-second",
        source: "bitlabs",
      });

      const txs = await ledger.getTransactions("user-1");
      expect(txs.length).toBe(2);
      expect(txs.map(t => t.txId)).toContain("tx-first");
      expect(txs.map(t => t.txId)).toContain("tx-second");
    });

    it("should limit results", async () => {
      for (let i = 0; i < 5; i++) {
        await ledger.credit({
          userId: "user-1",
          amountCents: 100,
          txId: `tx-${i}`,
          source: "bitlabs",
        });
      }

      const txs = await ledger.getTransactions("user-1", 3);
      expect(txs.length).toBe(3);
    });
  });
});
