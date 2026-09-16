import crypto from "crypto";
import { eq, and, desc, sql } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import type { DrizzleDB } from "@/server/ledger/service";
import type { LedgerService } from "@/server/ledger/service";

export const REFERRAL_COMMISSION_RATE = 0.05;

// Excludes visually ambiguous characters (0, O, 1, I, L), same rationale
// as the base58 exclusions in isValidSolanaAddress.
const CODE_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;
const MAX_CODE_GENERATION_ATTEMPTS = 5;

export function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARSET[crypto.randomInt(CODE_CHARSET.length)];
  }
  return code;
}

export function computeCommissionCents(amountCents: number): number {
  return Math.round(amountCents * REFERRAL_COMMISSION_RATE);
}

function isUniqueViolation(error: unknown): boolean {
  const err = error as { code?: string; cause?: { code?: string } };
  const errorStr = String(error);
  const code = err?.code || err?.cause?.code || "";
  return (
    code === "23505" ||
    errorStr.includes("unique") ||
    errorStr.includes("UNIQUE") ||
    errorStr.includes("duplicate key")
  );
}

export interface AttributeResult {
  attributed: boolean;
  reason?: "invalid_code" | "self_referral" | "already_attributed";
}

export interface ReferralStats {
  count: number;
  earnedCents: number;
}

export class ReferralService {
  constructor(private db: DrizzleDB) {}

  async getOrCreateReferralCode(userId: string): Promise<string> {
    const existing = await this.db.query.userReferralCode.findFirst({
      where: eq(schema.userReferralCode.userId, userId),
    });
    if (existing) return existing.code;

    for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
      const code = generateReferralCode();
      try {
        await this.db.insert(schema.userReferralCode).values({ userId, code });
        return code;
      } catch (error: unknown) {
        if (!isUniqueViolation(error)) throw error;

        // Either the code collided (retry with a new one) or a
        // concurrent request already created this user's row.
        const row = await this.db.query.userReferralCode.findFirst({
          where: eq(schema.userReferralCode.userId, userId),
        });
        if (row) return row.code;
      }
    }

    throw new Error("Failed to generate a unique referral code");
  }

  async getReferrerId(refereeId: string): Promise<string | null> {
    const link = await this.db.query.referralLink.findFirst({
      where: eq(schema.referralLink.refereeId, refereeId),
    });
    return link?.referrerId ?? null;
  }

  async attribute(refereeId: string, code: string): Promise<AttributeResult> {
    const codeRow = await this.db.query.userReferralCode.findFirst({
      where: eq(schema.userReferralCode.code, code),
    });
    if (!codeRow) {
      return { attributed: false, reason: "invalid_code" };
    }

    const referrerId = codeRow.userId;
    if (referrerId === refereeId) {
      return { attributed: false, reason: "self_referral" };
    }

    try {
      await this.db.insert(schema.referralLink).values({ refereeId, referrerId });
      return { attributed: true };
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        return { attributed: false, reason: "already_attributed" };
      }
      throw error;
    }
  }

  async getReferralHistory(referrerId: string, limit: number = 20): Promise<schema.Transaction[]> {
    return this.db.query.transaction.findMany({
      where: and(
        eq(schema.transaction.userId, referrerId),
        eq(schema.transaction.source, "referral_commission")
      ),
      orderBy: [desc(schema.transaction.createdAt)],
      limit,
    });
  }

  /** Whether this user has already passed the invite-code gate (entered a valid code or explicitly skipped). */
  async hasCompletedInviteGate(userId: string): Promise<boolean> {
    const row = await this.db.query.userInviteStatus.findFirst({
      where: eq(schema.userInviteStatus.userId, userId),
    });
    return !!row;
  }

  async markInviteGateCompleted(userId: string): Promise<void> {
    await this.db
      .insert(schema.userInviteStatus)
      .values({ userId })
      .onConflictDoNothing();
  }

  async getReferralStats(referrerId: string): Promise<ReferralStats> {
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.referralLink)
      .where(eq(schema.referralLink.referrerId, referrerId));

    const [{ total }] = await this.db
      .select({ total: sql<number>`coalesce(sum(${schema.transaction.amountCents}), 0)::int` })
      .from(schema.transaction)
      .where(
        and(
          eq(schema.transaction.userId, referrerId),
          eq(schema.transaction.source, "referral_commission")
        )
      );

    return { count, earnedCents: total };
  }
}

export async function creditReferralCommission(
  ledger: LedgerService,
  referral: ReferralService,
  params: { refereeId: string; refereeTxId: string; amountCents: number }
): Promise<void> {
  const referrerId = await referral.getReferrerId(params.refereeId);
  if (!referrerId) return;
  if (referrerId === params.refereeId) return;

  const commissionCents = computeCommissionCents(params.amountCents);
  if (commissionCents <= 0) return;

  await ledger.credit({
    userId: referrerId,
    amountCents: commissionCents,
    txId: `referral_${params.refereeTxId}`,
    source: "referral_commission",
    metadata: { refereeId: params.refereeId, refereeTxId: params.refereeTxId },
  });
}
