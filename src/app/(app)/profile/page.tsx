import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db, ensureDbInitialized } from "@/lib/db";
import { LedgerService } from "@/server/ledger/service";
import { hasVerified } from "@/server/worldid/service";
import { formatCents } from "@/lib/utils";
import { SignOutButton } from "@/components/SignOutButton";
import { ProfileWallet } from "@/components/ProfileWallet";
import { WorldIdVerifyCard } from "@/components/WorldIdVerifyCard";
import { User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return null;
  }

  await ensureDbInitialized();
  const ledger = new LedgerService(db);
  const [balanceCents, worldIdVerified] = await Promise.all([
    ledger.getBalance(session.user.id),
    hasVerified(db, session.user.id),
  ]);
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const worldIdAppId = process.env.NEXT_PUBLIC_WORLD_APP_ID;
  const worldIdAction = process.env.WORLD_ID_ACTION;

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-20 md:pb-6">
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-elevated flex items-center justify-center flex-shrink-0">
            {session.user.name ? (
              <span className="font-semibold">{session.user.name.charAt(0).toUpperCase()}</span>
            ) : (
              <User className="w-5 h-5 text-muted" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{session.user.name}</p>
            <p className="text-xs text-muted truncate">{session.user.email}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <span className="text-sm text-muted">Cash balance</span>
          <span className="font-bold text-lg tabular-nums text-cta">{formatCents(balanceCents)}</span>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-2">Wallet</h2>
          <ProfileWallet sessionEmail={session.user.email} privyAppId={privyAppId} />
        </div>

        {worldIdAppId && (
          <WorldIdVerifyCard
            initiallyVerified={worldIdVerified}
            appId={worldIdAppId}
            action={worldIdAction}
          />
        )}

        <SignOutButton />
      </div>
    </div>
  );
}
