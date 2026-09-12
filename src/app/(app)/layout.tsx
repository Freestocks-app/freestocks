import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db } from "@/lib/db";
import { LedgerService } from "@/server/ledger/service";
import { Navigation } from "@/components/Navigation";

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
  const balanceCents = await ledger.getBalance(session.user.id);

  return (
    <div className="min-h-screen bg-bg">
      <Navigation balanceCents={balanceCents} userName={session.user.name} />
      <main className="pt-12 md:pt-14">{children}</main>
    </div>
  );
}
