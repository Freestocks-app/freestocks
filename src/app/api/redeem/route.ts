import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db, ensureDbInitialized } from "@/lib/db";
import { LedgerService } from "@/server/ledger/service";
import { redeemRequest, type RedeemRequest } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { priceSymbols } from "@/lib/tokenized-stocks";

const MIN_REDEEM_CENTS = 500;

export async function GET() {
  await ensureDbInitialized();
  
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests: RedeemRequest[] = await db
  .select()
  .from(redeemRequest)
  .where(eq(redeemRequest.userId, session.user.id))
  .orderBy(desc(redeemRequest.createdAt))
  .limit(10);

  return NextResponse.json({ requests });
}

const VALID_STOCK_SYMBOLS = priceSymbols;

export async function POST(request: NextRequest) {
  await ensureDbInitialized();
  
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { fomoAddress?: string; amountCents?: number; stockSymbol?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { fomoAddress, amountCents, stockSymbol } = body;

  if (!fomoAddress || typeof fomoAddress !== "string") {
    return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
  }

  // TODO(privy): Update validation to accept Solana base58 addresses
  if (!fomoAddress.match(/^0x[a-fA-F0-9]{40}$/) && !fomoAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
    return NextResponse.json({ error: "Invalid wallet address format" }, { status: 400 });
  }

  if (!amountCents || typeof amountCents !== "number" || amountCents < MIN_REDEEM_CENTS) {
    return NextResponse.json({ error: `Minimum redemption is $${(MIN_REDEEM_CENTS / 100).toFixed(2)}` }, { status: 400 });
  }

  if (!stockSymbol || typeof stockSymbol !== "string") {
    return NextResponse.json({ error: "Stock symbol is required" }, { status: 400 });
  }

  if (!VALID_STOCK_SYMBOLS.includes(stockSymbol)) {
    return NextResponse.json({ error: `Invalid stock symbol. Choose from: ${VALID_STOCK_SYMBOLS.join(", ")}` }, { status: 400 });
  }

  const ledger = new LedgerService(db);
  const balance = await ledger.getBalance(session.user.id);

  if (balance < amountCents) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  const pendingRequests: RedeemRequest[] = await db
    .select()
    .from(redeemRequest)
    .where(eq(redeemRequest.userId, session.user.id));

  const hasPending = pendingRequests.some((r: RedeemRequest) => r.status === "pending");
  if (hasPending) {
    return NextResponse.json({ error: "You already have a pending redemption request" }, { status: 400 });
  }

  const requestId = uuidv4();
  await db.insert(redeemRequest).values({
    id: requestId,
    userId: session.user.id,
    amountCents,
    fomoAddress,
    stockSymbol,
    status: "pending",
    createdAt: new Date(),
  });

  return NextResponse.json({
    success: true,
    requestId,
    stockSymbol,
    message: "Redemption request submitted. Your tokenized stock will be sent to your Solana wallet.",
  });
}
