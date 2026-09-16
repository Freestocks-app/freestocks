/**
 * Pyth Hermes price feeds — primary price source for public equities.
 *
 * Feed IDs looked up 2026-09-16 via the (unauthenticated) Hermes metadata
 * endpoint: GET {base}/v2/price_feeds?asset_type=equity&query={SYMBOL},
 * matching attributes.asset_type === "Equity" && attributes.display_symbol
 * === symbol, preferring the traditional-hours feed (description ending in
 * "/ US DOLLAR") over Pyth's separate "PYTH {SYMBOL} 24/7" product feed.
 *
 * @see https://docs.pyth.network/price-feeds/core/fetch-price-updates
 */

const PYTH_HERMES_BASE = "https://pyth.dourolabs.app/hermes";

const PYTH_API_KEY = process.env.PYTH_API_KEY;

/** Symbol -> Hermes price feed ID (no 0x prefix). */
export const PYTH_FEED_IDS: Record<string, string> = {
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

/**
 * Fetches the latest Pyth price for each requested symbol that has a known
 * feed ID. Returns an empty map (never throws) if the API key is missing,
 * the request fails, or Hermes returns no parsed prices — callers should
 * treat this as "no Pyth data available" and fall back to another source.
 */
export async function fetchPythPrices(symbols: string[]): Promise<Record<string, PythPrice>> {
  if (!PYTH_API_KEY) {
    return {};
  }

  const feedEntries = symbols
    .map((symbol) => [symbol, PYTH_FEED_IDS[symbol]] as const)
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
      return {};
    }

    const data: HermesLatestPriceResponse = await res.json();
    if (!data.parsed || data.parsed.length === 0) {
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
  } catch {
    return {};
  }
}
