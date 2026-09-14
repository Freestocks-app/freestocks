# Freestocks — Product Strategy & Priorities

**Version 1.0** · 2026-09-14  
**Status:** Active · Stocklana hackathon track

---

## Changelog

| Date | Change |
|------|--------|
| 2026-09-14 | v1.0 — Initial strategy doc for Stocklana pivot |
| — | Privy + Solana unlock rail adopted; FOMO/RH Chain demoted to fallback |
| — | Lessons incorporated from Anywhere Cash Founding Strategy v2: offerwall is commodity (moat must be elsewhere), endowed progress drives conversion, explicit exclusion of delisting-risk dark patterns |

---

## 1. Overview

**Tagline (locked):** *The easiest way to earn stocks*

Freestocks is a web-first earn-to-stock product:

- **Earn engine:** FreeCash-style offerwall (BitLabs + Ayet tabs) — users complete offers to accumulate USD balance
- **Ledger:** Integer cents only (`balance_cents`); no floats, no crypto units in core accounting
- **Unlock rail:** Privy fixed-email OTP → embedded Solana wallet → SPL stock token transfer
- **Visual identity:** Lime-on-black (#84cc16 on #09090b); clean, mobile-first
- **Relationship:** Sister product to Sampo / Anywhere Cash; independent codebase, shared learnings

### Moat

The earn engine (offerwall) is a **commodity** — Enactsoft sells FreeCash clone scripts. Freestocks' differentiation is the **stock-on-Solana sink**:

| Layer | Defensibility |
|-------|---------------|
| Offerwall | None — BitLabs/Ayet available to anyone |
| USD ledger | None — standard accounting |
| **Stock redemption** | Moderate — tokenized stock sourcing, Solana rails, treasury ops |
| **Emotional sink** | High — "I own stock" beats "I have USDC" for retention |

Compare Anywhere Cash: moat = USDC + physical card (utility sink). Freestocks: moat = stock ownership (emotional/investment sink).

---

## 2. Core Thesis

### Why this works

1. **GPT ceiling:** AI can't click through offer flows for users — human attention remains valuable to advertisers
2. **Stock as emotional sink:** Fractional stock ownership ("I own Apple") creates stronger retention than fungible cash
3. **Solana unlock:** On-chain delivery provides verifiable, self-custodial exit — differentiator vs. traditional GPT apps

### Stocklana deadline

**2026-09-18 20:00 UTC** — hackathons.solana.com submission closes

### Refuse list (hard no)

| Pattern | Reason |
|---------|--------|
| Memecoin / speculative token rewards | Regulatory risk; not aligned with "stocks" positioning |
| Fake $/hr claims | FTC delisting risk (2026 enforcement trend); erodes trust |
| Silent forfeiture | Balance expiry without clear disclosure = user-hostile |
| Ticking yield / countdown pressure | Dark pattern; creates anxiety, not value |
| Shareholder overclaim | "You're a real investor" rhetoric when holding $0.50 of SPL token |

---

## 3. Product Locks

Decisions that are **not open for debate** during Stocklana sprint:

| Lock | Value | Rationale |
|------|-------|-----------|
| Tagline | "The easiest way to earn stocks" | Tested; fits Solana story |
| Navigation | Web header (desktop) / footer (mobile) tabs | FreeCash pattern; proven |
| Currency display | `$X.XX` only | No crypto units in consumer UI |
| Backend money | Integer cents | Prevents float rounding bugs |
| App auth | better-auth (email + social) | Already shipped; works |
| Unlock auth | Privy fixed-email OTP | Email pre-filled from session; no mismatch |
| Unlock rail | Privy embedded Solana wallet | Hackathon scope; FOMO/RH later |
| Gas model | Treasury pays send gas | Privy sponsorship = P2 |
| Minimum redeem | $5.00 | Unit economics baseline |
| Offerwalls | BitLabs + Ayet | Approved/pending; no others for v0 |
| Control access | `yuki@beyondclub.xyz` allowlist | No SSO; email-only admin |
| Demo focus | Privy → Solana flow | FOMO/RH Chain not primary demo |

---

## 4. URLs & Deadline

### Production

| Environment | URL |
|-------------|-----|
| Consumer | https://freestocks-beyond-club.vercel.app |
| Control | https://freestocks-control-beyond-club.vercel.app |

### Repositories

| Repo | URL |
|------|-----|
| Consumer | https://github.com/Sampo-app/freestocks |
| Control | https://github.com/Sampo-app/freestocks-control |

### Hackathon

| Item | Value |
|------|-------|
| Event | Stocklana Hackathon |
| Portal | https://hackathons.solana.com/hackathons/stocklana |
| Deadline | **2026-09-18 20:00 UTC** |
| Submission | Preview URL + GitHub + 60-90s mobile video |

---

## 5. Priorities

### P0 — Blocking for submission

| ID | Item | Status |
|----|------|--------|
| P0-1 | Branch + feature flag (`UNLOCK_RAIL=solana`) | ✅ Done |
| P0-2 | Privy Unlock UI (fixed email field) | ✅ Done |
| P0-3 | Privy Unlock impl (OTP → wallet → address stored) | ✅ Done |
| P0-4 | **Treasury SPL send + tx link in UI** | 🔲 **NEXT — blocking** |
| P0-5 | Copy alignment (remove "Coming soon", FOMO framing) | ✅ Done |
| P0-6 | Verify Privy allowed origins match prod URLs | 🔲 Verify |

### P1 — Polish for judges

| ID | Item | Notes |
|----|------|-------|
| P1-1 | Mobile responsive — all pages | Audit vs FreeCash; every route must feel native on phone |
| P1-2 | Landing page refinement | Hero, value prop, CTA hierarchy |
| P1-3 | Pitch video (60-90s mobile screen recording) | Demo the happy path |
| P1-4 | Hackathon submission | Preview URL + repo + video + one-liner |

### P2 — Attractiveness / post-submission

| ID | Item | Notes |
|----|------|-------|
| P2-1 | FreeCash gamification | See [FREECASH-GAMIFICATION.md](./FREECASH-GAMIFICATION.md) |
| P2-2 | Privy gas sponsorship | Required if users sign txs; not needed for v0 "we send" |
| P2-3 | OPEN-ITEMS hardening | Balance reserve, control auth, geo/corridor |

### P3 — Post-hackathon / external

| ID | Item | Notes |
|----|------|-------|
| P3-1 | Ayet approval | Website placement #24790 under review |
| P3-2 | BitLabs production callback | Verify HMAC route matches dashboard |
| P3-3 | Stock issuer relationship | Tokenized stock sourcing for treasury |
| P3-4 | Legal review | Terms, privacy, securities implications |

---

## 6. Hackathon North Star

**Judge path (mobile, <2 min):**

```
1. Landing page → tap "Get Started"
2. Sign up (email or social)
3. Earn tab visible → see balance
4. [Demo credit or complete offer] → balance ≥ $5.00
5. Unlock → fixed-email Privy OTP → Solana wallet created
6. Stock transferred → tx link displayed
```

**Submission one-liner:** *Freestocks — The easiest way to earn stocks. Complete offers, accumulate USD, unlock tokenized stocks to your Solana wallet.*

---

## 7. Open Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Mint choice** | High | Which SPL token represents "stock"? Need issuer or wrapped asset decision before real send |
| **Privy OTP origins** | Medium | Must verify allowed origins include production URLs; silent fail if misconfigured |
| **Unit economics** | Medium | $5 min redeem; need to validate CPA covers path + treasury margin |
| **Single-offer onboarding** | Low | FreeCash's lock pattern not implemented for v0; conversion may lag — tracked in P2-1 |
| **Moat honesty** | Low | Offerwall is commodity; must execute on stock sink or no differentiation |

---

## 8. Doc Map

| Document | Purpose |
|----------|---------|
| [PRODUCT.md](./PRODUCT.md) | This file — strategy, priorities, locks |
| [STOCKLANA-BACKLOG.md](./STOCKLANA-BACKLOG.md) | Sprint backlog for Stocklana branch |
| [FREECASH-GAMIFICATION.md](./FREECASH-GAMIFICATION.md) | P2-1 research — gamification patterns |
| [OPEN-ITEMS.md](./OPEN-ITEMS.md) | Engineering + ops open items |
| [QA-REPORT-2026-09-13.md](./QA-REPORT-2026-09-13.md) | QA findings from 2026-09-13 session |

---

*Freestocks — The easiest way to earn stocks*
