import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db } from "@/lib/db";
import { LedgerService } from "@/server/ledger/service";
import { redeemRequest, type RedeemRequest } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { CashoutFlow } from "@/components/CashoutFlow";
import { Clock, CheckCircle } from "lucide-react";

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
        {hasPendingRequest ? (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-cta/10 border border-cta/20 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-7 h-7 text-cta" />
              </div>
              <h1 className="text-xl font-bold">Pending Cashout</h1>
              <p className="text-sm text-muted mt-1">Your request is being processed</p>
            </div>

            {pendingRequests.filter((r: RedeemRequest) => r.status === "pending").map((req: RedeemRequest) => (
              <div key={req.id} className="card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-elevated border border-border flex items-center justify-center">
                    <span className="font-bold text-sm">{req.stockSymbol.slice(0, 2)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">${req.stockSymbol}</p>
                    <p className="text-xs text-muted">Tokenized stock</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg tabular-nums">${(req.amountCents / 100).toFixed(2)}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Solana wallet</span>
                    <span className="font-mono text-muted">{req.fomoAddress.slice(0, 6)}...{req.fomoAddress.slice(-4)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CashoutFlow 
            balanceCents={balanceCents} 
            sessionEmail={sessionEmail}
            privyAppId={privyAppId}
            minCashoutCents={MIN_CASHOUT_CENTS}
          />
        )}
      </div>
    </div>
  );
}
