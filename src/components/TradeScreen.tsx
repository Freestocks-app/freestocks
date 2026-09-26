"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { useSignAndSendTransaction, useFundWallet, useWallets } from "@privy-io/react-auth/solana";
import { Loader2, AlertCircle, CheckCircle, ArrowDown, Wallet, ExternalLink } from "lucide-react";
import { PrivyProvider } from "./PrivyProvider";
import { WalletConnectPrompt } from "./WalletConnectPrompt";
import { SegmentedTabs } from "./SegmentedTabs";
import { TOP10, type TokenizedStock } from "@/lib/tokenized-stocks";
import { USDC_MINT, USDC_DECIMALS } from "@/lib/solana-tokens";
import { usePrices } from "@/hooks/usePrices";
import { useWalletBalances } from "@/hooks/useWalletBalances";
import { useSolanaWalletAddress } from "@/hooks/useSolanaWalletAddress";
import { toBaseUnits, fromBaseUnits, formatTokenAmount } from "@/lib/token-amount";
import { getJupiterQuote, getJupiterSwapTransaction, type JupiterQuoteResponse } from "@/lib/jupiter/client";
import { persistWalletAddress } from "@/lib/persist-wallet-address";
import { EvmTradeScreen } from "./EvmTradeScreen";

interface TradeScreenProps {
  sessionEmail: string;
  privyAppId?: string;
}

type Side = "buy" | "sell";
type SendState = "idle" | "quoting" | "signing" | "confirming" | "success" | "error";

const SLIPPAGE_BPS = 50;
const QUOTE_STALE_MS = 25_000;
const MIN_TRADE_USD_CENTS = 100;

