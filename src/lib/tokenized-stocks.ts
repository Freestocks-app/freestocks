/**
 * Tokenized Stocks on Solana — Data Module
 *
 * Display set: Popular household-name equities that have xStock mints
 * (issuer: "xstocks"), plus a featured set of tokenized pre-IPO SPVs
 * (issuer: "prestocks"). Single source of truth for LP ticker, floating
 * icons, Cashout list.
 *
 * xStocks: 10 stocks verified to have Solana xStock mints via Backed.fi API.
 * @see https://api.backed.fi/api/v2/public/assets
 *
 * PreStocks: mints + prices sourced live from prestocks.com.
 * @see https://prestocks.com/api/prestocks
 */

export type Issuer = "xstocks" | "prestocks";

export interface TokenizedStock {
  symbol: string;
  name: string;
  issuer: Issuer;
  tokenSymbol: string;
  mint: string;
  logo: string;
  badge?: string;
}

function xstockLogo(tokenSymbol: string): string {
  return `https://xstocks-metadata.backed.fi/logos/tokens/${tokenSymbol}.png`;
}

function glassBadge(symbol: string): string {
  return `/assets/badges/${symbol}.png`;
}

/**
 * LOCKED TOP 10 — Popular equities with confirmed xStock Solana mints
 * Used for: LP ticker, floating icons, "stocks you can unlock" chips, Cashout list
 * 
 * Mint addresses verified 2026-09-14 via Backed.fi API
 * Logos from official Backed.fi xStocks metadata CDN
 * 
 * Custom glass badges (3D style) available for: AAPL, TSLA, NFLX, SPY
 * Place badge PNGs at public/assets/badges/{SYMBOL}.png
 */
export const TOP10: TokenizedStock[] = [
  { symbol: "AAPL", name: "Apple", issuer: "xstocks", tokenSymbol: "AAPLx", mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp", logo: xstockLogo("AAPLx"), badge: glassBadge("AAPL") },
  { symbol: "TSLA", name: "Tesla", issuer: "xstocks", tokenSymbol: "TSLAx", mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB", logo: xstockLogo("TSLAx"), badge: glassBadge("TSLA") },
  { symbol: "NVDA", name: "NVIDIA", issuer: "xstocks", tokenSymbol: "NVDAx", mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh", logo: xstockLogo("NVDAx"), badge: glassBadge("NVDA") },
  { symbol: "AMZN", name: "Amazon", issuer: "xstocks", tokenSymbol: "AMZNx", mint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg", logo: xstockLogo("AMZNx"), badge: glassBadge("AMZN") },
  { symbol: "GOOGL", name: "Alphabet", issuer: "xstocks", tokenSymbol: "GOOGLx", mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN", logo: xstockLogo("GOOGLx"), badge: glassBadge("GOOGL") },
  { symbol: "MSFT", name: "Microsoft", issuer: "xstocks", tokenSymbol: "MSFTx", mint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX", logo: xstockLogo("MSFTx"), badge: glassBadge("MSFT") },
  { symbol: "META", name: "Meta", issuer: "xstocks", tokenSymbol: "METAx", mint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu", logo: xstockLogo("METAx") },
  { symbol: "SPY", name: "S&P 500 ETF", issuer: "xstocks", tokenSymbol: "SPYx", mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W", logo: xstockLogo("SPYx"), badge: glassBadge("SPY") },
  { symbol: "NFLX", name: "Netflix", issuer: "xstocks", tokenSymbol: "NFLXx", mint: "XsEH7wWfJJu2ZT3UCFeVfALnVA6CP5ur7Ee11KmzVpL", logo: xstockLogo("NFLXx"), badge: glassBadge("NFLX") },
  { symbol: "QQQ", name: "Nasdaq 100 ETF", issuer: "xstocks", tokenSymbol: "QQQx", mint: "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ", logo: xstockLogo("QQQx") },
];

/**
 * PreStocks — tokenized pre-IPO SPV exposure (OpenAI, Anthropic, ...)
 * Used for: Cashout "Pre-IPO" section, light LP mention.
 *
 * Mints + prices verified live 2026-09-16 via https://prestocks.com/api/prestocks
 * Logos hotlinked from prestocks.com (confirmed CORS-open, Access-Control-Allow-Origin: *)
 *
 * Custom glass badges (3D style) available for: ANTHROPIC, OPENAI
 */
export const preStocksFeatured: TokenizedStock[] = [
  { symbol: "OPENAI", name: "OpenAI", issuer: "prestocks", tokenSymbol: "OPENAI", mint: "PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF", logo: "https://www.prestocks.com/logos/openai.png", badge: glassBadge("OPENAI") },
  { symbol: "ANTHROPIC", name: "Anthropic", issuer: "prestocks", tokenSymbol: "ANTHROPIC", mint: "Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw", logo: "https://www.prestocks.com/logos/anthropic.png", badge: glassBadge("ANTHROPIC") },
  { symbol: "ANDURIL", name: "Anduril", issuer: "prestocks", tokenSymbol: "ANDURIL", mint: "PresTj4Yc2bAR197Er7wz4UUKSfqt6FryBEdAriBoQB", logo: "https://www.prestocks.com/logos/anduril.png" },
  { symbol: "NEURALINK", name: "Neuralink", issuer: "prestocks", tokenSymbol: "NEURALINK", mint: "PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S", logo: "https://www.prestocks.com/logos/neuralink.png" },
  { symbol: "FIGUREAI", name: "Figure AI", issuer: "prestocks", tokenSymbol: "FIGUREAI", mint: "PreZad18qfPtbxNpMtMuAuX2zVpvkEU8DnJx56faCWd", logo: "https://www.prestocks.com/logos/figureai.png" },
];

/** Alias exports for backward compatibility */
export const cashoutStocks = TOP10;
export const displayTop10 = TOP10;

/** All cashout-eligible stocks across every issuer family */
export const allCashoutStocks: TokenizedStock[] = [...TOP10, ...preStocksFeatured];

/** Stock symbols for price API (xStocks only — Pyth/DexScreener don't price PreStocks) */
export const priceSymbols = TOP10.map(s => s.symbol);

/** Stock symbols valid for redemption across every issuer family */
export const allPriceSymbols = allCashoutStocks.map(s => s.symbol);

/** Get issuer display name and badge color */
export function getIssuerBadge(issuer: Issuer): { name: string; color: string } {
  if (issuer === "prestocks") {
    return { name: "Pre-IPO", color: "bg-purple-500/20 text-purple-300" };
  }
  return { name: "xStocks", color: "bg-cta/20 text-cta" };
}

/** Price data type from API */
export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

/** Ticker data for LP scroll animation */
export interface TickerItem {
  symbol: string;
  tokenSymbol: string;
  name: string;
  change: string;
  logo: string;
  price?: number;
}

export function getTickerData(prices?: Record<string, StockPrice>): TickerItem[] {
  return TOP10.map((stock) => {
    const priceData = prices?.[stock.symbol];
    const changePercent = priceData?.changePercent;
    const changeStr = changePercent !== undefined
      ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`
      : '—';
    
    return {
      symbol: stock.symbol,
      tokenSymbol: stock.tokenSymbol,
      name: stock.name,
      change: changeStr,
      logo: stock.logo,
      price: priceData?.price,
    };
  });
}

export const tickerData = getTickerData();
