import Link from "next/link";
import Image from "next/image";
import { ArrowRight, TrendingUp, DollarSign, Zap, CheckCircle, Gamepad2, FileText, Gift, Flame, Wallet } from "lucide-react";
import { TOP10, getTickerData, type StockPrice } from "@/lib/tokenized-stocks";

async function getPrices(): Promise<Record<string, StockPrice>> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3847";
    const res = await fetch(`${baseUrl}/api/prices`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data.prices ?? {};
  } catch {
    return {};
  }
}

function TickerCube({ symbol, change, logo }: { symbol: string; change: string; logo: string }) {
  const isPositive = change.startsWith("+");
  const isNegative = change.startsWith("-");
  return (
    <div className="ticker-cube float mx-1.5 sm:mx-2">
      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white flex items-center justify-center overflow-hidden mr-1.5">
        <Image src={logo} alt={symbol} width={20} height={20} className="w-4 h-4 sm:w-5 sm:h-5 object-contain" unoptimized />
      </div>
      <span className="text-foreground mr-1.5 text-xs sm:text-sm font-medium">{symbol}</span>
      <span className={`text-xs sm:text-sm font-medium ${isPositive ? "text-gain" : isNegative ? "text-red-400" : "text-muted"}`}>
        {change}
      </span>
    </div>
  );
}

function StockBadge({ stock }: { stock: typeof TOP10[0] }) {
  return (
    <div className="stock-badge float" title={`${stock.name} (${stock.tokenSymbol})`}>
      <Image src={stock.logo} alt={stock.name} width={32} height={32} className="w-6 h-6 sm:w-8 sm:h-8 object-contain" unoptimized />
    </div>
  );
}

