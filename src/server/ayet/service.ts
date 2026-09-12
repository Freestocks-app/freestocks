import { verifyAyetCallback, parseAyetCallbackParams } from "./verify";
import { LedgerService } from "../ledger/service";

export interface AyetCallbackResult {
  success: boolean;
  credited?: boolean;
  debited?: boolean;
  duplicate?: boolean;
  error?: string;
}

export interface ProcessAyetCallbackOptions {
  url: URL;
  securityHash: string | null;
  mockVerify?: boolean;
}

export class AyetService {
  constructor(
    private ledger: LedgerService,
    private apiKey: string
  ) {}

  async processCallback(options: ProcessAyetCallbackOptions): Promise<AyetCallbackResult> {
    const { url, securityHash, mockVerify } = options;

    if (!mockVerify) {
      const verifyResult = verifyAyetCallback(url, securityHash, this.apiKey);
      
      if (!verifyResult.valid) {
        console.error("[Ayet] HMAC verification failed:", {
          error: verifyResult.error,
          queryString: verifyResult.queryString,
          computedHash: verifyResult.computedHash,
          providedHash: verifyResult.providedHash,
        });
        return { success: false, error: "invalid_signature" };
      }
      
      console.log("[Ayet] HMAC verified successfully");
    }

    const params = parseAyetCallbackParams(url);

    if (!params.externalIdentifier) {
      return { success: false, error: "missing_user_id" };
    }

    if (!params.transactionId) {
      return { success: false, error: "missing_transaction_id" };
    }

    if (!params.payoutUsd && !params.currencyAmount) {
      return { success: false, error: "missing_payout" };
    }

    const amountCents = this.calculateAmountCents(params.payoutUsd, params.currencyAmount);

    if (amountCents <= 0) {
      return { success: false, error: "invalid_amount" };
    }

    if (params.isChargeback) {
      return this.processChargeback(
        params.externalIdentifier,
        amountCents,
        params.transactionId
      );
    }

    return this.processCredit(
      params.externalIdentifier,
      amountCents,
      params.transactionId
    );
  }

  private async processCredit(
    userId: string,
    amountCents: number,
    transactionId: string
  ): Promise<AyetCallbackResult> {
    const creditResult = await this.ledger.credit({
      userId,
      amountCents,
      txId: `ayet:${transactionId}`,
      source: "ayet",
    });

    if (creditResult.duplicate) {
      return { success: true, credited: false, duplicate: true };
    }

    if (!creditResult.success) {
      return { success: false, error: creditResult.error || "user_not_found" };
    }

    return { success: true, credited: true };
  }

  private async processChargeback(
    userId: string,
    amountCents: number,
    transactionId: string
  ): Promise<AyetCallbackResult> {
    const chargebackTxId = transactionId.startsWith("r-")
      ? `ayet:${transactionId}`
      : `ayet:chargeback:${transactionId}`;

    const debitResult = await this.ledger.debit({
      userId,
      amountCents,
      txId: chargebackTxId,
      source: "ayet_chargeback",
      metadata: { originalTransactionId: transactionId },
    });

    if (debitResult.duplicate) {
      return { success: true, debited: false, duplicate: true };
    }

    if (!debitResult.success) {
      return { success: false, error: debitResult.error || "user_not_found" };
    }

    return { success: true, debited: true };
  }

  calculateAmountCents(
    payoutUsd: string | null,
    currencyAmount: string | null
  ): number {
    const valueStr = payoutUsd || currencyAmount;
    if (!valueStr) return 0;

    const parsed = parseFloat(valueStr);
    if (isNaN(parsed)) return 0;

    if (payoutUsd) {
      return Math.round(parsed * 100);
    }

    return Math.round(parsed);
  }
}
