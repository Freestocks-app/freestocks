import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db, ensureDbInitialized } from "@/lib/db";
import { ReferralService } from "@/server/referral/service";

export async function POST() {
  await ensureDbInitialized();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const referral = new ReferralService(db);
  await referral.markInviteGateCompleted(session.user.id);

  return NextResponse.json({ success: true });
}
