import crypto from "crypto";

export interface AyetCallbackParams {
  transactionId: string | null;
  payoutUsd: string | null;
  externalIdentifier: string | null;
  currencyAmount: string | null;
  isChargeback: boolean;
}

export function parseAyetCallbackParams(url: URL): AyetCallbackParams {
  const searchParams = url.searchParams;

  const transactionId = searchParams.get("transaction_id");
  const payoutUsd = searchParams.get("payout_usd");
  const externalIdentifier = searchParams.get("external_identifier");
  const currencyAmount = searchParams.get("currency_amount");
  const isChargebackParam = searchParams.get("is_chargeback");
  
  const isChargeback = 
    isChargebackParam === "1" || 
    (transactionId?.startsWith("r-") ?? false);

  return {
    transactionId,
    payoutUsd,
    externalIdentifier,
    currencyAmount,
    isChargeback,
  };
}

export function buildSortedQueryString(url: URL): string {
  const params = Array.from(url.searchParams.entries());
  
  params.sort((a, b) => a[0].localeCompare(b[0]));
  
  const encoded = params.map(([key, value]) => {
    return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  });
  
  return encoded.join("&");
}

export function computeAyetHmac(queryString: string, apiKey: string): string {
  const hmac = crypto.createHmac("sha256", apiKey);
  hmac.update(queryString);
  return hmac.digest("hex");
}

export interface VerifyAyetResult {
  valid: boolean;
  queryString?: string;
  computedHash?: string;
  providedHash?: string;
  error?: string;
}

export function verifyAyetCallback(
  url: URL,
  providedHash: string | null,
  apiKey: string
): VerifyAyetResult {
  if (!providedHash) {
    return { valid: false, error: "no_hash_header" };
  }

  const queryString = buildSortedQueryString(url);
  const computedHash = computeAyetHmac(queryString, apiKey);

  if (computedHash.toLowerCase() === providedHash.toLowerCase()) {
    return {
      valid: true,
      queryString,
      computedHash,
      providedHash,
    };
  }

  return {
    valid: false,
    queryString,
    computedHash,
    providedHash,
    error: "hash_mismatch",
  };
}

export function computeHmacForTesting(queryString: string, apiKey: string): string {
  return computeAyetHmac(queryString, apiKey);
}
