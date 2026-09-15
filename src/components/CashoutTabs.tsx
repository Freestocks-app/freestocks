"use client";

import { useState, useCallback } from "react";
import { Clock } from "lucide-react";
import { SegmentedTabs } from "./SegmentedTabs";
import { CashoutFlow } from "./CashoutFlow";
import { WalletBalances } from "./WalletBalances";
import { PrivyProvider } from "./PrivyProvider";
import type { RedeemRequest } from "@/lib/db/schema";

interface CashoutTabsProps {
  balanceCents: number;
  hasPendingRequest: boolean;
  pendingRequests: RedeemRequest[];
  sessionEmail: string;
  privyAppId?: string;
  minCashoutCents: number;
}

function CashoutTabContent({
  balanceCents,
  hasPendingRequest,
  pendingRequests,
  sessionEmail,
  privyAppId,
  minCashoutCents,
}: CashoutTabsProps) {
  if (hasPendingRequest) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-cta/10 border border-cta/20 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-7 h-7 text-cta" />
          </div>
          <h1 className="text-xl font-bold">Pending Cashout</h1>
          <p className="text-sm text-muted mt-1">Your request is being processed</p>
        </div>

        {pendingRequests.filter((r) => r.status === "pending").map((req) => (
          <div key={req.id} className="card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-elevated border border-border flex items-center justify-center">
                <span className="font-bold text-sm">{req.stockSymbol.slice(0, 2)}</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold">${req.stockSymbol}</p>
                <p className="text-xs text-muted">Tokenized stock</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg tabular-nums">${(req.amountCents / 100).toFixed(2)}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Solana wallet</span>
                <span className="font-mono text-muted">{req.fomoAddress.slice(0, 6)}...{req.fomoAddress.slice(-4)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <CashoutFlow
      balanceCents={balanceCents}
      sessionEmail={sessionEmail}
      privyAppId={privyAppId}
      minCashoutCents={minCashoutCents}
    />
  );
}

function MyWalletTabContent({ sessionEmail, privyAppId }: { sessionEmail: string; privyAppId?: string }) {
  const [address, setAddress] = useState<string | undefined>(undefined);
  const handleWalletReady = useCallback((addr: string) => setAddress(addr), []);

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
        <CashoutTabContent {...props} />
      ) : (
        <MyWalletTabContent sessionEmail={props.sessionEmail} privyAppId={props.privyAppId} />
      )}
    </div>
  );
}
