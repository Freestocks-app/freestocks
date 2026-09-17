import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db as typedDb, ensureDbInitialized } from "@/lib/db";
import type { DrizzleDB } from "@/server/ledger/service";
import * as schema from "@/lib/db/schema";
import { ReferralService } from "@/server/referral/service";

const db: DrizzleDB = typedDb;

export async function GET() {
  await ensureDbInitialized();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const referral = new ReferralService(db);
  const userId = session.user.id;

  const [referrerId, inviteGateCompleted] = await Promise.all([
    referral.getReferrerId(userId),
    referral.hasCompletedInviteGate(userId),
  ]);

  let referrerEmail: string | null = null;
  if (referrerId) {
    const referrer = await db.query.user.findFirst({
      where: eq(schema.user.id, referrerId),
    });
    referrerEmail = referrer?.email ?? null;
  }

  return NextResponse.json({
    referred: !!referrerId,
    referrerEmail,
    inviteGateCompleted,
  });
}
