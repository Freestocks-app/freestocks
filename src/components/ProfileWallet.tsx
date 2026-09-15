"use client";

import { useState, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import { PrivyProvider } from "./PrivyProvider";
import { WalletBalances } from "./WalletBalances";

interface ProfileWalletProps {
  sessionEmail: string;
  privyAppId?: string;
}

function ProfileWalletInner({ sessionEmail }: { sessionEmail: string }) {
  const [address, setAddress] = useState<string | undefined>(undefined);
  const handleWalletReady = useCallback((addr: string) => setAddress(addr), []);

  return (
    <WalletBalances address={address} sessionEmail={sessionEmail} onWalletReady={handleWalletReady} />
  );
}

export function ProfileWallet({ sessionEmail, privyAppId }: ProfileWalletProps) {
  if (!privyAppId) {
    return (
      <div className="p-3 rounded-lg bg-elevated border border-border flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-muted flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted">Wallet verification is not configured.</p>
      </div>
    );
  }

  return (
    <PrivyProvider appId={privyAppId}>
      <ProfileWalletInner sessionEmail={sessionEmail} />
    </PrivyProvider>
  );
}
