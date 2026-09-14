# Freestocks × Stocklana — Backlog

Last updated: 2026-09-14  
Branch: `stocklana/privy-solana-unlock`  
Tagline (locked): **The easiest way to earn stocks**

**Related docs:** [PRODUCT.md](./PRODUCT.md) (strategy) · [FREECASH-GAMIFICATION.md](./FREECASH-GAMIFICATION.md) (P2-1 research) · [OPEN-ITEMS.md](./OPEN-ITEMS.md)

## North star (hackathon)

Happy path judges can feel in <2 min (prefer **mobile** demo):  
LP → signup → Earn visible → funded balance → Unlock → **fixed-email Privy OTP** → Solana wallet → stock arrives (tx link).

This branch is **not** FOMO / RH Chain. Exit rail = Privy embedded Solana wallet. Treasury pays send gas; **Privy gas sponsorship = later (P2)**.

---

## P0 — finish completely first (dev)

| ID | Item | Notes | Status |
|----|------|-------|--------|
| P0-1 | Branch + feature flag | `UNLOCK_RAIL=solana` on this branch; keep better-auth for app login | ✅ Done |
| P0-2 | **Privy Unlock UI** | Email field **fixed / greyed out** (= session email). Tap → OTP to that email only. Mismatch rejected | ✅ Done |
| P0-3 | **Privy Unlock impl** | OTP success → embedded Solana wallet created/linked → store address on redeem | ✅ Done |
| P0-4 | Demo credit → redeem → treasury send | One working send to Privy wallet address; tx link in UI/control. No gas sponsorship product yet | 🔲 Next |
| P0-5 | Copy alignment (this branch) | Remove "Coming soon" / Terms "not yet available" / FOMO+RH Chain receive framing. Story = earn → Solana wallet stocks | ✅ Done |

## P1 — polish that wins

| ID | Item | Notes |
|----|------|-------|
| P1-1 | **Mobile responsive — all pages** | Audit every route vs FreeCash mobile. Desktop header / mobile footer already exist — make each page feel native on phone |
| P1-2 | Pages to verify | `/` LP, `/sign-in`, `/sign-up`, `/earn`, `/offers`, `/unlock`, `/faq`, `/privacy`, `/terms` (+ control if shown) |
| P1-3 | Pitch + submit | 60–90s **mobile** screen recording; Preview URL; GitHub; hackathons.solana.com submit |

## P2 — attractiveness / later product

| ID | Item | Notes |
|----|------|-------|
| P2-1 | **FreeCash-style gamification / dark patterns** | See [FREECASH-GAMIFICATION.md](./FREECASH-GAMIFICATION.md) — endowed progress, progress meters, streaks; explicit OUT list for dark patterns |
| P2-2 | Privy / fee-payer **gas sponsorship** | Needed if users must sign chain txs; not required for v0 "we send to you". Document as future feature |
| P2-3 | Production FOMO rail coexistence | `main` may keep FOMO; this branch stays Solana-first |

## P3 — after hackathon / ops

| ID | Item | Notes |
|----|------|-------|
| P3-1 | Balance reserve on redeem (eng P0 from OPEN-ITEMS) | Still real prod risk |
| P3-2 | Ayet approval + live offerwalls | External |
| P3-3 | Stronger control auth, geo/corridor, favicon, etc. | See `docs/OPEN-ITEMS.md` |

---

## Remember (standing)

1. **Privy** — UI + implementation both required for Unlock (fixed email OTP → wallet → send).  
2. **Mobile** — FreeCash-referenced responsive pass on **all** pages.  
3. **Gamification** — FreeCash patterns tracked under **P2-1**, not forgotten.

## Tagline

Keep: *The easiest way to earn stocks* — LP, pitch video, submit one-liner. Fits Stocklana; don't dilute.
