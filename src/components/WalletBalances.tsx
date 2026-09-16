"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, AlertCircle } from "lucide-react";
import { useWalletBalances } from "@/hooks/useWalletBalances";
import { WalletConnectPrompt } from "./WalletConnectPrompt";
import { getIssuerBadge, type StockPrice } from "@/lib/tokenized-stocks";

interface WalletBalancesProps {
  address?: string;
  sessionEmail: string;
  onWalletReady: (address: string) => void;
}

function usePrices(): { prices: Record<string, StockPrice>; loading: boolean } {
  const [prices, setPrices] = useState<Record<string, StockPrice>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/prices?all=1")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setPrices(data.prices ?? {});
      })
      .catch(() => {
        // Prices are a nice-to-have on this view - fall back to showing
        // just token counts with no USD value if this fails.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { prices, loading };
}

export function WalletBalances({ address, sessionEmail, onWalletReady }: WalletBalancesProps) {
  const { solBalance, tokenBalances, loading, error } = useWalletBalances(address);
  const { prices, loading: pricesLoading } = usePrices();

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

      <div className="card p-4 flex items-center justify-between">
        <span className="text-sm text-muted">SOL</span>
        <span className="font-bold tabular-nums">{(solBalance ?? 0).toFixed(4)}</span>
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
