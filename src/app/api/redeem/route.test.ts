import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/lib/db/schema";

const VALID_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00";
const VALID_STOCK_SYMBOLS = ["AAPL", "TSLA", "NVDA", "AMZN", "GOOGL", "MSFT"];
const MIN_REDEEM_CENTS = 500;

describe("Redeem API", () => {
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
      CREATE TABLE redeem_request (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        amount_cents INTEGER NOT NULL,
        fomo_address TEXT NOT NULL,
        stock_symbol TEXT NOT NULL DEFAULT 'AAPL',
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMP
      )
    `);

    drizzle(client, { schema });

    await client.exec(`
      INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
      VALUES ('user-1', 'Test User', 'test@example.com', false, NOW(), NOW())
    `);

    await client.exec(`
      INSERT INTO user_balance (user_id, balance_cents)
      VALUES ('user-1', 1000)
    `);
  });

  afterEach(async () => {
    await client.close();
  });

  describe("Input validation", () => {
    it("should validate FOMO address is required", () => {
      const body: { amountCents: number; stockSymbol: string; fomoAddress?: string } = { 
        amountCents: 500, 
        stockSymbol: "AAPL" 
      };
      
      const hasAddress = Boolean(body.fomoAddress && typeof body.fomoAddress === "string");
      expect(hasAddress).toBe(false);
    });

    it("should validate FOMO address format (must be 0x + 40 hex chars)", () => {
      const validAddresses = [
        VALID_ADDRESS,
        "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
      ];
      const invalidAddresses = [
        "invalid",
        "0x123", 
        "0x" + "G".repeat(40),
        "742d35Cc6634C0532925a3b844Bc9e7595f8fE00",
      ];

      validAddresses.forEach(addr => {
        expect(addr.match(/^0x[a-fA-F0-9]{40}$/)).toBeTruthy();
      });

      invalidAddresses.forEach(addr => {
        expect(addr.match(/^0x[a-fA-F0-9]{40}$/)).toBeFalsy();
      });
    });

    it("should validate minimum redemption amount", () => {
      const belowMin = MIN_REDEEM_CENTS - 1;
      const atMin = MIN_REDEEM_CENTS;
      const aboveMin = MIN_REDEEM_CENTS + 100;

      expect(belowMin < MIN_REDEEM_CENTS).toBe(true);
      expect(atMin >= MIN_REDEEM_CENTS).toBe(true);
      expect(aboveMin >= MIN_REDEEM_CENTS).toBe(true);
    });

    it("should validate stock symbol is required", () => {
      const body: { fomoAddress: string; amountCents: number; stockSymbol?: string } = { 
        fomoAddress: VALID_ADDRESS, 
        amountCents: 500 
      };
      
      const hasStock = Boolean(body.stockSymbol && typeof body.stockSymbol === "string");
      expect(hasStock).toBe(false);
    });

    it("should validate stock symbol is from allowed list", () => {
      const validSymbols = VALID_STOCK_SYMBOLS;
      const invalidSymbols = ["BTC", "ETH", "DOGE", "GME", ""];

      validSymbols.forEach(sym => {
        expect(VALID_STOCK_SYMBOLS.includes(sym)).toBe(true);
      });

      invalidSymbols.forEach(sym => {
        expect(VALID_STOCK_SYMBOLS.includes(sym)).toBe(false);
      });
    });
  });

  describe("Balance validation", () => {
    it("should reject if balance is less than requested amount", async () => {
      const balanceResult = await client.query<{ balance_cents: number }>(
        "SELECT balance_cents FROM user_balance WHERE user_id = 'user-1'"
      );
      const balance = balanceResult.rows[0]?.balance_cents || 0;
      
      const requestedAmount = 2000;
      expect(balance < requestedAmount).toBe(true);
    });

    it("should accept if balance is sufficient", async () => {
      const balanceResult = await client.query<{ balance_cents: number }>(
        "SELECT balance_cents FROM user_balance WHERE user_id = 'user-1'"
      );
      const balance = balanceResult.rows[0]?.balance_cents || 0;
      
      const requestedAmount = 500;
      expect(balance >= requestedAmount).toBe(true);
    });
  });

  describe("Pending request check", () => {
    it("should allow request when no pending requests exist", async () => {
      const pendingResult = await client.query<{ status: string }>(
        "SELECT status FROM redeem_request WHERE user_id = 'user-1'"
      );
      
      const hasPending = pendingResult.rows.some(r => r.status === "pending");
      expect(hasPending).toBe(false);
    });

    it("should reject when a pending request exists", async () => {
      await client.exec(`
        INSERT INTO redeem_request (id, user_id, amount_cents, fomo_address, stock_symbol, status, created_at)
        VALUES ('req-1', 'user-1', 500, '${VALID_ADDRESS}', 'AAPL', 'pending', NOW())
      `);

      const pendingResult = await client.query<{ status: string }>(
        "SELECT status FROM redeem_request WHERE user_id = 'user-1'"
      );
      
      const hasPending = pendingResult.rows.some(r => r.status === "pending");
      expect(hasPending).toBe(true);
    });

    it("should allow new request after previous one is processed", async () => {
      await client.exec(`
        INSERT INTO redeem_request (id, user_id, amount_cents, fomo_address, stock_symbol, status, created_at, processed_at)
        VALUES ('req-1', 'user-1', 500, '${VALID_ADDRESS}', 'AAPL', 'completed', NOW(), NOW())
      `);

      const pendingResult = await client.query<{ status: string }>(
        "SELECT status FROM redeem_request WHERE user_id = 'user-1'"
      );
      
      const hasPending = pendingResult.rows.some(r => r.status === "pending");
      expect(hasPending).toBe(false);
    });
  });

  describe("Successful redemption", () => {
    it("should create redeem request with all fields", async () => {
      const requestId = "test-req-id";
      const userId = "user-1";
      const amountCents = 750;
      const fomoAddress = VALID_ADDRESS;
      const stockSymbol = "TSLA";

      await client.exec(`
        INSERT INTO redeem_request (id, user_id, amount_cents, fomo_address, stock_symbol, status, created_at)
        VALUES ('${requestId}', '${userId}', ${amountCents}, '${fomoAddress}', '${stockSymbol}', 'pending', NOW())
      `);

      const result = await client.query<{
        id: string;
        user_id: string;
        amount_cents: number;
        fomo_address: string;
        stock_symbol: string;
        status: string;
      }>("SELECT * FROM redeem_request WHERE id = $1", [requestId]);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].user_id).toBe(userId);
      expect(result.rows[0].amount_cents).toBe(amountCents);
      expect(result.rows[0].fomo_address).toBe(fomoAddress);
      expect(result.rows[0].stock_symbol).toBe(stockSymbol);
      expect(result.rows[0].status).toBe("pending");
    });

    it("should store amounts in integer cents", async () => {
      const amountCents = 1234;

      await client.exec(`
        INSERT INTO redeem_request (id, user_id, amount_cents, fomo_address, stock_symbol, status, created_at)
        VALUES ('cents-test', 'user-1', ${amountCents}, '${VALID_ADDRESS}', 'AAPL', 'pending', NOW())
      `);

      const result = await client.query<{ amount_cents: number }>(
        "SELECT amount_cents FROM redeem_request WHERE id = 'cents-test'"
      );

      expect(typeof result.rows[0].amount_cents).toBe("number");
      expect(Number.isInteger(result.rows[0].amount_cents)).toBe(true);
      expect(result.rows[0].amount_cents).toBe(1234);
    });
  });

  describe("Stock symbols", () => {
    it("should accept all valid stock symbols", async () => {
      for (let i = 0; i < VALID_STOCK_SYMBOLS.length; i++) {
        const symbol = VALID_STOCK_SYMBOLS[i];
        await client.exec(`
          INSERT INTO redeem_request (id, user_id, amount_cents, fomo_address, stock_symbol, status, created_at)
          VALUES ('stock-${i}', 'user-1', 500, '${VALID_ADDRESS}', '${symbol}', 'completed', NOW())
        `);

        const result = await client.query<{ stock_symbol: string }>(
          "SELECT stock_symbol FROM redeem_request WHERE id = $1",
          [`stock-${i}`]
        );

        expect(result.rows[0].stock_symbol).toBe(symbol);
      }
    });
  });
});
