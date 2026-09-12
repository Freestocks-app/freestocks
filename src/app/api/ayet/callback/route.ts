import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { LedgerService } from "@/server/ledger/service";
import { AyetService } from "@/server/ayet/service";

export async function GET(request: NextRequest) {
  await ensureDbInitialized();
  
  const apiKey = process.env.AYET_API_KEY;

  if (!apiKey) {
    console.error("[Ayet] AYET_API_KEY not configured");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const securityHash = request.headers.get("X-Ayetstudios-Security-Hash");

  console.log("[Ayet] Callback received:", {
    url: request.url,
    hasSecurityHash: !!securityHash,
  });

  const ledger = new LedgerService(db);
  const ayet = new AyetService(ledger, apiKey);

  const url = new URL(request.url);
  const result = await ayet.processCallback({
    url,
    securityHash,
  });

  if (!result.success) {
    console.error(`[Ayet] Callback failed: ${result.error}`);
    
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
    console.log("[Ayet] Duplicate TX, returning OK");
  } else if (result.credited) {
    console.log("[Ayet] Credit processed successfully");
  } else if (result.debited) {
    console.log("[Ayet] Chargeback processed successfully");
  }

  return new NextResponse("OK", { status: 200 });
}
