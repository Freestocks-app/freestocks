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
