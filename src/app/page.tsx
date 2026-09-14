import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock } from "lucide-react";
import { TOP10, getTickerData, type StockPrice } from "@/lib/tokenized-stocks";
import { RotatingTicker } from "@/components/RotatingTicker";
import { isComingSoon } from "@/lib/utils";

async function getPrices(): Promise<Record<string, StockPrice>> {
  const prices: Record<string, StockPrice> = {};
  
  try {
    await Promise.allSettled(
      TOP10.map(async (stock) => {
        try {
          const res = await fetch(
            `https://api.dexscreener.com/tokens/v1/solana/${stock.mint}`,
            { next: { revalidate: 60 } }
          );
          if (!res.ok) return;
          const pairs = await res.json();
          if (!pairs || pairs.length === 0) return;
          
          const pair = pairs[0];
          const price = parseFloat(pair.priceUsd) || 0;
          const changePercent = pair.priceChange?.h24 ?? 0;
          
          if (price > 0) {
            prices[stock.symbol] = {
              symbol: stock.symbol,
              price,
              change: 0,
              changePercent,
            };
          }
        } catch {
          // Skip this stock on error
        }
      })
    );
  } catch {
    // Return whatever we have
  }
  
  return prices;
}

function TickerCube({ symbol, change, logo }: { symbol: string; change: string; logo: string }) {
  const isPositive = change.startsWith("+");
  const isNegative = change.startsWith("-");
  return (
    <div className="ticker-cube mx-1.5 sm:mx-2">
      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md overflow-hidden mr-1.5 flex-shrink-0">
        <Image src={logo} alt={symbol} width={20} height={20} className="w-full h-full object-cover" unoptimized />
      </div>
      <span className="text-foreground mr-1.5 text-xs sm:text-sm font-medium">${symbol}</span>
      <span className={`text-xs sm:text-sm font-medium ${isPositive ? "text-gain" : isNegative ? "text-red-400" : "text-muted"}`}>
        {change}
      </span>
    </div>
  );
}

function StockBadge({ stock, className = "" }: { stock: typeof TOP10[0]; className?: string }) {
  const imageSrc = stock.badge || stock.logo;
  return (
    <div className={`stock-badge ${className}`} title={stock.name}>
      <Image src={imageSrc} alt={stock.name} width={88} height={88} className="w-full h-full object-cover" unoptimized />
    </div>
  );
}

