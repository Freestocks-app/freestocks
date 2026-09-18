"use client";

import { useState } from "react";
import { Copy, Check, ArrowLeft } from "lucide-react";

interface ReceiveViewProps {
  address: string;
  onBack: () => void;
}

export function ReceiveView({ address, onBack }: ReceiveViewProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (permissions, insecure context) - the
      // address is still visible on screen for manual copy either way.
    }
  }

  return (
    <div className="card p-4 space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted hover:text-foreground">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      <div className="text-center space-y-1">
        <p className="text-sm font-semibold">Your Solana address</p>
        <p className="text-xs text-muted">Send SOL, USDC, or any xStock to this address.</p>
      </div>

      <div className="bg-elevated border border-border rounded-lg p-3">
        <p className="text-xs font-mono break-all text-center">{address}</p>
      </div>

      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border hover:bg-elevated transition-colors text-sm font-semibold"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-gain" />
            Copied
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copy address
          </>
        )}
      </button>
    </div>
  );
}
