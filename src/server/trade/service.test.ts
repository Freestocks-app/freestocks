import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/lib/db/schema";
import { logTrade } from "./service";

describe("logTrade", () => {
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

    await client.exec(`
      INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
      VALUES ('user-1', 'Test User', 'test@example.com', false, NOW(), NOW())
    `);
  });

  afterEach(async () => {
    await client.close();
  });

  const baseParams = {
    userId: "user-1",
    txId: "5x7abc...signature",
    side: "buy" as const,
    symbol: "NVDA",
    mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
    tokenAmountRaw: "14000000",
    tokenDecimals: 8,
    usdcAmountRaw: "25000000",
    usdAmountCents: 2500,
    priceImpactPct: 0.0005,
    slippageBps: 50,
  };

  it("inserts a trade into the transaction table", async () => {
    const result = await logTrade(db, baseParams);

    expect(result).toEqual({ success: true });

    const rows = await client.query(`SELECT * FROM "transaction" WHERE tx_id = $1`, [baseParams.txId]);
    expect(rows.rows).toHaveLength(1);
    const row = rows.rows[0] as Record<string, unknown>;
    expect(row.source).toBe("trade");
    expect(row.amount_cents).toBe(2500);
    expect(row.user_id).toBe("user-1");

    const metadata = JSON.parse(row.metadata as string);
    expect(metadata).toMatchObject({
      side: "buy",
      symbol: "NVDA",
      mint: baseParams.mint,
      tokenAmountRaw: "14000000",
      tokenDecimals: 8,
      usdcAmountRaw: "25000000",
      priceImpactPct: 0.0005,
      slippageBps: 50,
    });
  });

  it("returns duplicate:true instead of inserting twice for the same txId", async () => {
    await logTrade(db, baseParams);
    const second = await logTrade(db, { ...baseParams, usdAmountCents: 9999 });

    expect(second).toEqual({ success: false, duplicate: true });

    const rows = await client.query(`SELECT * FROM "transaction" WHERE tx_id = $1`, [baseParams.txId]);
    expect(rows.rows).toHaveLength(1);
    expect((rows.rows[0] as Record<string, unknown>).amount_cents).toBe(2500);
  });

  it("logs a sell trade with its own distinct txId", async () => {
    await logTrade(db, baseParams);
    const sellResult = await logTrade(db, {
      ...baseParams,
      txId: "different-signature",
      side: "sell",
    });

    expect(sellResult).toEqual({ success: true });

    const rows = await client.query(`SELECT * FROM "transaction" WHERE user_id = 'user-1'`);
    expect(rows.rows).toHaveLength(2);
  });
});
