import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { TOP10, getTickerData, type StockPrice } from "@/lib/tokenized-stocks";
import { RotatingTicker } from "@/components/RotatingTicker";

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
      <Image src={imageSrc} alt={stock.name} width={80} height={80} className="w-full h-full object-cover" unoptimized />
    </div>
  );
}

export default async function LandingPage() {
  const prices = await getPrices();
  const tickerData = getTickerData(prices);

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
            className="h-8 sm:h-10 md:h-11 w-auto" 
            priority 
          />
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/sign-in" className="text-xs sm:text-sm text-muted hover:text-foreground transition-colors px-2 sm:px-3 py-1.5">
            Sign In
          </Link>
          <Link href="/sign-up" className="btn-primary text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4">
            Get Started
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
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
          </div>

          {/* Mobile badges - minimal */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none sm:hidden">
            <div style={{ position: "absolute", top: "5%", right: "4%" }}><StockBadge stock={TOP10[1]} /></div>
            <div style={{ position: "absolute", top: "70%", left: "2%" }}><StockBadge stock={TOP10[2]} /></div>
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
              <Link href="/sign-up" className="btn-primary text-base sm:text-lg px-10 py-4 pulse-glow">
                Start Earning Free
                <ArrowRight className="w-5 h-5" />
              </Link>
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

        {/* 3-Step Section - Clean and focused */}
        <section className="py-12 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                The easiest way to earn stocks
              </h2>
              <p className="text-sm sm:text-base text-muted">Three steps. No deposit needed.</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-cta/10 border border-cta/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-cta">1</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Earn points</h3>
                <p className="text-sm text-muted">
                  Complete offers, download apps, play games, take surveys. Rewards credit your balance.
                </p>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-cta/10 border border-cta/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-cta">2</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Cashout at $5</h3>
                <p className="text-sm text-muted">
                  Once you hit $5, choose a stock to redeem. Apple, Tesla, NVIDIA — your pick.
                </p>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gain/10 border border-gain/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-gain">3</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Receive stock</h3>
                <p className="text-sm text-muted">
                  Tokenized shares (xStocks) delivered to your account. You own them.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stocks Section - Clean cards with brand logos */}
        <section className="py-12 sm:py-16 bg-elevated/30 border-y border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                Stocks you can unlock
              </h2>
              <p className="text-sm sm:text-base text-muted">
                xStocks on Solana — backed 1:1 by real shares via{" "}
                <a href="https://backed.fi" target="_blank" rel="noopener noreferrer" className="text-cta hover:underline">
                  Backed.fi
                </a>
              </p>
            </div>

            {/* FreeCash-style structured stock cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-8">
              {TOP10.map((stock) => (
                <div key={stock.symbol} className="stock-card">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden mb-2">
                    <Image src={stock.logo} alt={stock.name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
                  </div>
                  <p className="font-semibold text-sm">${stock.symbol}</p>
                  <p className="text-[10px] text-muted">{stock.name}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link href="/sign-up" className="btn-primary text-base px-8 py-3">
                Start Earning
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 sm:py-24">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to earn your first stock?
            </h2>
            <p className="text-muted mb-8">
              Join thousands of users earning fractional shares. No deposit, no catch.
            </p>
            <Link href="/sign-up" className="btn-primary text-lg px-10 py-4 pulse-glow">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
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
              className="h-6 w-auto" 
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
