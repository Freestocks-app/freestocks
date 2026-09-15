"use client";

import Image from "next/image";
import { Loader2, AlertCircle } from "lucide-react";
import { useWalletBalances } from "@/hooks/useWalletBalances";
import { WalletConnectPrompt } from "./WalletConnectPrompt";

interface WalletBalancesProps {
  address?: string;
  sessionEmail: string;
  onWalletReady: (address: string) => void;
}

export function WalletBalances({ address, sessionEmail, onWalletReady }: WalletBalancesProps) {
  const { solBalance, tokenBalances, loading, error } = useWalletBalances(address);

  if (!address) {
    return <WalletConnectPrompt sessionEmail={sessionEmail} onWalletReady={onWalletReady} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-cta animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="card p-4 flex items-center justify-between">
        <span className="text-sm text-muted">SOL</span>
        <span className="font-bold tabular-nums">{(solBalance ?? 0).toFixed(4)}</span>
      </div>

      <div className="card divide-y divide-border">
        {tokenBalances.map((token) => (
          <div key={token.symbol} className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={token.logo}
                alt={token.name}
                width={32}
                height={32}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">${token.symbol}</p>
              <p className="text-xs text-muted truncate">{token.name}</p>
            </div>
            <span className="font-bold text-sm tabular-nums">{token.uiAmount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
