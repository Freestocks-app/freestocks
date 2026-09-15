"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Wallet,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { PrivyProvider } from "./PrivyProvider";
import { PrivyUnlockFlow } from "./PrivyUnlockFlow";
import { cashoutStocks, type TokenizedStock } from "@/lib/tokenized-stocks";

type Step = "stock" | "wallet" | "confirm";

interface CashoutFlowProps {
  balanceCents: number;
  sessionEmail: string;
  privyAppId?: string;
  minCashoutCents: number;
}

function StockLogo({ stock, size = "md" }: { stock: TokenizedStock; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  if (stock.logo) {
    return (
      <div className={`${sizeClasses[size]} rounded-xl overflow-hidden flex-shrink-0`}>
        <Image
          src={stock.logo}
          alt={stock.name}
          width={size === "lg" ? 48 : size === "md" ? 40 : 32}
          height={size === "lg" ? 48 : size === "md" ? 40 : 32}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-xl bg-elevated border border-border flex items-center justify-center`}>
      <span className="font-bold text-xs">{stock.symbol.slice(0, 2)}</span>
    </div>
  );
}

function StockCard({
  stock,
  canCashout,
  progressPercent,
  balanceCents,
  minCashoutCents,
  onSelect,
}: {
  stock: TokenizedStock;
  canCashout: boolean;
  progressPercent: number;
  balanceCents: number;
  minCashoutCents: number;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`group flex flex-col rounded-2xl border overflow-hidden transition-all text-left ${
        canCashout
          ? "border-border bg-elevated hover:border-cta/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cta/5"
          : "border-border bg-elevated/60"
      }`}
    >
      <div className="p-2 pb-1">
        <p className="text-xs font-semibold text-center truncate">${stock.symbol}</p>
      </div>
      <div className="mx-3 mb-2 aspect-square rounded-xl overflow-hidden bg-bg flex items-center justify-center">
        <Image
          src={stock.logo}
          alt={stock.name}
          width={96}
          height={96}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
      <div className="px-3 pb-3">
        <div className="h-1.5 rounded-full bg-bg overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.max(progressPercent, canCashout ? 100 : 8)}%`,
              background: "linear-gradient(90deg, #9fce2e 0%, #d4fc50 100%)",
            }}
          />
        </div>
        <p className={`text-center text-[11px] font-semibold ${canCashout ? "text-gain" : "text-muted"}`}>
          {canCashout
            ? "Withdraw now"
            : `$${(balanceCents / 100).toFixed(0)}/$${(minCashoutCents / 100).toFixed(0)}`}
        </p>
      </div>
    </button>
  );
}

