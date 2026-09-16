"use client";

import { useState, useEffect, useRef } from "react";
import { usePrivy, useLoginWithEmail, useUser } from "@privy-io/react-auth";
import { useCreateWallet } from "@privy-io/react-auth/solana";
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

type Step = "idle" | "sending" | "code_sent" | "verifying";

export function PrivyUnlockFlow({
  sessionEmail,
  balanceCents,
  selectedStock,
  onWalletReady,
  onBack,
}: PrivyUnlockFlowProps) {
  const { ready, authenticated, user, logout } = usePrivy();
  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail();
  const { createWallet } = useCreateWallet();
  const { refreshUser } = useUser();

  const [step, setStep] = useState<Step>("idle");
  const [otpCode, setOtpCode] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [walletStuck, setWalletStuck] = useState(false);
  const walletCreationAttempted = useRef(false);

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

  // createOnLogin: "all-users" should auto-provision a Solana embedded
  // wallet, but that provisioning is an async side-effect of login that can
  // lag behind `authenticated` flipping true. If we're authenticated with no
  // mismatch but still see no wallet, explicitly request one as a fallback
  // rather than leaving the user stuck with no wallet and no explanation.
  //
  // createWallet() throws if the user already has an embedded wallet (e.g.
  // an account created before this fallback existed) - in that case the
  // local `user` object is just stale, so refreshUser() pulls the existing
  // wallet into `linkedAccounts` instead of leaving the UI stuck forever.
  useEffect(() => {
    if (
      authenticated &&
      !emailMismatch &&
      !solanaAddress &&
      !walletCreationAttempted.current
    ) {
      walletCreationAttempted.current = true;
      createWallet()
        .catch((err) => {
          console.error("Failed to create Solana wallet, refreshing user instead:", err);
          return refreshUser();
        })
        .catch((err) => {
          console.error("Failed to refresh user after wallet creation issue:", err);
        });
    }
  }, [authenticated, emailMismatch, solanaAddress, createWallet, refreshUser]);

  const waitingForWallet = authenticated && !emailMismatch && !solanaAddress;

  // Safety net: if we're still stuck waiting on a wallet a few seconds after
  // authenticating, stop spinning forever and let the user retry instead.
  useEffect(() => {
    if (!waitingForWallet) {
      return;
    }

    const timer = setTimeout(() => setWalletStuck(true), 8000);
    return () => clearTimeout(timer);
  }, [waitingForWallet]);

  const handleSendCode = async () => {
    setActionError(null);
    setStep("sending");

    try {
      await sendCode({ email: sessionEmail });
      setCodeSentTo(sessionEmail);
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

  const handleRetryWalletCreation = () => {
    setWalletStuck(false);
    walletCreationAttempted.current = false;
    refreshUser().catch((err) => {
      console.error("Failed to refresh user:", err);
    });
  };

  if (!ready) {
    return (
      <div className="card p-6 text-center">
        <Loader2 className="w-8 h-8 text-cta animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted">Initializing secure verification...</p>
      </div>
    );
  }

  if (waitingForWallet) {
    return (
      <div className="card p-6 text-center">
        {walletStuck ? (
          <>
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-muted mb-3">
              This is taking longer than expected. Please try again.
            </p>
            <button
              onClick={handleRetryWalletCreation}
              className="btn-primary w-full text-sm py-2.5 justify-center"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 text-cta animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted">Creating your Solana wallet...</p>
          </>
        )}
      </div>
    );
  }

  if (verified) {
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
              {solanaAddress!.slice(0, 6)}...{solanaAddress!.slice(-4)}
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
        ${selectedStock}, up to ${(balanceCents / 100).toFixed(2)}, will be sent to your Solana wallet.
      </p>

      <div className="bg-bg rounded-lg p-4 border border-border">
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

        {error ? (
          <>
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
          </>
        ) : (
          <>
            {step === "idle" && (
              <button
                onClick={handleSendCode}
                className="btn-primary w-full text-sm py-2.5 justify-center"
              >
                Send Code
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === "sending" && (
              <div className="flex items-center justify-center gap-2 py-3">
                <Loader2 className="w-5 h-5 text-cta animate-spin" />
                <span className="text-sm text-muted">Sending code...</span>
              </div>
            )}

            {step === "code_sent" && (
              <>
                <p className="text-xs text-muted mb-3">
                  Enter the 6-digit code sent to <strong className="text-foreground">{codeSentTo}</strong>.
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
                <button
                  onClick={handleSendCode}
                  className="w-full text-xs text-muted hover:text-foreground mt-2 py-1"
                >
                  Didn&apos;t receive it? Send again
                </button>
              </>
            )}

            {step === "verifying" && (
              <div className="flex items-center justify-center gap-2 py-3">
                <Loader2 className="w-5 h-5 text-cta animate-spin" />
                <span className="text-sm text-muted">Verifying...</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
