"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, AlertCircle, Wallet, Send, QrCode } from "lucide-react";
import { useWalletBalances } from "@/hooks/useWalletBalances";
import { usePrices } from "@/hooks/usePrices";
import { useFundWallet } from "@privy-io/react-auth/solana";
import { WalletConnectPrompt } from "./WalletConnectPrompt";
import { SendFlow } from "./SendFlow";
import { ReceiveView } from "./ReceiveView";
import { getIssuerBadge } from "@/lib/tokenized-stocks";

interface WalletBalancesProps {
  address?: string;
  sessionEmail: string;
  onWalletReady: (address: string) => void;
}

type View = "balances" | "send" | "receive";

export function WalletBalances({ address, sessionEmail, onWalletReady }: WalletBalancesProps) {
  const { solBalance, usdcBalance, tokenBalances, loading, error } = useWalletBalances(address);
  const { prices, loading: pricesLoading } = usePrices();
  const { fundWallet } = useFundWallet();
  const [view, setView] = useState<View>("balances");

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

  if (view === "send") {
    return <SendFlow address={address} onBack={() => setView("balances")} />;
  }
  if (view === "receive") {
    return <ReceiveView address={address} onBack={() => setView("balances")} />;
  }

  const heldStocks = tokenBalances.filter((token) => token.uiAmount > 0);
  const totalValueCents = tokenBalances.reduce((sum, token) => {
    const price = prices[token.symbol]?.price;
    return price ? sum + Math.round(token.uiAmount * price * 100) : sum;
  }, 0);

  return (
    <div className="space-y-3">
      <div className="card p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted mb-0.5">Stocks held</p>
          <p className="font-bold tabular-nums">{heldStocks.length}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted mb-0.5">Portfolio value</p>
          <p className="font-bold tabular-nums">
            {pricesLoading ? "—" : `$${(totalValueCents / 100).toFixed(2)}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() =>
            fundWallet({ address, options: { asset: "USDC", defaultFundingMethod: "card", card: { preferredProvider: "moonpay" } } })
          }
          className="flex flex-col items-center gap-1 py-2.5 rounded-lg border border-border hover:bg-elevated transition-colors"
        >
          <Wallet className="w-4 h-4 text-cta" />
          <span className="text-xs font-semibold">Add cash</span>
        </button>
        <button
          onClick={() => setView("send")}
          className="flex flex-col items-center gap-1 py-2.5 rounded-lg border border-border hover:bg-elevated transition-colors"
        >
          <Send className="w-4 h-4 text-cta" />
          <span className="text-xs font-semibold">Send</span>
        </button>
        <button
          onClick={() => setView("receive")}
          className="flex flex-col items-center gap-1 py-2.5 rounded-lg border border-border hover:bg-elevated transition-colors"
        >
          <QrCode className="w-4 h-4 text-cta" />
          <span className="text-xs font-semibold">Receive</span>
        </button>
      </div>

      <div className="card p-4 flex items-center justify-between">
        <span className="text-sm text-muted">SOL</span>
        <span className="font-bold tabular-nums">{(solBalance ?? 0).toFixed(4)}</span>
      </div>

      <div className="card p-4 flex items-center justify-between">
        <span className="text-sm text-muted">USDC</span>
        <span className="font-bold tabular-nums">{(usdcBalance ?? 0).toFixed(2)}</span>
      </div>

      <div className="card divide-y divide-border">
        {tokenBalances.map((token) => {
          const issuerBadge = getIssuerBadge(token.issuer);
          const price = prices[token.symbol];
          const valueCents = price ? Math.round(token.uiAmount * price.price * 100) : null;
          const changePercent = price?.changePercent;
          const hasChange = token.issuer === "xstocks" && changePercent !== undefined && changePercent !== 0;

          return (
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
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-sm">${token.symbol}</p>
                  {token.issuer === "prestocks" && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${issuerBadge.color}`}
                    >
                      {issuerBadge.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted truncate">{token.name}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm tabular-nums block">{token.uiAmount}</span>
                {valueCents !== null && (
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs text-muted tabular-nums">
                      ${(valueCents / 100).toFixed(2)}
                    </span>
                    {hasChange && (
                      <span
                        className={`text-[10px] font-semibold tabular-nums ${
                          changePercent! > 0 ? "text-gain" : "text-red-400"
                        }`}
                      >
                        {changePercent! > 0 ? "+" : ""}
                        {changePercent!.toFixed(2)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
