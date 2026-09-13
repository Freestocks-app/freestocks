# Freestocks × Stocklana — Backlog

Last updated: 2026-09-13  
Branch: `stocklana/privy-solana-unlock`  
Tagline (locked): **The easiest way to earn stocks**

## North star (hackathon)

Happy path judges can feel in <2 min (prefer **mobile** demo):  
LP → signup → Earn visible → funded balance → Unlock → **fixed-email Privy OTP** → Solana wallet → stock arrives (tx link).

This branch is **not** FOMO / RH Chain. Exit rail = Privy embedded Solana wallet. Treasury pays send gas; **Privy gas sponsorship = later (P2)**.

---

## P0 — finish completely first (dev)

| ID | Item | Notes |
|----|------|-------|
| P0-1 | Branch + feature flag | `UNLOCK_RAIL=solana` on this branch; keep better-auth for app login |
| P0-2 | **Privy Unlock UI** | Email field **fixed / greyed out** (= session email). Tap → OTP to that email only. Mismatch rejected |
| P0-3 | **Privy Unlock impl** | OTP success → embedded Solana wallet created/linked → store address on redeem |
| P0-4 | Demo credit → redeem → treasury send | One working send to Privy wallet address; tx link in UI/control. No gas sponsorship product yet |
| P0-5 | Copy alignment (this branch) | Remove "Coming soon" / Terms "not yet available" / FOMO+RH Chain receive framing. Story = earn → Solana wallet stocks |

## P1 — polish that wins

| ID | Item | Notes |
|----|------|-------|
| P1-1 | **Mobile responsive — all pages** | Audit every route vs FreeCash mobile. Desktop header / mobile footer already exist — make each page feel native on phone |
| P1-2 | Pages to verify | `/` LP, `/sign-in`, `/sign-up`, `/earn`, `/offers`, `/unlock`, `/faq`, `/privacy`, `/terms` (+ control if shown) |
| P1-3 | Pitch + submit | 60–90s **mobile** screen recording; Preview URL; GitHub; hackathons.solana.com submit |

## P2 — attractiveness / later product

| ID | Item | Notes |
|----|------|-------|
| P2-1 | **FreeCash-style gamification / dark patterns** | Urgency, social proof, progress/FOMO chrome, offer card pressure — polish that makes LP+Earn addictive. Explicit backlog item for Stocklana attractiveness |
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
