/**
 * Tokenized Stocks on Solana — Data Module
 * 
 * Three major issuer families for tokenized stocks on Solana:
 * 1. xStocks (Backed) — Backed.fi's xStocks with 'x' suffix
 * 2. Ondo Finance — Total return trackers with 'on' suffix
 * 3. Backpack Securities — 1:1 redeemable stocks
 * 
 * @see docs/TOKENIZED-STOCKS-SOLANA.md for full documentation
 */

export type Issuer = "xstocks" | "ondo" | "backpack";

export interface TokenizedStock {
  symbol: string;
  name: string;
  issuer: Issuer;
  tokenSymbol: string;
  logo?: string;
  description?: string;
}

function clearbitLogo(domain: string): string {
  return `https://logo.clearbit.com/${domain}`;
}

/**
 * xStocks (Backed.fi) — TOP 10 by CMC-style market cap
 * These are backed tokenized securities with 'x' suffix
 */
export const xStocksTop10: TokenizedStock[] = [
  { symbol: "STRC", name: "Strategy PP Variable", issuer: "xstocks", tokenSymbol: "STRCx", logo: clearbitLogo("strategy.com") },
  { symbol: "CRCL", name: "Circle", issuer: "xstocks", tokenSymbol: "CRCLx", logo: clearbitLogo("circle.com") },
  { symbol: "MSTR", name: "Strategy", issuer: "xstocks", tokenSymbol: "MSTRx", logo: clearbitLogo("microstrategy.com") },
  { symbol: "TSLA", name: "Tesla", issuer: "xstocks", tokenSymbol: "TSLAx", logo: clearbitLogo("tesla.com") },
  { symbol: "SPY", name: "S&P 500 ETF", issuer: "xstocks", tokenSymbol: "SPYx", logo: clearbitLogo("ssga.com") },
  { symbol: "SPCX", name: "SpaceX", issuer: "xstocks", tokenSymbol: "SPCXx", logo: clearbitLogo("spacex.com") },
  { symbol: "NVDA", name: "NVIDIA", issuer: "xstocks", tokenSymbol: "NVDAx", logo: clearbitLogo("nvidia.com") },
  { symbol: "QQQ", name: "Nasdaq 100 ETF", issuer: "xstocks", tokenSymbol: "QQQx", logo: clearbitLogo("invesco.com") },
  { symbol: "GOOGL", name: "Alphabet", issuer: "xstocks", tokenSymbol: "GOOGLx", logo: clearbitLogo("google.com") },
  { symbol: "MIXU", name: "Mixue", issuer: "xstocks", tokenSymbol: "MIXUx", logo: clearbitLogo("mixue.com.cn") },
];

/**
 * Ondo Finance — Featured tokenized stocks
 * Total-return trackers, typically no US person restrictions
 * Platform TVL ~$840M total (per RWA.xyz)
 */
export const ondoFeatured: TokenizedStock[] = [
  { symbol: "CRCL", name: "Circle", issuer: "ondo", tokenSymbol: "CRCLon", logo: clearbitLogo("circle.com"), description: "Total-return tracker" },
  { symbol: "IVV", name: "iShares Core S&P 500", issuer: "ondo", tokenSymbol: "IVVon", logo: clearbitLogo("ishares.com"), description: "Total-return tracker" },
  { symbol: "SPY", name: "S&P 500 ETF", issuer: "ondo", tokenSymbol: "SPYon", logo: clearbitLogo("ssga.com"), description: "Total-return tracker" },
  { symbol: "MU", name: "Micron", issuer: "ondo", tokenSymbol: "MUon", logo: clearbitLogo("micron.com"), description: "Total-return tracker" },
  { symbol: "NVDA", name: "NVIDIA", issuer: "ondo", tokenSymbol: "NVDAon", logo: clearbitLogo("nvidia.com"), description: "Total-return tracker" },
  { symbol: "QQQ", name: "Nasdaq 100 ETF", issuer: "ondo", tokenSymbol: "QQQon", logo: clearbitLogo("invesco.com"), description: "Total-return tracker" },
  { symbol: "TSLA", name: "Tesla", issuer: "ondo", tokenSymbol: "TSLAon", logo: clearbitLogo("tesla.com"), description: "Total-return tracker" },
  { symbol: "GOOGL", name: "Alphabet", issuer: "ondo", tokenSymbol: "GOOGLon", logo: clearbitLogo("google.com"), description: "Total-return tracker" },
  { symbol: "SPCX", name: "SpaceX", issuer: "ondo", tokenSymbol: "SPCXon", logo: clearbitLogo("spacex.com"), description: "Total-return tracker" },
  { symbol: "HIMS", name: "Hims & Hers", issuer: "ondo", tokenSymbol: "HIMSon", logo: clearbitLogo("hims.com"), description: "Total-return tracker" },
];

