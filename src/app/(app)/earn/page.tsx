import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/server/auth";
import { db } from "@/lib/db";
import { LedgerService } from "@/server/ledger/service";
import { Zap, DollarSign, FileText, Gamepad2, Gift, ArrowRight } from "lucide-react";
import { EarnOfferwall, OfferwallProvider } from "@/components/EarnOfferwall";

export const dynamic = "force-dynamic";

const modes = [
  { id: "surveys", label: "Surveys", icon: FileText, color: "text-cta" },
  { id: "offers", label: "Offers", icon: Gift, color: "text-gain" },
  { id: "gaming", label: "Games", icon: Gamepad2, color: "text-cta" },
];

const MIN_UNLOCK_CENTS = 500;

export default async function EarnPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    return null;
  }

  const ledger = new LedgerService(db);
  const balanceCents = await ledger.getBalance(session.user.id);

  const providers: OfferwallProvider[] = [];

  const bitlabsToken = process.env.BITLABS_TOKEN;
  if (bitlabsToken) {
    providers.push({
      id: "bitlabs",
      name: "BitLabs",
      url: `https://web.bitlabs.ai/?uid=${encodeURIComponent(session.user.id)}&token=${encodeURIComponent(bitlabsToken)}&theme=DARK&display_mode=surveys,offers,gaming&sdk=IFRAME&background_color=%230a0a0a&navigation_color=%23161616&interaction_color=%23d4fc50`,
    });
  }

  const ayetAdslotId = process.env.AYET_ADSLOT_ID;
  if (ayetAdslotId) {
    providers.push({
      id: "ayet",
      name: "Ayet",
      url: `https://offerwall.ayet.io/offers?adSlot=${encodeURIComponent(ayetAdslotId)}&externalIdentifier=${encodeURIComponent(session.user.id)}`,
    });
  }

  const hasProviders = providers.length > 0;
  const progressPercent = Math.min(100, (balanceCents / MIN_UNLOCK_CENTS) * 100);
  const needsMore = MIN_UNLOCK_CENTS - balanceCents;

  return (
    <div className="min-h-[calc(100vh-3rem)] flex flex-col">
      <div className="sticky top-12 md:top-14 z-40 border-b border-border bg-bg/95 backdrop-blur-md">
        <div className="px-4 md:px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2 flex-shrink-0">
                <Zap className="w-4 h-4 text-cta" />
                <span className="font-semibold text-sm">Earn</span>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                {modes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <div
                      key={mode.id}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-elevated/50 border border-border text-xs"
                    >
                      <Icon className={`w-3 h-3 ${mode.color}`} />
                      <span className="text-muted">{mode.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              {balanceCents < MIN_UNLOCK_CENTS && (
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[10px] text-muted whitespace-nowrap">Unlock</span>
                  <div className="w-12 h-1.5 bg-elevated rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cta to-gain rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted whitespace-nowrap tabular-nums">
                    {Math.round(progressPercent)}% · ${(needsMore / 100).toFixed(2)} to go
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-cta/10 border border-cta/20 rounded-full px-2.5 py-1">
                <DollarSign className="w-3 h-3 text-cta" />
                <span className="text-cta font-bold text-sm tabular-nums">
                  {(balanceCents / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {balanceCents < MIN_UNLOCK_CENTS && (
          <div className="sm:hidden px-4 py-1.5 bg-elevated/30 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-muted">Unlock</span>
              <div className="flex-1 h-1 bg-bg rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cta to-gain rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[9px] text-muted whitespace-nowrap tabular-nums">
                {Math.round(progressPercent)}% · ${(needsMore / 100).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 relative bg-elevated/10 pb-16 md:pb-0">
        {hasProviders ? (
          <EarnOfferwall providers={providers} userId={session.user.id} />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] px-6 text-center">
            <div className="w-14 h-14 rounded-xl bg-cta/10 border border-cta/20 flex items-center justify-center mb-4">
              <Zap className="w-7 h-7 text-cta" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Offers Coming Soon</h2>
            <p className="text-muted text-sm max-w-xs mb-6">
              We&apos;re setting up earning opportunities. Check back shortly for surveys, apps, and games.
            </p>
            
            <div className="card p-4 text-left max-w-xs w-full mb-4">
              <p className="text-[10px] text-muted uppercase tracking-wide mb-1">Your User ID</p>
              <code className="text-xs text-cta break-all block">{session.user.id}</code>
            </div>

            <Link href="/offers" className="text-xs text-cta font-medium hover:underline flex items-center gap-1">
              View your balance
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
