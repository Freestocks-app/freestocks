import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDB = any;

/**
 * Persists (or updates) the user's verified Solana wallet address so it can
 * be looked up server-side - e.g. to compute a portfolio value for the
 * header - without requiring a client-side Privy session on every page load.
 */
export async function saveWalletAddress(
  db: DrizzleDB,
  userId: string,
  solanaAddress: string
): Promise<void> {
  await db
    .insert(schema.userWallet)
    .values({ userId, solanaAddress })
    .onConflictDoUpdate({
      target: schema.userWallet.userId,
      set: { solanaAddress },
    });
}

export async function getWalletAddress(db: DrizzleDB, userId: string): Promise<string | null> {
  const row = await db.query.userWallet.findFirst({
    where: eq(schema.userWallet.userId, userId),
  });
  return row?.solanaAddress ?? null;
}
