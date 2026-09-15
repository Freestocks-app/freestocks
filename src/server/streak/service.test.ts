import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/lib/db/schema";
import { StreakService, computeStreakFromDays } from "./service";

describe("computeStreakFromDays", () => {
  it("counts consecutive days ending today", () => {
    const days = ["2026-09-13", "2026-09-14", "2026-09-15"];
    expect(computeStreakFromDays(days, "2026-09-15")).toBe(3);
  });

  it("counts consecutive days ending yesterday (grace period)", () => {
    const days = ["2026-09-12", "2026-09-13", "2026-09-14"];
    expect(computeStreakFromDays(days, "2026-09-15")).toBe(3);
  });

  it("breaks the streak at a gap", () => {
    const days = ["2026-09-10", "2026-09-13", "2026-09-14", "2026-09-15"];
    expect(computeStreakFromDays(days, "2026-09-15")).toBe(3);
  });

  it("returns 0 for empty input", () => {
    expect(computeStreakFromDays([], "2026-09-15")).toBe(0);
  });

  it("returns 0 when neither today nor yesterday has activity", () => {
    const days = ["2026-09-01", "2026-09-02"];
    expect(computeStreakFromDays(days, "2026-09-15")).toBe(0);
  });

  it("counts a single day", () => {
    expect(computeStreakFromDays(["2026-09-15"], "2026-09-15")).toBe(1);
  });

  it("dedupes duplicate days", () => {
    const days = ["2026-09-15", "2026-09-15", "2026-09-14", "2026-09-14", "2026-09-14"];
    expect(computeStreakFromDays(days, "2026-09-15")).toBe(2);
  });
});

describe("StreakService", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle>;
  let streak: StreakService;

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
    streak = new StreakService(db);

    await client.exec(`
      INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
      VALUES ('user-1', 'Test User', 'test@example.com', false, NOW(), NOW())
    `);
  });

  afterEach(async () => {
    await client.close();
  });

  it("returns 0 for a user with no transactions", async () => {
    expect(await streak.getCurrentStreak("user-1")).toBe(0);
  });

  it("returns 1 for a user with a transaction today", async () => {
    // Use an explicit UTC timestamp rather than SQL NOW() — PGlite's NOW()
    // can reflect the host's local timezone offset rather than true UTC,
    // which flakes this test near a local midnight boundary.
    const nowUtc = new Date().toISOString();
    await client.query(
      `INSERT INTO "transaction" (id, tx_id, user_id, amount_cents, source, created_at)
       VALUES ('tx-1', 'tx-1', 'user-1', 100, 'test', $1)`,
      [nowUtc]
    );
    expect(await streak.getCurrentStreak("user-1")).toBe(1);
  });
});
