import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db, ensureDbInitialized } from "@/lib/db";
import { LedgerService } from "@/server/ledger/service";

export async function GET() {
  await ensureDbInitialized();
  
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ledger = new LedgerService(db);
  const balanceCents = await ledger.getBalance(session.user.id);

  return NextResponse.json({ balanceCents });
}