/**
 * Backpack Securities — ~41 tokenized stocks
 * 1:1 redeemable shares, emphasis on direct ownership
 * On-chain market cap often smaller; volume-led trading
 */
export const backpackFeatured: TokenizedStock[] = [
  { symbol: "SPCX", name: "SpaceX", issuer: "backpack", tokenSymbol: "SPCX", logo: clearbitLogo("spacex.com"), description: "Flagship offering" },
  { symbol: "MU", name: "Micron", issuer: "backpack", tokenSymbol: "MU", logo: clearbitLogo("micron.com") },
  { symbol: "MSTR", name: "Strategy", issuer: "backpack", tokenSymbol: "MSTR", logo: clearbitLogo("microstrategy.com") },
  { symbol: "NVDA", name: "NVIDIA", issuer: "backpack", tokenSymbol: "NVDA", logo: clearbitLogo("nvidia.com") },
  { symbol: "DNUT", name: "Krispy Kreme", issuer: "backpack", tokenSymbol: "DNUT", logo: clearbitLogo("krispykreme.com") },
  { symbol: "TSLA", name: "Tesla", issuer: "backpack", tokenSymbol: "TSLA", logo: clearbitLogo("tesla.com") },
  { symbol: "AAPL", name: "Apple", issuer: "backpack", tokenSymbol: "AAPL", logo: clearbitLogo("apple.com") },
  { symbol: "AMZN", name: "Amazon", issuer: "backpack", tokenSymbol: "AMZN", logo: clearbitLogo("amazon.com") },
  { symbol: "GOOGL", name: "Alphabet", issuer: "backpack", tokenSymbol: "GOOGL", logo: clearbitLogo("google.com") },
  { symbol: "META", name: "Meta", issuer: "backpack", tokenSymbol: "META", logo: clearbitLogo("meta.com") },
  { symbol: "MSFT", name: "Microsoft", issuer: "backpack", tokenSymbol: "MSFT", logo: clearbitLogo("microsoft.com") },
  { symbol: "BA", name: "Boeing", issuer: "backpack", tokenSymbol: "BA", logo: clearbitLogo("boeing.com"), description: "Sep 2026 expansion" },
  { symbol: "BABA", name: "Alibaba", issuer: "backpack", tokenSymbol: "BABA", logo: clearbitLogo("alibaba.com"), description: "Sep 2026 expansion" },
  { symbol: "COST", name: "Costco", issuer: "backpack", tokenSymbol: "COST", logo: clearbitLogo("costco.com"), description: "Sep 2026 expansion" },
  { symbol: "DELL", name: "Dell", issuer: "backpack", tokenSymbol: "DELL", logo: clearbitLogo("dell.com"), description: "Sep 2026 expansion" },
  { symbol: "IBM", name: "IBM", issuer: "backpack", tokenSymbol: "IBM", logo: clearbitLogo("ibm.com"), description: "Sep 2026 expansion" },
  { symbol: "JNJ", name: "Johnson & Johnson", issuer: "backpack", tokenSymbol: "JNJ", logo: clearbitLogo("jnj.com"), description: "Sep 2026 expansion" },
  { symbol: "PFE", name: "Pfizer", issuer: "backpack", tokenSymbol: "PFE", logo: clearbitLogo("pfizer.com"), description: "Sep 2026 expansion" },
  { symbol: "RDDT", name: "Reddit", issuer: "backpack", tokenSymbol: "RDDT", logo: clearbitLogo("reddit.com"), description: "Sep 2026 expansion" },
  { symbol: "RIVN", name: "Rivian", issuer: "backpack", tokenSymbol: "RIVN", logo: clearbitLogo("rivian.com"), description: "Sep 2026 expansion" },
  { symbol: "SHOP", name: "Shopify", issuer: "backpack", tokenSymbol: "SHOP", logo: clearbitLogo("shopify.com"), description: "Sep 2026 expansion" },
  { symbol: "SNAP", name: "Snap", issuer: "backpack", tokenSymbol: "SNAP", logo: clearbitLogo("snap.com"), description: "Sep 2026 expansion" },
  { symbol: "UPS", name: "UPS", issuer: "backpack", tokenSymbol: "UPS", logo: clearbitLogo("ups.com"), description: "Sep 2026 expansion" },
  { symbol: "HIMS", name: "Hims & Hers", issuer: "backpack", tokenSymbol: "HIMS", logo: clearbitLogo("hims.com"), description: "Sep 2026 expansion" },
];

