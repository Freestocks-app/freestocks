import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/server/auth";
import { db } from "@/lib/db";
import { LedgerService } from "@/server/ledger/service";
import { TrendingUp, ArrowRight, Clock, DollarSign, CheckCircle } from "lucide-react";
import { redeemRequest, type RedeemRequest } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { RedeemFlow } from "@/components/RedeemFlow";

export const dynamic = "force-dynamic";

const MIN_UNLOCK_CENTS = 500;

export default async function UnlockPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return null;
  }

  const ledger = new LedgerService(db);
  const balanceCents = await ledger.getBalance(session.user.id);
  const progressPercent = Math.min(100, (balanceCents / MIN_UNLOCK_CENTS) * 100);
  const needsMore = MIN_UNLOCK_CENTS - balanceCents;
  const isReady = balanceCents >= MIN_UNLOCK_CENTS;

  const pendingRequests: RedeemRequest[] = await db
    .select()
    .from(redeemRequest)
    .where(eq(redeemRequest.userId, session.user.id))
    .orderBy(desc(redeemRequest.createdAt))
    .limit(5);

  const hasPendingRequest = pendingRequests.some((r: RedeemRequest) => r.status === "pending");
  const fomoReferralUrl = process.env.FOMO_REFERRAL_URL;

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-24 md:pb-6">
      <div className="px-4 md:px-6 py-3 border-b border-border bg-elevated/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cta/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-cta" />
            </div>
            <h1 className="text-base font-bold">Unlock Stocks</h1>
          </div>
          {hasPendingRequest && (
            <div className="flex items-center gap-1.5 text-xs text-cta bg-cta/10 border border-cta/20 rounded-full px-2.5 py-1">
              <Clock className="w-3 h-3" />
              <span>Pending</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
        <div className="card p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-cta/10 border border-cta/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-cta" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted">Your Balance</p>
              <p className="text-2xl font-bold tabular-nums">${(balanceCents / 100).toFixed(2)}</p>
            </div>
            <div className="text-right">
              {isReady ? (
                <span className="text-xs text-gain bg-gain/10 border border-gain/20 px-2 py-1 rounded-full font-medium">
                  Ready to unlock!
                </span>
              ) : (
                <p className="text-xs text-muted">
                  ${(needsMore / 100).toFixed(2)} to unlock
                </p>
              )}
            </div>
          </div>
          
          <div className="relative">
            <div className="h-2 bg-bg rounded-full overflow-hidden">
              <div 
                className="h-full bg-cta rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-muted">
              <span>$0</span>
              <span className="font-medium">$5.00 minimum</span>
            </div>
          </div>
        </div>

        {hasPendingRequest ? (
          <div className="card p-4 mb-4 border-cta/20 bg-cta/5">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-cta" />
              Redemption request pending
            </h3>
            <p className="text-xs text-muted mb-3">
              Your request is being processed by our team.
            </p>
            {pendingRequests.filter((r: RedeemRequest) => r.status === "pending").map((req: RedeemRequest) => (
              <div key={req.id} className="bg-bg rounded-lg p-3 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted">Stock</span>
                  <span className="text-sm font-semibold">{req.stockSymbol}</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted">Amount</span>
                  <span className="text-sm font-semibold tabular-nums">${(req.amountCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Wallet Address</span>
                  <span className="text-xs font-mono text-muted">{req.fomoAddress.slice(0, 6)}...{req.fomoAddress.slice(-4)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <RedeemFlow 
            balanceCents={balanceCents} 
            fomoReferralUrl={fomoReferralUrl}
          />
        )}

        {!isReady && !hasPendingRequest && (
          <Link href="/earn" className="btn-primary w-full text-sm py-2.5 justify-center mt-4">
            Start Earning
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
