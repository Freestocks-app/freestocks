/**
 * Pyth Hermes price feeds.
 *
 * Two feed families are used, both live-verified via Hermes' (unauthenticated)
 * metadata endpoint on 2026-09-16/17:
 * - Equity.US.{SYMBOL}/USD — the underlying public-market equity price.
 *   Looked up via GET {base}/v2/price_feeds?asset_type=equity&query={SYMBOL},
 *   matching attributes.asset_type === "Equity" && attributes.display_symbol
 *   === symbol, preferring the traditional-hours feed (description ending in
 *   "/ US DOLLAR") over Pyth's separate "PYTH {SYMBOL} 24/7" product feed.
 * - Crypto.{SYMBOL}X/USD — the xStock SPL token's own on-chain-tracked price
 *   (Pyth's "Best Use of Pyth market data" bounty explicitly calls this out:
 *   builders can use the equity feed, the xStock feed, or compare both).
 *   Looked up via GET {base}/v2/price_feeds?asset_type=crypto&query={SYMBOL}X.
 *
 * @see https://docs.pyth.network/price-feeds/core/fetch-price-updates
 */

const PYTH_HERMES_BASE = "https://pyth.dourolabs.app/hermes";

const PYTH_API_KEY = process.env.PYTH_API_KEY;

/** Symbol -> Hermes equity feed ID (no 0x prefix). */
export const PYTH_EQUITY_FEED_IDS: Record<string, string> = {
  AAPL: "49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688",
  TSLA: "16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1",
  NVDA: "b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593",
  AMZN: "b5d0e0fa58a1f8b81498ae670ce93c872d14434b72c364885d4fa1b257cbb07a",
  GOOGL: "5a48c03e9b9cb337801073ed9d166817473697efff0d138874e0f6a33d6d5aa6",
  MSFT: "d0ca23c1cc005e004ccf1db5bf76aeb6a49218f43dac3d4b275e92de12ded4d1",
  META: "78a3e3b8e676a8f73c439f5d749737034b139bbbe899ba5775216fba596607fe",
  NFLX: "8376cfd7ca8bcdf372ced05307b24dced1f15b1afafdeff715664598f15a3dd2",
  SPY: "19e09bb805456ada3979a7d1cbb4b6d63babc3a0f8e8a9509f68afa5c4c11cd5",
  QQQ: "9695e2b96ea7b3859da9ed25b7a46a920a776e2fdae19a7bcfdf2b219230452d",
};

/** Symbol -> Hermes xStock (Crypto.{SYMBOL}X/USD) feed ID (no 0x prefix). */
export const PYTH_XSTOCK_FEED_IDS: Record<string, string> = {
  AAPL: "978e6cc68a119ce066aa830017318563a9ed04ec3a0a6439010fc11296a58675",
  TSLA: "47a156470288850a440df3a6ce85a55917b813a19bb5b31128a33a986566a362",
  NVDA: "4244d07890e4610f46bbde67de8f43a4bf8b569eebe904f136b469f148503b7f",
  AMZN: "7148fbe6e493ff2580305c92a8d7f8628c9943b11b9b253aebc24863fec290e8",
  GOOGL: "b911b0329028cd0283e4259c33809d62942bd2716a58084e5f31d64c00b5424e",
  MSFT: "bb723a70af731ab56b9a650eb7e8ac22b7bc07ea77f8670bd1fa9a37bf6df3f5",
  META: "bf3e5871be3f80ab7a4d1f1fd039145179fb58569e159aee1ccd472868ea5900",
  SPY: "2817b78438c769357182c04346fddaad1178c82f4048828fe0997c3c64624e14",
  NFLX: "02a67e6184e6c9dd65e14745a2a80df8b2b3d2ca91b4b191404936003d9929ae",
  QQQ: "178a6f73a5aede9d0d682e86b0047c9f333ed0efe5c6537ca937565219c4054d",
};

/** @deprecated use PYTH_EQUITY_FEED_IDS - kept for backward compatibility. */
export const PYTH_FEED_IDS = PYTH_EQUITY_FEED_IDS;

interface HermesParsedPrice {
  id: string;
  price: {
    price: string;
    expo: number;
    publish_time: number;
  };
}

interface HermesLatestPriceResponse {
  parsed?: HermesParsedPrice[];
}

export interface PythPrice {
  price: number;
  publishTime: number;
}

async function fetchPythPricesFromFeedMap(
  symbols: string[],
  feedIds: Record<string, string>
): Promise<Record<string, PythPrice>> {
  if (!PYTH_API_KEY) {
    return {};
  }

  const feedEntries = symbols
    .map((symbol) => [symbol, feedIds[symbol]] as const)
    .filter((entry): entry is [string, string] => !!entry[1]);

  if (feedEntries.length === 0) {
    return {};
  }

  const params = new URLSearchParams();
  for (const [, feedId] of feedEntries) {
    params.append("ids[]", `0x${feedId}`);
  }

  try {
    const res = await fetch(`${PYTH_HERMES_BASE}/v2/updates/price/latest?${params.toString()}`, {
      headers: { Authorization: `Bearer ${PYTH_API_KEY}` },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[pyth] Hermes request failed: ${res.status} ${body}`.slice(0, 500));
      return {};
    }

    const data: HermesLatestPriceResponse = await res.json();
    if (!data.parsed || data.parsed.length === 0) {
      console.error("[pyth] Hermes returned no parsed prices", JSON.stringify(data).slice(0, 500));
      return {};
    }

    const feedIdToSymbol = new Map(feedEntries.map(([symbol, feedId]) => [feedId, symbol]));
    const result: Record<string, PythPrice> = {};

    for (const parsed of data.parsed) {
      const symbol = feedIdToSymbol.get(parsed.id);
      if (!symbol) continue;

      const rawPrice = Number(parsed.price.price);
      const expo = parsed.price.expo;
      if (!Number.isFinite(rawPrice)) continue;

      result[symbol] = {
        price: rawPrice * 10 ** expo,
        publishTime: parsed.price.publish_time,
      };
    }

    return result;
  } catch (err) {
    console.error("[pyth] fetchPythPricesFromFeedMap threw:", err);
    return {};
  }
}

/**
 * Fetches the latest Pyth price for each requested symbol's underlying
 * public equity (Equity.US.{SYMBOL}/USD). Returns an empty map (never
 * throws) if the API key is missing, the request fails, or Hermes returns
 * no parsed prices — callers should treat this as "no Pyth data available"
 * and fall back to another source.
 */
export async function fetchPythPrices(symbols: string[]): Promise<Record<string, PythPrice>> {
  return fetchPythPricesFromFeedMap(symbols, PYTH_EQUITY_FEED_IDS);
}

/**
 * Fetches the latest Pyth price for each requested symbol's xStock SPL
 * token (Crypto.{SYMBOL}X/USD) - the on-chain-tracked price of the
 * tokenized asset itself, as distinct from fetchPythPrices()'s underlying
 * equity price. Same never-throws/empty-map-on-failure contract.
 */
export async function fetchPythXStockPrices(symbols: string[]): Promise<Record<string, PythPrice>> {
  return fetchPythPricesFromFeedMap(symbols, PYTH_XSTOCK_FEED_IDS);
}
