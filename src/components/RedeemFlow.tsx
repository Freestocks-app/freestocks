"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Wallet,
  AlertCircle,
  Loader2,
  Copy,
  Check,
} from "lucide-react";

const FOMO_REFERRAL_URL_PLACEHOLDER = "https://fomo.family/r/freestocks";

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

type Step = "stock" | "fomo" | "wallet";

interface RedeemFlowProps {
  balanceCents: number;
  fomoReferralUrl?: string;
}

export function RedeemFlow({ balanceCents, fomoReferralUrl }: RedeemFlowProps) {
  const [step, setStep] = useState<Step>("stock");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [hasFomoAccount, setHasFomoAccount] = useState(false);
  const [fomoAddress, setFomoAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralUrl = fomoReferralUrl || FOMO_REFERRAL_URL_PLACEHOLDER;
  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(fomoAddress);
  const MIN_UNLOCK_CENTS = 500;
  const canUnlock = balanceCents >= MIN_UNLOCK_CENTS;

  async function handleCopyReferral() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API failed
    }
  }

  async function handleSubmit() {
    if (!selectedStock || !isValidAddress) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fomoAddress,
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
          <span className="text-foreground">On the way to your FOMO wallet.</span>
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
            <span className="text-xs text-muted">FOMO Address</span>
            <span className="text-xs font-mono text-muted">{fomoAddress.slice(0, 6)}...{fomoAddress.slice(-4)}</span>
          </div>
        </div>
        <p className="text-[10px] text-muted">
          Status: <span className="text-cta">Pending</span> — Our team will process your redemption soon.
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
              You need ${(MIN_UNLOCK_CENTS / 100).toFixed(2)} to unlock stocks on FOMO.
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

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-2">
        {(["stock", "fomo", "wallet"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? "bg-cta text-cta-ink"
                  : (["stock", "fomo", "wallet"].indexOf(step) > i)
                  ? "bg-gain text-cta-ink"
                  : "bg-elevated border border-border text-muted"
              }`}
            >
              {(["stock", "fomo", "wallet"].indexOf(step) > i) ? (
                <Check className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 2 && (
              <div
                className={`w-8 h-0.5 mx-1 ${
                  (["stock", "fomo", "wallet"].indexOf(step) > i) ? "bg-gain" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
        <span className="text-xs text-muted ml-2">
          {step === "stock" && "Pick stock"}
          {step === "fomo" && "FOMO account"}
          {step === "wallet" && "Enter address"}
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
            onClick={() => setStep("fomo")}
            disabled={!selectedStock}
            className="btn-primary w-full text-sm py-2.5 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue with {selectedStock || "..."}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: FOMO Account Setup */}
      {step === "fomo" && (
        <div className="card p-4">
          <button
            onClick={() => setStep("stock")}
            className="flex items-center gap-1 text-xs text-muted hover:text-foreground mb-3"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to stock selection
          </button>

          <h3 className="font-semibold text-sm mb-1">Set up your FOMO account</h3>
          <p className="text-xs text-muted mb-4">
            Stocks are delivered to your FOMO wallet on RH Chain. Create an account if you don&apos;t have one.
          </p>

          <div className="bg-bg rounded-lg p-4 border border-border mb-4">
            <p className="text-xs font-medium mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cta/10 flex items-center justify-center text-cta text-[10px] font-bold">1</span>
              Sign up on FOMO
            </p>
            <a
              href={referralUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full text-sm py-2.5 justify-center mb-2"
            >
              Create FOMO Account
              <ExternalLink className="w-4 h-4" />
            </a>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={referralUrl}
                readOnly
                className="flex-1 bg-elevated border border-border rounded-lg py-2 px-3 text-xs font-mono text-muted"
              />
              <button
                onClick={handleCopyReferral}
                className="p-2 rounded-lg border border-border hover:border-cta/50 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-gain" />
                ) : (
                  <Copy className="w-4 h-4 text-muted" />
                )}
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-medium mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cta/10 flex items-center justify-center text-cta text-[10px] font-bold">2</span>
                Get your deposit address
              </p>
              <p className="text-[11px] text-muted leading-relaxed">
                After signing up, go to your FOMO wallet and copy your <strong className="text-foreground">RH Chain deposit address</strong>. 
                It starts with <code className="text-cta">0x...</code>
              </p>
            </div>
          </div>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-cta/30 cursor-pointer transition-colors mb-4">
            <input
              type="checkbox"
              checked={hasFomoAccount}
              onChange={(e) => setHasFomoAccount(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border text-cta focus:ring-cta/20"
            />
            <span className="text-xs text-muted leading-relaxed">
              I have a FOMO account and my RH Chain deposit address ready
            </span>
          </label>

          <button
            onClick={() => setStep("wallet")}
            disabled={!hasFomoAccount}
            className="btn-primary w-full text-sm py-2.5 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to address
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 3: Wallet Address */}
      {step === "wallet" && (
        <div className="card p-4">
          <button
            onClick={() => setStep("fomo")}
            className="flex items-center gap-1 text-xs text-muted hover:text-foreground mb-3"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to FOMO setup
          </button>

          <h3 className="font-semibold text-sm mb-1">Enter your FOMO wallet address</h3>
          <p className="text-xs text-muted mb-4">
            Paste your RH Chain deposit address from your FOMO account.
          </p>

          <div className="space-y-3">
            <div>
              <label htmlFor="fomoAddress" className="block text-xs font-medium text-foreground mb-1.5">
                FOMO Deposit Address
              </label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  id="fomoAddress"
                  type="text"
                  value={fomoAddress}
                  onChange={(e) => setFomoAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-bg border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm font-mono placeholder:text-muted/60 focus:outline-none focus:border-cta/50 focus:ring-1 focus:ring-cta/20"
                />
              </div>
              <p className="text-[10px] text-muted mt-1">
                RH Chain address (EVM-compatible, 0x format)
              </p>
            </div>

            <div className="bg-elevated rounded-lg p-3 border border-border space-y-2">
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
                <span className="text-xs text-cta">RH Chain</span>
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
                  Unlock {selectedStock} on FOMO
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[10px] text-muted text-center">
              Your redemption will be processed by our team. This is not an instant on-chain transfer.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