/**
 * Display stocks for Cashout UI — curated list with popular companies
 * Used for stock picker in Cashout flow
 */
export const cashoutStocks: TokenizedStock[] = [
  { symbol: "TSLA", name: "Tesla", issuer: "xstocks", tokenSymbol: "TSLAx", logo: clearbitLogo("tesla.com") },
  { symbol: "NVDA", name: "NVIDIA", issuer: "xstocks", tokenSymbol: "NVDAx", logo: clearbitLogo("nvidia.com") },
  { symbol: "AAPL", name: "Apple", issuer: "xstocks", tokenSymbol: "AAPLx", logo: clearbitLogo("apple.com") },
  { symbol: "GOOGL", name: "Alphabet", issuer: "xstocks", tokenSymbol: "GOOGLx", logo: clearbitLogo("google.com") },
  { symbol: "AMZN", name: "Amazon", issuer: "xstocks", tokenSymbol: "AMZNx", logo: clearbitLogo("amazon.com") },
  { symbol: "MSFT", name: "Microsoft", issuer: "xstocks", tokenSymbol: "MSFTx", logo: clearbitLogo("microsoft.com") },
  { symbol: "META", name: "Meta", issuer: "xstocks", tokenSymbol: "METAx", logo: clearbitLogo("meta.com") },
  { symbol: "SPCX", name: "SpaceX", issuer: "xstocks", tokenSymbol: "SPCXx", logo: clearbitLogo("spacex.com") },
];

/**
 * Display stocks for LP ticker — subset for visual display
 */
export const displayTop10: TokenizedStock[] = [
  { symbol: "TSLA", name: "Tesla", issuer: "xstocks", tokenSymbol: "TSLAx", logo: clearbitLogo("tesla.com") },
  { symbol: "NVDA", name: "NVIDIA", issuer: "xstocks", tokenSymbol: "NVDAx", logo: clearbitLogo("nvidia.com") },
  { symbol: "SPCX", name: "SpaceX", issuer: "xstocks", tokenSymbol: "SPCXx", logo: clearbitLogo("spacex.com") },
  { symbol: "GOOGL", name: "Alphabet", issuer: "xstocks", tokenSymbol: "GOOGLx", logo: clearbitLogo("google.com") },
  { symbol: "AAPL", name: "Apple", issuer: "xstocks", tokenSymbol: "AAPLx", logo: clearbitLogo("apple.com") },
  { symbol: "MSFT", name: "Microsoft", issuer: "xstocks", tokenSymbol: "MSFTx", logo: clearbitLogo("microsoft.com") },
  { symbol: "AMZN", name: "Amazon", issuer: "xstocks", tokenSymbol: "AMZNx", logo: clearbitLogo("amazon.com") },
  { symbol: "META", name: "Meta", issuer: "xstocks", tokenSymbol: "METAx", logo: clearbitLogo("meta.com") },
];

/**
 * Get issuer display name and badge color
 */
export function getIssuerBadge(issuer: Issuer): { name: string; color: string } {
  switch (issuer) {
    case "xstocks":
      return { name: "xStocks", color: "bg-cta/20 text-cta" };
    case "ondo":
      return { name: "Ondo", color: "bg-gain/20 text-gain" };
    case "backpack":
      return { name: "Backpack", color: "bg-blue-500/20 text-blue-400" };
  }
}

/**
 * Ticker data for LP scroll animation
 */
export const tickerData = displayTop10.map((stock, i) => ({
  symbol: stock.tokenSymbol,
  displaySymbol: stock.symbol,
  name: stock.name,
  change: `+${(2 + (i * 0.7) % 4).toFixed(2)}%`,
  issuer: stock.issuer,
  logo: stock.logo,
}));
