import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/server/auth";
import { db } from "@/lib/db";
import { ReferralService } from "@/server/referral/service";
import { formatCents } from "@/lib/utils";
import { ReferralLinkCard } from "@/components/ReferralLinkCard";
import { ArrowLeft, Mail, Users } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function ReferralsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return null;
  }

  const referral = new ReferralService(db);
  const [code, stats, history] = await Promise.all([
    referral.getOrCreateReferralCode(session.user.id),
    referral.getReferralStats(session.user.id),
    referral.getReferralHistory(session.user.id),
  ]);

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-20 md:pb-6">
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        <Link href="/profile" className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground">
          <ArrowLeft className="w-3 h-3" />
          Back
        </Link>

        <div>
          <h1 className="text-2xl font-bold mb-1">Rewards</h1>
          <p className="text-xs text-muted mb-1">Total earned</p>
          <p className="text-4xl font-bold tabular-nums">{formatCents(stats.earnedCents)}</p>
        </div>

        <ReferralLinkCard code={code} />

        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="w-3.5 h-3.5 text-muted" />
              <span className="text-xs text-muted">Referrals</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-cta/15 text-cta font-medium">5%</span>
            </div>
            <p className="text-lg font-bold tabular-nums">{stats.count}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Mail className="w-3.5 h-3.5 text-muted" />
              <span className="text-xs text-muted">Earned</span>
            </div>
            <p className="text-lg font-bold tabular-nums">{formatCents(stats.earnedCents)}</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-2">History</h2>
          {history.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-sm text-muted">No referral earnings yet.</p>
            </div>
          ) : (
            <div className="card divide-y divide-border">
              {history.map((tx) => (
                <div key={tx.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gain/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-gain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Referral</p>
                    <p className="text-xs text-muted">{formatDate(tx.createdAt)}</p>
                  </div>
                  <span className="font-bold text-gain tabular-nums">
                    +{formatCents(tx.amountCents)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
