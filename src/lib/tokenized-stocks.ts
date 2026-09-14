/**
 * Tokenized Stocks on Solana — Data Module
 * 
 * Display set: Popular household-name equities that have xStock mints.
 * Single source of truth for LP ticker, floating icons, Cashout list.
 * 
 * All 10 stocks verified to have Solana xStock mints via Backed.fi API.
 * @see https://api.backed.fi/api/v2/public/assets
 */

export type Issuer = "xstocks";

export interface TokenizedStock {
  symbol: string;
  name: string;
  issuer: Issuer;
  tokenSymbol: string;
  mint: string;
  logo: string;
}

function xstockLogo(tokenSymbol: string): string {
  return `https://xstocks-metadata.backed.fi/logos/tokens/${tokenSymbol}.png`;
}

/**
 * LOCKED TOP 10 — Popular equities with confirmed xStock Solana mints
 * Used for: LP ticker, floating icons, "stocks you can unlock" chips, Cashout list
 * 
 * Mint addresses verified 2026-09-14 via Backed.fi API
 * Logos from official Backed.fi xStocks metadata CDN
 */
export const TOP10: TokenizedStock[] = [
  { symbol: "AAPL", name: "Apple", issuer: "xstocks", tokenSymbol: "AAPLx", mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp", logo: xstockLogo("AAPLx") },
  { symbol: "TSLA", name: "Tesla", issuer: "xstocks", tokenSymbol: "TSLAx", mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB", logo: xstockLogo("TSLAx") },
  { symbol: "NVDA", name: "NVIDIA", issuer: "xstocks", tokenSymbol: "NVDAx", mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh", logo: xstockLogo("NVDAx") },
  { symbol: "AMZN", name: "Amazon", issuer: "xstocks", tokenSymbol: "AMZNx", mint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg", logo: xstockLogo("AMZNx") },
  { symbol: "GOOGL", name: "Alphabet", issuer: "xstocks", tokenSymbol: "GOOGLx", mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN", logo: xstockLogo("GOOGLx") },
  { symbol: "MSFT", name: "Microsoft", issuer: "xstocks", tokenSymbol: "MSFTx", mint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX", logo: xstockLogo("MSFTx") },
  { symbol: "META", name: "Meta", issuer: "xstocks", tokenSymbol: "METAx", mint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu", logo: xstockLogo("METAx") },
  { symbol: "SPY", name: "S&P 500 ETF", issuer: "xstocks", tokenSymbol: "SPYx", mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W", logo: xstockLogo("SPYx") },
  { symbol: "NFLX", name: "Netflix", issuer: "xstocks", tokenSymbol: "NFLXx", mint: "XsEH7wWfJJu2ZT3UCFeVfALnVA6CP5ur7Ee11KmzVpL", logo: xstockLogo("NFLXx") },
  { symbol: "QQQ", name: "Nasdaq 100 ETF", issuer: "xstocks", tokenSymbol: "QQQx", mint: "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ", logo: xstockLogo("QQQx") },
];

/** Alias exports for backward compatibility */
export const cashoutStocks = TOP10;
export const displayTop10 = TOP10;

/** Stock symbols for price API */
export const priceSymbols = TOP10.map(s => s.symbol);

/** Get issuer display name and badge color */
export function getIssuerBadge(): { name: string; color: string } {
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
