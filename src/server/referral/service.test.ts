import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/lib/db/schema";
import { LedgerService } from "@/server/ledger/service";
import {
  ReferralService,
  computeCommissionCents,
  generateReferralCode,
  creditReferralCommission,
} from "./service";

describe("computeCommissionCents", () => {
  it("computes 5% of a whole-cent amount", () => {
    expect(computeCommissionCents(1000)).toBe(50);
  });

  it("rounds 5% of 33 cents up to 2", () => {
    expect(computeCommissionCents(33)).toBe(2);
  });

  it("rounds 5% of 10 cents to 1 (round-half-up)", () => {
    expect(computeCommissionCents(10)).toBe(1);
  });

  it("returns 0 for 0 cents", () => {
    expect(computeCommissionCents(0)).toBe(0);
  });

  it("rounds 5% of 1 cent down to 0", () => {
    expect(computeCommissionCents(1)).toBe(0);
  });
});

describe("generateReferralCode", () => {
  it("generates an 8-character code from the expected charset", () => {
    const code = generateReferralCode();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/);
  });

  it("excludes visually ambiguous characters", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateReferralCode();
      expect(code).not.toMatch(/[0O1IL]/);
    }
  });
});

describe("creditReferralCommission", () => {
  it("does not credit when there is no referrer", async () => {
    const ledger = { credit: vi.fn() } as unknown as LedgerService;
    const referral = { getReferrerId: vi.fn().mockResolvedValue(null) } as unknown as ReferralService;

    await creditReferralCommission(ledger, referral, {
      refereeId: "user-1",
      refereeTxId: "tx-1",
      amountCents: 1000,
    });

    expect(ledger.credit).not.toHaveBeenCalled();
  });

  it("blocks self-referral defensively", async () => {
    const ledger = { credit: vi.fn() } as unknown as LedgerService;
    const referral = { getReferrerId: vi.fn().mockResolvedValue("user-1") } as unknown as ReferralService;

    await creditReferralCommission(ledger, referral, {
      refereeId: "user-1",
      refereeTxId: "tx-1",
      amountCents: 1000,
    });

    expect(ledger.credit).not.toHaveBeenCalled();
  });

  it("skips crediting when the computed commission is 0", async () => {
    const ledger = { credit: vi.fn() } as unknown as LedgerService;
    const referral = { getReferrerId: vi.fn().mockResolvedValue("referrer-1") } as unknown as ReferralService;

    await creditReferralCommission(ledger, referral, {
      refereeId: "user-1",
      refereeTxId: "tx-1",
      amountCents: 1,
    });

    expect(ledger.credit).not.toHaveBeenCalled();
  });

  it("credits the referrer 5% with a deterministic txId", async () => {
    const ledger = { credit: vi.fn().mockResolvedValue({ success: true }) } as unknown as LedgerService;
    const referral = { getReferrerId: vi.fn().mockResolvedValue("referrer-1") } as unknown as ReferralService;

    await creditReferralCommission(ledger, referral, {
      refereeId: "user-1",
      refereeTxId: "tx-1",
      amountCents: 1000,
    });

    expect(ledger.credit).toHaveBeenCalledWith({
      userId: "referrer-1",
      amountCents: 50,
      txId: "referral_tx-1",
      source: "referral_commission",
      metadata: { refereeId: "user-1", refereeTxId: "tx-1" },
    });
  });
});

describe("ReferralService", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle>;
  let referral: ReferralService;
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

    await client.exec(`
      CREATE TABLE user_referral_code (
        user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
        code TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.exec(`
      CREATE TABLE referral_link (
        referee_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
        referrer_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    db = drizzle(client, { schema });
    referral = new ReferralService(db);
    ledger = new LedgerService(db);

    await client.exec(`
      INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
      VALUES
        ('referrer-1', 'Referrer', 'referrer@example.com', false, NOW(), NOW()),
        ('referee-1', 'Referee', 'referee@example.com', false, NOW(), NOW())
    `);
  });

  afterEach(async () => {
    await client.close();
  });

  describe("getOrCreateReferralCode", () => {
    it("creates a code on first call and returns the same code on second call", async () => {
      const code1 = await referral.getOrCreateReferralCode("referrer-1");
      const code2 = await referral.getOrCreateReferralCode("referrer-1");
      expect(code1).toBe(code2);
      expect(code1).toHaveLength(8);
    });
  });

  describe("attribute", () => {
    it("attributes a referee to the referrer by code", async () => {
      const code = await referral.getOrCreateReferralCode("referrer-1");
      const result = await referral.attribute("referee-1", code);
      expect(result).toEqual({ attributed: true });
      expect(await referral.getReferrerId("referee-1")).toBe("referrer-1");
    });

    it("rejects an invalid code", async () => {
      const result = await referral.attribute("referee-1", "NOTAREAL");
      expect(result).toEqual({ attributed: false, reason: "invalid_code" });
    });

    it("blocks self-referral", async () => {
      const code = await referral.getOrCreateReferralCode("referrer-1");
      const result = await referral.attribute("referrer-1", code);
      expect(result).toEqual({ attributed: false, reason: "self_referral" });
    });

    it("is idempotent on a second attribute call for the same referee", async () => {
      const code = await referral.getOrCreateReferralCode("referrer-1");
      await referral.attribute("referee-1", code);
      const second = await referral.attribute("referee-1", code);
      expect(second).toEqual({ attributed: false, reason: "already_attributed" });
      expect(await referral.getReferrerId("referee-1")).toBe("referrer-1");
    });
  });

  describe("end-to-end commission crediting", () => {
    it("credits the referrer 5% of the referee's earning, once", async () => {
      const code = await referral.getOrCreateReferralCode("referrer-1");
      await referral.attribute("referee-1", code);

      await ledger.credit({
        userId: "referee-1",
        amountCents: 1000,
        txId: "offer-tx-1",
        source: "bitlabs",
      });

      await creditReferralCommission(ledger, referral, {
        refereeId: "referee-1",
        refereeTxId: "offer-tx-1",
        amountCents: 1000,
      });

      expect(await ledger.getBalance("referrer-1")).toBe(50);

      const stats = await referral.getReferralStats("referrer-1");
      expect(stats).toEqual({ count: 1, earnedCents: 50 });
    });

    it("does not double-credit on a retried callback for the same event", async () => {
      const code = await referral.getOrCreateReferralCode("referrer-1");
      await referral.attribute("referee-1", code);

      await ledger.credit({
        userId: "referee-1",
        amountCents: 1000,
        txId: "offer-tx-1",
        source: "bitlabs",
      });

      await creditReferralCommission(ledger, referral, {
        refereeId: "referee-1",
        refereeTxId: "offer-tx-1",
        amountCents: 1000,
      });
      await creditReferralCommission(ledger, referral, {
        refereeId: "referee-1",
        refereeTxId: "offer-tx-1",
        amountCents: 1000,
      });

      expect(await ledger.getBalance("referrer-1")).toBe(50);
    });
  });
});
