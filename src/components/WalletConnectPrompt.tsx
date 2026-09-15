"use client";

import { useState, useEffect } from "react";
import { usePrivy, useLoginWithEmail } from "@privy-io/react-auth";
import { Loader2, CheckCircle, AlertCircle, Wallet, ArrowRight, RefreshCw } from "lucide-react";

interface WalletConnectPromptProps {
  sessionEmail: string;
  onWalletReady: (address: string) => void;
}

type Step = "idle" | "sending" | "code_sent" | "verifying";

export function WalletConnectPrompt({ sessionEmail, onWalletReady }: WalletConnectPromptProps) {
  const { ready, authenticated, user, logout } = usePrivy();
  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail();

  const [step, setStep] = useState<Step>("idle");
  const [otpCode, setOtpCode] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

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

  const emailMismatch =
    authenticated && user?.email?.address && user.email.address !== sessionEmail
      ? user.email.address
      : null;

  const error =
    actionError ||
    (emailMismatch
      ? `Email mismatch: Privy account is ${emailMismatch}, but your Freestocks account is ${sessionEmail}. Please log out of Privy first.`
      : null) ||
    (emailState?.status === "error" ? "Failed to complete verification. Please try again." : null);

  const verified = authenticated && !emailMismatch && !!solanaAddress;

  useEffect(() => {
    if (verified) {
      onWalletReady(solanaAddress as string);
    }
  }, [verified, solanaAddress, onWalletReady]);

  useEffect(() => {
    if (emailMismatch) {
      logout();
    }
  }, [emailMismatch, logout]);

  const handleSendCode = async () => {
    setActionError(null);
    setStep("sending");

    try {
      await sendCode({ email: sessionEmail });
      setStep("code_sent");
    } catch (err) {
      console.error("Failed to send code:", err);
      setActionError("Failed to send verification code. Please try again.");
      setStep("idle");
    }
  };

  const handleVerifyCode = async () => {
    if (otpCode.length !== 6) {
      setActionError("Please enter the 6-digit code");
      return;
    }

    setActionError(null);
    setStep("verifying");

    try {
      await loginWithCode({ code: otpCode });
    } catch (err) {
      console.error("Failed to verify code:", err);
      setActionError("Invalid code. Please check and try again.");
      setStep("code_sent");
    }
  };

  const handleRetry = () => {
    setActionError(null);
    setOtpCode("");
    setStep("idle");
  };

  if (!ready) {
    return (
      <div className="card p-6 text-center">
        <Loader2 className="w-6 h-6 text-cta animate-spin mx-auto" />
      </div>
    );
  }

  if (verified) {
    return (
      <div className="card p-4 border-gain/20 bg-gain/5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gain/10 border border-gain/20 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-4 h-4 text-gain" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-gain">Wallet connected</p>
          <p className="text-xs font-mono text-muted truncate">
            {solanaAddress!.slice(0, 6)}...{solanaAddress!.slice(-4)}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-4">
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
        <button
          onClick={handleRetry}
          className="btn-primary w-full text-sm py-2.5 justify-center"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="card p-4">
      {step === "idle" && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-cta/10 border border-cta/20 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-4 h-4 text-cta" />
            </div>
            <p className="text-sm">Verify your email to create a Solana wallet.</p>
          </div>
          <button
            onClick={handleSendCode}
            className="btn-primary w-full text-sm py-2.5 justify-center"
          >
            Send Code
            <ArrowRight className="w-4 h-4" />
          </button>
        </>
      )}

      {step === "sending" && (
        <div className="flex items-center justify-center gap-2 py-3">
          <Loader2 className="w-5 h-5 text-cta animate-spin" />
          <span className="text-sm text-muted">Sending code...</span>
        </div>
      )}

      {step === "code_sent" && (
        <>
          <p className="text-sm mb-3">
            Enter the 6-digit code sent to <strong className="text-foreground">{sessionEmail}</strong>.
          </p>
          <input
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="w-full bg-elevated border border-border rounded-lg py-3 px-4 text-center text-2xl font-mono tracking-[0.5em] placeholder:text-muted/40 focus:outline-none focus:border-cta/50 focus:ring-1 focus:ring-cta/20 mb-3"
            autoFocus
            maxLength={6}
          />
          <button
            onClick={handleVerifyCode}
            disabled={otpCode.length !== 6}
            className="btn-primary w-full text-sm py-2.5 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify
            <Wallet className="w-4 h-4" />
          </button>
        </>
      )}

      {step === "verifying" && (
        <div className="flex items-center justify-center gap-2 py-3">
          <Loader2 className="w-5 h-5 text-cta animate-spin" />
          <span className="text-sm text-muted">Verifying...</span>
        </div>
      )}
    </div>
  );
}
