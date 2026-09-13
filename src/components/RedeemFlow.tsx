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

// TODO(privy): Remove referral URL placeholder once Privy OTP flow is implemented
const REFERRAL_URL_PLACEHOLDER = "https://freestocks.app";

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

type Step = "stock" | "verify" | "wallet";

interface RedeemFlowProps {
  balanceCents: number;
  fomoReferralUrl?: string;
}

export function RedeemFlow({ balanceCents, fomoReferralUrl }: RedeemFlowProps) {
  const [step, setStep] = useState<Step>("stock");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [hasVerifiedEmail, setHasVerifiedEmail] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralUrl = fomoReferralUrl || REFERRAL_URL_PLACEHOLDER;
  // TODO(privy): Replace 0x validation with Solana base58 address validation
  const isValidAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress) || /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
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
      // TODO(privy): Use Privy-created wallet address instead of manual input
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
            <span className="text-xs font-mono text-muted">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
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

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-2">
        {(["stock", "verify", "wallet"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? "bg-cta text-cta-ink"
                  : (["stock", "verify", "wallet"].indexOf(step) > i)
                  ? "bg-gain text-cta-ink"
                  : "bg-elevated border border-border text-muted"
              }`}
            >
              {(["stock", "verify", "wallet"].indexOf(step) > i) ? (
                <Check className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 2 && (
              <div
                className={`w-8 h-0.5 mx-1 ${
                  (["stock", "verify", "wallet"].indexOf(step) > i) ? "bg-gain" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
        <span className="text-xs text-muted ml-2">
          {step === "stock" && "Pick stock"}
          {step === "verify" && "Verify email"}
          {step === "wallet" && "Solana wallet"}
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

      {/* Step 2: Email Verification + Solana Wallet */}
      {/* TODO(privy): Replace this step with Privy email OTP flow that creates/links embedded Solana wallet */}
      {step === "verify" && (
        <div className="card p-4">
          <button
            onClick={() => setStep("stock")}
            className="flex items-center gap-1 text-xs text-muted hover:text-foreground mb-3"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to stock selection
          </button>

          <h3 className="font-semibold text-sm mb-1">Verify your email</h3>
          <p className="text-xs text-muted mb-4">
            Tokenized stocks are delivered to a Solana wallet linked to your account. Verify your email to continue.
          </p>

          {/* TODO(privy): Replace this placeholder with Privy OTP component */}
          {/* The email field should be fixed/greyed out showing the session email */}
          {/* OTP is sent only to that email; mismatch is rejected */}
          <div className="bg-bg rounded-lg p-4 border border-border mb-4">
            <p className="text-xs font-medium mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cta/10 flex items-center justify-center text-cta text-[10px] font-bold">1</span>
              Confirm your email
            </p>
            <p className="text-[11px] text-muted leading-relaxed mb-3">
              We&apos;ll send a one-time code to your registered email address to verify it&apos;s you.
            </p>
            <div className="p-3 rounded-lg bg-elevated border border-cta/20 text-center">
              <p className="text-[10px] text-muted mb-1">Privy verification coming soon</p>
              <p className="text-xs text-cta font-medium">For now, confirm below to continue</p>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-medium mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cta/10 flex items-center justify-center text-cta text-[10px] font-bold">2</span>
                Solana wallet created
              </p>
              <p className="text-[11px] text-muted leading-relaxed">
                After verification, a <strong className="text-foreground">Solana wallet</strong> will be created and linked to your account automatically.
              </p>
            </div>
          </div>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-cta/30 cursor-pointer transition-colors mb-4">
            <input
              type="checkbox"
              checked={hasVerifiedEmail}
              onChange={(e) => setHasVerifiedEmail(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border text-cta focus:ring-cta/20"
            />
            <span className="text-xs text-muted leading-relaxed">
              I understand stocks will be sent to my Solana wallet
            </span>
          </label>

          <button
            onClick={() => setStep("wallet")}
            disabled={!hasVerifiedEmail}
            className="btn-primary w-full text-sm py-2.5 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to wallet
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 3: Wallet Address */}
      {/* TODO(privy): This step should auto-populate with the Privy-created Solana wallet address */}
      {step === "wallet" && (
        <div className="card p-4">
          <button
            onClick={() => setStep("verify")}
            className="flex items-center gap-1 text-xs text-muted hover:text-foreground mb-3"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to verification
          </button>

          <h3 className="font-semibold text-sm mb-1">Enter your Solana wallet address</h3>
          <p className="text-xs text-muted mb-4">
            Your tokenized stocks will be sent to this Solana wallet.
          </p>

          <div className="space-y-3">
            <div>
              {/* TODO(privy): Replace this input with auto-populated Privy wallet address (read-only) */}
              <label htmlFor="walletAddress" className="block text-xs font-medium text-foreground mb-1.5">
                Solana Wallet Address
              </label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  id="walletAddress"
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Enter Solana address..."
                  className="w-full bg-bg border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm font-mono placeholder:text-muted/60 focus:outline-none focus:border-cta/50 focus:ring-1 focus:ring-cta/20"
                />
              </div>
              <p className="text-[10px] text-muted mt-1">
                Solana address (base58 format)
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
                <span className="text-xs text-cta">Solana</span>
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
              Your tokenized stock will be sent to your Solana wallet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
