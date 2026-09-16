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
  availableBalanceCents: number;
  pendingRequests: RedeemRequest[];
  sessionEmail: string;
  privyAppId?: string;
  minCashoutCents: number;
}

function PendingRequestsList({ pendingRequests }: { pendingRequests: RedeemRequest[] }) {
  const pending = pendingRequests.filter((r) => r.status === "pending");
  if (pending.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-muted">
        <Clock className="w-3.5 h-3.5" />
        Pending ({pending.length})
      </div>
      <div className="card divide-y divide-border">
        {pending.map((req) => (
          <div key={req.id} className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-elevated border border-border flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-xs">{req.stockSymbol.slice(0, 2)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">${req.stockSymbol}</p>
              <p className="text-xs text-muted font-mono truncate">
                {req.fomoAddress.slice(0, 6)}...{req.fomoAddress.slice(-4)}
              </p>
            </div>
            <span className="font-bold text-sm tabular-nums flex-shrink-0">
              ${(req.amountCents / 100).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CashoutTabContent({
  balanceCents,
  availableBalanceCents,
  pendingRequests,
  sessionEmail,
  privyAppId,
  minCashoutCents,
}: CashoutTabsProps) {
  return (
    <div className="space-y-6">
      <CashoutFlow
        balanceCents={balanceCents}
        availableBalanceCents={availableBalanceCents}
        sessionEmail={sessionEmail}
        privyAppId={privyAppId}
        minCashoutCents={minCashoutCents}
      />
      <PendingRequestsList pendingRequests={pendingRequests} />
    </div>
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
