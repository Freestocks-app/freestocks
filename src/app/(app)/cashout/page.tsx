import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db } from "@/lib/db";
import { LedgerService } from "@/server/ledger/service";
import { redeemRequest, type RedeemRequest } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { CashoutTabs } from "@/components/CashoutTabs";

export const dynamic = "force-dynamic";

const MIN_CASHOUT_CENTS = 500;

export default async function CashoutPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return null;
  }

  const ledger = new LedgerService(db);
  const balanceCents = await ledger.getBalance(session.user.id);

  const pendingRequests: RedeemRequest[] = await db
    .select()
    .from(redeemRequest)
    .where(eq(redeemRequest.userId, session.user.id))
    .orderBy(desc(redeemRequest.createdAt))
    .limit(5);

  const hasPendingRequest = pendingRequests.some((r: RedeemRequest) => r.status === "pending");
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const sessionEmail = session.user.email;

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-20 md:pb-6">
      <div className="max-w-md mx-auto px-4 py-6">
        <CashoutTabs
          balanceCents={balanceCents}
          hasPendingRequest={hasPendingRequest}
          pendingRequests={pendingRequests}
          sessionEmail={sessionEmail}
          privyAppId={privyAppId}
          minCashoutCents={MIN_CASHOUT_CENTS}
        />
      </div>
    </div>
  );
}
