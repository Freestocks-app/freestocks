import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/lib/db/schema";
import { getPendingTotalCents, getAvailableBalanceCents } from "./service";

describe("redeem/service", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle>;

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
      CREATE TABLE redeem_request (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        amount_cents INTEGER NOT NULL,
        fomo_address TEXT NOT NULL,
        stock_symbol TEXT NOT NULL DEFAULT 'AAPL',
        stock_issuer TEXT NOT NULL DEFAULT 'xstocks',
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMP
      )
    `);

    db = drizzle(client, { schema });

    await client.exec(`
      INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
      VALUES ('user-1', 'Test User', 'test@example.com', false, NOW(), NOW())
    `);
  });

  afterEach(async () => {
    await client.close();
  });

  describe("getPendingTotalCents", () => {
    it("returns 0 when there are no requests", async () => {
      expect(await getPendingTotalCents(db, "user-1")).toBe(0);
    });

    it("sums only pending requests", async () => {
      await client.exec(`
        INSERT INTO redeem_request (id, user_id, amount_cents, fomo_address, status, created_at)
        VALUES
          ('req-1', 'user-1', 500, 'addr', 'pending', NOW()),
          ('req-2', 'user-1', 300, 'addr', 'pending', NOW()),
          ('req-3', 'user-1', 1000, 'addr', 'completed', NOW())
      `);

      expect(await getPendingTotalCents(db, "user-1")).toBe(800);
    });

    it("ignores other users' requests", async () => {
      await client.exec(`
        INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
        VALUES ('user-2', 'Other User', 'other@example.com', false, NOW(), NOW())
      `);
      await client.exec(`
        INSERT INTO redeem_request (id, user_id, amount_cents, fomo_address, status, created_at)
        VALUES ('req-1', 'user-2', 500, 'addr', 'pending', NOW())
      `);

      expect(await getPendingTotalCents(db, "user-1")).toBe(0);
    });
  });

  describe("getAvailableBalanceCents", () => {
    it("subtracts pending total from balance", async () => {
      await client.exec(`
        INSERT INTO redeem_request (id, user_id, amount_cents, fomo_address, status, created_at)
        VALUES ('req-1', 'user-1', 500, 'addr', 'pending', NOW())
      `);

      expect(await getAvailableBalanceCents(db, "user-1", 1000)).toBe(500);
    });

    it("never returns a negative number", async () => {
      await client.exec(`
        INSERT INTO redeem_request (id, user_id, amount_cents, fomo_address, status, created_at)
        VALUES ('req-1', 'user-1', 1500, 'addr', 'pending', NOW())
      `);

      expect(await getAvailableBalanceCents(db, "user-1", 1000)).toBe(0);
    });

    it("equals balance when there's no pending request", async () => {
      expect(await getAvailableBalanceCents(db, "user-1", 550)).toBe(550);
    });
  });
});
