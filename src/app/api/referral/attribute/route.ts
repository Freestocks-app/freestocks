import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db, ensureDbInitialized } from "@/lib/db";
import { ReferralService } from "@/server/referral/service";

export async function POST(request: NextRequest) {
  await ensureDbInitialized();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const code = body?.code;
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Missing referral code" }, { status: 400 });
  }

  const referral = new ReferralService(db);
  const result = await referral.attribute(session.user.id, code);

  // Any outcome except an invalid code means the invite gate has been
  // handled for this user (either freshly attributed, or a referrer link
  // already exists) - don't prompt them again on their next page load.
  if (result.attributed || result.reason !== "invalid_code") {
    await referral.markInviteGateCompleted(session.user.id);
  }

  return NextResponse.json(result);
}
