import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/server/auth";
import { db } from "@/lib/db";
import { LedgerService } from "@/server/ledger/service";
import { DollarSign, ArrowRight, Zap, CheckCircle, Gift, Gamepad2, FileText, Lock, TrendingUp, Star, Flame, Clock } from "lucide-react";

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
  if (source.includes("survey")) return FileText;
  if (source.includes("game")) return Gamepad2;
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
    <div className="min-h-[calc(100vh-4rem)] pb-24 md:pb-6">
      <div className="sticky top-12 md:top-14 z-40 px-4 md:px-6 py-2 border-b border-border bg-bg/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-cta" />
            <span className="font-semibold text-sm">My Offers</span>
            <span className="text-xs text-muted">·</span>
            <span className="text-xs text-muted">{transactions.length} completed</span>
          </div>
          <div className="flex items-center gap-1.5 bg-cta/10 border border-cta/20 rounded-full px-2.5 py-1">
            <DollarSign className="w-3 h-3 text-cta" />
            <span className="text-cta font-bold text-sm tabular-nums">{(balanceCents / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
        {!hasTransactions ? (
          <div className="space-y-4">
            <div className="card p-5 text-center border-cta/20 bg-gradient-to-br from-cta/5 to-transparent">
              <div className="w-14 h-14 rounded-xl bg-cta/10 border border-cta/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-cta" />
              </div>
              <h2 className="font-semibold text-lg mb-1">No completed offers yet</h2>
              <p className="text-sm text-muted mb-4 max-w-sm mx-auto">
                This page shows your earning history. Complete your first offer to see it appear here with your reward.
              </p>
              <Link href="/earn" className="btn-primary text-sm py-2.5 px-6 inline-flex">
                Browse Offers
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted uppercase tracking-wide">What You Can Earn</p>
              <span className="text-[9px] text-muted bg-elevated px-2 py-0.5 rounded border border-border">Preview only</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { icon: Gamepad2, title: "Mobile Games", meta: "Reach milestones", reward: 4.50, chip: null, hasBonus: true, bonusText: "High payouts" },
                { icon: FileText, title: "Quick Surveys", meta: "5-15 minutes", reward: 0.85, chip: null, hasBonus: false, bonusText: "" },
                { icon: Gift, title: "App Signups", meta: "Try new apps", reward: 2.25, chip: null, hasBonus: true, bonusText: "Easy completion" },
              ].map((offer, i) => (
                <div key={i} className="card overflow-hidden opacity-70">
                  {offer.hasBonus && (
                    <div className="h-1 bg-muted/30" />
                  )}
                  <div className="p-3">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-elevated border border-border flex items-center justify-center flex-shrink-0">
                        <offer.icon className="w-5 h-5 text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-sm truncate text-muted">{offer.title}</p>
                        </div>
                        <p className="text-[11px] text-muted/70 truncate">{offer.meta}</p>
                      </div>
                    </div>
                    {offer.hasBonus && (
                      <div className="flex items-center gap-1.5 mb-3 px-2 py-1 rounded bg-elevated border border-border">
                        <Zap className="w-3 h-3 text-muted" />
                        <span className="text-[10px] text-muted">{offer.bonusText}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-muted/70 uppercase">Typical</p>
                        <p className="text-lg font-bold text-muted tabular-nums">${offer.reward.toFixed(2)}</p>
                      </div>
                      <Link href="/earn" className="btn-secondary text-xs py-1.5 px-3 opacity-80">
                        Earn →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted/60 text-center mt-2">
              These are example offer types. Browse real offers on the Earn page.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <div className="card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-muted" />
                  <span className="text-xs font-medium text-muted uppercase tracking-wide">Unlock Progress</span>
                </div>
                <div className="space-y-2">
                  {[
                    { amount: 1, label: "First dollar", icon: Star },
                    { amount: 5, label: "Stock redemption", icon: TrendingUp },
                    { amount: 25, label: "Power earner", icon: Zap },
                  ].map((tier, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-elevated border border-border flex items-center justify-center flex-shrink-0">
                        <Lock className="w-3 h-3 text-muted/50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs">{tier.label}</p>
                      </div>
                      <span className="text-[10px] text-muted tabular-nums">${tier.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-3 border-cta/20 bg-gradient-to-br from-cta/5 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-cta" />
                  <span className="text-xs font-medium">Quick Start</span>
                </div>
                <p className="text-xs text-muted mb-3">
                  Surveys pay $0.50–$2.00 in minutes. Games pay more but take longer.
                </p>
                <Link href="/earn" className="btn-primary text-xs py-1.5 w-full justify-center">
                  Browse All Offers
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="card p-4">
              <p className="text-xs text-muted uppercase tracking-wide mb-3">How it works</p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-cta/10 border border-cta/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-cta">1</div>
                  <div>
                    <p className="text-sm font-medium">Browse offers</p>
                    <p className="text-xs text-muted">Surveys, apps, games</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-cta/10 border border-cta/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-cta">2</div>
                  <div>
                    <p className="text-sm font-medium">Complete tasks</p>
                    <p className="text-xs text-muted">Follow instructions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gain/10 border border-gain/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gain">3</div>
                  <div>
                    <p className="text-sm font-medium">Get credited</p>
                    <p className="text-xs text-muted">Balance updated in minutes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="divide-y divide-border">
              {transactions.map((tx) => {
                const Icon = getSourceIcon(tx.source);
                return (
                  <div
                    key={tx.id}
                    className="px-4 py-2.5 flex items-center gap-3 hover:bg-elevated/30 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gain/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-gain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate capitalize">
                          {tx.source.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-muted bg-elevated px-1.5 py-0.5 rounded flex-shrink-0">
                          {formatDate(tx.createdAt)}
                        </span>
                      </div>
                    </div>
                    <span className="font-semibold text-gain text-sm tabular-nums flex-shrink-0">
                      +${(tx.amountCents / 100).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="px-4 py-3 border-t border-border bg-elevated/30">
              <Link href="/earn" className="text-xs text-cta font-medium hover:underline flex items-center gap-1">
                Browse more offers
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
