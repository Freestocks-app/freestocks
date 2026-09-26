"use client";

import { useState } from "react";
import { Interface, parseUnits } from "ethers";
import { useSendTransaction } from "@privy-io/react-auth";
import { Loader2, AlertCircle, CheckCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { isValidEvmAddress } from "@/lib/utils";
import { useEvmWalletBalances } from "@/hooks/useEvmWalletBalances";
import { formatTokenAmount } from "@/lib/token-amount";
import { BASE_STOCKS, BASE_CHAIN_ID, BASE_BLOCK_EXPLORER, USDC_ADDRESS, USDC_DECIMALS } from "@/lib/uniswap/constants";
import { ERC20_ABI } from "@/lib/uniswap/client";

interface EvmSendFlowProps {
  address: string;
  onBack: () => void;
}

type Asset =
  | { kind: "eth" }
  | { kind: "usdc" }
  | { kind: "token"; symbol: string; tokenAddress: string; decimals: number };

type SendState = "idle" | "signing" | "confirming" | "success" | "error";

function assetKey(asset: Asset): string {
  return asset.kind === "token" ? `token:${asset.tokenAddress}` : asset.kind;
}

const ERC20_TRANSFER_IFACE = new Interface(ERC20_ABI.concat("function transfer(address to, uint256 amount) returns (bool)"));

/** Base-chain equivalent of SendFlow.tsx - no ATA/blockhash complexity, just calldata + sendTransaction. */
export function EvmSendFlow({ address, onBack }: EvmSendFlowProps) {
  const { sendTransaction } = useSendTransaction();
  const { ethBalance, usdcBalance, tokenBalances } = useEvmWalletBalances(address);

  const heldStocks = tokenBalances.filter((t) => t.uiAmount > 0);
  const assetOptions: Asset[] = [
    { kind: "eth" },
    { kind: "usdc" },
    ...heldStocks.map((t) => ({
      kind: "token" as const,
      symbol: t.symbol,
      tokenAddress: BASE_STOCKS.find((s) => s.symbol === t.symbol)?.address ?? "",
      decimals: t.decimals,
    })),
  ];

  const [selectedKey, setSelectedKey] = useState(assetKey(assetOptions[0]));
  const selectedAsset = assetOptions.find((a) => assetKey(a) === selectedKey) ?? assetOptions[0];

  const [recipient, setRecipient] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const balance =
    selectedAsset.kind === "eth"
      ? ethBalance ?? 0
      : selectedAsset.kind === "usdc"
        ? usdcBalance ?? 0
        : heldStocks.find((t) => t.symbol === selectedAsset.symbol)?.uiAmount ?? 0;

  const decimals = selectedAsset.kind === "eth" ? 18 : selectedAsset.kind === "usdc" ? USDC_DECIMALS : selectedAsset.decimals;

  const isValidRecipient = isValidEvmAddress(recipient.trim());
  const amount = parseFloat(amountInput || "0");
  const insufficientBalance = !!amountInput && amount > balance;
  const canSubmit =
    isValidRecipient && !!amountInput && amount > 0 && !insufficientBalance && state === "idle";

  function handleMax() {
    setAmountInput(balance > 0 ? String(balance) : "");
  }

  async function handleSend() {
    setError(null);

    try {
      const recipientAddress = recipient.trim();
      const amountRaw = parseUnits(amountInput, decimals);

      setState("signing");

      let hash: string;
      if (selectedAsset.kind === "eth") {
        const result = await sendTransaction(
          { to: recipientAddress, value: amountRaw, chainId: BASE_CHAIN_ID },
          { address }
        );
        hash = result.hash;
      } else {
        const tokenAddress = selectedAsset.kind === "usdc" ? USDC_ADDRESS : selectedAsset.tokenAddress;
        const data = ERC20_TRANSFER_IFACE.encodeFunctionData("transfer", [recipientAddress, amountRaw]);
        setState("confirming");
        const result = await sendTransaction(
          { to: tokenAddress, data, chainId: BASE_CHAIN_ID },
          { address }
        );
        hash = result.hash;
      }

      setTxHash(hash);
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
        {txHash && (
          <a
            href={`${BASE_BLOCK_EXPLORER}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-cta hover:underline"
          >
            View on BaseScan <ExternalLink className="w-3 h-3" />
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
              {a.kind === "eth" ? "ETH" : a.kind === "usdc" ? "USDC" : a.symbol}
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
          placeholder="Base (EVM) address"
          disabled={state !== "idle"}
          className="w-full bg-bg border border-border rounded-lg py-2.5 px-3 text-sm font-mono focus:outline-none focus:border-cta/50 disabled:opacity-60"
        />
        {recipient && !isValidRecipient && (
          <p className="text-xs text-red-400 mt-1">Not a valid Base address.</p>
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
        <p className="text-xs text-muted mt-1">Balance: {formatTokenAmount(balance, decimals)}</p>
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
        {state === "signing" || state === "confirming" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {state === "signing" ? "Confirm in wallet…" : "Confirming on-chain…"}
          </>
        ) : (
          "Send"
        )}
      </button>
    </div>
  );
}
