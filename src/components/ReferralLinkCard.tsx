"use client";

import { useState } from "react";
import { Gift, Copy, Check, Share2 } from "lucide-react";

interface ReferralLinkCardProps {
  code: string;
}

export function ReferralLinkCard({ code }: ReferralLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const link = typeof window !== "undefined"
    ? `${window.location.origin}/sign-up?ref=${code}`
    : `/sign-up?ref=${code}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable; no-op
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ url: link });
      } catch {
        // user cancelled or share unsupported; no-op
      }
    } else {
      handleCopy();
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="bg-cta text-cta-ink px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Gift className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-semibold truncate">
            Invite friends and earn 5% of their earnings
          </span>
        </div>
        <button onClick={handleShare} className="flex-shrink-0">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-elevated/50 transition-colors"
      >
        <span className="text-sm text-muted truncate font-mono">
          freestocks.app/sign-up?ref=<span className="text-foreground font-semibold">{code}</span>
        </span>
        {copied ? (
          <Check className="w-4 h-4 text-gain flex-shrink-0" />
        ) : (
          <Copy className="w-4 h-4 text-muted flex-shrink-0" />
        )}
      </button>
    </div>
  );
}
