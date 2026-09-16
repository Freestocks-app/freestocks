import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/lib/db/schema";
import { TOP10 } from "@/lib/tokenized-stocks";
import { saveWalletAddress } from "./service";

const mockGetParsedTokenAccountsByOwner = vi.fn();

vi.mock("@solana/web3.js", async () => {
  const actual = await vi.importActual<typeof import("@solana/web3.js")>("@solana/web3.js");
  return {
    ...actual,
    Connection: vi.fn().mockImplementation(function (this: unknown) {
      return { getParsedTokenAccountsByOwner: mockGetParsedTokenAccountsByOwner };
    }),
  };
});

vi.mock("@/lib/prices", () => ({
  getAllPrices: vi.fn(),
}));

function tokenAccount(mint: string, uiAmount: number) {
  return {
    account: {
      data: {
        parsed: {
          info: {
            mint,
            tokenAmount: { uiAmount },
          },
        },
      },
    },
  };
}

describe("getPortfolioValueCents", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle>;

  beforeEach(async () => {
    vi.clearAllMocks();
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

  it("returns null when the user has no saved wallet", async () => {
    const { getPortfolioValueCents } = await import("./portfolio");
    expect(await getPortfolioValueCents(db, "user-1")).toBeNull();
  });

  it("sums uiAmount * price across held stocks", async () => {
    await saveWalletAddress(db, "user-1", "CtQqGSa6tzLmRdHw1Vh66ibSyKW9WBgTc8Ba1eLuzwGF");

    const aapl = TOP10.find((s) => s.symbol === "AAPL")!;
    const tsla = TOP10.find((s) => s.symbol === "TSLA")!;

    mockGetParsedTokenAccountsByOwner.mockResolvedValue({
      value: [tokenAccount(aapl.mint, 2), tokenAccount(tsla.mint, 1)],
    });

    const { getAllPrices } = await import("@/lib/prices");
    (getAllPrices as ReturnType<typeof vi.fn>).mockResolvedValue({
      AAPL: { symbol: "AAPL", price: 150, change: 0, changePercent: 0 },
      TSLA: { symbol: "TSLA", price: 400, change: 0, changePercent: 0 },
    });

    const { getPortfolioValueCents } = await import("./portfolio");
    const result = await getPortfolioValueCents(db, "user-1");

    expect(result).not.toBeNull();
    expect(result!.valueCents).toBe(2 * 150 * 100 + 1 * 400 * 100);
    expect(result!.stockCount).toBe(2);
  });

  it("excludes zero-balance holdings from stockCount", async () => {
    await saveWalletAddress(db, "user-1", "CtQqGSa6tzLmRdHw1Vh66ibSyKW9WBgTc8Ba1eLuzwGF");

    mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });

    const { getAllPrices } = await import("@/lib/prices");
    (getAllPrices as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const { getPortfolioValueCents } = await import("./portfolio");
    const result = await getPortfolioValueCents(db, "user-1");

    expect(result).toEqual({ valueCents: 0, stockCount: 0 });
  });

  it("returns null (not a throw) when the RPC call rejects", async () => {
    await saveWalletAddress(db, "user-1", "CtQqGSa6tzLmRdHw1Vh66ibSyKW9WBgTc8Ba1eLuzwGF");

    mockGetParsedTokenAccountsByOwner.mockRejectedValue(new Error("RPC down"));

    const { getAllPrices } = await import("@/lib/prices");
    (getAllPrices as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const { getPortfolioValueCents } = await import("./portfolio");
    const result = await getPortfolioValueCents(db, "user-1");

    expect(result).toBeNull();
  });

  it("skips a held stock with no available price", async () => {
    await saveWalletAddress(db, "user-1", "CtQqGSa6tzLmRdHw1Vh66ibSyKW9WBgTc8Ba1eLuzwGF");

    const aapl = TOP10.find((s) => s.symbol === "AAPL")!;
    mockGetParsedTokenAccountsByOwner.mockResolvedValue({
      value: [tokenAccount(aapl.mint, 5)],
    });

    const { getAllPrices } = await import("@/lib/prices");
    (getAllPrices as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const { getPortfolioValueCents } = await import("./portfolio");
    const result = await getPortfolioValueCents(db, "user-1");

    expect(result).toEqual({ valueCents: 0, stockCount: 1 });
  });
});
