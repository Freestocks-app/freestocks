import crypto from "crypto";

export function verifyBitlabsHmac(
  urlWithoutHash: string,
  providedHash: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha1", secret);
  hmac.update(urlWithoutHash);
  const computedHash = hmac.digest("hex");

  return computedHash.toLowerCase() === providedHash.toLowerCase();
}

export function extractHashFromUrl(fullUrl: string): {
  urlWithoutHash: string;
  hash: string | null;
} {
  const splitIndex = fullUrl.lastIndexOf("&hash=");
  if (splitIndex === -1) {
    return { urlWithoutHash: fullUrl, hash: null };
  }

  const urlWithoutHash = fullUrl.slice(0, splitIndex);
  const hashPart = fullUrl.slice(splitIndex + 6);
  const hash = hashPart.match(/^([a-fA-F0-9]+)/)?.[1] || null;

  return { urlWithoutHash, hash };
}

export interface CallbackParams {
  userId: string | null;
  valueCurrency: string | null;
  valueUsd: string | null;
  txId: string | null;
}

export function parseCallbackParams(url: URL): CallbackParams {
  const searchParams = url.searchParams;

  const userId = searchParams.get("uid") || searchParams.get("USER:UID");
  const valueCurrency =
    searchParams.get("val") || searchParams.get("VALUE:CURRENCY");
  const valueUsd = searchParams.get("VALUE:USD");
  const txId = searchParams.get("tx") || searchParams.get("TX");

  return {
    userId,
    valueCurrency,
    valueUsd,
    txId,
  };
}

export interface VerifyResult {
  valid: boolean;
  urlUsed?: string;
  computedHash?: string;
  providedHash?: string;
  error?: string;
}

export function verifyBitlabsCallback(
  fullUrl: string,
  secret: string
): VerifyResult {
  const { urlWithoutHash, hash } = extractHashFromUrl(fullUrl);

  if (!hash) {
    return { valid: false, error: "no_hash_parameter" };
  }

  const hmac1 = crypto.createHmac("sha1", secret);
  hmac1.update(urlWithoutHash);
  const computedHash = hmac1.digest("hex");

  if (computedHash.toLowerCase() === hash.toLowerCase()) {
    return {
      valid: true,
      urlUsed: urlWithoutHash,
      computedHash,
      providedHash: hash,
    };
  }

  const urlEncoded = encodeUrlForBitlabs(urlWithoutHash);
  if (urlEncoded !== urlWithoutHash) {
    const hmac2 = crypto.createHmac("sha1", secret);
    hmac2.update(urlEncoded);
    const computedHashEncoded = hmac2.digest("hex");

    if (computedHashEncoded.toLowerCase() === hash.toLowerCase()) {
      return {
        valid: true,
        urlUsed: urlEncoded,
        computedHash: computedHashEncoded,
        providedHash: hash,
      };
    }
  }

  const urlDecoded = decodeUrlForBitlabs(urlWithoutHash);
  if (urlDecoded !== urlWithoutHash) {
    const hmac3 = crypto.createHmac("sha1", secret);
    hmac3.update(urlDecoded);
    const computedHashDecoded = hmac3.digest("hex");

    if (computedHashDecoded.toLowerCase() === hash.toLowerCase()) {
      return {
        valid: true,
        urlUsed: urlDecoded,
        computedHash: computedHashDecoded,
        providedHash: hash,
      };
    }
  }

  return {
    valid: false,
    urlUsed: urlWithoutHash,
    computedHash,
    providedHash: hash,
    error: "hash_mismatch",
  };
}

function encodeUrlForBitlabs(url: string): string {
  return url.replace(/VALUE:USD/g, "VALUE%3AUSD")
    .replace(/VALUE:CURRENCY/g, "VALUE%3ACURRENCY")
    .replace(/USER:UID/g, "USER%3AUID");
}

function decodeUrlForBitlabs(url: string): string {
  return url.replace(/VALUE%3AUSD/gi, "VALUE:USD")
    .replace(/VALUE%3ACURRENCY/gi, "VALUE:CURRENCY")
    .replace(/USER%3AUID/gi, "USER:UID");
}

export function computeHmacForTesting(urlWithoutHash: string, secret: string): string {
  const hmac = crypto.createHmac("sha1", secret);
  hmac.update(urlWithoutHash);
  return hmac.digest("hex");
}
