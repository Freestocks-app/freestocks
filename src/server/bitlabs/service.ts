import { verifyBitlabsCallback, parseCallbackParams } from "./verify";
import { LedgerService } from "../ledger/service";

export interface CallbackResult {
  success: boolean;
  credited?: boolean;
  duplicate?: boolean;
  error?: string;
}

export interface ProcessCallbackOptions {
  fullUrl: string;
  mockVerify?: boolean;
}

export class BitLabsService {
  constructor(
    private ledger: LedgerService,
    private secret: string
  ) {}

  async processCallback(options: ProcessCallbackOptions): Promise<CallbackResult> {
    const { fullUrl, mockVerify } = options;

    if (!mockVerify) {
      const verifyResult = verifyBitlabsCallback(fullUrl, this.secret);
      
      if (!verifyResult.valid) {
        console.error("[BitLabs] HMAC verification failed:", {
          error: verifyResult.error,
          urlUsed: verifyResult.urlUsed,
          computedHash: verifyResult.computedHash,
          providedHash: verifyResult.providedHash,
          fullUrlLength: fullUrl.length,
        });
        return { success: false, error: "invalid_signature" };
      }
      
      console.log("[BitLabs] HMAC verified successfully");
    }

    const url = new URL(fullUrl);
    const params = parseCallbackParams(url);

    if (!params.userId) {
      return { success: false, error: "missing_user_id" };
    }

    if (!params.txId) {
      return { success: false, error: "missing_tx_id" };
    }

    if (!params.valueCurrency && !params.valueUsd) {
      return { success: false, error: "missing_value" };
    }

    const amountCents = this.calculateAmountCents(
      params.valueCurrency,
      params.valueUsd
    );

    if (amountCents <= 0) {
      return { success: false, error: "invalid_amount" };
    }

    const creditResult = await this.ledger.credit({
      userId: params.userId,
      amountCents,
      txId: params.txId,
      source: "bitlabs",
    });

    if (creditResult.duplicate) {
      return { success: true, credited: false, duplicate: true };
    }

    if (!creditResult.success) {
      return { success: false, error: creditResult.error || "user_not_found" };
    }

    return { success: true, credited: true };
  }

  calculateAmountCents(
    valueCurrency: string | null,
    valueUsd: string | null
  ): number {
    const valueStr = valueUsd || valueCurrency;
    if (!valueStr) return 0;

    const parsed = parseFloat(valueStr);
    if (isNaN(parsed)) return 0;

    return Math.round(parsed * 100);
  }
}
