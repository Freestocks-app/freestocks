import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { LedgerService } from "@/server/ledger/service";
import { BitLabsService } from "@/server/bitlabs/service";

export async function GET(request: NextRequest) {
  await ensureDbInitialized();
  
  const secret = process.env.BITLABS_SECRET;

  if (!secret) {
    console.error("[BitLabs] BITLABS_SECRET not configured");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  console.log("[BitLabs] Callback received:", {
    url: request.url,
    urlLength: request.url.length,
  });

  const ledger = new LedgerService(db);
  const bitlabs = new BitLabsService(ledger, secret);

  const result = await bitlabs.processCallback({
    fullUrl: request.url,
  });

  if (!result.success) {
    console.error(`[BitLabs] Callback failed: ${result.error}`);
    
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
    console.log("[BitLabs] Duplicate TX, returning OK");
  } else {
    console.log("[BitLabs] Credit processed successfully");
  }

  return new NextResponse("OK", { status: 200 });
}
