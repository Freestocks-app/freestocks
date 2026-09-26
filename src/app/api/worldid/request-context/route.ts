import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { signRequest } from "@worldcoin/idkit-server";
import { auth } from "@/server/auth";

/**
 * Mints a fresh, short-lived rp_context for one World ID verification
 * attempt. Signing happens ONLY here, server-side - WORLD_ID_SIGNING_KEY
 * must never reach the client, since it's what proves a request actually
 * came from this app's backend (anyone with it could forge verifications).
 * The client fetches this immediately before opening the IDKit widget,
 * not once at page load - rp_context has a short TTL by design.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signingKeyHex = process.env.WORLD_ID_SIGNING_KEY;
  const rpId = process.env.WORLD_ID_RP_ID;
  if (!signingKeyHex || !rpId) {
    return NextResponse.json({ error: "World ID is not configured" }, { status: 503 });
  }

  const action = process.env.WORLD_ID_ACTION || "verify-human";

  const { sig, nonce, createdAt, expiresAt } = signRequest({ signingKeyHex, action });

  return NextResponse.json({
    rp_context: {
      rp_id: rpId,
      nonce,
      created_at: createdAt,
      expires_at: expiresAt,
      signature: sig,
    },
  });
}
