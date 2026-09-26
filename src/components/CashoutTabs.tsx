"use client";

import { Suspense, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SegmentedTabs } from "./SegmentedTabs";
import { CashoutFlow } from "./CashoutFlow";
import { EvmCashoutFlow } from "./EvmCashoutFlow";
import { WalletBalances } from "./WalletBalances";
import { EvmWalletBalances } from "./EvmWalletBalances";
import { PrivyProvider } from "./PrivyProvider";
import { persistWalletAddress } from "@/lib/persist-wallet-address";
import type { RedeemRequest } from "@/lib/db/schema";

interface CashoutTabsProps {
  balanceCents: number;
  availableBalanceCents: number;
  pendingRequests: RedeemRequest[];
  sessionEmail: string;
  privyAppId?: string;
  minCashoutCents: number;
  /** True only on the ETHGlobal demo domain - see TradeScreen.tsx for the pattern this mirrors. */
  ethGlobalDemo?: boolean;
}

type TabId = "cashout" | "wallet";

function MyWalletTabContent({
  sessionEmail,
  privyAppId,
  ethGlobalDemo,
}: {
  sessionEmail: string;
  privyAppId?: string;
  ethGlobalDemo?: boolean;
}) {
  const [address, setAddress] = useState<string | undefined>(undefined);
  const handleWalletReady = useCallback((addr: string) => {
    setAddress(addr);
    persistWalletAddress(addr);
  }, []);

  if (!privyAppId) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted">Wallet verification is not configured.</p>
      </div>
    );
  }

  return (
    <PrivyProvider appId={privyAppId}>
      {ethGlobalDemo ? (
        <EvmWalletBalances />
      ) : (
        <WalletBalances address={address} sessionEmail={sessionEmail} onWalletReady={handleWalletReady} />
      )}
    </PrivyProvider>
  );
}

export function CashoutTabs(props: CashoutTabsProps) {
  return (
    <Suspense fallback={null}>
      <CashoutTabsInner {...props} />
    </Suspense>
  );
}

function CashoutTabsInner(props: CashoutTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get("tab");
  const initialTab: TabId = tabParam === "wallet" ? "wallet" : "cashout";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const handleTabChange = (id: string) => {
    const nextTab = id as TabId;
    setActiveTab(nextTab);

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <SegmentedTabs
          tabs={[
            { id: "cashout", label: "Cashout" },
            { id: "wallet", label: "My Wallet" },
          ]}
          activeId={activeTab}
          onChange={handleTabChange}
        />
      </div>

      {activeTab === "cashout" ? (
        props.ethGlobalDemo ? (
          <EvmCashoutFlow
            balanceCents={props.balanceCents}
            availableBalanceCents={props.availableBalanceCents}
            pendingRequests={props.pendingRequests}
            privyAppId={props.privyAppId}
            minCashoutCents={props.minCashoutCents}
          />
        ) : (
          <CashoutFlow
            balanceCents={props.balanceCents}
            availableBalanceCents={props.availableBalanceCents}
            pendingRequests={props.pendingRequests}
            sessionEmail={props.sessionEmail}
            privyAppId={props.privyAppId}
            minCashoutCents={props.minCashoutCents}
          />
        )
      ) : (
        <MyWalletTabContent
          sessionEmail={props.sessionEmail}
          privyAppId={props.privyAppId}
          ethGlobalDemo={props.ethGlobalDemo}
        />
      )}
    </div>
  );
}
