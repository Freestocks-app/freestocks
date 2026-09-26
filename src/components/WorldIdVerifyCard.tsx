"use client";

import { useState, useEffect } from "react";
import { useIDKitRequest } from "@worldcoin/idkit";
import { proofOfHuman } from "@worldcoin/idkit-core";
import { CheckCircle, Loader2, AlertCircle, ShieldCheck } from "lucide-react";

interface WorldIdVerifyCardProps {
  initiallyVerified: boolean;
  appId?: string;
  action?: string;
}

interface RpContext {
  rp_id: string;
  nonce: string;
  created_at: number;
  expires_at: number;
  signature: string;
}

/**
 * "Verified Human" badge, gated by a World ID proof-of-human credential.
 * Deliberately gates a one-time bonus / badge only - never a money-moving
 * action (Trade, Send, Cashout) - so skipping this never blocks a user
 * from using the app; it's an optional perk, matching a Device-level
 * credential's "minimum sufficient assurance" for a lightweight anti-Sybil
 * signal, not KYC-grade identity verification.
 */
export function WorldIdVerifyCard({ initiallyVerified, appId, action }: WorldIdVerifyCardProps) {
  const [verified, setVerified] = useState(initiallyVerified);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [verifyingOnServer, setVerifyingOnServer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { open, result, isSuccess, isError, errorCode, reset } = useIDKitRequest(
    rpContext
      ? {
          app_id: appId as `app_${string}`,
          action: action || "verify-human",
          rp_context: rpContext,
          allow_legacy_proofs: false,
          preset: proofOfHuman(),
        }
      : // Placeholder config while rp_context hasn't loaded yet - `open()`
        // is only ever called after rpContext is set, so this branch never
        // actually opens a request.
        {
          app_id: (appId || "app_placeholder") as `app_${string}`,
          action: action || "verify-human",
          rp_context: { rp_id: "rp_placeholder", nonce: "", created_at: 0, expires_at: 0, signature: "" },
          allow_legacy_proofs: false,
          preset: proofOfHuman(),
        }
  );

  // Once World App returns a successful proof, send it to our backend for
  // real verification - client-side isSuccess alone proves nothing, the
  // server call is what actually credits the bonus.
  useEffect(() => {
    if (!isSuccess || !result || verified) return;
    if (result.protocol_version !== "4.0" || !("responses" in result)) return;

    const timer = setTimeout(() => {
      setVerifyingOnServer(true);
      setError(null);

      fetch("/api/worldid/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonce: result.nonce, responses: result.responses }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setVerified(true);
          } else {
            setError("Verification could not be completed. Please try again.");
          }
        })
        .catch(() => {
          setError("Something went wrong verifying with our server. Please try again.");
        })
        .finally(() => setVerifyingOnServer(false));
    }, 0);

    return () => clearTimeout(timer);
  }, [isSuccess, result, verified]);

  useEffect(() => {
    if (!isError) return;
    const timer = setTimeout(() => {
      setError(
        errorCode === "user_rejected" || errorCode === "verification_rejected"
          ? "Verification was cancelled."
          : "Verification failed. Please try again."
      );
    }, 0);
    return () => clearTimeout(timer);
  }, [isError, errorCode]);

  async function handleStart() {
    setError(null);
    setLoadingContext(true);
    try {
      const res = await fetch("/api/worldid/request-context");
      if (!res.ok) {
        setError("Couldn't start verification. Please try again.");
        return;
      }
      const data = await res.json();
      setRpContext(data.rp_context);
      // rp_context is now in state; open() reads the hook config built
      // from it on next render, so defer the actual open() call.
      requestAnimationFrame(() => open());
    } catch {
      setError("Couldn't start verification. Please try again.");
    } finally {
      setLoadingContext(false);
    }
  }

  if (!appId) {
    return null;
  }

  if (verified) {
    return (
      <div className="card p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gain/10 border border-gain/20 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-4 h-4 text-gain" />
        </div>
        <div>
          <p className="font-semibold text-sm text-gain">Verified Human</p>
          <p className="text-xs text-muted">Confirmed with World ID</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-cta/10 border border-cta/20 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-cta" />
        </div>
        <div>
          <p className="font-semibold text-sm">Verify with World ID</p>
          <p className="text-xs text-muted">Get a one-time $1.00 bonus</p>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={() => {
          reset();
          handleStart();
        }}
        disabled={loadingContext || verifyingOnServer}
        className="btn-primary w-full text-sm py-2.5 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingContext || verifyingOnServer ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Verify with World ID"
        )}
      </button>
    </div>
  );
}
