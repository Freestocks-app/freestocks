import crypto from "crypto";

export interface CpxCallbackParams {
  userId: string | null;
  transactionId: string | null;
  status: string | null;
  amountLocal: string | null;
  amountUsd: string | null;
  subId1: string | null;
  subId2: string | null;
  secureHash: string | null;
}

/**
 * CPX Research reward status codes: 1 = completed (reward), 2 = canceled
 * (chargeback/reversal). Any other value is treated as unknown/invalid.
 */
export function parseCpxCallbackParams(url: URL): CpxCallbackParams {
  const searchParams = url.searchParams;

  return {
    userId: searchParams.get("user_id"),
    transactionId: searchParams.get("trans_id"),
    status: searchParams.get("status"),
    amountLocal: searchParams.get("amount_local"),
    amountUsd: searchParams.get("amount_usd"),
    subId1: searchParams.get("sub_id"),
    subId2: searchParams.get("sub_id_2"),
    // CPX's postback query param is named "hash" (per their Postback
    // Settings example: &hash={secure_hash}), not "secure_hash" — that
    // name is reserved for the *outgoing* Script Tag config field.
    secureHash: searchParams.get("hash"),
  };
}

function timingSafeHexEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a.toLowerCase(), "hex");
  const bufB = Buffer.from(b.toLowerCase(), "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * CPX Research postback secure_hash = MD5(trans_id + "-" + secret).
 * (Distinct from the Script Tag's own general_config.secure_hash, which is
 * MD5(user_id + "-" + secret) and signs the *outgoing* widget request —
 * unrelated to verifying this *incoming* postback.)
 */
export function computeCpxSecureHash(transactionId: string, secret: string): string {
  return crypto.createHash("md5").update(`${transactionId}-${secret}`).digest("hex");
}

export interface VerifyCpxResult {
  valid: boolean;
  computedHash?: string;
  providedHash?: string;
  error?: string;
}

export function verifyCpxCallback(
  transactionId: string | null,
  providedHash: string | null,
  secret: string
): VerifyCpxResult {
  if (!transactionId) {
    return { valid: false, error: "missing_transaction_id" };
  }
  if (!providedHash) {
    return { valid: false, error: "no_hash_parameter" };
  }

  const computedHash = computeCpxSecureHash(transactionId, secret);

  if (!/^[a-fA-F0-9]+$/.test(providedHash) || !timingSafeHexEqual(computedHash, providedHash)) {
    return { valid: false, computedHash, providedHash, error: "hash_mismatch" };
  }

  return { valid: true, computedHash, providedHash };
}
