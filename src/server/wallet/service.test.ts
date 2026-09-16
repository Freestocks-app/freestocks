import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/lib/db/schema";
import { saveWalletAddress, getWalletAddress } from "./service";

describe("wallet/service", () => {
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
      CREATE TABLE user_wallet (
        user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
        solana_address TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
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

  describe("getWalletAddress", () => {
    it("returns null when no wallet is saved", async () => {
      expect(await getWalletAddress(db, "user-1")).toBeNull();
    });
  });

  describe("saveWalletAddress", () => {
    it("persists a new wallet address", async () => {
      await saveWalletAddress(db, "user-1", "CtQqGSa6tzLmRdHw1Vh66ibSyKW9WBgTc8Ba1eLuzwGF");
      expect(await getWalletAddress(db, "user-1")).toBe("CtQqGSa6tzLmRdHw1Vh66ibSyKW9WBgTc8Ba1eLuzwGF");
    });

    it("upserts (overwrites) on a second call for the same user", async () => {
      await saveWalletAddress(db, "user-1", "CtQqGSa6tzLmRdHw1Vh66ibSyKW9WBgTc8Ba1eLuzwGF");
      await saveWalletAddress(db, "user-1", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

      expect(await getWalletAddress(db, "user-1")).toBe("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
    });
  });
});