function LockedProgressModal({
  balanceCents,
  minCashoutCents,
  onClose,
}: {
  balanceCents: number;
  minCashoutCents: number;
  onClose: () => void;
}) {
  const needsMore = minCashoutCents - balanceCents;
  const progressPercent = Math.min(100, (balanceCents / minCashoutCents) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70" onClick={onClose}>
      <div className="card p-5 max-w-sm w-full relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-bold mb-2 pr-6">
          Unlock cashout at ${(minCashoutCents / 100).toFixed(2)}
        </h2>
        <p className="text-sm text-muted mb-4">
          You need ${(minCashoutCents / 100).toFixed(2)} in available balance to make your first cashout.
        </p>
        <div className="flex items-center justify-between text-xs text-muted mb-1.5">
          <span>Your progress</span>
          <span className="tabular-nums">
            ${(balanceCents / 100).toFixed(2)} / ${(minCashoutCents / 100).toFixed(2)}
          </span>
        </div>
        <div className="h-2 bg-elevated rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-cta rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <Link href="/earn" className="btn-primary w-full justify-center">
          Earn ${(needsMore / 100).toFixed(2)} More
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function CashoutFlowInner({ balanceCents, sessionEmail, privyAppId, minCashoutCents }: CashoutFlowProps) {
  const [step, setStep] = useState<Step>("stock");
  const [selectedStock, setSelectedStock] = useState<TokenizedStock | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showLockedModal, setShowLockedModal] = useState(false);

  const canCashout = balanceCents >= minCashoutCents;
  const progressPercent = Math.min(100, (balanceCents / minCashoutCents) * 100);
  const isValidAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress);

  const handleSelectStock = (stock: TokenizedStock) => {
    if (!canCashout) {
      setShowLockedModal(true);
      return;
    }
    setSelectedStock(stock);
    setStep("wallet");
  };

  const handleWalletReady = useCallback((address: string) => {
    setWalletAddress(address);
    setStep("confirm");
  }, []);

  async function handleSubmit() {
    if (!selectedStock || !isValidAddress) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fomoAddress: walletAddress,
          amountCents: balanceCents,
          stockSymbol: selectedStock.symbol,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (success && selectedStock) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gain/10 border border-gain/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-gain" />
        </div>
        <h2 className="text-xl font-bold mb-1 text-gain">Cashout Submitted!</h2>
        <p className="text-sm text-muted mb-6">
          ${(balanceCents / 100).toFixed(2)} → ${selectedStock.symbol}
        </p>

        <div className="card p-4 text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Stock</span>
            <div className="flex items-center gap-2">
              <StockLogo stock={selectedStock} size="sm" />
              <span className="font-semibold">${selectedStock.symbol}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Amount</span>
            <span className="font-bold tabular-nums">${(balanceCents / 100).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Wallet</span>
            <span className="text-xs font-mono text-cta">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</span>
          </div>
        </div>

        <p className="text-[10px] text-muted mt-4">
          Your tokenized stock will be sent to your Solana wallet.
        </p>
      </div>
    );
  }

  if (!privyAppId) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-elevated border border-border flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-muted" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Setup Required</h2>
        <p className="text-sm text-muted">Wallet verification is not configured. Please contact support.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance display */}
      <div className="text-center mb-2">
        <p className="text-sm text-muted">Your balance</p>
        <p className="text-4xl font-bold text-cta tabular-nums">${(balanceCents / 100).toFixed(2)}</p>
      </div>

      {/* Step 1: Stock Selection - FreeCash-style grid */}
      {step === "stock" && (
        <>
          <p className="text-sm font-semibold mb-3">Most Popular</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {cashoutStocks.map((stock) => (
              <StockCard
                key={stock.symbol}
                stock={stock}
                canCashout={canCashout}
                progressPercent={progressPercent}
                balanceCents={balanceCents}
                minCashoutCents={minCashoutCents}
                onSelect={() => handleSelectStock(stock)}
              />
            ))}
          </div>
        </>
      )}

      {showLockedModal && (
        <LockedProgressModal
          balanceCents={balanceCents}
          minCashoutCents={minCashoutCents}
          onClose={() => setShowLockedModal(false)}
        />
      )}

      {/* Step 2: Wallet Verification */}
      {step === "wallet" && selectedStock && (
        <PrivyUnlockFlow
          sessionEmail={sessionEmail}
          balanceCents={balanceCents}
          selectedStock={selectedStock.symbol}
          onWalletReady={handleWalletReady}
          onBack={() => setStep("stock")}
        />
      )}

      {/* Step 3: Confirm */}
      {step === "confirm" && selectedStock && walletAddress && (
        <div className="space-y-4">
          <button
            onClick={() => setStep("wallet")}
            className="flex items-center gap-1 text-xs text-muted hover:text-foreground"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </button>

          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Stock</span>
              <div className="flex items-center gap-2">
                <StockLogo stock={selectedStock} size="sm" />
                <span className="font-semibold">${selectedStock.symbol}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Amount</span>
              <span className="font-bold text-lg tabular-nums">${(balanceCents / 100).toFixed(2)}</span>
            </div>
            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted">Solana Wallet</span>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-gain" />
                  <span className="text-xs text-gain">Verified</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-bg rounded-lg">
                <Wallet className="w-4 h-4 text-cta flex-shrink-0" />
                <span className="text-xs font-mono break-all">{walletAddress}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Confirm Cashout
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export function CashoutFlow({ balanceCents, sessionEmail, privyAppId, minCashoutCents }: CashoutFlowProps) {
  if (!privyAppId) {
    return (
      <CashoutFlowInner
        balanceCents={balanceCents}
        sessionEmail={sessionEmail}
        privyAppId={privyAppId}
        minCashoutCents={minCashoutCents}
      />
    );
  }

  return (
    <PrivyProvider appId={privyAppId}>
      <CashoutFlowInner
        balanceCents={balanceCents}
        sessionEmail={sessionEmail}
        privyAppId={privyAppId}
        minCashoutCents={minCashoutCents}
      />
    </PrivyProvider>
  );
}
