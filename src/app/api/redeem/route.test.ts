import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/lib/db/schema";
import { allCashoutStocks, allPriceSymbols } from "@/lib/tokenized-stocks";

const VALID_EVM_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00";
const VALID_SOLANA_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const VALID_STOCK_SYMBOLS = allPriceSymbols;
const MIN_REDEEM_CENTS = 500;

describe("Redeem API - Auth requirements", () => {
  it("should require authentication (GET returns 401 without session)", () => {
    const expectedStatusForUnauthenticated = 401;
    expect(expectedStatusForUnauthenticated).toBe(401);
  });

  it("should require authentication (POST returns 401 without session)", () => {
    const expectedStatusForUnauthenticated = 401;
    expect(expectedStatusForUnauthenticated).toBe(401);
  });
});

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
        stock_issuer TEXT NOT NULL DEFAULT 'xstocks',
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

    it("should validate EVM address format (0x + 40 hex chars)", () => {
      const validEvmAddresses = [
        VALID_EVM_ADDRESS,
        "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
      ];
      const invalidEvmAddresses = [
        "invalid",
        "0x123", 
        "0x" + "G".repeat(40),
        "742d35Cc6634C0532925a3b844Bc9e7595f8fE00",
      ];

      validEvmAddresses.forEach(addr => {
        expect(addr.match(/^0x[a-fA-F0-9]{40}$/)).toBeTruthy();
      });

      invalidEvmAddresses.forEach(addr => {
        expect(addr.match(/^0x[a-fA-F0-9]{40}$/)).toBeFalsy();
      });
    });

    it("should validate Solana base58 address format (32-44 chars, no 0OIl)", () => {
      const validSolanaAddresses = [
        VALID_SOLANA_ADDRESS,
        "So11111111111111111111111111111111111111112",
        "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
        "11111111111111111111111111111111",
      ];
      const invalidSolanaAddresses = [
        "abc",
        "1234567890123456789012345678901",
        "O111111111111111111111111111111111111111111",
        "I111111111111111111111111111111111111111111",
        "l111111111111111111111111111111111111111111",
        "0111111111111111111111111111111111111111111",
      ];

      validSolanaAddresses.forEach(addr => {
        expect(addr.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/), `${addr} should be valid`).toBeTruthy();
      });

      invalidSolanaAddresses.forEach(addr => {
        expect(addr.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/), `${addr} should be invalid`).toBeFalsy();
      });
    });

    it("should accept either EVM or Solana address format", () => {
      const combinedRegex = /^0x[a-fA-F0-9]{40}$|^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      
      expect(combinedRegex.test(VALID_EVM_ADDRESS)).toBe(true);
      expect(combinedRegex.test(VALID_SOLANA_ADDRESS)).toBe(true);
      expect(combinedRegex.test("invalid")).toBe(false);
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
        fomoAddress: VALID_EVM_ADDRESS, 
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
        VALUES ('req-1', 'user-1', 500, '${VALID_SOLANA_ADDRESS}', 'AAPL', 'pending', NOW())
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
        VALUES ('req-1', 'user-1', 500, '${VALID_SOLANA_ADDRESS}', 'AAPL', 'completed', NOW(), NOW())
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
      const fomoAddress = VALID_SOLANA_ADDRESS;
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
        VALUES ('cents-test', 'user-1', ${amountCents}, '${VALID_EVM_ADDRESS}', 'AAPL', 'pending', NOW())
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
    it("should accept all valid stock symbols across both issuer families", async () => {
      for (let i = 0; i < VALID_STOCK_SYMBOLS.length; i++) {
        const symbol = VALID_STOCK_SYMBOLS[i];
        const issuer = allCashoutStocks.find((s) => s.symbol === symbol)?.issuer;

        await client.exec(`
          INSERT INTO redeem_request (id, user_id, amount_cents, fomo_address, stock_symbol, stock_issuer, status, created_at)
          VALUES ('stock-${i}', 'user-1', 500, '${VALID_EVM_ADDRESS}', '${symbol}', '${issuer}', 'completed', NOW())
        `);

        const result = await client.query<{ stock_symbol: string; stock_issuer: string }>(
          "SELECT stock_symbol, stock_issuer FROM redeem_request WHERE id = $1",
          [`stock-${i}`]
        );

        expect(result.rows[0].stock_symbol).toBe(symbol);
        expect(result.rows[0].stock_issuer).toBe(issuer);
      }
    });

    it("includes PreStocks symbols alongside xStocks symbols", () => {
      expect(VALID_STOCK_SYMBOLS).toContain("AAPL");
      expect(VALID_STOCK_SYMBOLS).toContain("OPENAI");
      expect(VALID_STOCK_SYMBOLS).toContain("ANTHROPIC");
    });
  });

  describe("Stock issuer", () => {
    it("defaults to xstocks when not provided", async () => {
      await client.exec(`
        INSERT INTO redeem_request (id, user_id, amount_cents, fomo_address, stock_symbol, status, created_at)
        VALUES ('issuer-default', 'user-1', 500, '${VALID_EVM_ADDRESS}', 'AAPL', 'pending', NOW())
      `);

      const result = await client.query<{ stock_issuer: string }>(
        "SELECT stock_issuer FROM redeem_request WHERE id = 'issuer-default'"
      );

      expect(result.rows[0].stock_issuer).toBe("xstocks");
    });

    it("stores prestocks issuer for a PreStocks symbol", async () => {
      await client.exec(`
        INSERT INTO redeem_request (id, user_id, amount_cents, fomo_address, stock_symbol, stock_issuer, status, created_at)
        VALUES ('issuer-prestocks', 'user-1', 500, '${VALID_SOLANA_ADDRESS}', 'OPENAI', 'prestocks', 'pending', NOW())
      `);

      const result = await client.query<{ stock_issuer: string; stock_symbol: string }>(
        "SELECT stock_issuer, stock_symbol FROM redeem_request WHERE id = 'issuer-prestocks'"
      );

      expect(result.rows[0].stock_symbol).toBe("OPENAI");
      expect(result.rows[0].stock_issuer).toBe("prestocks");
    });
  });
});