export default async function LandingPage() {
  const prices = await getPrices();
  const tickerData = getTickerData(prices);

  return (
    <div className="min-h-screen bg-bg flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-12 sm:h-14 flex items-center justify-between px-3 sm:px-4 md:px-6 bg-bg/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-cta flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cta-ink" />
          </div>
          <span className="font-bold text-sm sm:text-base">Freestocks</span>
        </div>
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
        {/* Hero Section */}
        <section className="relative overflow-hidden py-10 sm:py-16 md:py-24 min-h-[60vh] sm:min-h-[70vh] flex items-center">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-48 sm:w-64 h-48 sm:h-64 bg-cta/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-56 sm:w-80 h-56 sm:h-80 bg-gain/10 rounded-full blur-3xl" />
          </div>

          {/* Floating stock badges - desktop */}
          <div className="spark-field hidden sm:block">
            <div style={{ position: "absolute", top: "12%", left: "8%" }}><StockBadge stock={TOP10[0]} /></div>
            <div style={{ position: "absolute", top: "25%", right: "10%" }}><StockBadge stock={TOP10[1]} /></div>
            <div style={{ position: "absolute", top: "55%", left: "5%" }}><StockBadge stock={TOP10[2]} /></div>
            <div style={{ position: "absolute", top: "65%", right: "8%" }}><StockBadge stock={TOP10[3]} /></div>
            <div style={{ position: "absolute", top: "40%", left: "12%" }} className="hidden md:block"><StockBadge stock={TOP10[4]} /></div>
            <div style={{ position: "absolute", top: "30%", right: "15%" }} className="hidden md:block"><StockBadge stock={TOP10[5]} /></div>
            <div style={{ position: "absolute", top: "18%", left: "18%" }} className="hidden lg:block"><StockBadge stock={TOP10[6]} /></div>
            <div style={{ position: "absolute", top: "50%", right: "18%" }} className="hidden lg:block"><StockBadge stock={TOP10[7]} /></div>
          </div>

          {/* Mobile floating badges */}
          <div className="spark-field sm:hidden">
            <div style={{ position: "absolute", top: "8%", right: "5%" }}><StockBadge stock={TOP10[1]} /></div>
            <div style={{ position: "absolute", top: "60%", left: "3%" }}><StockBadge stock={TOP10[2]} /></div>
          </div>

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center z-10">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-elevated border border-border mb-4 sm:mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-gain animate-pulse" />
              <span className="text-[10px] sm:text-xs text-muted">No deposit needed — earn stocks from offers</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-5">
              The easiest way to{" "}
              <span className="text-cta">earn stocks</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-muted max-w-lg mx-auto mb-6 sm:mb-8">
              Complete offers. Build your balance. Unlock fractional shares of Apple, Tesla, NVIDIA and more.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 mb-6">
              <Link href="/sign-up" className="btn-primary text-sm sm:text-base px-6 sm:px-8 py-3 w-full sm:w-auto pulse-glow">
                Start Earning Free
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link href="/sign-in" className="btn-secondary text-sm sm:text-base px-6 sm:px-8 py-3 w-full sm:w-auto">
                I have an account
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] sm:text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-cta" />
                <span>USD balance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-gain" />
                <span>Instant credits</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-cta" />
                <span>To Solana wallet</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="py-3 sm:py-4 border-y border-border bg-elevated/50">
          <div className="max-w-4xl mx-auto px-3 sm:px-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-cta/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-cta" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold">USD Ledger</p>
                  <p className="text-[9px] sm:text-xs text-muted">Real dollars, not points</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gain/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-gain" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold">Instant</p>
                  <p className="text-[9px] sm:text-xs text-muted">Credits in minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-cta/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-cta" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold">Real Stocks</p>
                  <p className="text-[9px] sm:text-xs text-muted">xStocks on Solana</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ticker Section */}
        <section className="py-3 sm:py-4 border-b border-border overflow-hidden bg-bg">
          <div className="relative">
            <div className="flex ticker-scroll whitespace-nowrap">
              {[...tickerData, ...tickerData].map((ticker, i) => (
                <TickerCube key={`${ticker.symbol}-${i}`} symbol={ticker.symbol} change={ticker.change} logo={ticker.logo} />
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-10 sm:py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                Three steps to free stocks
              </h2>
              <p className="text-sm sm:text-base text-muted">Simpler than you think</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="card p-5 sm:p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-cta/10 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-6 h-6 text-cta" />
                </div>
                <div className="text-xs font-bold text-cta mb-2">STEP 1</div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Complete Offers</h3>
                <p className="text-sm text-muted">
                  Download apps, play games, take surveys. Each offer pays real cash.
                </p>
              </div>

              <div className="card p-5 sm:p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-gain/10 flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-6 h-6 text-gain" />
                </div>
                <div className="text-xs font-bold text-gain mb-2">STEP 2</div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Reach $5</h3>
                <p className="text-sm text-muted">
                  Build your balance. Track every dollar in your dashboard.
                </p>
              </div>

              <div className="card p-5 sm:p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-cta/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-cta" />
                </div>
                <div className="text-xs font-bold text-cta mb-2">STEP 3</div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Unlock Stocks</h3>
                <p className="text-sm text-muted">
                  Cashout to tokenized stock shares delivered to your Solana wallet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Offers */}
        <section className="py-10 sm:py-14 bg-elevated/30 border-y border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                Popular offers right now
              </h2>
              <p className="text-sm sm:text-base text-muted">Sign up to see all available</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-6 sm:mb-8">
              {[
                { icon: Gamepad2, title: "Royal Match", meta: "Reach Level 200", reward: 4.50, chip: "Hot", hasBonus: true, bonusText: "2x Weekend" },
                { icon: FileText, title: "Opinion Survey", meta: "5 min • Instant", reward: 0.85, chip: "New", hasBonus: false, bonusText: "" },
                { icon: Gift, title: "Cashback App", meta: "First purchase", reward: 2.25, chip: null, hasBonus: true, bonusText: "+50% Limited" },
                { icon: Gamepad2, title: "Coin Master", meta: "Village 10", reward: 3.75, chip: null, hasBonus: false, bonusText: "" },
              ].map((offer, i) => (
                <div key={i} className="card overflow-hidden">
                  {offer.hasBonus && <div className="h-1 bg-bonus" />}
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start gap-2.5 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-bg border border-border flex items-center justify-center flex-shrink-0">
                        <offer.icon className="w-4 h-4 text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="font-semibold text-sm truncate">{offer.title}</p>
                          {offer.chip && (
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${offer.chip === "Hot" ? "bg-gain/20 text-gain" : "bg-cta/20 text-cta"}`}>
                              {offer.chip}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted truncate">{offer.meta}</p>
                      </div>
                    </div>
                    {offer.hasBonus && (
                      <div className="flex items-center gap-1 mb-2 px-2 py-1 rounded bg-bonus/10 border border-bonus/20">
                        <Flame className="w-2.5 h-2.5 text-bonus" />
                        <span className="text-[9px] text-bonus font-medium">{offer.bonusText}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[8px] text-muted uppercase">Up to</p>
                        <p className="text-base sm:text-lg font-bold text-cta tabular-nums">${offer.reward.toFixed(2)}</p>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-cta flex items-center justify-center">
                        <ArrowRight className="w-3.5 h-3.5 text-cta-ink" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link href="/sign-up" className="btn-primary text-sm sm:text-base px-8 py-3">
                Start Earning Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-xs text-muted mt-3">No deposits required</p>
            </div>
          </div>
        </section>

        {/* Stocks You Can Unlock */}
        <section className="py-10 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                Stocks you can unlock
              </h2>
              <p className="text-sm sm:text-base text-muted">xStocks on Solana — backed 1:1 by real shares</p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6">
              {TOP10.map((stock) => (
                <div
                  key={stock.symbol}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-elevated border border-border hover:border-cta/50 transition-colors"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-white flex items-center justify-center overflow-hidden">
                    <Image src={stock.logo} alt={stock.name} width={24} height={24} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" unoptimized />
                  </div>
                  <span className="font-semibold text-sm">{stock.symbol}</span>
                  <span className="text-[10px] text-muted hidden sm:inline">{stock.name}</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-cta/20 text-cta font-medium">xStocks</span>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-muted">
              Tokenized securities via{" "}
              <a href="https://backed.fi" target="_blank" rel="noopener noreferrer" className="text-cta hover:underline">
                Backed.fi
              </a>
              {" "}— redeemable for underlying shares
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-5 sm:py-6 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-cta flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-cta-ink" />
            </div>
            <span className="font-semibold text-sm">Freestocks</span>
          </div>
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
