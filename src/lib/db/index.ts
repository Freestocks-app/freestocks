import { drizzle } from "drizzle-orm/neon-http";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle> | null = null;
let sqlInstance: NeonQueryFunction<false, false> | null = null;

function getConnectionUrl(): string | null {
  if (process.env.POSTGRES_URL) {
    return process.env.POSTGRES_URL;
  }
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  return null;
}

function requireConnectionUrl(): string {
  const url = getConnectionUrl();
  if (!url) {
    throw new Error(
      "Database connection URL not found. " +
      "Set POSTGRES_URL or DATABASE_URL in your environment. " +
      "On Vercel, add Neon via the Marketplace for automatic injection."
    );
  }
  return url;
}

function getSql(): NeonQueryFunction<false, false> {
  if (!sqlInstance) {
    sqlInstance = neon(requireConnectionUrl());
  }
  return sqlInstance;
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getSql(), { schema });
  }
  return dbInstance;
}

const DB_STUB_SYMBOL = Symbol("db-stub");

function createStubDb(): ReturnType<typeof drizzle> {
  const handler: ProxyHandler<object> = {
    get(target, prop) {
      if (prop === DB_STUB_SYMBOL) return true;
      if (prop === "then") return undefined;
      if (prop === "toJSON") return () => "[Database Stub - Not Connected]";
      if (prop === "toString") return () => "[Database Stub - Not Connected]";
      
      return new Proxy(() => {}, handler);
    },
    apply() {
      throw new Error(
        "Database not connected. " +
        "Set POSTGRES_URL or DATABASE_URL in your environment."
      );
    },
  };
  return new Proxy({}, handler) as ReturnType<typeof drizzle>;
}

export const db: ReturnType<typeof drizzle> = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    const url = getConnectionUrl();
    if (!url) {
      return createStubDb()[prop as keyof ReturnType<typeof drizzle>];
    }
    return getDb()[prop as keyof ReturnType<typeof drizzle>];
  },
});

export async function initializeDatabase() {
  const database = getDb();
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified BOOLEAN NOT NULL DEFAULT false,
      image TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expires_at TIMESTAMP NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      access_token TEXT,
      refresh_token TEXT,
      id_token TEXT,
      access_token_expires_at TIMESTAMP,
      refresh_token_expires_at TIMESTAMP,
      scope TEXT,
      password TEXT,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP,
      updated_at TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_balance (
      user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
      balance_cents INTEGER NOT NULL DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "transaction" (
      id TEXT PRIMARY KEY,
      tx_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      amount_cents INTEGER NOT NULL,
      source TEXT NOT NULL,
      metadata TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_transaction_user_id ON "transaction"(user_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_transaction_tx_id ON "transaction"(tx_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(user_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_account_user_id ON account(user_id)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS redeem_request (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      amount_cents INTEGER NOT NULL,
      fomo_address TEXT NOT NULL,
      stock_symbol TEXT NOT NULL DEFAULT 'AAPL',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      processed_at TIMESTAMP
    )
  `;

  await sql`
    ALTER TABLE redeem_request ADD COLUMN IF NOT EXISTS stock_symbol TEXT NOT NULL DEFAULT 'AAPL'
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_redeem_request_user_id ON redeem_request(user_id)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_referral_code (
      user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
      code TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_user_referral_code_code ON user_referral_code(code)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS referral_link (
      referee_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
      referrer_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_referral_link_referrer_id ON referral_link(referrer_id)
  `;

  return database;
}

let initialized = false;

export async function ensureDbInitialized() {
  if (!initialized) {
    await initializeDatabase();
    initialized = true;
  }
  return getDb();
}

export function hasDbConnection(): boolean {
  return getConnectionUrl() !== null;
}

export { schema };
