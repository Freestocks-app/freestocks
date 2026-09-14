import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/server/auth";
import { db } from "@/lib/db";
import { LedgerService } from "@/server/ledger/service";
import { Gift, ArrowRight, Gamepad2, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getSourceIcon(source: string) {
  if (source.includes("survey") || source.includes("bitlabs")) return FileText;
  if (source.includes("game") || source.includes("ayet")) return Gamepad2;
  return Gift;
}

export default async function MyOffersPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return null;
  }

  const ledger = new LedgerService(db);
  const balanceCents = await ledger.getBalance(session.user.id);
  const transactions = await ledger.getTransactions(session.user.id);

  const hasTransactions = transactions.length > 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-20 md:pb-6">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header with count */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold">My Offers</h1>
          <span className="text-sm text-muted">{transactions.length} completed</span>
        </div>

        {!hasTransactions ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-elevated border border-border flex items-center justify-center mx-auto mb-4">
              <Gift className="w-7 h-7 text-muted" />
            </div>
            <h2 className="font-semibold mb-1">No completed offers yet</h2>
            <p className="text-sm text-muted mb-6 max-w-xs mx-auto">
              Complete your first offer to see your earnings here.
            </p>
            <Link href="/earn" className="btn-primary inline-flex">
              Browse Offers
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="card">
            <div className="divide-y divide-border">
              {transactions.map((tx) => {
                const Icon = getSourceIcon(tx.source);
                return (
                  <div
                    key={tx.id}
                    className="px-4 py-3 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gain/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-gain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate capitalize">
                        {tx.source.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted">{formatDate(tx.createdAt)}</p>
                    </div>
                    <span className="font-bold text-gain tabular-nums">
                      +${(tx.amountCents / 100).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
