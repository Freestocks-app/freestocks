import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db, ensureDbInitialized } from "@/lib/db";
import { LedgerService } from "@/server/ledger/service";
import { hasVerified, recordVerification } from "@/server/worldid/service";

const WORLD_ID_VERIFY_BASE = "https://developer.world.org/api/v4/verify";
const VERIFICATION_BONUS_CENTS = 100;

interface WorldIdResponseItem {
  identifier: string;
  success: boolean;
  nullifier: string;
  code?: string;
  detail?: string;
}

interface WorldIdVerifyApiResponse {
  success: boolean;
  nullifier?: string;
  results?: WorldIdResponseItem[];
}

/**
 * Verifies a World ID proof server-side and, on first-time success, credits
 * a one-time bonus. Never trusts a client-reported "success" alone - always
 * re-verifies against Worldcoin's own v4 verify endpoint before crediting
 * anything or recording a verification.
 */
export async function POST(request: NextRequest) {
  await ensureDbInitialized();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rpId = process.env.WORLD_ID_RP_ID;
  if (!rpId) {
    return NextResponse.json({ error: "World ID is not configured" }, { status: 503 });
  }

  const action = process.env.WORLD_ID_ACTION || "verify-human";

  let body: { nonce?: string; responses?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { nonce, responses } = body;
  if (!nonce || typeof nonce !== "string" || !responses) {
    return NextResponse.json({ error: "Missing nonce or responses" }, { status: 400 });
  }

  const alreadyVerified = await hasVerified(db, session.user.id);
  if (alreadyVerified) {
    return NextResponse.json({ success: true, alreadyVerified: true });
  }

  let verifyResult: WorldIdVerifyApiResponse;
  try {
    const res = await fetch(`${WORLD_ID_VERIFY_BASE}/${rpId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        protocol_version: "4.0",
        nonce,
        action,
        responses,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error(`[worldid] Verify request failed: ${res.status} ${errBody}`.slice(0, 500));
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    verifyResult = await res.json();
  } catch (err) {
    console.error("[worldid] Verify request errored:", err);
    return NextResponse.json({ error: "Verification request failed" }, { status: 502 });
  }

  if (!verifyResult.success || !verifyResult.nullifier) {
    return NextResponse.json({ error: "Proof was not accepted" }, { status: 400 });
  }

  const recordResult = await recordVerification(db, session.user.id, verifyResult.nullifier);
  if (!recordResult.success) {
    // duplicate: true means either this user (race with another request)
    // or - the important case - a different Freestocks account already
    // claimed this same real-world person's nullifier. Either way, no
    // second bonus.
    return NextResponse.json({ success: true, duplicate: true });
  }

  const ledger = new LedgerService(db);
  await ledger.credit({
    userId: session.user.id,
    amountCents: VERIFICATION_BONUS_CENTS,
    txId: `world_id_verify_${session.user.id}`,
    source: "world_id_verification",
    metadata: { nullifier: verifyResult.nullifier },
  });

  return NextResponse.json({ success: true });
}
