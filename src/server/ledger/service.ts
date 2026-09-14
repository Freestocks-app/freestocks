import { eq, desc, sql } from "drizzle-orm";
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

    try {
      await this.db.insert(schema.transaction).values({
        id: uuidv4(),
        txId,
        userId,
        amountCents,
        source,
        metadata: metadata ? JSON.stringify(metadata) : null,
        createdAt: new Date(),
      });
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
      if (
        code === "23505" ||
        errorStr.includes("unique") ||
        errorStr.includes("UNIQUE") ||
        errorStr.includes("duplicate key")
      ) {
        return { success: false, duplicate: true };
      }
      throw error;
    }

    const [row] = await this.db
      .insert(schema.userBalance)
      .values({
        userId,
        balanceCents: amountCents,
      })
      .onConflictDoUpdate({
        target: schema.userBalance.userId,
        set: { balanceCents: sql`${schema.userBalance.balanceCents} + ${amountCents}` },
      })
      .returning({ balanceCents: schema.userBalance.balanceCents });

    return { success: true, newBalance: row.balanceCents };
  }

  async debit(params: DebitParams): Promise<DebitResult> {
    const { userId, amountCents, txId, source, metadata } = params;

    try {
      await this.db.insert(schema.transaction).values({
        id: uuidv4(),
        txId,
        userId,
        amountCents: -amountCents,
        source,
        metadata: metadata ? JSON.stringify(metadata) : null,
        createdAt: new Date(),
      });
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
      if (
        code === "23505" ||
        errorStr.includes("unique") ||
        errorStr.includes("UNIQUE") ||
        errorStr.includes("duplicate key")
      ) {
        return { success: false, duplicate: true };
      }
      throw error;
    }

    const [row] = await this.db
      .insert(schema.userBalance)
      .values({
        userId,
        balanceCents: 0,
      })
      .onConflictDoUpdate({
        target: schema.userBalance.userId,
        set: {
          balanceCents: sql`GREATEST(0, ${schema.userBalance.balanceCents} - ${amountCents})`,
        },
      })
      .returning({ balanceCents: schema.userBalance.balanceCents });

    return { success: true, newBalance: row.balanceCents };
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
