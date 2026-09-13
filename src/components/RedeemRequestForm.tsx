"use client";

import { useState } from "react";
import { Loader2, Wallet, AlertCircle, CheckCircle } from "lucide-react";

interface RedeemRequestFormProps {
  balanceCents: number;
}

// TODO(privy): This form should be replaced with the Privy email OTP flow
// that creates an embedded Solana wallet automatically
export function RedeemRequestForm({ balanceCents }: RedeemRequestFormProps) {
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // TODO(privy): Replace with Solana base58 address validation
  const isValidAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress) || /^0x[a-fA-F0-9]{40}$/.test(walletAddress);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidAddress) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fomoAddress: walletAddress,
          amountCents: balanceCents,
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
      <div className="flex items-center gap-2 p-3 rounded-lg bg-gain/10 border border-gain/20">
        <CheckCircle className="w-5 h-5 text-gain flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-gain">Request submitted!</p>
          <p className="text-xs text-muted">Your tokenized stocks will be sent to your wallet.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        {/* TODO(privy): Replace with auto-populated Privy wallet address */}
        <label htmlFor="walletAddress" className="block text-xs font-medium text-foreground mb-1.5">
          Your Solana Wallet Address
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
            required
          />
        </div>
        <p className="text-[10px] text-muted mt-1">
          Solana wallet address (base58 format)
        </p>
      </div>

      <div className="p-3 rounded-lg bg-elevated border border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">Redemption amount</span>
          <span className="text-sm font-semibold tabular-nums">${(balanceCents / 100).toFixed(2)}</span>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !isValidAddress}
        className="w-full py-2.5 rounded-lg bg-cta text-cta-ink font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Unlock Stocks"
        )}
      </button>

      <p className="text-[10px] text-muted text-center">
        Your tokenized stocks will be sent to your Solana wallet.
      </p>
    </form>
  );
}
