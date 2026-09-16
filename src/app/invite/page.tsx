"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Ticket, Loader2, AlertCircle, ArrowRight } from "lucide-react";

export default function InvitePage() {
  return (
    <Suspense fallback={null}>
      <InvitePageInner />
    </Suspense>
  );
}

function extractRefCode(next: string): string {
  try {
    const url = new URL(next, "https://placeholder.invalid");
    return url.searchParams.get("ref")?.toUpperCase() || "";
  } catch {
    return "";
  }
}

function InvitePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/earn";

  const [code, setCode] = useState(() => extractRefCode(next));
  const [loading, setLoading] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/referral/attribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();

      if (data.attributed || data.reason === "already_attributed" || data.reason === "self_referral") {
        router.push(next);
        return;
      }

      setError("That invite code isn't valid. Check it and try again, or skip.");
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleSkip() {
    setError(null);
    setSkipping(true);

    try {
      await fetch("/api/user/invite-skip", { method: "POST" });
    } catch {
      // Best-effort - if this fails the user just sees the gate again
      // next load, which is an acceptable fallback (not a hard block).
    }

    router.push(next);
  }

  const isDisabled = loading || skipping;

  return (
    <div className="min-h-screen bg-bg flex flex-col overflow-x-hidden">
      <header className="h-11 sm:h-12 flex items-center justify-center border-b border-border bg-elevated/50 px-4">
        <Link href="/" className="flex items-center">
          <img
            src="/brand/freestocks-logo.png"
            alt="Freestocks"
            className="h-7 sm:h-8 w-auto"
          />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-6 sm:py-8">
        <div className="w-full max-w-[380px]">
          <div className="card p-4 sm:p-6 border-border/50 bg-elevated/80 backdrop-blur-sm text-center">
            <div className="w-12 h-12 rounded-xl bg-cta/10 border border-cta/20 flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-6 h-6 text-cta" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold mb-1.5">Have an invite code?</h1>
            <p className="text-sm text-muted mb-5">
              Enter it to link your account, or skip for now.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="INVITE CODE"
                className="w-full text-center tracking-widest font-semibold bg-bg border border-border rounded-lg py-3 px-4 text-sm placeholder:text-muted/60 placeholder:tracking-widest placeholder:font-normal focus:outline-none focus:border-cta/50 focus:ring-1 focus:ring-cta/20"
                disabled={isDisabled}
                autoFocus
              />

              {error && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2 text-left">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isDisabled || !code.trim()}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-cta text-cta-ink font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <button
              onClick={handleSkip}
              disabled={isDisabled}
              className="w-full text-center text-sm text-muted hover:text-foreground transition-colors mt-4 py-1 disabled:opacity-50"
            >
              {skipping ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Skip for now"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