function TradeScreenInner({ sessionEmail }: { sessionEmail: string }) {
  const searchParams = useSearchParams();
  const walletAddress = useSolanaWalletAddress();
  const { wallets } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const { fundWallet } = useFundWallet();

  const [manualAddress, setManualAddress] = useState<string | undefined>(undefined);
  const address = walletAddress ?? manualAddress;

  const handleWalletReady = useCallback((addr: string) => {
    setManualAddress(addr);
    persistWalletAddress(addr);
  }, []);

  const initialSymbol = searchParams.get("symbol")?.toUpperCase();
  const [stock, setStock] = useState<TokenizedStock>(
    () => TOP10.find((s) => s.symbol === initialSymbol) ?? TOP10[0]
  );

  const { prices } = usePrices();
  const { solBalance, usdcBalance, tokenBalances, loading: balancesLoading } = useWalletBalances(address);

  const [side, setSide] = useState<Side>("buy");
  const [amountInput, setAmountInput] = useState("");
  const [quote, setQuote] = useState<JupiterQuoteResponse | null>(null);
  const [quoteFetchedAt, setQuoteFetchedAt] = useState<number | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const quoteRequestId = useRef(0);

  const price = prices[stock.symbol];
  const heldTokenBalance = tokenBalances.find((t) => t.symbol === stock.symbol)?.uiAmount ?? 0;

  const payDecimals = side === "buy" ? USDC_DECIMALS : stock.decimals;
  const receiveDecimals = side === "buy" ? stock.decimals : USDC_DECIMALS;
  const payBalance = side === "buy" ? usdcBalance ?? 0 : heldTokenBalance;
  const inputMint = side === "buy" ? USDC_MINT : stock.mint;
  const outputMint = side === "buy" ? stock.mint : USDC_MINT;

  const resetQuote = useCallback(() => {
    setQuote(null);
    setQuoteFetchedAt(null);
    setQuoteError(null);
  }, []);

  // Reset the whole in-progress trade whenever the user changes what they're
  // trading or which direction - a stale quote for a different pair/side
  // must never be reused. Done directly in the change handlers (not an
  // effect keyed on stock/side) since this is a response to a user action,
  // not a value derived from external state.
  const resetTrade = useCallback(() => {
    setAmountInput("");
    setQuote(null);
    setQuoteFetchedAt(null);
    setQuoteError(null);
    setSendState("idle");
    setSendError(null);
    setSignature(null);
  }, []);

  function handleSelectStock(symbol: string) {
    setStock(TOP10.find((s) => s.symbol === symbol) ?? TOP10[0]);
    resetTrade();
  }

  function handleSelectSide(nextSide: Side) {
    setSide(nextSide);
    resetTrade();
  }

  const fetchQuote = useCallback(
    async (amountRaw: bigint) => {
      const requestId = ++quoteRequestId.current;
      setQuoteLoading(true);
      setQuoteError(null);

      try {
        const result = await getJupiterQuote({
          inputMint,
          outputMint,
          amount: amountRaw.toString(),
          slippageBps: SLIPPAGE_BPS,
        });
        if (quoteRequestId.current !== requestId) return; // a newer request superseded this one
        setQuote(result);
        setQuoteFetchedAt(Date.now());
      } catch (err) {
        if (quoteRequestId.current !== requestId) return;
        setQuote(null);
        setQuoteFetchedAt(null);
        setQuoteError(err instanceof Error ? err.message : "Failed to get a quote");
      } finally {
        if (quoteRequestId.current === requestId) setQuoteLoading(false);
      }
    },
    [inputMint, outputMint]
  );

  // Debounced quote fetch on amount change. The invalid/zero-amount cases
  // clear the quote after a tick (not synchronously) so this effect only
  // ever schedules work rather than calling setState directly in its body.
  useEffect(() => {
    if (!amountInput || sendState !== "idle") {
      return;
    }

    const timer = setTimeout(() => {
      let amountRaw: bigint;
      try {
        amountRaw = toBaseUnits(amountInput, payDecimals);
      } catch {
        resetQuote();
        return;
      }
      if (amountRaw <= BigInt(0)) {
        resetQuote();
        return;
      }
      fetchQuote(amountRaw);
    }, 450);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountInput, payDecimals, sendState]);

  const [isQuoteStale, setIsQuoteStale] = useState(false);
  useEffect(() => {
    const resetTimer = setTimeout(() => setIsQuoteStale(false), 0);
    if (quoteFetchedAt === null) {
      return () => clearTimeout(resetTimer);
    }
    const staleTimer = setTimeout(() => setIsQuoteStale(true), QUOTE_STALE_MS);
    return () => {
      clearTimeout(resetTimer);
      clearTimeout(staleTimer);
    };
  }, [quoteFetchedAt]);

  const amountUsdCents =
    side === "buy"
      ? Math.round(parseFloat(amountInput || "0") * 100)
      : price
        ? Math.round(parseFloat(amountInput || "0") * price.price * 100)
        : 0;

  const insufficientBalance = !!amountInput && parseFloat(amountInput) > payBalance;
  const belowMinimum = !!amountInput && amountUsdCents > 0 && amountUsdCents < MIN_TRADE_USD_CENTS;
  const nearZeroSol = (solBalance ?? 0) < 0.001;

  const canSubmit =
    !!quote &&
    !quoteLoading &&
    !insufficientBalance &&
    !belowMinimum &&
    !nearZeroSol &&
    sendState === "idle";

  function handleMax() {
    setAmountInput(payBalance > 0 ? String(payBalance) : "");
  }

  async function handleConfirm() {
    if (!address) return;

    const wallet = wallets.find((w) => w.address === address);
    if (!wallet) {
      setSendError("Wallet not connected. Please reconnect and try again.");
      setSendState("error");
      return;
    }

    setSendState("signing");
    setSendError(null);

    try {
      // Always refetch immediately before building the swap tx rather than
      // trusting a quote that's been sitting in state - Jupiter quotes go
      // stale fast and a swap built from one can fail slippage on-chain.
      const amountRaw = toBaseUnits(amountInput, payDecimals);
      const freshQuote = await getJupiterQuote({
        inputMint,
        outputMint,
        amount: amountRaw.toString(),
        slippageBps: SLIPPAGE_BPS,
      });

      const { swapTransaction } = await getJupiterSwapTransaction({
        quoteResponse: freshQuote,
        userPublicKey: address,
      });

      const txBytes = Uint8Array.from(atob(swapTransaction), (c) => c.charCodeAt(0));
      const versionedTx = VersionedTransaction.deserialize(txBytes);
      const serialized = versionedTx.serialize();

      setSendState("confirming");
      const { signature: sigBytes } = await signAndSendTransaction({
        transaction: serialized,
        wallet,
      });
      const sigBase58 = bs58.encode(sigBytes);
      setSignature(sigBase58);

      fetch("/api/trade/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txId: sigBase58,
          side,
          symbol: stock.symbol,
          mint: stock.mint,
          tokenAmountRaw: side === "buy" ? freshQuote.outAmount : freshQuote.inAmount,
          tokenDecimals: stock.decimals,
          usdcAmountRaw: side === "buy" ? freshQuote.inAmount : freshQuote.outAmount,
          usdAmountCents: amountUsdCents,
          priceImpactPct: parseFloat(freshQuote.priceImpactPct as string) || 0,
          slippageBps: SLIPPAGE_BPS,
        }),
      }).catch(() => {
        // Best-effort history logging - the swap already succeeded on-chain
        // regardless of whether this call succeeds.
      });

      setSendState("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Trade failed";
      const rejected = /reject|cancel/i.test(message);
      setSendError(
        rejected
          ? "Transaction cancelled."
          : "Something went wrong sending your trade. If this happened after you approved it, check your wallet before retrying - it may have already gone through."
      );
      setSendState("error");
    }
  }

  function handleReset() {
    setAmountInput("");
    resetQuote();
    setSendState("idle");
    setSendError(null);
    setSignature(null);
  }

  const outputPreview = quote ? fromBaseUnits(quote.outAmount, side === "buy" ? stock.decimals : USDC_DECIMALS) : null;
  const minReceived = quote
    ? fromBaseUnits(quote.otherAmountThreshold, side === "buy" ? stock.decimals : USDC_DECIMALS)
    : null;

  if (!address) {
    return (
      <div className="max-w-md mx-auto">
        <WalletConnectPrompt sessionEmail={sessionEmail} onWalletReady={handleWalletReady} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-elevated">
          <Image src={stock.logo} alt={stock.name} width={40} height={40} className="w-full h-full object-cover" unoptimized />
        </div>
        <div className="flex-1 min-w-0">
          <select
            value={stock.symbol}
            onChange={(e) => handleSelectStock(e.target.value)}
            className="bg-transparent font-bold text-lg focus:outline-none cursor-pointer"
          >
            {TOP10.map((s) => (
              <option key={s.symbol} value={s.symbol} className="bg-elevated text-foreground">
                {s.symbol} - {s.name}
              </option>
            ))}
          </select>
        </div>
        {price && (
          <div className="text-right">
            <p className="font-bold tabular-nums">${price.price.toFixed(2)}</p>
            <p className={`text-xs font-semibold tabular-nums ${price.changePercent >= 0 ? "text-gain" : "text-red-400"}`}>
              {price.changePercent >= 0 ? "+" : ""}
              {price.changePercent.toFixed(2)}%
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <SegmentedTabs
          tabs={[
            { id: "buy", label: "Buy" },
            { id: "sell", label: "Sell" },
          ]}
          activeId={side}
          onChange={(id) => handleSelectSide(id as Side)}
        />
      </div>

      {sendState === "success" ? (
        <div className="card p-6 text-center space-y-3">
          <CheckCircle className="w-10 h-10 text-gain mx-auto" />
          <p className="font-bold">
            {side === "buy" ? "Bought" : "Sold"} {stock.symbol}
          </p>
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
          <button onClick={handleReset} className="btn-primary w-full text-sm py-2.5 justify-center mt-2">
            Trade again
          </button>
        </div>
      ) : (
        <>
          <div className="card p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>You pay</span>
              <span>{side === "buy" ? "USDC" : stock.symbol}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                disabled={sendState !== "idle"}
                className="w-full bg-transparent text-2xl font-bold focus:outline-none disabled:opacity-60"
              />
              <button
                onClick={handleMax}
                disabled={sendState !== "idle" || balancesLoading}
                className="text-xs font-semibold text-cta hover:underline flex-shrink-0 disabled:opacity-50"
              >
                Max
              </button>
            </div>
            <p className="text-xs text-muted">
              Balance: {balancesLoading ? "…" : formatTokenAmount(payBalance, payDecimals)}{" "}
              {side === "buy" ? "USDC" : stock.symbol}
            </p>
          </div>

          <div className="flex justify-center -my-2 relative z-10">
            <div className="w-8 h-8 rounded-full bg-elevated border border-border flex items-center justify-center">
              <ArrowDown className="w-4 h-4 text-muted" />
            </div>
          </div>

          <div className="card p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>You receive (estimated)</span>
              <span>{side === "buy" ? stock.symbol : "USDC"}</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {quoteLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted" />
              ) : outputPreview !== null ? (
                formatTokenAmount(outputPreview, receiveDecimals)
              ) : (
                "0.00"
              )}
            </p>
            {quote && minReceived !== null && (
              <p className="text-xs text-muted">
                Min received: {formatTokenAmount(minReceived, receiveDecimals)} · Price impact:{" "}
                {(parseFloat(quote.priceImpactPct as string) * 100).toFixed(2)}% · Slippage: 0.5%
              </p>
            )}
          </div>

          {side === "buy" && (usdcBalance ?? 0) < parseFloat(amountInput || "0") && (
            <button
              onClick={() => address && fundWallet({ address, options: { asset: "USDC", defaultFundingMethod: "card", card: { preferredProvider: "moonpay" } } })}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-cta/30 text-cta text-sm font-semibold hover:bg-cta/5 transition-colors"
            >
              <Wallet className="w-4 h-4" />
              Add cash
            </button>
          )}

          {quoteError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{quoteError}</p>
            </div>
          )}
          {insufficientBalance && (
            <p className="text-xs text-red-400">Amount exceeds your available balance.</p>
          )}
          {belowMinimum && <p className="text-xs text-red-400">Minimum trade is $1.00.</p>}
          {nearZeroSol && (
            <p className="text-xs text-amber-400">
              You need a small amount of SOL to cover network fees.
            </p>
          )}
          {sendError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{sendError}</p>
            </div>
          )}
          {isQuoteStale && sendState === "idle" && quote && (
            <p className="text-xs text-muted text-center">Price updated - refreshing quote…</p>
          )}

          <button
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="btn-primary w-full text-sm py-3 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendState === "signing" || sendState === "confirming" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {sendState === "signing" ? "Confirm in wallet…" : "Confirming on-chain…"}
              </>
            ) : (
              `${side === "buy" ? "Buy" : "Sell"} ${stock.symbol}`
            )}
          </button>
        </>
      )}
    </div>
  );
}

type Chain = "solana" | "ethereum";

export function TradeScreen({ sessionEmail, privyAppId }: TradeScreenProps) {
  const [chain, setChain] = useState<Chain>("solana");

  if (!privyAppId) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted">Trading is not configured.</p>
      </div>
    );
  }

  return (
    <PrivyProvider appId={privyAppId}>
      <div className="max-w-md mx-auto mb-4 flex justify-center">
        <SegmentedTabs
          tabs={[
            { id: "solana", label: "Solana" },
            { id: "ethereum", label: "Ethereum" },
          ]}
          activeId={chain}
          onChange={(id) => setChain(id as Chain)}
        />
      </div>
      {chain === "solana" ? <TradeScreenInner sessionEmail={sessionEmail} /> : <EvmTradeScreen />}
    </PrivyProvider>
  );
}
