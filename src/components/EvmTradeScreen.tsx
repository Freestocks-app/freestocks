"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSendTransaction } from "@privy-io/react-auth";
import { Loader2, AlertCircle, CheckCircle, ArrowDown, ExternalLink } from "lucide-react";
import { SegmentedTabs } from "./SegmentedTabs";
import { useEvmWalletAddress } from "@/hooks/useEvmWalletAddress";
import { toBaseUnits, fromBaseUnits, formatTokenAmount } from "@/lib/token-amount";
import {
  BASE_STOCKS,
  BASE_CHAIN_ID,
  BASE_BLOCK_EXPLORER,
  USDC_ADDRESS,
  USDC_DECIMALS,
  type BaseStock,
} from "@/lib/uniswap/constants";
import {
  getUniswapQuote,
  getSwapRouterAllowance,
  buildApproveTransaction,
  buildSwapTransaction,
  type UniswapQuoteResult,
} from "@/lib/uniswap/client";

type Side = "buy" | "sell";
type SendState = "idle" | "approving" | "signing" | "confirming" | "success" | "error";

const SLIPPAGE_BPS = 50;
const QUOTE_STALE_MS = 25_000;
const MIN_TRADE_USD_CENTS = 100;

export function EvmTradeScreen() {
  const address = useEvmWalletAddress();
  const { sendTransaction } = useSendTransaction();

  const [stock, setStock] = useState<BaseStock>(BASE_STOCKS[0]);
  const [side, setSide] = useState<Side>("buy");
  const [amountInput, setAmountInput] = useState("");
  const [quote, setQuote] = useState<UniswapQuoteResult | null>(null);
  const [quoteFetchedAt, setQuoteFetchedAt] = useState<number | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const quoteRequestId = useRef(0);

  const payDecimals = side === "buy" ? USDC_DECIMALS : stock.decimals;
  const receiveDecimals = side === "buy" ? stock.decimals : USDC_DECIMALS;
  const tokenIn = side === "buy" ? USDC_ADDRESS : stock.address;
  const tokenOut = side === "buy" ? stock.address : USDC_ADDRESS;

  // No live balance reader for Base yet (unlike the Solana side's
  // useWalletBalances) - Max/balance display are out of scope for this
  // first pass; the amount input still works, just without a Max shortcut.

  const resetTrade = useCallback(() => {
    setAmountInput("");
    setQuote(null);
    setQuoteFetchedAt(null);
    setQuoteError(null);
    setSendState("idle");
    setSendError(null);
    setTxHash(null);
  }, []);

  function handleSelectStock(symbol: string) {
    setStock(BASE_STOCKS.find((s) => s.symbol === symbol) ?? BASE_STOCKS[0]);
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
        const result = await getUniswapQuote({
          tokenIn,
          tokenOut,
          amountIn: amountRaw.toString(),
          fee: stock.poolFee,
        });
        if (quoteRequestId.current !== requestId) return;
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
    [tokenIn, tokenOut, stock.poolFee]
  );

  useEffect(() => {
    if (!amountInput || sendState !== "idle") return;

    const timer = setTimeout(() => {
      let amountRaw: bigint;
      try {
        amountRaw = toBaseUnits(amountInput, payDecimals);
      } catch {
        setQuote(null);
        setQuoteFetchedAt(null);
        return;
      }
      if (amountRaw <= BigInt(0)) {
        setQuote(null);
        setQuoteFetchedAt(null);
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
    side === "buy" ? Math.round(parseFloat(amountInput || "0") * 100) : 0; // sell-side USD estimate not shown without a price feed

  const belowMinimum = side === "buy" && !!amountInput && amountUsdCents > 0 && amountUsdCents < MIN_TRADE_USD_CENTS;

  const canSubmit = !!quote && !quoteLoading && !belowMinimum && sendState === "idle" && !!amountInput;

  async function handleConfirm() {
    if (!address) return;

    setSendError(null);

    try {
      const amountRaw = toBaseUnits(amountInput, payDecimals);

      // Always refetch immediately before building the swap, same
      // discipline as the Solana/Jupiter path - a quote sitting in state
      // can go stale.
      const freshQuote = await getUniswapQuote({
        tokenIn,
        tokenOut,
        amountIn: amountRaw.toString(),
        fee: stock.poolFee,
      });
      const amountOutMinimum =
        (BigInt(freshQuote.amountOut) * BigInt(10_000 - SLIPPAGE_BPS)) / BigInt(10_000);

      const allowance = await getSwapRouterAllowance(tokenIn, address);
      if (allowance < amountRaw) {
        setSendState("approving");
        const approveTx = buildApproveTransaction(tokenIn, amountRaw.toString());
        await sendTransaction(
          { to: approveTx.to as string, data: approveTx.data as string, chainId: BASE_CHAIN_ID },
          { address }
        );
      }

      setSendState("signing");
      const swapTx = buildSwapTransaction({
        tokenIn,
        tokenOut,
        fee: stock.poolFee,
        recipient: address,
        amountIn: amountRaw.toString(),
        amountOutMinimum: amountOutMinimum.toString(),
      });

      setSendState("confirming");
      const { hash } = await sendTransaction(
        { to: swapTx.to as string, data: swapTx.data as string, chainId: BASE_CHAIN_ID },
        { address }
      );
      setTxHash(hash);
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

  const outputPreview = quote ? fromBaseUnits(quote.amountOut, receiveDecimals) : null;

  if (!address) {
    return (
      <div className="card p-6 text-center">
        <Loader2 className="w-5 h-5 text-cta animate-spin mx-auto mb-2" />
        <p className="text-xs text-muted">Setting up your Base wallet…</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-elevated flex items-center justify-center text-xs font-bold">
          {stock.symbol.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <select
            value={stock.symbol}
            onChange={(e) => handleSelectStock(e.target.value)}
            className="bg-transparent font-bold text-lg focus:outline-none cursor-pointer"
          >
            {BASE_STOCKS.map((s) => (
              <option key={s.symbol} value={s.symbol} className="bg-elevated text-foreground">
                {s.tokenSymbol} - {s.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted">on Base · vs USDC</p>
        </div>
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
            {side === "buy" ? "Bought" : "Sold"} {stock.tokenSymbol}
          </p>
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
          <button onClick={resetTrade} className="btn-primary w-full text-sm py-2.5 justify-center mt-2">
            Trade again
          </button>
        </div>
      ) : (
        <>
          <div className="card p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>You pay</span>
              <span>{side === "buy" ? "USDC" : stock.tokenSymbol}</span>
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
            </div>
          </div>

          <div className="flex justify-center -my-2 relative z-10">
            <div className="w-8 h-8 rounded-full bg-elevated border border-border flex items-center justify-center">
              <ArrowDown className="w-4 h-4 text-muted" />
            </div>
          </div>

          <div className="card p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>You receive (estimated)</span>
              <span>{side === "buy" ? stock.tokenSymbol : "USDC"}</span>
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
          </div>

          {quoteError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{quoteError}</p>
            </div>
          )}
          {belowMinimum && <p className="text-xs text-red-400">Minimum trade is $1.00.</p>}
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
            {sendState === "approving" || sendState === "signing" || sendState === "confirming" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {sendState === "approving"
                  ? "Approving…"
                  : sendState === "signing"
                    ? "Confirm in wallet…"
                    : "Confirming on-chain…"}
              </>
            ) : (
              `${side === "buy" ? "Buy" : "Sell"} ${stock.tokenSymbol}`
            )}
          </button>
        </>
      )}
    </div>
  );
}
