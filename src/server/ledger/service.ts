import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import * as schema from "@/lib/db/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DrizzleDB = any;

export interface CreditParams {
  userId: string;
  amountCents: number;
  txId: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface CreditResult {
  success: boolean;
  duplicate?: boolean;
  newBalance?: number;
  error?: string;
}

export interface DebitParams {
  userId: string;
  amountCents: number;
  txId: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface DebitResult {
  success: boolean;
  duplicate?: boolean;
  newBalance?: number;
  error?: string;
}

export class LedgerService {
  constructor(private db: DrizzleDB) {}

  async getBalance(userId: string): Promise<number> {
    const balance = await this.db.query.userBalance.findFirst({
      where: eq(schema.userBalance.userId, userId),
    });
    return balance?.balanceCents ?? 0;
  }

  async credit(params: CreditParams): Promise<CreditResult> {
    const { userId, amountCents, txId, source, metadata } = params;

    const existingTx = await this.db.query.transaction.findFirst({
      where: eq(schema.transaction.txId, txId),
    });

    if (existingTx) {
      return { success: false, duplicate: true };
    }

    const currentBalance = await this.getBalance(userId);
    const newBalance = currentBalance + amountCents;

    try {
      await this.db
        .insert(schema.userBalance)
        .values({
          userId,
          balanceCents: newBalance,
        })
        .onConflictDoUpdate({
          target: schema.userBalance.userId,
          set: { balanceCents: newBalance },
        });

      await this.db.insert(schema.transaction).values({
        id: uuidv4(),
        txId,
        userId,
        amountCents,
        source,
        metadata: metadata ? JSON.stringify(metadata) : null,
        createdAt: new Date(),
      });

      return { success: true, newBalance };
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string; cause?: { code?: string } };
      const errorStr = String(error);
      const code = err?.code || err?.cause?.code || "";
      
      if (
        code === "23503" ||
        errorStr.includes("foreign key") ||
        errorStr.includes("FOREIGN KEY") ||
        errorStr.includes("violates foreign key constraint")
      ) {
        return { success: false, error: "user_not_found" };
      }
      throw error;
    }
  }

  async debit(params: DebitParams): Promise<DebitResult> {
    const { userId, amountCents, txId, source, metadata } = params;

    const existingTx = await this.db.query.transaction.findFirst({
      where: eq(schema.transaction.txId, txId),
    });

    if (existingTx) {
      return { success: false, duplicate: true };
    }

    const currentBalance = await this.getBalance(userId);
    const newBalance = Math.max(0, currentBalance - amountCents);

    try {
      await this.db
        .insert(schema.userBalance)
        .values({
          userId,
          balanceCents: newBalance,
        })
        .onConflictDoUpdate({
          target: schema.userBalance.userId,
          set: { balanceCents: newBalance },
        });

      await this.db.insert(schema.transaction).values({
        id: uuidv4(),
        txId,
        userId,
        amountCents: -amountCents,
        source,
        metadata: metadata ? JSON.stringify(metadata) : null,
        createdAt: new Date(),
      });

      return { success: true, newBalance };
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string; cause?: { code?: string } };
      const errorStr = String(error);
      const code = err?.code || err?.cause?.code || "";
      
      if (
        code === "23503" ||
        errorStr.includes("foreign key") ||
        errorStr.includes("FOREIGN KEY") ||
        errorStr.includes("violates foreign key constraint")
      ) {
        return { success: false, error: "user_not_found" };
      }
      throw error;
    }
  }

  async getTransactions(
    userId: string,
    limit: number = 50
  ): Promise<schema.Transaction[]> {
    return this.db.query.transaction.findMany({
      where: eq(schema.transaction.userId, userId),
      orderBy: [desc(schema.transaction.createdAt)],
      limit,
    });
  }
}
