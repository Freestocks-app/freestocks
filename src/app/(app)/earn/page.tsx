import crypto from "crypto";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db } from "@/lib/db";
import { LedgerService } from "@/server/ledger/service";
import { getAvailableBalanceCents } from "@/server/redeem/service";
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
  const availableBalanceCents = await getAvailableBalanceCents(db, session.user.id, balanceCents);

  const providers: OfferwallProvider[] = [];

  const ayetAdslotId = process.env.AYET_ADSLOT_ID;
  if (ayetAdslotId) {
    providers.push({
      id: "ayet",
      name: "Game",
      url: `https://offerwall.ayet.io/offers?adSlot=${encodeURIComponent(ayetAdslotId)}&externalIdentifier=${encodeURIComponent(session.user.id)}`,
    });
  }

  const cpxAppId = process.env.NEXT_PUBLIC_CPX_APP_ID;
  const cpxSecret = process.env.CPX_SECRET;
  if (cpxAppId) {
    const cpxSecureHash = cpxSecret
      ? crypto.createHash("md5").update(`${session.user.id}-${cpxSecret}`).digest("hex")
      : undefined;

    providers.push({
      id: "cpx",
      name: "Survey",
      type: "cpx_script",
      cpxAppId,
      cpxSecureHash,
    });
  }

  const hasProviders = providers.length > 0;
  const progressPercent = Math.min(100, (availableBalanceCents / MIN_CASHOUT_CENTS) * 100);

  return (
    <div className="min-h-[calc(100vh-3rem)] flex flex-col">
      <ReferralAttribution />
      {/* Next Cashout Progress Bar - FreeCash style */}
      <div className="border-b border-border bg-[#0d1117]">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="text-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wide text-foreground">Next cashout</span>
          </div>
          <div className="relative h-6 rounded-full bg-elevated overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-l-full transition-all duration-500"
              style={{
                width: `${Math.max(progressPercent, 10)}%`,
                minWidth: "1.5rem",
                borderTopRightRadius: progressPercent >= 99 ? "9999px" : "0",
                borderBottomRightRadius: progressPercent >= 99 ? "9999px" : "0",
                background: "linear-gradient(90deg, #9fce2e 0%, #d4fc50 100%)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center gap-1 text-xs font-bold tabular-nums">
              <span className="text-cta-ink drop-shadow-sm">${(availableBalanceCents / 100).toFixed(2)}</span>
              <span className="text-cta-ink/60">/ $5.00</span>
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
