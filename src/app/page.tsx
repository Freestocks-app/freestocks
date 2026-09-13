import Link from "next/link";
import { ArrowRight, TrendingUp, DollarSign, Gift, Shield, Zap, Clock, CheckCircle, Star, Gamepad2, FileText, Flame } from "lucide-react";

const tickers = [
  { symbol: "AAPL", change: "+2.34%" },
  { symbol: "TSLA", change: "+5.12%" },
  { symbol: "NVDA", change: "+3.87%" },
  { symbol: "AMZN", change: "+1.56%" },
  { symbol: "MSFT", change: "+2.01%" },
  { symbol: "GOOGL", change: "+1.89%" },
  { symbol: "META", change: "+4.23%" },
  { symbol: "AMD", change: "+3.45%" },
];

function TickerCube({
  symbol,
  change,
  delay,
}: {
  symbol: string;
  change: string;
  delay: number;
}) {
  return (
    <div
      className="ticker-cube float mx-1.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-foreground mr-1.5">{symbol}</span>
      <span className="gain">{change}</span>
    </div>
  );
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}

function TeslaLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 5.362l2.475 3.026s.385-.264.711-.596c.201-.204.376-.478.376-.478l-3.562-4.18-3.562 4.18s.175.274.376.478c.326.332.711.596.711.596L12 5.362zm0-2.343l4.965 5.826c.058.044.104.091.146.134a7.03 7.03 0 01.472.557c.13.167.252.346.36.538L12 22.98l-5.943-13.006c.108-.192.23-.371.36-.538a7.03 7.03 0 01.472-.557c.042-.043.088-.09.146-.134L12 3.019z"/>
    </svg>
  );
}

function NvidiaLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.948 8.798v-1.43a6.7 6.7 0 01.424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851a6.15 6.15 0 01-1.167-.127V9.332c1.47.114 1.832.926 2.758 2.108l2.065-1.746s-1.688-1.9-3.884-1.9c-.35 0-.627.006-.939.003zM8.948 6.27v1.14c-.307.035-.607.094-.912.181l-.136-.376C7.882 6.188 8.058 6.22 8.948 6.27zm0 8.963v1.186c-2.994-.6-4.448-3.23-4.448-3.23s1.96-2.165 4.448-2.475v1.242c-.034.003-.074.003-.109.003-1.544 0-2.67 1.303-2.67 1.303s.747 1.49 2.456 1.96c.11.029.218.044.323.011zm0-10.9v1.147l-.087.024c-3.77.75-6.29 3.816-6.29 3.816s3.063 4.372 6.29 4.393v1.19c-3.921-.008-7.356-4.08-7.356-4.08-.002-.002 3.165-5.44 7.443-6.49z"/>
    </svg>
  );
}

function AmazonLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.958 10.09c0 1.232.029 2.256-.591 3.351-.502.891-1.301 1.438-2.186 1.438-1.214 0-1.922-.924-1.922-2.292 0-2.692 2.415-3.182 4.7-3.182v.685zm3.186 7.705a.66.66 0 01-.753.076c-1.057-.878-1.247-1.285-1.828-2.122-1.748 1.782-2.986 2.315-5.249 2.315-2.681 0-4.764-1.654-4.764-4.963 0-2.585 1.401-4.344 3.394-5.203 1.728-.754 4.143-.89 5.985-1.098v-.409c0-.752.057-1.641-.383-2.29-.385-.578-1.124-.816-1.776-.816-1.205 0-2.277.618-2.54 1.9-.054.284-.261.564-.549.578l-3.067-.331c-.259-.056-.547-.266-.472-.66C6.057 1.926 8.893.873 11.459.873c1.32 0 3.043.351 4.082 1.35 1.32 1.229 1.193 2.868 1.193 4.652v4.215c0 1.267.526 1.822 1.02 2.508.173.25.212.549-.009.735-.554.46-1.542 1.318-2.085 1.798l-.516-.336zM21.6 18.134c-1.721 1.28-4.212 1.956-6.36 1.956-3.01 0-5.72-1.113-7.772-2.965-.16-.145-.017-.343.176-.23 2.215 1.288 4.953 2.065 7.778 2.065 1.908 0 4.006-.396 5.937-1.216.291-.125.535.191.241.39zm.688-.773c-.219-.281-1.448-.133-2-.067-.167.02-.193-.126-.042-.232 .979-.689 2.586-.49 2.773-.259.19.234-.05 1.854-.968 2.627-.141.118-.276.055-.213-.101.207-.514.67-1.688.45-1.968z"/>
    </svg>
  );
}

function CostcoLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
      <text x="12" y="16" textAnchor="middle" fontSize="6" fontWeight="bold" fill="currentColor">C</text>
    </svg>
  );
}

function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 2h9.5v9.5H2V2zm10.5 0H22v9.5h-9.5V2zM2 12.5h9.5V22H2v-9.5zm10.5 0H22V22h-9.5v-9.5z"/>
    </svg>
  );
}

function MetaLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a4.07 4.07 0 001.216 2.014c.528.527 1.2.882 1.986 1.037.106.02.214.039.323.047h.004c.108.01.222.015.338.015a4.26 4.26 0 002.347-.7c.832-.52 1.554-1.262 2.153-2.169.328-.498.623-1.04.884-1.617.263.58.561 1.125.896 1.626.6.903 1.324 1.64 2.156 2.16.724.453 1.523.7 2.348.7h.039c.111 0 .222-.005.333-.016.11-.009.219-.03.326-.049a4.28 4.28 0 001.985-1.037 4.07 4.07 0 001.216-2.014c.14-.604.21-1.267.21-1.973 0-2.566-.704-5.241-2.044-7.306-1.188-1.833-2.903-3.113-4.871-3.113-.847 0-1.657.253-2.393.727a6.25 6.25 0 00-.949.718 6.25 6.25 0 00-.949-.718A4.78 4.78 0 006.915 4.03zm0 2.183c.454 0 .916.152 1.375.469.363.25.695.568.995.942-1.243 1.818-2.195 4.2-2.195 6.924 0 .138.003.274.01.407a2.8 2.8 0 01-1.378.365c-.15 0-.296-.011-.438-.031a2.12 2.12 0 01-.955-.483 2.05 2.05 0 01-.596-1.013 5.77 5.77 0 01-.117-1.344c0-2.137.566-4.424 1.652-6.112.716-1.112 1.564-1.848 2.394-2.062.09-.023.176-.04.253-.062zM12 10.714c.35 0 .686.148 1.009.441.325.293.616.69.869 1.166.253.476.456 1.02.61 1.616.155.596.234 1.206.234 1.798 0 .59-.079 1.14-.234 1.635-.155.496-.358.9-.61 1.217-.253.316-.544.547-.87.69-.323.145-.66.218-1.008.218-.35 0-.686-.073-1.009-.217a2.54 2.54 0 01-.87-.69c-.252-.317-.455-.721-.61-1.217-.155-.496-.233-1.045-.233-1.635 0-.592.078-1.202.234-1.798.154-.596.357-1.14.609-1.616.253-.477.544-.873.87-1.166.323-.293.66-.442 1.009-.442zm5.085-4.501c.83.214 1.678.95 2.394 2.062 1.086 1.688 1.652 3.975 1.652 6.112 0 .468-.042.929-.117 1.344a2.05 2.05 0 01-.596 1.013 2.12 2.12 0 01-.955.483c-.142.02-.288.031-.438.031a2.8 2.8 0 01-1.378-.365c.007-.133.01-.269.01-.407 0-2.724-.952-5.106-2.195-6.924.3-.374.632-.692.995-.942.459-.317.92-.469 1.375-.469.077.022.163.039.253.062z"/>
    </svg>
  );
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function StockTile({
  logo: Logo,
  symbol,
  variant = "dark",
  style,
  className = "",
}: {
  logo: React.ComponentType<{ className?: string }>;
  symbol: string;
  variant?: "dark" | "lime" | "gain";
  style?: React.CSSProperties;
  className?: string;
}) {
  const variantClasses = {
    dark: "spark-cube",
    lime: "spark-cube lime",
    gain: "spark-cube gain",
  };

  return (
    <div className={`${variantClasses[variant]} ${className}`} style={style} title={symbol}>
      <Logo className="w-6 h-6 md:w-7 md:h-7" />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 md:px-6 bg-bg/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cta flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-cta-ink" />
          </div>
          <span className="font-bold">Freestocks</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="text-sm text-muted hover:text-foreground transition-colors px-3 py-1.5"
          >
            Sign In
          </Link>
          <Link href="/sign-up" className="btn-primary text-sm py-2 px-4">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="flex-1 pt-14">
        <section className="relative overflow-hidden py-12 md:py-20 min-h-[70vh] flex items-center">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-cta/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gain/10 rounded-full blur-3xl" />
          </div>

          {/* Glossy floating brand logo tiles */}
          <div className="spark-field">
            <StockTile logo={AppleLogo} symbol="AAPL" variant="lime" style={{ top: '15%', left: '8%' }} />
            <StockTile logo={TeslaLogo} symbol="TSLA" style={{ top: '25%', right: '10%' }} />
            <StockTile logo={NvidiaLogo} symbol="NVDA" variant="gain" style={{ top: '60%', left: '5%' }} />
            <StockTile logo={AmazonLogo} symbol="AMZN" style={{ top: '70%', right: '8%' }} />
            <StockTile logo={MicrosoftLogo} symbol="MSFT" variant="lime" style={{ top: '45%', left: '12%' }} />
            <StockTile logo={GoogleLogo} symbol="GOOGL" style={{ top: '35%', right: '15%' }} />
            <StockTile logo={MetaLogo} symbol="META" variant="gain" style={{ top: '20%', left: '20%' }} className="hidden md:flex" />
            <StockTile logo={NvidiaLogo} symbol="NVDA" style={{ top: '55%', right: '18%' }} className="hidden md:flex" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 md:px-6 text-center z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-elevated border border-border mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-gain animate-pulse" />
              <span className="text-xs text-muted">Earn stocks from offers — no deposit needed</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              The easiest way to{" "}
              <span className="text-cta">earn stocks</span>
            </h1>

            <p className="text-base md:text-lg text-muted max-w-xl mx-auto mb-8">
              Complete offers, play games, take surveys. Earn real cash and unlock fractional shares of top companies.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Link
                href="/sign-up"
                className="btn-primary text-base px-6 py-3 w-full sm:w-auto pulse-glow"
              >
                Start Earning Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/sign-in" className="btn-secondary text-base px-6 py-3 w-full sm:w-auto">
                I have an account
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-cta" />
                <span>USD balance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-gain" />
                <span>Instant credits</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Secure ledger</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-3 border-y border-border bg-elevated/50">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-bg/50 border border-border">
                <div className="w-8 h-8 rounded-md bg-cta/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-cta" />
                </div>
                <div>
                  <p className="text-xs font-semibold">USD Ledger</p>
                  <p className="text-[10px] text-muted">No points, just $</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-bg/50 border border-border">
                <div className="w-8 h-8 rounded-md bg-gain/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-gain" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Instant Credits</p>
                  <p className="text-[10px] text-muted">Credited in minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-bg/50 border border-border">
                <div className="w-8 h-8 rounded-md bg-cta/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-cta" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Verified Offers</p>
                  <p className="text-[10px] text-muted">From top brands</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-bg/50 border border-border">
                <div className="w-8 h-8 rounded-md bg-gain/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-gain" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Stock Unlock</p>
                  <p className="text-[10px] text-muted">To Solana wallet</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-4 border-b border-border overflow-hidden bg-elevated/30">
          <div className="relative">
            <div className="flex ticker-scroll whitespace-nowrap">
              {[...tickers, ...tickers].map((ticker, i) => (
                <TickerCube
                  key={`${ticker.symbol}-${i}`}
                  symbol={ticker.symbol}
                  change={ticker.change}
                  delay={i * 200}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                Three steps to your first stock
              </h2>
              <p className="text-muted">Simpler than you think</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="card p-5 text-center">
                <div className="w-12 h-12 rounded-xl bg-cta/10 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-6 h-6 text-cta" />
                </div>
                <h3 className="font-semibold mb-2">1. Complete Offers</h3>
                <p className="text-sm text-muted">
                  Download apps, play games, or take surveys. Each earns you cash.
                </p>
              </div>

              <div className="card p-5 text-center">
                <div className="w-12 h-12 rounded-xl bg-gain/10 flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-6 h-6 text-gain" />
                </div>
                <h3 className="font-semibold mb-2">2. Build Balance</h3>
                <p className="text-sm text-muted">
                  Watch earnings grow. Track every dollar in your dashboard.
                </p>
              </div>

              <div className="card p-5 text-center">
                <div className="w-12 h-12 rounded-xl bg-cta/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-cta" />
                </div>
                <h3 className="font-semibold mb-2">3. Unlock Stocks</h3>
                <p className="text-sm text-muted">
                  Redeem balance for fractional shares of top companies.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-elevated/30 border-y border-border">
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                Popular offers right now
              </h2>
              <p className="text-muted">Real examples — sign up to see all available</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              {[
                { icon: Gamepad2, title: "Royal Match", meta: "Reach Level 200", reward: 4.50, chip: "Hot", hasBonus: true, bonusText: "2x Weekend" },
                { icon: FileText, title: "Opinion Survey", meta: "5 min • Instant pay", reward: 0.85, chip: "New", hasBonus: false, bonusText: "" },
                { icon: Gift, title: "Cashback App", meta: "First purchase", reward: 2.25, chip: null, hasBonus: true, bonusText: "+50% Limited" },
                { icon: Gamepad2, title: "Coin Master", meta: "Village 10", reward: 3.75, chip: null, hasBonus: false, bonusText: "" },
              ].map((offer, i) => (
                <div key={i} className="card overflow-hidden">
                  {offer.hasBonus && (
                    <div className="h-1 bg-bonus" />
                  )}
                  <div className="p-3">
                    <div className="flex items-start gap-2.5 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-bg border border-border flex items-center justify-center flex-shrink-0">
                        <offer.icon className="w-4 h-4 text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="font-semibold text-sm truncate">{offer.title}</p>
                          {offer.chip && (
                            <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${offer.chip === 'Hot' ? 'bg-gain/20 text-gain' : 'bg-cta/20 text-cta'}`}>
                              {offer.chip}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted truncate">{offer.meta}</p>
                      </div>
                    </div>
                    {offer.hasBonus && (
                      <div className="flex items-center gap-1 mb-2 px-1.5 py-0.5 rounded bg-bonus/10 border border-bonus/20">
                        <Flame className="w-2.5 h-2.5 text-bonus" />
                        <span className="text-[9px] text-bonus font-medium">{offer.bonusText}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[8px] text-muted uppercase">Up to</p>
                        <p className="text-base font-bold text-cta tabular-nums">${offer.reward.toFixed(2)}</p>
                      </div>
                      <div className="w-7 h-7 rounded-md bg-cta flex items-center justify-center">
                        <ArrowRight className="w-3.5 h-3.5 text-cta-ink" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link href="/sign-up" className="btn-primary text-base px-8 py-3">
                Start Earning Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-xs text-muted mt-3">No deposits required</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-cta flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-cta-ink" />
            </div>
            <span className="font-semibold text-sm">Freestocks</span>
          </div>
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Freestocks. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
