# Uniswap Integration Feedback — ETHGlobal Tokyo 2026

Project: Freestocks — earn and trade tokenized stocks
Track: Best Uniswap Stack Contribution

## What we built

A Chain toggle inside the app's existing `/trade` screen adds an
Ethereum tab that swaps USDC for Coinbase's tokenized US equities
(AAPLc, NVDAc, METAc, GOOGLc, MSFTc, AMZNc) on Base mainnet, via direct
Uniswap v3 contract calls (`QuoterV2` for quotes, `SwapRouter02` for the
swap) — no Trading API key. Signing goes through the same Privy embedded
wallet already used for the app's Solana-side trading (Jupiter), now
also holding an EVM wallet on the same account.

See the "ETHGlobal Tokyo 2026 — Uniswap Integration" section of
[`README.md`](./README.md) for exact file/line references.

## Integration method

Direct contract calls via `ethers` + the Uniswap v3 SDK packages
(`@uniswap/v3-sdk`, `@uniswap/sdk-core`), not the hosted Trading API —
chosen specifically to avoid the API-key request/approval step under
hackathon time pressure, at the cost of writing quote/allowance/swap
transaction-building logic ourselves rather than calling one hosted
endpoint.

## Timeline

Roughly half a day, most of it front-loaded into verification rather
than implementation:

1. Confirmed Base's Coinbase-issued tokenized stock addresses (scraped
   from `base.org/stocks`' raw HTML — the rendered page truncates
   addresses in a way that's easy to misread; had to grep the raw HTML
   and cross-check byte length).
2. Confirmed Uniswap v3 contract addresses on Base against Uniswap's own
   `sdks` GitHub repo (`sdk-core/src/addresses.ts`), then independently
   verified those addresses are the real deployment (not a look-alike) by
   diffing on-chain bytecode against the equivalent Sepolia deployment.
3. Discovered, by actually calling `QuoterV2` live per symbol/fee-tier
   rather than trusting `Factory.getPool()` alone, that several
   stock/USDC pools exist on-chain but have no real liquidity (revert on
   every quote), and that the *working* fee tier differs per stock
   (3000 for most, 10000 for two). TSLA has no quotable pool at any
   standard tier and had to be excluded.
4. Implementation itself (quote polling, approve-then-swap flow, UI) was
   the fast part once the above was nailed down.

## Primary obstacles

- **No official way to tell a "real" pool from a "used to have liquidity
  or was only ever a test pool" one, other than trying an actual quote.**
  `Factory.getPool()` returning a non-zero address only tells you a pool
  contract exists, not that it's tradeable. This cost real
  investigation time and would have shipped a broken swap silently if
  we'd stopped at "the pool exists."
- **Per-symbol fee tier inconsistency.** Assuming one fee tier works for
  every token in a stock/USDC family is wrong even within a single
  issuer's own token set (Coinbase's own B20 tokens, in this case) —
  each pool had to be checked individually.
- Address-scraping from a rendered page (`base.org/stocks`) is fragile —
  the same address rendered inconsistently between a summarized page
  fetch and the raw HTML; had to always fall back to grepping raw HTML
  and validating byte length before trusting an address.

## Support used

Public documentation only (Uniswap's own developer docs and GitHub repo,
Base's own docs) — did not use office hours, Discord, or direct mentor
support for this integration, so no feedback on those channels from us
this time.

## Continuing the project

Yes — Freestocks already has a working Solana-side trading feature
(Jupiter) predating this hackathon; the EVM/Uniswap side extends the
same product rather than being a throwaway demo, and we intend to keep
it live.
