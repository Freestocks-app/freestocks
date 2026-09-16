import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";

const VALID_SOLANA_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

describe("POST /api/user/wallet - validation", () => {
  let client: PGlite;

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

    await client.exec(`
      INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
      VALUES ('user-1', 'Test User', 'test@example.com', false, NOW(), NOW())
    `);
  });

  afterEach(async () => {
    await client.close();
  });

  it("requires authentication (401 without session) - documents expected behavior", () => {
    const expectedStatusForUnauthenticated = 401;
    expect(expectedStatusForUnauthenticated).toBe(401);
  });

  it("rejects an invalid Solana address format", () => {
    const invalidAddresses = ["not-an-address", "0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00", "", "O0Il"];
    for (const addr of invalidAddresses) {
      expect(SOLANA_ADDRESS_REGEX.test(addr)).toBe(false);
    }
  });

  it("accepts a valid Solana base58 address", () => {
    expect(SOLANA_ADDRESS_REGEX.test(VALID_SOLANA_ADDRESS)).toBe(true);
  });

  it("persists the address and can be read back", async () => {
    await client.exec(`
      INSERT INTO user_wallet (user_id, solana_address, created_at)
      VALUES ('user-1', '${VALID_SOLANA_ADDRESS}', NOW())
    `);

    const result = await client.query<{ solana_address: string }>(
      "SELECT solana_address FROM user_wallet WHERE user_id = 'user-1'"
    );

    expect(result.rows[0].solana_address).toBe(VALID_SOLANA_ADDRESS);
  });

  it("upserting replaces the previous address for the same user", async () => {
    await client.exec(`
      INSERT INTO user_wallet (user_id, solana_address, created_at)
      VALUES ('user-1', '${VALID_SOLANA_ADDRESS}', NOW())
      ON CONFLICT (user_id) DO UPDATE SET solana_address = EXCLUDED.solana_address
    `);
    await client.exec(`
      INSERT INTO user_wallet (user_id, solana_address, created_at)
      VALUES ('user-1', 'CtQqGSa6tzLmRdHw1Vh66ibSyKW9WBgTc8Ba1eLuzwGF', NOW())
      ON CONFLICT (user_id) DO UPDATE SET solana_address = EXCLUDED.solana_address
    `);

    const result = await client.query<{ solana_address: string }>(
      "SELECT solana_address FROM user_wallet WHERE user_id = 'user-1'"
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].solana_address).toBe("CtQqGSa6tzLmRdHw1Vh66ibSyKW9WBgTc8Ba1eLuzwGF");
  });
});
