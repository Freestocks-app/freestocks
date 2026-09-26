"use client";

import { useState } from "react";
import { Loader2, AlertCircle, Wallet, Send, QrCode } from "lucide-react";
import { useEvmWalletAddress } from "@/hooks/useEvmWalletAddress";
import { useEvmWalletBalances } from "@/hooks/useEvmWalletBalances";
import { usePrices } from "@/hooks/usePrices";
import { useFundWallet } from "@privy-io/react-auth";
import { EvmSendFlow } from "./EvmSendFlow";
import { ReceiveView } from "./ReceiveView";
import { formatTokenAmount } from "@/lib/token-amount";
import { BASE_CHAIN_ID } from "@/lib/uniswap/constants";

type View = "balances" | "send" | "receive";

/** Base-chain equivalent of WalletBalances.tsx - no issuer badge (single issuer in this mode), no wallet-connect step (EVM wallets are auto-created on login). */
export function EvmWalletBalances() {
  const address = useEvmWalletAddress();
  const { ethBalance, usdcBalance, tokenBalances, loading, error } = useEvmWalletBalances(address);
  const { prices, loading: pricesLoading } = usePrices();
  const { fundWallet } = useFundWallet();
  const [view, setView] = useState<View>("balances");

  if (!address) {
    return (
      <div className="card p-6 text-center">
        <Loader2 className="w-5 h-5 text-cta animate-spin mx-auto mb-2" />
        <p className="text-xs text-muted">Setting up your Base wallet…</p>
      </div>
    );
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
    return <EvmSendFlow address={address} onBack={() => setView("balances")} />;
  }
  if (view === "receive") {
    return (
      <ReceiveView
        address={address}
        onBack={() => setView("balances")}
        chainLabel="Base"
        assetHint="ETH, USDC, or any Base stock token"
      />
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

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() =>
            fundWallet({
              address,
              options: { chain: { id: BASE_CHAIN_ID }, asset: "USDC", defaultFundingMethod: "card", card: { preferredProvider: "moonpay" } },
            })
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
        <span className="text-sm text-muted">ETH</span>
        <span className="font-bold tabular-nums">{(ethBalance ?? 0).toFixed(4)}</span>
      </div>

      <div className="card p-4 flex items-center justify-between">
        <span className="text-sm text-muted">USDC</span>
        <span className="font-bold tabular-nums">{(usdcBalance ?? 0).toFixed(2)}</span>
      </div>

      <div className="card divide-y divide-border">
        {tokenBalances.map((token) => {
          const price = prices[token.symbol];
          const valueCents = price ? Math.round(token.uiAmount * price.price * 100) : null;

          return (
            <div key={token.symbol} className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-elevated border border-border flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-[10px]">{token.symbol.slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">${token.symbol}</p>
                <p className="text-xs text-muted truncate">{token.name}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm tabular-nums block">{formatTokenAmount(token.uiAmount, token.decimals)}</span>
                {valueCents !== null && (
                  <span className="text-xs text-muted tabular-nums">${(valueCents / 100).toFixed(2)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
