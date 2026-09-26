import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/lib/db/schema";
import { hasVerified, recordVerification } from "./service";

describe("worldid service", () => {
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
      CREATE TABLE user_world_id_verification (
        user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
        nullifier_hash TEXT NOT NULL UNIQUE,
        verified_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    db = drizzle(client, { schema });

    await client.exec(`
      INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
      VALUES
        ('user-1', 'Test User 1', 'user1@example.com', false, NOW(), NOW()),
        ('user-2', 'Test User 2', 'user2@example.com', false, NOW(), NOW())
    `);
  });

  afterEach(async () => {
    await client.close();
  });

  describe("hasVerified", () => {
    it("returns false for a user with no verification record", async () => {
      expect(await hasVerified(db, "user-1")).toBe(false);
    });

    it("returns true after a verification is recorded", async () => {
      await recordVerification(db, "user-1", "nullifier-abc");
      expect(await hasVerified(db, "user-1")).toBe(true);
    });
  });

  describe("recordVerification", () => {
    it("records a new verification", async () => {
      const result = await recordVerification(db, "user-1", "nullifier-abc");
      expect(result).toEqual({ success: true });

      const rows = await client.query(`SELECT * FROM user_world_id_verification WHERE user_id = 'user-1'`);
      expect(rows.rows).toHaveLength(1);
      expect((rows.rows[0] as Record<string, unknown>).nullifier_hash).toBe("nullifier-abc");
    });

    it("rejects a second verification attempt for the same user (duplicate userId)", async () => {
      await recordVerification(db, "user-1", "nullifier-abc");
      const second = await recordVerification(db, "user-1", "nullifier-different");

      expect(second).toEqual({ success: false, duplicate: true });
    });

    it("rejects reusing the same nullifier under a different account - this is the actual Sybil defense", async () => {
      await recordVerification(db, "user-1", "nullifier-abc");
      const second = await recordVerification(db, "user-2", "nullifier-abc");

      expect(second).toEqual({ success: false, duplicate: true });

      // user-2 must NOT be marked verified - the same real person can't
      // claim the bonus twice under two different Freestocks accounts.
      expect(await hasVerified(db, "user-2")).toBe(false);
    });
  });
});
