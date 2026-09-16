import { eq, and } from "drizzle-orm";
import { redeemRequest, type RedeemRequest } from "@/lib/db/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDB = any;

/**
 * Sum of amountCents across all of a user's still-pending redeem requests.
 * redeem_request rows are never debited from the ledger balance automatically
 * (fulfillment is a manual/ops process), so this must be subtracted from
 * balanceCents wherever "how much can I cash out right now" is shown -
 * otherwise a user could request more in total than they actually have.
 */
export async function getPendingTotalCents(db: DrizzleDB, userId: string): Promise<number> {
  const pending: RedeemRequest[] = await db
    .select()
    .from(redeemRequest)
    .where(and(eq(redeemRequest.userId, userId), eq(redeemRequest.status, "pending")));

  return pending.reduce((sum: number, r: RedeemRequest) => sum + r.amountCents, 0);
}

export async function getAvailableBalanceCents(
  db: DrizzleDB,
  userId: string,
  balanceCents: number
): Promise<number> {
  const pendingTotalCents = await getPendingTotalCents(db, userId);
  return Math.max(0, balanceCents - pendingTotalCents);
}
