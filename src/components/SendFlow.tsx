"use client";

import { useState } from "react";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} from "@solana/spl-token";
import { useSignAndSendTransaction, useWallets } from "@privy-io/react-auth/solana";
import { Loader2, AlertCircle, CheckCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { TOP10 } from "@/lib/tokenized-stocks";
import { USDC_MINT, USDC_DECIMALS } from "@/lib/solana-tokens";
import { useWalletBalances } from "@/hooks/useWalletBalances";
import { toBaseUnits } from "@/lib/token-amount";
import { SOLANA_RPC_URL } from "@/lib/wallet-balances";
import bs58 from "bs58";

const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

interface SendFlowProps {
  address: string;
  onBack: () => void;
}

type Asset =
  | { kind: "sol" }
  | { kind: "usdc" }
  | { kind: "spl"; symbol: string; mint: string; decimals: number };

type SendState = "idle" | "building" | "signing" | "confirming" | "success" | "error";

function assetKey(asset: Asset): string {
  return asset.kind === "spl" ? `spl:${asset.mint}` : asset.kind;
}

export function SendFlow({ address, onBack }: SendFlowProps) {
  const { wallets } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const { solBalance, usdcBalance, tokenBalances } = useWalletBalances(address);

  const heldStocks = tokenBalances.filter((t) => t.uiAmount > 0);
  const assetOptions: Asset[] = [
    { kind: "sol" },
    { kind: "usdc" },
    ...heldStocks.map((t) => {
      const stock = TOP10.find((s) => s.symbol === t.symbol);
      return {
        kind: "spl" as const,
        symbol: t.symbol,
        mint: stock?.mint ?? "",
        decimals: stock?.decimals ?? 8,
      };
    }),
  ];

  const [selectedKey, setSelectedKey] = useState(assetKey(assetOptions[0]));
  const selectedAsset = assetOptions.find((a) => assetKey(a) === selectedKey) ?? assetOptions[0];

  const [recipient, setRecipient] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const balance =
    selectedAsset.kind === "sol"
      ? solBalance ?? 0
      : selectedAsset.kind === "usdc"
        ? usdcBalance ?? 0
        : heldStocks.find((t) => t.symbol === selectedAsset.symbol)?.uiAmount ?? 0;

  const decimals =
    selectedAsset.kind === "sol" ? 9 : selectedAsset.kind === "usdc" ? USDC_DECIMALS : selectedAsset.decimals;

  const isValidRecipient = SOLANA_ADDRESS_REGEX.test(recipient.trim());
  const amount = parseFloat(amountInput || "0");
  const insufficientBalance = !!amountInput && amount > balance;
  const canSubmit =
    isValidRecipient && !!amountInput && amount > 0 && !insufficientBalance && state === "idle";

  function handleMax() {
    setAmountInput(balance > 0 ? String(balance) : "");
  }

  async function handleSend() {
    const wallet = wallets.find((w) => w.address === address);
    if (!wallet) {
      setError("Wallet not connected. Please reconnect and try again.");
      setState("error");
      return;
    }

    setState("building");
    setError(null);

    try {
      const connection = new Connection(SOLANA_RPC_URL);
      const sender = new PublicKey(address);
      const recipientKey = new PublicKey(recipient.trim());
      const amountRaw = toBaseUnits(amountInput, decimals);

      const tx = new Transaction();

      if (selectedAsset.kind === "sol") {
        tx.add(
          SystemProgram.transfer({
            fromPubkey: sender,
            toPubkey: recipientKey,
            lamports: Number(amountRaw),
          })
        );
      } else {
        const mint = new PublicKey(selectedAsset.kind === "usdc" ? USDC_MINT : selectedAsset.mint);
        const sourceAta = await getAssociatedTokenAddress(mint, sender);
        const destAta = await getAssociatedTokenAddress(mint, recipientKey);

        const destAccountInfo = await connection.getAccountInfo(destAta);
        if (!destAccountInfo) {
          tx.add(createAssociatedTokenAccountInstruction(sender, destAta, recipientKey, mint));
        }

        tx.add(createTransferInstruction(sourceAta, destAta, sender, amountRaw));
      }

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = sender;

      const serialized = tx.serialize({ requireAllSignatures: false });

      setState("signing");
      const { signature: sigBytes } = await signAndSendTransaction({
        transaction: serialized,
        wallet,
      });
      setSignature(bs58.encode(sigBytes));
      setState("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Send failed";
      const rejected = /reject|cancel/i.test(message);
      setError(
        rejected
          ? "Transaction cancelled."
          : "Something went wrong sending this transfer. If this happened after you approved it, check your wallet before retrying - it may have already gone through."
      );
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="card p-6 text-center space-y-3">
        <CheckCircle className="w-10 h-10 text-gain mx-auto" />
        <p className="font-bold">Sent</p>
        {signature && (
          <a
            href={`https://solscan.io/tx/${signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-cta hover:underline"
          >
            View on Solscan <ExternalLink className="w-3 h-3" />
          </a>
        )}
        <button onClick={onBack} className="btn-primary w-full text-sm py-2.5 justify-center mt-2">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="card p-4 space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted hover:text-foreground">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      <div>
        <label className="block text-xs text-muted mb-1.5">Asset</label>
        <select
          value={selectedKey}
          onChange={(e) => {
            setSelectedKey(e.target.value);
            setAmountInput("");
          }}
          disabled={state !== "idle"}
          className="w-full bg-bg border border-border rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-cta/50"
        >
          {assetOptions.map((a) => (
            <option key={assetKey(a)} value={assetKey(a)} className="bg-elevated text-foreground">
              {a.kind === "sol" ? "SOL" : a.kind === "usdc" ? "USDC" : a.symbol}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-muted mb-1.5">Recipient address</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value.trim())}
          placeholder="Solana address"
          disabled={state !== "idle"}
          className="w-full bg-bg border border-border rounded-lg py-2.5 px-3 text-sm font-mono focus:outline-none focus:border-cta/50 disabled:opacity-60"
        />
        {recipient && !isValidRecipient && (
          <p className="text-xs text-red-400 mt-1">Not a valid Solana address.</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-muted">Amount</label>
          <button onClick={handleMax} disabled={state !== "idle"} className="text-xs font-semibold text-cta hover:underline disabled:opacity-50">
            Max
          </button>
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0.00"
          disabled={state !== "idle"}
          className="w-full bg-bg border border-border rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-cta/50 disabled:opacity-60"
        />
        <p className="text-xs text-muted mt-1">Balance: {balance.toFixed(4)}</p>
        {insufficientBalance && <p className="text-xs text-red-400 mt-1">Amount exceeds your balance.</p>}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={!canSubmit}
        className="btn-primary w-full text-sm py-3 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === "building" || state === "signing" || state === "confirming" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {state === "building" ? "Preparing…" : state === "signing" ? "Confirm in wallet…" : "Confirming on-chain…"}
          </>
        ) : (
          "Send"
        )}
      </button>
    </div>
  );
}
