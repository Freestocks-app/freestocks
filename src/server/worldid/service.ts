import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import type { DrizzleDB } from "@/server/ledger/service";

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

export async function hasVerified(db: DrizzleDB, userId: string): Promise<boolean> {
  const row = await db.query.userWorldIdVerification.findFirst({
    where: eq(schema.userWorldIdVerification.userId, userId),
  });
  return !!row;
}

export interface RecordVerificationResult {
  success: boolean;
  /** true if this nullifier was already used - by this user or (more importantly) a different one. */
  duplicate?: boolean;
}

/**
 * Records a verified World ID proof for a user. The nullifier_hash unique
 * constraint is what actually prevents Sybil abuse here - it stops the
 * same real-world person from claiming the bonus under a second Freestocks
 * account, not just re-claiming on the same account.
 */
export async function recordVerification(
  db: DrizzleDB,
  userId: string,
  nullifierHash: string
): Promise<RecordVerificationResult> {
  try {
    await db.insert(schema.userWorldIdVerification).values({ userId, nullifierHash });
    return { success: true };
  } catch (error: unknown) {
    if (isUniqueViolation(error)) {
      return { success: false, duplicate: true };
    }
    throw error;
  }
}
