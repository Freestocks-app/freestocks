import { desc, eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import type { DrizzleDB } from "@/server/ledger/service";

function toUtcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Count consecutive calendar days (UTC) with at least one earning
 * transaction, walking backward from today. If today has no transaction
 * yet, the streak still counts from yesterday (a grace period so the
 * streak doesn't appear broken before the user has had a chance to earn
 * today).
 */
export function computeStreakFromDays(distinctUtcDays: string[], todayUtc: string): number {
  const days = new Set(distinctUtcDays);
  if (days.size === 0) return 0;

  let cursor = new Date(`${todayUtc}T00:00:00.000Z`);
  if (!days.has(toUtcDateString(cursor))) {
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
    if (!days.has(toUtcDateString(cursor))) {
      return 0;
    }
  }

  let streak = 0;
  while (days.has(toUtcDateString(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  return streak;
}

export class StreakService {
  constructor(private db: DrizzleDB) {}

  async getCurrentStreak(userId: string): Promise<number> {
    const rows = await this.db.query.transaction.findMany({
      where: eq(schema.transaction.userId, userId),
      orderBy: [desc(schema.transaction.createdAt)],
      columns: { createdAt: true },
    });

    const distinctDays = Array.from(
      new Set(rows.map((row: { createdAt: Date }) => toUtcDateString(row.createdAt)))
    ) as string[];

    return computeStreakFromDays(distinctDays, toUtcDateString(new Date()));
  }
}
