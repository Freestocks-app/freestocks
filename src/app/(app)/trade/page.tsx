import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { TradeScreen } from "@/components/TradeScreen";

export const dynamic = "force-dynamic";

export default async function TradePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return null;
  }

  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const sessionEmail = session.user.email;

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <TradeScreen sessionEmail={sessionEmail} privyAppId={privyAppId} />
      </div>
    </div>
  );
}
