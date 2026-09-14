"use client";

import { useState, useEffect } from "react";

const TICKERS = ["AAPL", "TSLA", "NVDA", "AMZN", "GOOGL", "NFLX", "SPY"];
const ROTATE_INTERVAL = 2500;

export function RotatingTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % TICKERS.length);
        setIsAnimating(false);
      }, 200);
    }, ROTATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const ticker = TICKERS[currentIndex];

  return (
    <span
      className={`inline-block text-cta transition-all duration-200 ${
        isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      }`}
    >
      ${ticker}
    </span>
  );
}
