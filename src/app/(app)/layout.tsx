import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db } from "@/lib/db";
import { LedgerService } from "@/server/ledger/service";
import { getAvailableBalanceCents } from "@/server/redeem/service";
import { getPortfolioValueCents } from "@/server/wallet/portfolio";
import { StreakService } from "@/server/streak/service";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  const ledger = new LedgerService(db);
  const streak = new StreakService(db);
  const [balanceCents, streakCount, portfolio] = await Promise.all([
    ledger.getBalance(session.user.id),
    streak.getCurrentStreak(session.user.id),
    getPortfolioValueCents(db, session.user.id),
  ]);
  const availableBalanceCents = await getAvailableBalanceCents(db, session.user.id, balanceCents);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navigation
        balanceCents={availableBalanceCents}
        userName={session.user.name}
        streakCount={streakCount}
        portfolioValueCents={portfolio?.valueCents ?? null}
      />
      <main className="pt-12 md:pt-14">
        {children}
        <div className="pb-14 md:pb-0">
          <Footer />
        </div>
      </main>
    </div>
  );
}