export default async function LandingPage() {
  const prices = await getPrices();
  const tickerData = getTickerData(prices);
  const comingSoon = isComingSoon();

  return (
    <div className="min-h-screen bg-bg flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-12 sm:h-14 flex items-center justify-between px-3 sm:px-4 md:px-6 bg-bg/95 backdrop-blur-md border-b border-border">
        <Link href="/" className="flex items-center">
          <Image 
            src="/brand/freestocks-logo.png"
            alt="Freestocks"
            width={180}
            height={44}
            className="h-6 sm:h-7 md:h-8 w-auto"
            priority
          />
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {comingSoon ? (
            <span className="hidden md:inline-flex btn-primary text-sm py-2 px-4 opacity-60 cursor-not-allowed">
              <Clock className="w-4 h-4" />
              Coming Soon
            </span>
          ) : (
            <>
              <Link href="/sign-in" className="text-xs sm:text-sm text-muted hover:text-foreground transition-colors px-2 sm:px-3 py-1.5">
                Sign In
              </Link>
              <Link href="/sign-up" className="btn-primary text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4">
                Get Started
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 pt-12 sm:pt-14">
        {/* Hero Section - Spacious, outcome-first */}
        <section className="relative py-12 sm:py-20 md:py-28 min-h-[65vh] sm:min-h-[70vh] flex items-center">
          {/* Background glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/3 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-cta/8 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-[28rem] h-72 sm:h-[28rem] bg-gain/6 rounded-full blur-3xl" />
          </div>

          {/* Floating stock badges - positioned to not obscure headline */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
            <div style={{ position: "absolute", top: "8%", left: "6%" }}><StockBadge stock={TOP10[0]} /></div>
            <div style={{ position: "absolute", top: "18%", right: "8%" }}><StockBadge stock={TOP10[1]} /></div>
            <div style={{ position: "absolute", top: "65%", left: "4%" }}><StockBadge stock={TOP10[2]} /></div>
            <div style={{ position: "absolute", top: "72%", right: "6%" }}><StockBadge stock={TOP10[3]} /></div>
            <div style={{ position: "absolute", top: "12%", left: "18%" }} className="hidden lg:block"><StockBadge stock={TOP10[4]} /></div>
            <div style={{ position: "absolute", top: "22%", right: "16%" }} className="hidden lg:block"><StockBadge stock={TOP10[5]} /></div>
            <div style={{ position: "absolute", top: "62%", left: "22%" }}><StockBadge stock={TOP10[7]} /></div>
          </div>

          {/* Mobile badges - four corners */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none sm:hidden">
            <div style={{ position: "absolute", top: "4%", left: "3%" }}><StockBadge stock={TOP10[0]} /></div>
            <div style={{ position: "absolute", top: "4%", right: "3%" }}><StockBadge stock={TOP10[1]} /></div>
            <div style={{ position: "absolute", bottom: "4%", left: "3%" }}><StockBadge stock={TOP10[2]} /></div>
            <div style={{ position: "absolute", bottom: "4%", right: "3%" }}><StockBadge stock={TOP10[3]} /></div>
          </div>

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 sm:mb-8 flex flex-col items-center">
              <span className="inline-flex items-baseline justify-center flex-wrap">
                Earn&nbsp;<RotatingTicker />&nbsp;for
              </span>
              <span className="block text-[0.85em] sm:text-[1em]">
                testing apps, games &amp; surveys
              </span>
            </h1>

            {/* Primary CTA */}
            <div className="flex justify-center">
              {comingSoon ? (
                <span className="btn-primary text-base sm:text-lg px-10 py-4 opacity-60 cursor-not-allowed">
                  <Clock className="w-5 h-5" />
                  Coming Soon
                </span>
              ) : (
                <Link href="/sign-up" className="btn-primary text-base sm:text-lg px-10 py-4 pulse-glow">
                  Start Earning Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Ticker Section */}
        <section className="py-3 sm:py-4 border-y border-border overflow-hidden bg-elevated/30">
          <div className="relative">
            <div className="flex ticker-scroll whitespace-nowrap">
              {[...tickerData, ...tickerData].map((ticker, i) => (
                <TickerCube key={`${ticker.symbol}-${i}`} symbol={ticker.symbol} change={ticker.change} logo={ticker.logo} />
              ))}
            </div>
          </div>
        </section>

        {/* 3-Step Section - Yuki's elevated design */}
        <section className="py-16 sm:py-24 md:py-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            {/* Header */}
            <div className="text-center mb-12 sm:mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full border border-cta text-cta text-xs sm:text-sm font-medium tracking-wide mb-6">
                NO DEPOSIT. REAL OWNERSHIP.
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
                Turn quick tasks into <span className="text-cta">stock</span>
              </h2>
              <p className="text-muted text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                Test apps, play games, and answer surveys. When your balance hits $5, choose the company you want to own.
              </p>
            </div>

            {/* Three Cards */}
            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
              {/* Card 1 - Complete offers */}
              <div className="step-card group">
                <div className="step-number">1</div>
                <div className="step-icon mb-6">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="12" width="48" height="40" rx="6" fill="#1a1a1a" stroke="#2b2b2b" strokeWidth="1.5"/>
                    <rect x="16" y="24" width="32" height="8" rx="4" fill="var(--cta)" fillOpacity="0.9"/>
                    <rect x="16" y="36" width="20" height="4" rx="2" fill="#3a3a3a"/>
                    <rect x="16" y="44" width="28" height="4" rx="2" fill="#3a3a3a"/>
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Complete offers</h3>
                <p className="text-sm text-muted leading-relaxed">
                  Pick bite-size tasks from apps, games, and surveys. Rewards land in your Freestocks balance as points.
                </p>
              </div>

              {/* Card 2 - Unlock at $5 */}
              <div className="step-card group">
                <div className="step-number">2</div>
                <div className="step-icon mb-6">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="12" width="48" height="40" rx="10" fill="var(--cta)"/>
                    <text x="32" y="40" textAnchor="middle" fill="#0a0a0a" fontSize="22" fontWeight="700" fontFamily="Inter, sans-serif">$5</text>
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Unlock at $5</h3>
                <p className="text-sm text-muted leading-relaxed">
                  No deposit needed. Reach the threshold and swap your balance for a stock reward.
                </p>
              </div>

              {/* Card 3 - Choose a stock */}
              <div className="step-card group">
                <div className="step-number">3</div>
                <div className="step-icon mb-6">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="barGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="var(--cta)" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="var(--cta)" stopOpacity="1"/>
                      </linearGradient>
                    </defs>
                    <rect x="10" y="36" width="10" height="20" rx="3" fill="url(#barGradient)"/>
                    <rect x="27" y="24" width="10" height="32" rx="3" fill="url(#barGradient)"/>
                    <rect x="44" y="12" width="10" height="44" rx="3" fill="url(#barGradient)"/>
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Choose a stock</h3>
                <p className="text-sm text-muted leading-relaxed">
                  Redeem into tokenized shares from names like Apple, Tesla, NVIDIA, and more.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stocks Section - Elevated visual language */}
        <section className="py-16 sm:py-24 border-t border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-14">
              <span className="inline-block px-3 py-1 rounded-full bg-elevated border border-border text-muted text-xs font-medium mb-4">
                BACKED 1:1 BY REAL SHARES
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
                Names you <span className="text-cta">know</span>
              </h2>
              <p className="text-muted text-sm sm:text-base max-w-xl mx-auto">
                xStocks on Solana via{" "}
                <a href="https://backed.fi" target="_blank" rel="noopener noreferrer" className="text-cta hover:underline">
                  Backed.fi
                </a>
                {" "}— fractional ownership of household names
              </p>
            </div>

            {/* Stock grid - refined cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-10">
              {TOP10.map((stock) => (
                <div key={stock.symbol} className="stock-card-elevated">
                  <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl overflow-hidden mb-3">
                    <Image src={stock.logo} alt={stock.name} width={56} height={56} className="w-full h-full object-cover" unoptimized />
                  </div>
                  <p className="font-semibold text-sm sm:text-base">${stock.symbol}</p>
                  <p className="text-[10px] sm:text-xs text-muted">{stock.name}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              {comingSoon ? (
                <span className="btn-primary text-base px-8 py-3.5 opacity-60 cursor-not-allowed inline-flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Coming Soon
                </span>
              ) : (
                <Link href="/sign-up" className="btn-primary text-base px-8 py-3.5">
                  Start Earning
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Final CTA Section - Elevated band */}
        <section className="py-20 sm:py-28 border-t border-border relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cta/5 rounded-full blur-3xl" />
          </div>
          
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center relative z-10">
            <span className="inline-block px-4 py-1.5 rounded-full border border-cta/40 text-cta text-xs sm:text-sm font-medium mb-6">
              {comingSoon ? "LAUNCHING SOON" : "FREE TO START"}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              {comingSoon ? (
                <>Freestocks is <span className="text-cta">launching soon</span></>
              ) : (
                <>Your first stock is <span className="text-cta">waiting</span></>
              )}
            </h2>
            <p className="text-muted text-base sm:text-lg mb-8 max-w-lg mx-auto">
              {comingSoon 
                ? "We're putting the finishing touches on something great. Check back soon!"
                : "No deposit, no catch. Earn points, pick a stock, own a piece of the companies you believe in."}
            </p>
            {comingSoon ? (
              <span className="btn-primary text-lg px-10 py-4 opacity-60 cursor-not-allowed inline-flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Coming Soon
              </span>
            ) : (
              <Link href="/sign-up" className="btn-primary text-lg px-10 py-4 pulse-glow">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-5 sm:py-6 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link href="/" className="flex items-center">
            <Image 
              src="/brand/freestocks-logo.png" 
              alt="Freestocks" 
              width={120} 
              height={28} 
              className="h-7 w-auto" 
            />
          </Link>
          <div className="flex items-center gap-4 text-xs text-muted">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
          </div>
          <p className="text-xs text-muted">© {new Date().getFullYear()} Freestocks</p>
        </div>
      </footer>
    </div>
  );
}
