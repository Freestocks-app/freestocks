"use client";

import { useState, useEffect } from "react";

const TICKERS = [
  "$AAPL",
  "$TSLA",
  "$NVDA",
  "$AMZN",
  "$GOOGL",
  "$MSFT",
  "$META",
  "$NFLX",
];

const ROTATION_INTERVAL_MS = 2500;

export function RotatingTicker() {
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % TICKERS.length);
        setIsAnimating(false);
      }, 300);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="ticker-rotate-container">
      <span
        className={`ticker-rotate-text ${isAnimating ? "ticker-exit" : "ticker-enter"}`}
        key={index}
      >
        {TICKERS[index]}
      </span>
    </span>
  );
}
