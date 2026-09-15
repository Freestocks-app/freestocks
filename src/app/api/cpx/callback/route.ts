import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { LedgerService } from "@/server/ledger/service";
import { CpxService } from "@/server/cpx/service";
import { ReferralService } from "@/server/referral/service";

export async function GET(request: NextRequest) {
  await ensureDbInitialized();

  const secret = process.env.CPX_SECRET;

  if (!secret) {
    console.error("[CPX] CPX_SECRET not configured");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  console.log("[CPX] Callback received:", { url: request.url });

  const ledger = new LedgerService(db);
  const referral = new ReferralService(db);
  const cpx = new CpxService(ledger, secret, referral);

  const url = new URL(request.url);
  const result = await cpx.processCallback({ url });

  if (!result.success) {
    console.error(`[CPX] Callback failed: ${result.error}`);

    if (result.error === "invalid_signature") {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    if (result.error === "user_not_found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: result.error || "Bad request" },
      { status: 400 }
    );
  }

  if (result.duplicate) {
    console.log("[CPX] Duplicate TX, returning OK");
  } else if (result.credited) {
    console.log("[CPX] Credit processed successfully");
  } else if (result.debited) {
    console.log("[CPX] Chargeback processed successfully");
  }

  return new NextResponse("1", { status: 200 });
}
