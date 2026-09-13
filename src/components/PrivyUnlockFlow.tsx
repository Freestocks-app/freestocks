"use client";

import { useState, useEffect, useCallback } from "react";
import { usePrivy, useLoginWithEmail } from "@privy-io/react-auth";
import {
  Mail,
  Loader2,
  CheckCircle,
  AlertCircle,
  Wallet,
  ArrowRight,
  ArrowLeft,
  Shield,
  RefreshCw,
} from "lucide-react";

interface PrivyUnlockFlowProps {
  sessionEmail: string;
  balanceCents: number;
  selectedStock: string;
  onWalletReady: (address: string) => void;
  onBack: () => void;
}

type VerifyState = "idle" | "sending" | "code_sent" | "verifying" | "verified" | "error";

export function PrivyUnlockFlow({
  sessionEmail,
  balanceCents,
  selectedStock,
  onWalletReady,
  onBack,
}: PrivyUnlockFlowProps) {
  const { ready, authenticated, user, logout } = usePrivy();
  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail();

  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);

  const solanaWallet = user?.linkedAccounts?.find(
    (account) =>
      account.type === "wallet" &&
      "chainType" in account &&
      (account as { chainType?: string }).chainType === "solana" &&
      "walletClientType" in account &&
      (account as { walletClientType?: string }).walletClientType === "privy"
  );
  const solanaAddress = solanaWallet && "address" in solanaWallet 
    ? (solanaWallet as { address: string }).address 
    : undefined;

  const handleEmailMismatch = useCallback(async () => {
    if (authenticated && user?.email?.address && user.email.address !== sessionEmail) {
      setError(`Email mismatch: Privy account is ${user.email.address}, but your Freestocks account is ${sessionEmail}. Please log out of Privy first.`);
      setVerifyState("error");
      await logout();
    }
  }, [authenticated, user, sessionEmail, logout]);

  useEffect(() => {
    handleEmailMismatch();
  }, [handleEmailMismatch]);

  useEffect(() => {
    if (authenticated && solanaAddress && verifyState !== "error") {
      setVerifyState("verified");
      onWalletReady(solanaAddress);
    }
  }, [authenticated, solanaAddress, verifyState, onWalletReady]);

  useEffect(() => {
    if (emailState?.status === "error") {
      setError("Failed to complete verification. Please try again.");
      setVerifyState("error");
    }
  }, [emailState?.status]);

  const handleSendCode = async () => {
    setError(null);
    setVerifyState("sending");

    try {
      await sendCode({ email: sessionEmail });
      setCodeSentTo(sessionEmail);
      setVerifyState("code_sent");
    } catch (err) {
      console.error("Failed to send code:", err);
      setError("Failed to send verification code. Please try again.");
      setVerifyState("error");
    }
  };

  const handleVerifyCode = async () => {
    if (otpCode.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setError(null);
    setVerifyState("verifying");

    try {
      await loginWithCode({ code: otpCode });
    } catch (err) {
      console.error("Failed to verify code:", err);
      setError("Invalid code. Please check and try again.");
      setVerifyState("error");
    }
  };

  const handleRetry = () => {
    setError(null);
    setOtpCode("");
    setVerifyState("idle");
  };

  if (!ready) {
    return (
      <div className="card p-6 text-center">
        <Loader2 className="w-8 h-8 text-cta animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted">Initializing secure verification...</p>
      </div>
    );
  }

  if (verifyState === "verified" && solanaAddress) {
    return (
      <div className="card p-4 border-gain/20 bg-gain/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gain/10 border border-gain/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-gain" />
          </div>
          <div>
            <p className="font-semibold text-sm text-gain">Email Verified</p>
            <p className="text-xs text-muted">Solana wallet ready</p>
          </div>
        </div>

        <div className="bg-bg rounded-lg p-3 border border-border space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Verified Email</span>
            <span className="text-xs font-medium">{sessionEmail}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Solana Wallet</span>
            <span className="text-xs font-mono text-cta">
              {solanaAddress.slice(0, 6)}...{solanaAddress.slice(-4)}
            </span>
          </div>
        </div>

        <p className="text-[10px] text-muted text-center">
          Your tokenized stocks will be sent to this wallet automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-muted hover:text-foreground mb-3"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to stock selection
      </button>

      <h3 className="font-semibold text-sm mb-1">Verify your email</h3>
      <p className="text-xs text-muted mb-4">
        Verify your identity to create a secure Solana wallet for receiving tokenized stocks.
      </p>

      <div className="bg-bg rounded-lg p-4 border border-border mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-cta/10 border border-cta/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-cta" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted mb-0.5">Your Freestocks email</p>
            <p className="text-sm font-medium truncate">{sessionEmail}</p>
          </div>
          <Shield className="w-4 h-4 text-gain" />
        </div>

        {verifyState === "idle" && (
          <>
            <p className="text-[11px] text-muted leading-relaxed mb-4">
              We&apos;ll send a one-time verification code to <strong className="text-foreground">{sessionEmail}</strong> to confirm your identity and create your Solana wallet.
            </p>
            <button
              onClick={handleSendCode}
              className="btn-primary w-full text-sm py-2.5 justify-center"
            >
              Send Verification Code
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {verifyState === "sending" && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="w-5 h-5 text-cta animate-spin" />
            <span className="text-sm text-muted">Sending code to {sessionEmail}...</span>
          </div>
        )}

        {verifyState === "code_sent" && (
          <>
            <div className="mb-4">
              <p className="text-[11px] text-muted leading-relaxed mb-3">
                We sent a 6-digit code to <strong className="text-foreground">{codeSentTo}</strong>. Enter it below:
              </p>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full bg-elevated border border-border rounded-lg py-3 px-4 text-center text-2xl font-mono tracking-[0.5em] placeholder:text-muted/40 focus:outline-none focus:border-cta/50 focus:ring-1 focus:ring-cta/20"
                autoFocus
                maxLength={6}
              />
            </div>
            <button
              onClick={handleVerifyCode}
              disabled={otpCode.length !== 6}
              className="btn-primary w-full text-sm py-2.5 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Verify & Create Wallet
              <Wallet className="w-4 h-4" />
            </button>
            <button
              onClick={handleSendCode}
              className="w-full text-xs text-muted hover:text-foreground mt-2 py-1"
            >
              Didn&apos;t receive it? Send again
            </button>
          </>
        )}

        {verifyState === "verifying" && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="w-5 h-5 text-cta animate-spin" />
            <span className="text-sm text-muted">Verifying & creating wallet...</span>
          </div>
        )}

        {verifyState === "error" && (
          <>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            </div>
            <button
              onClick={handleRetry}
              className="btn-primary w-full text-sm py-2.5 justify-center"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </>
        )}
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-elevated/50 border border-border">
        <Wallet className="w-4 h-4 text-cta flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] text-muted leading-relaxed">
            After verification, a <strong className="text-foreground">Solana wallet</strong> will be automatically created and linked to your account. Your {selectedStock} tokenized stock worth <strong className="text-foreground">${(balanceCents / 100).toFixed(2)}</strong> will be sent to this wallet.
          </p>
        </div>
      </div>
    </div>
  );
}
