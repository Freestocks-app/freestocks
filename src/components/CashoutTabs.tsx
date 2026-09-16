"use client";

import { useState, useCallback } from "react";
import { SegmentedTabs } from "./SegmentedTabs";
import { CashoutFlow } from "./CashoutFlow";
import { WalletBalances } from "./WalletBalances";
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
}

function MyWalletTabContent({ sessionEmail, privyAppId }: { sessionEmail: string; privyAppId?: string }) {
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
      <WalletBalances address={address} sessionEmail={sessionEmail} onWalletReady={handleWalletReady} />
    </PrivyProvider>
  );
}

export function CashoutTabs(props: CashoutTabsProps) {
  const [activeTab, setActiveTab] = useState<"cashout" | "wallet">("cashout");

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <SegmentedTabs
          tabs={[
            { id: "cashout", label: "Cashout" },
            { id: "wallet", label: "My Wallet" },
          ]}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as "cashout" | "wallet")}
        />
      </div>

      {activeTab === "cashout" ? (
        <CashoutFlow
          balanceCents={props.balanceCents}
          availableBalanceCents={props.availableBalanceCents}
          pendingRequests={props.pendingRequests}
          sessionEmail={props.sessionEmail}
          privyAppId={props.privyAppId}
          minCashoutCents={props.minCashoutCents}
        />
      ) : (
        <MyWalletTabContent sessionEmail={props.sessionEmail} privyAppId={props.privyAppId} />
      )}
    </div>
  );
}
