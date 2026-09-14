# Freestocks — Open Items

Last updated: 2026-09-14

**Docs:** [PRODUCT.md](./PRODUCT.md) (strategy & priorities) · [STOCKLANA-BACKLOG.md](./STOCKLANA-BACKLOG.md) · [FREECASH-GAMIFICATION.md](./FREECASH-GAMIFICATION.md)

## Product lock (reminder)

- Web-only FreeCash-style earn → USD ledger (integer cents) → FOMO stock unlock
- No Freestocks in-app wallet; exit via FOMO referral + RH Chain deposit address
- v0 real send = treasury wallet transfer of existing tokenized stock + mark completed in control (no custom smart contract required)

## External / ops

| Item | Status | Notes |
|------|--------|-------|
| Ayet Website placement #24790 | Under review | AM: james.lonergan@ayetstudios.com — wait for approval before live Earn testing |
| BitLabs dashboard callback URL | Confirm | Prod consumer: `https://freestocks-beyond-club.vercel.app` — verify callback path matches BitLabs HMAC route |
| Real FOMO referral URL | Placeholder | Env `FOMO_REFERRAL_URL=https://fomo.family/r/freestocks` — replace with real Freestocks referral when ready |
| Manual redeem fulfillment | Ops process | Control Redeem queue → treasury send → mark completed |

## Engineering (P0 / P1)

| Priority | Item | Notes |
|----------|------|-------|
| P0 | Balance reserve/debit on redeem submit | Today redeem creates `pending` only; does not reserve balance. Risk of double-spend if balance spent elsewhere while pending |
| P1 | Stronger control auth | Email allowlist only (`ADMIN_EMAILS=yuki@beyondclub.xyz`); no password / SSO — tighten before broader admin access |
| P1 | Geo / corridor + cash fallback | Stock redeem only in permitted corridors; cash/USDC elsewhere — product model locked, not implemented |
| P2 | Automated on-chain send | Later; v0 stays manual |
| P2 | Favicon | Missing / polish |
| P2 | Full git history | Origin→GitHub was squashed/import; optional history restore |
| Optional | Dev / Review agents | Not created |

## Shipped (for context)

- Consumer: auth (email + Google/Apple/Facebook), Earn (BitLabs + Ayet tabs), ledger, Offers/FAQ, Privacy/Terms, Unlock 3-step UI
- Control: Dashboard / Users / Redeem on shared Neon; Vercel SSO disabled for app allowlist
- GitHub: `Sampo-app/freestocks`, `Sampo-app/freestocks-control`
- Prod: `https://freestocks-beyond-club.vercel.app`, `https://freestocks-control-beyond-club.vercel.app`

## URLs

- Consumer: https://freestocks-beyond-club.vercel.app
- Control: https://freestocks-control-beyond-club.vercel.app
- Repos: https://github.com/Sampo-app/freestocks · https://github.com/Sampo-app/freestocks-control
