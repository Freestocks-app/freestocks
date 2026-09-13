"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Wallet,
  AlertCircle,
  Loader2,
  Check,
  Settings,
} from "lucide-react";
import { PrivyProvider } from "./PrivyProvider";
import { PrivyUnlockFlow } from "./PrivyUnlockFlow";

interface Stock {
  symbol: string;
  name: string;
}

const STOCKS: Stock[] = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "GOOGL", name: "Google" },
  { symbol: "MSFT", name: "Microsoft" },
];

type Step = "stock" | "verify" | "confirm";

interface RedeemFlowProps {
  balanceCents: number;
  sessionEmail: string;
  privyAppId?: string;
}

function PrivyNotConfigured() {
  return (
    <div className="card p-6 text-center border-border">
      <div className="w-14 h-14 rounded-xl bg-elevated border border-border flex items-center justify-center mx-auto mb-4">
        <Settings className="w-7 h-7 text-muted" />
      </div>
      <h3 className="font-semibold text-sm mb-2">Wallet Verification Not Configured</h3>
      <p className="text-xs text-muted mb-4 max-w-xs mx-auto">
        The Privy integration required for wallet verification is not configured. Please contact support or try again later.
      </p>
      <div className="p-3 rounded-lg bg-elevated border border-border text-left">
        <p className="text-[10px] text-muted mb-1">For developers:</p>
        <code className="text-[10px] text-cta">NEXT_PUBLIC_PRIVY_APP_ID</code>
        <p className="text-[10px] text-muted mt-1">must be set in environment variables</p>
      </div>
    </div>
  );
}

function RedeemFlowInner({ balanceCents, sessionEmail, privyAppId }: RedeemFlowProps) {
  const [step, setStep] = useState<Step>("stock");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const MIN_UNLOCK_CENTS = 500;
  const canUnlock = balanceCents >= MIN_UNLOCK_CENTS;
  const isValidAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress);

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
          stockSymbol: selectedStock,
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

  if (success) {
    return (
      <div className="card p-6 text-center border-gain/20 bg-gain/5">
        <div className="w-14 h-14 rounded-xl bg-gain/10 border border-gain/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-gain" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-gain">Request Submitted!</h3>
        <p className="text-sm text-muted mb-4">
          Your ${(balanceCents / 100).toFixed(2)} redemption for {selectedStock} is pending.
          <br />
          <span className="text-foreground">On the way to your Solana wallet.</span>
        </p>
        <div className="bg-bg rounded-lg p-3 border border-border text-left mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted">Stock</span>
            <span className="text-sm font-semibold">{selectedStock}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted">Amount</span>
            <span className="text-sm font-semibold tabular-nums">${(balanceCents / 100).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Solana Wallet</span>
            <span className="text-xs font-mono text-cta">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
          </div>
        </div>
        <p className="text-[10px] text-muted">
          Status: <span className="text-cta">Pending</span> — Your tokenized stock will be sent to your Solana wallet.
        </p>
      </div>
    );
  }

  if (!canUnlock) {
    const needsMore = MIN_UNLOCK_CENTS - balanceCents;
    return (
      <div className="card p-5 border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-elevated border border-border flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm mb-1">Keep earning to unlock</p>
            <p className="text-xs text-muted leading-relaxed mb-3">
              You need ${(MIN_UNLOCK_CENTS / 100).toFixed(2)} to unlock tokenized stocks.
              <br />
              <span className="text-foreground">${(needsMore / 100).toFixed(2)} more to go!</span>
            </p>
            <Link href="/earn" className="btn-primary text-sm py-2 px-4 inline-flex">
              Start Earning
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!privyAppId) {
    return <PrivyNotConfigured />;
  }

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-2">
        {(["stock", "verify", "confirm"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? "bg-cta text-cta-ink"
                  : (["stock", "verify", "confirm"].indexOf(step) > i)
                  ? "bg-gain text-cta-ink"
                  : "bg-elevated border border-border text-muted"
              }`}
            >
              {(["stock", "verify", "confirm"].indexOf(step) > i) ? (
                <Check className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 2 && (
              <div
                className={`w-8 h-0.5 mx-1 ${
                  (["stock", "verify", "confirm"].indexOf(step) > i) ? "bg-gain" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
        <span className="text-xs text-muted ml-2">
          {step === "stock" && "Pick stock"}
          {step === "verify" && "Verify email"}
          {step === "confirm" && "Confirm unlock"}
        </span>
      </div>

      {/* Step 1: Stock Selection */}
      {step === "stock" && (
        <div className="card p-4">
          <h3 className="font-semibold text-sm mb-1">Choose your stock</h3>
          <p className="text-xs text-muted mb-4">
            Select which stock to unlock with your ${(balanceCents / 100).toFixed(2)} balance.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {STOCKS.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => setSelectedStock(stock.symbol)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  selectedStock === stock.symbol
                    ? "border-cta bg-cta/10"
                    : "border-border bg-bg hover:border-cta/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center ${
                      selectedStock === stock.symbol
                        ? "bg-cta text-cta-ink"
                        : "bg-elevated border border-border"
                    }`}
                  >
                    <span className="font-bold text-[10px]">{stock.symbol.slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{stock.symbol}</p>
                    <p className="text-[10px] text-muted">{stock.name}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep("verify")}
            disabled={!selectedStock}
            className="btn-primary w-full text-sm py-2.5 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue with {selectedStock || "..."}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: Privy Email Verification */}
      {step === "verify" && selectedStock && (
        <PrivyUnlockFlow
          sessionEmail={sessionEmail}
          balanceCents={balanceCents}
          selectedStock={selectedStock}
          onWalletReady={handleWalletReady}
          onBack={() => setStep("stock")}
        />
      )}

      {/* Step 3: Confirm & Submit */}
      {step === "confirm" && walletAddress && (
        <div className="card p-4">
          <button
            onClick={() => setStep("verify")}
            className="flex items-center gap-1 text-xs text-muted hover:text-foreground mb-3"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to verification
          </button>

          <h3 className="font-semibold text-sm mb-1">Confirm your unlock</h3>
          <p className="text-xs text-muted mb-4">
            Review the details and unlock your tokenized stock.
          </p>

          <div className="space-y-3">
            <div className="bg-elevated rounded-lg p-4 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Stock</span>
                <span className="text-sm font-semibold">{selectedStock}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Amount</span>
                <span className="text-sm font-semibold tabular-nums">${(balanceCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Network</span>
                <span className="text-xs text-cta font-medium">Solana</span>
              </div>
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Destination Wallet</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-gain" />
                    <span className="text-xs text-gain">Verified</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Wallet className="w-4 h-4 text-cta" />
                  <span className="text-xs font-mono text-foreground break-all">
                    {walletAddress}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !isValidAddress}
              className="btn-primary w-full text-sm py-2.5 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Unlock {selectedStock}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[10px] text-muted text-center">
              Your tokenized stock will be sent to your verified Solana wallet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function RedeemFlow({ balanceCents, sessionEmail, privyAppId }: RedeemFlowProps) {
  if (!privyAppId) {
    return (
      <RedeemFlowInner
        balanceCents={balanceCents}
        sessionEmail={sessionEmail}
        privyAppId={privyAppId}
      />
    );
  }

  return (
    <PrivyProvider appId={privyAppId}>
      <RedeemFlowInner
        balanceCents={balanceCents}
        sessionEmail={sessionEmail}
        privyAppId={privyAppId}
      />
    </PrivyProvider>
  );
}
