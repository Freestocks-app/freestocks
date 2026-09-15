import { verifyCpxCallback, parseCpxCallbackParams } from "./verify";
import { LedgerService } from "../ledger/service";
import { ReferralService, creditReferralCommission } from "../referral/service";

export interface CpxCallbackResult {
  success: boolean;
  credited?: boolean;
  debited?: boolean;
  duplicate?: boolean;
  error?: string;
}

export interface ProcessCpxCallbackOptions {
  url: URL;
  mockVerify?: boolean;
}

// CPX status: 1 = completed (reward), 2 = canceled (chargeback/reversal).
// Anything other than "2" is treated as a normal reward credit.
const STATUS_CANCELED = "2";

export class CpxService {
  constructor(
    private ledger: LedgerService,
    private secret: string,
    private referral?: ReferralService
  ) {}

  async processCallback(options: ProcessCpxCallbackOptions): Promise<CpxCallbackResult> {
    const { url, mockVerify } = options;
    const params = parseCpxCallbackParams(url);

    if (!mockVerify) {
      const verifyResult = verifyCpxCallback(params.transactionId, params.secureHash, this.secret);

      if (!verifyResult.valid) {
        console.error("[CPX] Secure hash verification failed:", {
          error: verifyResult.error,
          computedHash: verifyResult.computedHash,
          providedHash: verifyResult.providedHash,
        });
        return { success: false, error: "invalid_signature" };
      }
    }

    if (!params.userId) {
      return { success: false, error: "missing_user_id" };
    }

    if (!params.transactionId) {
      return { success: false, error: "missing_transaction_id" };
    }

    if (!params.amountUsd && !params.amountLocal) {
      return { success: false, error: "missing_amount" };
    }

    const amountCents = this.calculateAmountCents(params.amountUsd, params.amountLocal);

    if (amountCents <= 0) {
      return { success: false, error: "invalid_amount" };
    }

    if (params.status === STATUS_CANCELED) {
      return this.processChargeback(params.userId, amountCents, params.transactionId);
    }

    return this.processCredit(params.userId, amountCents, params.transactionId);
  }

  private async processCredit(
    userId: string,
    amountCents: number,
    transactionId: string
  ): Promise<CpxCallbackResult> {
    const creditResult = await this.ledger.credit({
      userId,
      amountCents,
      txId: `cpx:${transactionId}`,
      source: "cpx",
    });

    if (creditResult.duplicate) {
      return { success: true, credited: false, duplicate: true };
    }

    if (!creditResult.success) {
      return { success: false, error: creditResult.error || "user_not_found" };
    }

    if (this.referral) {
      await creditReferralCommission(this.ledger, this.referral, {
        refereeId: userId,
        refereeTxId: `cpx:${transactionId}`,
        amountCents,
      });
    }

    return { success: true, credited: true };
  }

  private async processChargeback(
    userId: string,
    amountCents: number,
    transactionId: string
  ): Promise<CpxCallbackResult> {
    const debitResult = await this.ledger.debit({
      userId,
      amountCents,
      txId: `cpx:chargeback:${transactionId}`,
      source: "cpx_chargeback",
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

  calculateAmountCents(amountUsd: string | null, amountLocal: string | null): number {
    const valueStr = amountUsd || amountLocal;
    if (!valueStr) return 0;

    const parsed = parseFloat(valueStr);
    if (isNaN(parsed)) return 0;

    return Math.round(parsed * 100);
  }
}
