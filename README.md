# Freestocks

The easiest way to earn fractional stocks. Complete offers, earn cash, unlock stocks.

## Quick Start

```bash
# Install dependencies
npm ci

# Copy environment file and configure
cp .env.example .env.local

# Generate auth secret
openssl rand -base64 32  # Add to BETTER_AUTH_SECRET

# Push database schema (creates tables)
npm run db:push

# Start development server
npm run dev
```

Visit [http://localhost:3847](http://localhost:3847)

## Environment Variables

See `.env.example` for all available configuration options. Required variables:

| Variable | Description |
|----------|-------------|
| `BETTER_AUTH_SECRET` | Auth signing key (generate with `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Base URL for auth callbacks (e.g., `http://localhost:3847`) |
| `POSTGRES_URL` | Database connection string (optional - uses PGlite locally) |

### Optional Integrations

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `APPLE_CLIENT_ID` / `APPLE_CLIENT_SECRET` | Apple OAuth |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | Facebook OAuth |
| `BITLABS_TOKEN` / `BITLABS_SECRET` | BitLabs offer wall |
| `AYET_API_KEY` / `AYET_ADSLOT_ID` | Ayet offer wall |
| `FOMO_REFERRAL_URL` | Referral URL (defaults to `https://fomo.family/r/freestocks`) |

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
npm run test       # Run tests
npm run test:watch # Run tests in watch mode
npm run test:cov   # Run tests with coverage
npm run db:push    # Push schema to database
npm run db:migrate # Run migrations
```

## Architecture

See [AGENTS.md](./AGENTS.md) for detailed architecture documentation including:

- Project structure and layering rules
- Money handling (integer cents)
- BitLabs callback flow
- Database schema
- Testing strategy

## ETHGlobal Tokyo 2026 — Uniswap Integration

Built for the **"Best Uniswap Stack Contribution"** track. See
[`FEEDBACK.md`](./FEEDBACK.md) for the full writeup (integration method,
timeline, blockers hit).

**What it does:** the `/trade` screen's Ethereum tab lets a user swap
USDC for Coinbase's tokenized US equities (AAPLc, NVDAc, METAc, GOOGLc,
MSFTc, AMZNc) on **Base mainnet**, via direct Uniswap v3 contract calls
(no Trading API key) — the same embedded Privy wallet used for the app's
existing Solana trading, now also holding an EVM wallet.

**Relevant contracts and code:**
- [`src/lib/uniswap/constants.ts`](./src/lib/uniswap/constants.ts) — Uniswap v3 contract addresses on Base (`UNISWAP_V3_FACTORY`, `UNISWAP_SWAP_ROUTER_02`, `UNISWAP_QUOTER_V2`, lines 27-30), the tokenized stock addresses and their per-symbol quotable pool fee tier (`BASE_STOCKS`, lines 61-68)
- [`src/lib/uniswap/client.ts`](./src/lib/uniswap/client.ts) — `getUniswapQuote()` (QuoterV2 read, lines 63-78), `buildApproveTransaction()`/`buildSwapTransaction()` (unsigned tx builders against SwapRouter02's `exactInputSingle`, lines 87-124)
- [`src/components/EvmTradeScreen.tsx`](./src/components/EvmTradeScreen.tsx) — the Buy/Sell UI, quote polling, and approve-then-swap confirm flow signed via Privy's `useSendTransaction`
- [`src/components/TradeScreen.tsx`](./src/components/TradeScreen.tsx) — the Solana/Ethereum chain toggle that mounts `EvmTradeScreen`

**Verification note:** every contract address above was checked two ways
before use — sourced directly from Uniswap's own `sdks` GitHub repo (not
a block explorer), then cross-checked by diffing on-chain bytecode
(`eth_getCode`) against the equivalent, independently-known-good Ethereum
Sepolia deployment byte-for-byte. Each stock's pool fee tier was found by
actually calling `QuoterV2` live per symbol on Base mainnet — a pool
existing (`Factory.getPool()` returning a non-zero address) does not mean
it's tradeable; several of Coinbase's stock/USDC pools exist on-chain at
multiple fee tiers but revert on every quote (no real liquidity). TSLA
has no quotable pool at any standard fee tier as of this integration and
is deliberately excluded rather than shipped broken.

## ETHGlobal Tokyo 2026 — World ID Integration

Built for the **"Best Use of IDKit"** track.

**What it does:** the profile page offers a one-time "Verify with World
ID" action. On a successful proof-of-human verification, the user gets a
one-time $1.00 bonus and a "Verified Human" badge. This is deliberately
the *only* thing World ID gates — never a money-moving action (Trade,
Send, Cashout) — so a user who skips it loses nothing but the bonus,
satisfying the "meaningful alternative path" requirement by construction.

**Relevant contracts and code:**
- [`src/app/api/worldid/request-context/route.ts`](./src/app/api/worldid/request-context/route.ts) — server-side `rp_context` signing via `@worldcoin/idkit-server`'s `signRequest()`; the signing key never reaches the client
- [`src/app/api/worldid/verify/route.ts`](./src/app/api/worldid/verify/route.ts) — re-verifies the proof server-side against Worldcoin's v4 verify endpoint (never trusts a client-reported success), then credits the bonus exactly once
- [`src/server/worldid/service.ts`](./src/server/worldid/service.ts) — `recordVerification()`; the `nullifier_hash` unique constraint (not just per-user) is the actual Sybil defense, preventing one real person from claiming the bonus under multiple Freestocks accounts
- [`src/components/WorldIdVerifyCard.tsx`](./src/components/WorldIdVerifyCard.tsx) — the client-side IDKit flow (`useIDKitRequest` + `proofOfHuman()` preset, Device-level credential)
