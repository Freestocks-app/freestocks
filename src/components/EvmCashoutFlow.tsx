"use client";

import { useState } from "react";
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
  Clock,
} from "lucide-react";
import { PrivyProvider } from "./PrivyProvider";
import { useEvmWalletAddress } from "@/hooks/useEvmWalletAddress";
import { BASE_STOCKS, type BaseStock } from "@/lib/uniswap/constants";
import type { RedeemRequest } from "@/lib/db/schema";

type Step = "stock" | "confirm";

interface EvmCashoutFlowProps {
  balanceCents: number;
  /** Balance minus the total of any pending redemption requests. Defaults to balanceCents. */
  availableBalanceCents?: number;
  pendingRequests?: RedeemRequest[];
  privyAppId?: string;
  minCashoutCents: number;
}

function PendingRequestsList({ pendingRequests }: { pendingRequests: RedeemRequest[] }) {
  const pending = pendingRequests.filter((r) => r.status === "pending");
  if (pending.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
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

function StockLogo({ stock, size = "md" }: { stock: BaseStock; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

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

function StockCard({
  stock,
  canCashout,
  progressPercent,
  balanceCents,
  minCashoutCents,
  onSelect,
}: {
  stock: BaseStock;
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
      <div className="p-2 pb-1 flex flex-col items-center gap-1">
        <p className="text-xs font-semibold text-center truncate w-full">${stock.symbol}</p>
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
        <p className={`text-center text-[11px] font-semibold ${canCashout ? "text-cta" : "text-muted"}`}>
          {canCashout
            ? "Withdraw now"
            : `$${(balanceCents / 100).toFixed(2)}/$${(minCashoutCents / 100).toFixed(2)}`}
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

function EvmCashoutFlowInner({
  balanceCents,
  availableBalanceCents = balanceCents,
  pendingRequests = [],
  minCashoutCents,
}: EvmCashoutFlowProps) {
  const address = useEvmWalletAddress();
  const [step, setStep] = useState<Step>("stock");
  const [selectedStock, setSelectedStock] = useState<BaseStock | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successAmountCents, setSuccessAmountCents] = useState(0);
  const [showLockedModal, setShowLockedModal] = useState(false);

  const canCashout = availableBalanceCents >= minCashoutCents;
  const progressPercent = Math.min(100, (availableBalanceCents / minCashoutCents) * 100);

  const amountCents = Math.round(parseFloat(amountInput || "0") * 100);
  const isValidAmount =
    Number.isFinite(amountCents) && amountCents >= minCashoutCents && amountCents <= availableBalanceCents;

  const handleSelectStock = (stock: BaseStock) => {
    if (!canCashout) {
      setShowLockedModal(true);
      return;
    }
    setSelectedStock(stock);
    setAmountInput((availableBalanceCents / 100).toFixed(2));
    setStep("confirm");
  };

  async function handleSubmit() {
    if (!selectedStock || !address || !isValidAmount) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fomoAddress: address,
          amountCents,
          stockSymbol: selectedStock.symbol,
          stockIssuer: "coinbase",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setSuccessAmountCents(amountCents);
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
        <p className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          ${(successAmountCents / 100).toFixed(2)} → ${selectedStock.symbol}
        </p>
        <p className="text-sm text-muted mb-6">
          Delivered to your wallet within 3 business days.
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
            <span className="font-bold tabular-nums">${(successAmountCents / 100).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Wallet</span>
            <span className="text-xs font-mono text-cta">{address?.slice(0, 8)}...{address?.slice(-6)}</span>
          </div>
        </div>

        <p className="text-[10px] text-muted mt-4">
          Your tokenized stock will be sent to your Base wallet.
        </p>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="card p-6 text-center">
        <Loader2 className="w-5 h-5 text-cta animate-spin mx-auto mb-2" />
        <p className="text-xs text-muted">Setting up your Base wallet…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance display */}
      <div className="text-center mb-2">
        <p className="text-sm text-muted">Your balance</p>
        <p className="text-4xl font-bold text-cta tabular-nums">${(balanceCents / 100).toFixed(2)}</p>
        {availableBalanceCents < balanceCents && (
          <p className="text-xs text-muted mt-1">
            ${(availableBalanceCents / 100).toFixed(2)} available (rest pending)
          </p>
        )}
      </div>

      {/* Step 1: Stock Selection */}
      {step === "stock" && (
        <>
          <PendingRequestsList pendingRequests={pendingRequests} />

          <p className="text-sm font-semibold mb-3">Cash out to</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {BASE_STOCKS.map((stock) => (
              <StockCard
                key={stock.symbol}
                stock={stock}
                canCashout={canCashout}
                progressPercent={progressPercent}
                balanceCents={availableBalanceCents}
                minCashoutCents={minCashoutCents}
                onSelect={() => handleSelectStock(stock)}
              />
            ))}
          </div>
        </>
      )}

      {showLockedModal && (
        <LockedProgressModal
          balanceCents={availableBalanceCents}
          minCashoutCents={minCashoutCents}
          onClose={() => setShowLockedModal(false)}
        />
      )}

      {/* Step 2: Confirm */}
      {step === "confirm" && selectedStock && (
        <div className="space-y-4">
          <button
            onClick={() => setStep("stock")}
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
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-muted">Amount</span>
                <span className="text-xs text-muted tabular-nums">
                  Available: ${(availableBalanceCents / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-bg rounded-lg px-3 py-2 border border-border focus-within:border-cta/50">
                <span className="text-lg font-bold text-muted">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, "");
                    setAmountInput(value);
                  }}
                  className="flex-1 bg-transparent text-lg font-bold tabular-nums outline-none min-w-0"
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={() => setAmountInput((availableBalanceCents / 100).toFixed(2))}
                  className="text-xs font-semibold text-cta hover:underline flex-shrink-0"
                >
                  Max
                </button>
              </div>
              {!isValidAmount && amountInput !== "" && (
                <p className="text-xs text-red-400 mt-1.5">
                  {amountCents > availableBalanceCents
                    ? "Amount exceeds your available balance"
                    : `Minimum cashout is $${(minCashoutCents / 100).toFixed(2)}`}
                </p>
              )}
            </div>
            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted">Base Wallet</span>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-gain" />
                  <span className="text-xs text-gain">Verified</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-bg rounded-lg">
                <Wallet className="w-4 h-4 text-cta flex-shrink-0" />
                <span className="text-xs font-mono break-all">{address}</span>
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
            disabled={loading || !isValidAmount}
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

export function EvmCashoutFlow({
  balanceCents,
  availableBalanceCents,
  pendingRequests,
  privyAppId,
  minCashoutCents,
}: EvmCashoutFlowProps) {
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
    <PrivyProvider appId={privyAppId}>
      <EvmCashoutFlowInner
        balanceCents={balanceCents}
        availableBalanceCents={availableBalanceCents}
        pendingRequests={pendingRequests}
        privyAppId={privyAppId}
        minCashoutCents={minCashoutCents}
      />
    </PrivyProvider>
  );
}
