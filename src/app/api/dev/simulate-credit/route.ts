import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { LedgerService } from "@/server/ledger/service";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  await ensureDbInitialized();

  try {
    const body = await request.json();
    const { userId, amountCents, source = "dev_test" } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (!amountCents || typeof amountCents !== "number" || amountCents <= 0) {
      return NextResponse.json(
        { error: "amountCents must be a positive number" },
        { status: 400 }
      );
    }

    const ledger = new LedgerService(db);
    const txId = `dev_${uuidv4()}`;

    const result = await ledger.credit({
      userId,
      amountCents,
      txId,
      source,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to credit" },
        { status: result.error === "user_not_found" ? 404 : 409 }
      );
    }

    return NextResponse.json({
      success: true,
      txId,
      credited: amountCents,
      newBalance: result.newBalance,
    });
  } catch (error) {
    console.error("[Dev] simulate-credit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    usage: {
      method: "POST",
      body: {
        userId: "string (required) - The user ID to credit",
        amountCents: "number (required) - Amount in cents to credit",
        source: "string (optional) - Source of the credit, defaults to 'dev_test'",
      },
      example: {
        userId: "your-user-id-here",
        amountCents: 500,
        source: "dev_test",
      },
    },
  });
}
