import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db } from "@/lib/db";
import { LedgerService } from "@/server/ledger/service";
import { Zap } from "lucide-react";
import { EarnOfferwall, OfferwallProvider } from "@/components/EarnOfferwall";
import { ReferralAttribution } from "@/components/ReferralAttribution";

export const dynamic = "force-dynamic";

const MIN_CASHOUT_CENTS = 500;

export default async function EarnPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    return null;
  }

  const ledger = new LedgerService(db);
  const balanceCents = await ledger.getBalance(session.user.id);

  const providers: OfferwallProvider[] = [];

  const ayetAdslotId = process.env.AYET_ADSLOT_ID;
  if (ayetAdslotId) {
    providers.push({
      id: "ayet",
      name: "Game",
      url: `https://offerwall.ayet.io/offers?adSlot=${encodeURIComponent(ayetAdslotId)}&externalIdentifier=${encodeURIComponent(session.user.id)}`,
    });
  }

  const bitlabsToken = process.env.BITLABS_TOKEN;
  if (bitlabsToken) {
    providers.push({
      id: "bitlabs",
      name: "Survey",
      url: `https://web.bitlabs.ai/?uid=${encodeURIComponent(session.user.id)}&token=${encodeURIComponent(bitlabsToken)}&theme=DARK&display_mode=surveys,offers,gaming&sdk=IFRAME&background_color=%230a0a0a&navigation_color=%23161616&interaction_color=%23d4fc50`,
    });
  }

  const hasProviders = providers.length > 0;
  const progressPercent = Math.min(100, (balanceCents / MIN_CASHOUT_CENTS) * 100);

  return (
    <div className="min-h-[calc(100vh-3rem)] flex flex-col">
      <ReferralAttribution />
      {/* Next Cashout Progress Bar - FreeCash style */}
      <div className="border-b border-border bg-[#0d1117]">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="text-center mb-2">
            <span className="text-xs text-muted">Next cashout</span>
          </div>
          <div className="relative">
            <div className="h-2 bg-elevated rounded-full overflow-hidden">
              <div 
                className="h-full bg-cta rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs">
              <span className="text-cta font-bold tabular-nums">${(balanceCents / 100).toFixed(2)}</span>
              <span className="text-muted font-semibold tabular-nums">/ $5.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 relative bg-bg pb-16 md:pb-0">
        {hasProviders ? (
          <EarnOfferwall providers={providers} userId={session.user.id} />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] px-4 sm:px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-cta/10 border border-cta/20 flex items-center justify-center mb-4">
              <Zap className="w-7 h-7 text-cta" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Offers Coming Soon</h2>
            <p className="text-muted text-sm max-w-xs mb-6">
              Earning opportunities loading. Check back shortly.
            </p>
            
            <div className="card p-4 text-left max-w-xs w-full">
              <p className="text-[10px] text-muted uppercase tracking-wide mb-1">Your User ID</p>
              <code className="text-xs text-cta break-all block">{session.user.id}</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
