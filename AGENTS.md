# Freestocks Engineering Guide

Architecture and conventions for the Freestocks codebase.

## Layering

```
src/
├── app/                 # Next.js App Router - thin route handlers only
│   ├── (app)/          # Authenticated app routes (with nav chrome)
│   ├── (auth)/         # Auth pages (sign-in, sign-up)
│   ├── api/            # API routes - thin, delegate to server/
│   └── page.tsx        # Landing page
├── components/          # React components - UI only, no business logic
├── server/              # Domain logic (the core)
│   ├── auth.ts         # better-auth instance
│   ├── bitlabs/        # BitLabs integration
│   │   ├── service.ts  # Callback processing, HMAC, credits
│   │   └── verify.ts   # HMAC verification pure function
│   └── ledger/         # Money/balance operations
│       └── service.ts  # Credit, debit, balance queries
└── lib/                 # Shared utilities
    ├── db/             # Database connection and schema
    └── utils.ts        # Pure utility functions
```

### Rules

1. **Routes are thin**: `app/api/*` routes validate input, call a service, return response. No business logic.
2. **Components are dumb**: React components render UI. Business logic lives in `server/`.
3. **Services own domains**: Each service (`bitlabs`, `ledger`) encapsulates its domain logic.
4. **Auth is centralized**: All auth flows go through `server/auth.ts` (better-auth instance).

## Money Handling

**Integer cents only in all backend code.**

```typescript
// ✅ Correct - ledger stores cents
user.balanceCents = 1234; // $12.34

// ❌ Wrong - never store dollars as float
user.balance = 12.34;
```

**Format to `$X.XX` only at the UI edge:**

```typescript
// In a React component only:
const formatted = `$${(balanceCents / 100).toFixed(2)}`;
```

## Naming Conventions

### Files
- `kebab-case.ts` for all files
- `PascalCase.tsx` for React components
- Test files: `*.test.ts` colocated with source

### Database
- Tables: `snake_case` (e.g., `user`, `transaction`)
- Columns: `snake_case` (e.g., `balance_cents`, `created_at`)
- Primary keys: `id` (text UUID or cuid)

### TypeScript
- Interfaces/Types: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE` for true constants only

## BitLabs Integration

### Callback Flow

```
BitLabs → GET /api/bitlabs/callback → bitlabs/service.ts → ledger/service.ts
```

1. **Verify HMAC**: `bitlabs/verify.ts` checks SHA1 HMAC with `BITLABS_SECRET`
2. **Parse params**: Extract `uid`, `tx`, `VALUE:USD` or `VALUE:CURRENCY`
3. **Dedupe**: Check if `tx` already processed (transaction table)
4. **Credit**: Add to user's `balance_cents` via ledger service
5. **Return 200**: BitLabs expects 200 OK on success

### Environment Variables

```bash
BITLABS_TOKEN=xxx     # App token for iframe URL
BITLABS_SECRET=xxx    # App secret for HMAC verification
```

**Never commit secrets.** Use `.env.local` for development.

## Testing Strategy

### TDD Required For:
- `server/bitlabs/verify.ts` - HMAC verification
- `server/bitlabs/service.ts` - Callback processing, TX dedupe
- `server/ledger/service.ts` - Credit, balance operations
- `app/api/bitlabs/callback/route.ts` - Integration test

### Not Required For:
- UI components (visual/CSS)
- Landing page copy
- Static pages (FAQ, etc.)

### Test Commands

```bash
npm run test        # Run all tests
npm run test:watch  # Watch mode
npm run test:cov    # Coverage report
```

## Database Schema

Designed for SQLite locally, easy Postgres swap:

```sql
-- Core tables (managed by better-auth)
user (id, email, name, email_verified, image, created_at, updated_at)
session (id, user_id, token, expires_at, ...)
account (id, user_id, provider, provider_account_id, ...)
verification (id, identifier, value, expires_at, ...)

-- App tables
user_balance (
  user_id TEXT PRIMARY KEY REFERENCES user(id),
  balance_cents INTEGER NOT NULL DEFAULT 0
)

transaction (
  id TEXT PRIMARY KEY,
  tx_id TEXT NOT NULL UNIQUE,  -- BitLabs TX for dedupe
  user_id TEXT NOT NULL REFERENCES user(id),
  amount_cents INTEGER NOT NULL,
  source TEXT NOT NULL,        -- 'bitlabs', 'manual', etc.
  created_at INTEGER NOT NULL
)
```

## Code Review Checklist

- [ ] No business logic in route handlers
- [ ] No business logic in React components
- [ ] Money stored as integer cents
- [ ] `$` formatting only in UI
- [ ] Tests for money path changes
- [ ] No secrets in code
- [ ] Errors logged with context

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
