# FreeCash Gamification Research

**Version 1.0** · 2026-09-14  
**Priority:** P2-1 (see [STOCKLANA-BACKLOG.md](./STOCKLANA-BACKLOG.md))  
**Status:** Research complete; implementation backlog defined

---

## Purpose

Document FreeCash's gamification patterns for potential Freestocks adoption. This research incorporates corrections from Anywhere Cash Founding Strategy v2, which identified several misconceptions about FreeCash's actual mechanics.

**Key insight:** The offerwall itself is commodity infrastructure. Gamification and onboarding flow are where FreeCash creates conversion advantage.

---

## 1. FreeCash Onboarding — How It Actually Works (2026)

### Corrected Understanding

Previous assumptions about FreeCash were partially wrong. Based on Anywhere Cash v2 analysis and direct observation:

| Aspect | Previous Assumption | Actual Behavior |
|--------|---------------------|-----------------|
| First offer | User browses freely | **Single-offer lock** — new users see one curated high-value offer until completed |
| Signup bonus | Small welcome credit | **~35-50% of first cashout threshold** — substantial endowed progress |
| Headline earnings | Median user earnings | **Full milestone chain total** — aspirational, not typical |
| Unlock progression | Linear from $0 | **Progressive unlock** — features/thresholds gate behind offer completion |

### The Actual Flow

```
1. Landing → see "$500+ earned" headlines (= full chain, not median)
2. Signup → receive ~$1.75 bonus (if $5 min = 35% endowed)
3. Dashboard locked to SINGLE featured offer
4. Complete offer → unlock full offerwall + next threshold meter
5. "Next cashout" progress bar always visible
6. Repeat with increasing engagement hooks
```

### Why This Works — Economics

| Who Pays | Amount | Purpose |
|----------|--------|---------|
| Advertiser (CPA) | $3-15+ per offer | Funds most of path-to-threshold |
| FreeCash (signup bonus) | ~$1.50-2.50 | Endowed progress; cash-at-risk << sticker value |
| User | Attention + time | Completes advertiser goal |

**Critical insight:** Company cash-at-risk is much smaller than the "bonus" feels. A $1.75 signup bonus on a $5 threshold means FreeCash risks $1.75 max, but the *perceived* progress is 35%. First offer CPA often exceeds remaining $3.25 needed.

---

## 2. Surface Catalog

### 2.1 Landing Page

| Element | Pattern | Freestocks Status |
|---------|---------|-------------------|
| Hero headline | Large $ figure (aspirational) | ⚠️ Have hero; no $ claim yet |
| Social proof counters | "X users earned $Y" | 🔲 Not implemented |
| Trust badges | Payment method logos, ratings | 🔲 Not implemented |
| Single CTA | "Start Earning" dominant | ✅ Have CTA |
| Testimonial cards | User photos + earnings | 🔲 Not implemented |

### 2.2 App Shell

| Element | Pattern | Freestocks Status |
|---------|---------|-------------------|
| Balance display | Always visible, prominent | ✅ Implemented |
| Progress meter | "Next cashout: $X.XX to go" | 🔲 Not implemented |
| Notification badge | Offers/bonuses available | 🔲 Not implemented |
| Tab navigation | Earn / Offers / Profile | ✅ Implemented (header/footer) |

### 2.3 Earn Tab

| Element | Pattern | Freestocks Status |
|---------|---------|-------------------|
| Offer cards | Image, title, payout, "Start" | ✅ BitLabs/Ayet iframes |
| Sort/filter chips | "Highest paying", "Fastest" | 🔲 Not implemented (iframe limitation) |
| Bonus multiplier badge | "2x points today!" | 🔲 Not implemented |
| Category tabs | Games, Surveys, Signups | ✅ BitLabs/Ayet tabs |
| Featured offer lock | Single offer for new users | 🔲 Not implemented |

### 2.4 My Offers / History

| Element | Pattern | Freestocks Status |
|---------|---------|-------------------|
| In-progress offers | Status, remaining steps | 🔲 Not implemented |
| Completed offers | Payout, date, tx link | 🔲 Partial (balance history) |
| Pending review | "Verifying..." state | 🔲 Not implemented |

### 2.5 Quests & Streaks

| Element | Pattern | Freestocks Status |
|---------|---------|-------------------|
| Daily login bonus | Small credit for return | 🔲 Not implemented |
| Streak counter | "Day 5 — bonus at 7!" | 🔲 Not implemented |
| Achievement badges | Milestone unlocks | 🔲 Not implemented |
| Referral program | "Earn $X per friend" | 🔲 Not implemented |

---

## 3. Gap Analysis — Sampo/LootGO Precedent

Before adopting FreeCash patterns wholesale, assess what Sampo ecosystem has already shipped:

| Pattern | LootGO/Sampo Status | Freestocks Applicability |
|---------|---------------------|-------------------------|
| Lottery/gacha | ✅ LootGO core mechanic | ⚠️ Different product; lottery doesn't fit "earn stocks" |
| Leaderboard | ✅ LootGO competitive | ⚠️ May work for referrals; not core earn flow |
| Streak bonuses | 🔲 Not shipped | ✅ Transferable — implement |
| Progress meters | 🔲 Not shipped | ✅ Transferable — implement |
| Single-offer lock | 🔲 Not shipped | ✅ Experiment candidate |

**Conclusion:** Don't blind-import LootGO lottery/leaderboard. Freestocks earn flow is closer to FreeCash than LootGO. Adopt progress/streak patterns; evaluate competitive elements separately.

---

## 4. Dark Pattern Taxonomy

Catalog of engagement patterns with ethical assessment:

### Patterns IN (acceptable with care)

| Code | Pattern | Description | Risk Level |
|------|---------|-------------|------------|
| A | Endowed progress | Signup bonus toward threshold | Low — transparent value |
| B | Progress visualization | "X% to next cashout" meter | Low — helpful UX |
| C | Loss aversion framing | "Don't lose your progress" | Medium — use sparingly |
| D | Social proof (real) | Actual user counts/earnings | Low — if accurate |
| E | Streak rewards | Bonus for consecutive days | Low — rewards engagement |
| F | Achievement unlocks | Badges for milestones | Low — positive reinforcement |
| G | Limited-time offers | Real expiring promotions | Medium — must be genuine |
| H | Referral incentives | Credit for friend signups | Low — standard practice |
| I | Tiered thresholds | Unlock better rates at volume | Low — rewards loyalty |
| J | Notification prompts | "New offers available" | Medium — respect frequency |

### Patterns OUT (explicitly rejected)

| Pattern | Reason | Regulatory Risk |
|---------|--------|-----------------|
| **Ticking yield / countdown** | Creates false urgency; anxiety-driven | FTC scrutiny |
| **Ban-before-cashout** | Fraud accusation to avoid payout | Litigation risk; reputation |
| **Misleading $/hr claims** | "Earn $35/hr!" when median is $2 | FTC 2026 enforcement trend |
| **Featured deposit gambling** | Promoting casino offers prominently | Regulatory; brand risk |
| **Fake counts/countdowns** | "Only 3 left!" when unlimited | FTC deceptive practices |
| **Silent balance expiry** | Forfeiture without clear notice | Consumer protection laws |
| **Shareholder overclaim** | "You're a real investor!" for $0.50 | Securities misrepresentation |

---

## 5. Implementation Backlog

### P1 — High-impact, lower effort

| ID | Item | Description | Effort |
|----|------|-------------|--------|
| G-P1-1 | Next-unlock meter | Progress bar in app shell: "$X.XX to next cashout" | Small |
| G-P1-2 | Balance chips | Animated balance update on credit | Small |
| G-P1-3 | Signup bonus | $1.00-1.75 credit on verified signup | Small (backend) |
| G-P1-4 | Completion celebration | Confetti/animation on threshold reach | Small |

### P2 — Higher impact, more effort

| ID | Item | Description | Effort |
|----|------|-------------|--------|
| G-P2-1 | Single-offer experiment | New user sees one curated offer until complete | Medium |
| G-P2-2 | Streak system | Daily login bonus + streak multiplier | Medium |
| G-P2-3 | Achievement badges | Milestone unlocks with visual rewards | Medium |
| G-P2-4 | Referral program | Credit for friend signups | Medium |
| G-P2-5 | Social proof (real) | "X users earned today" with real data | Small |

### P3 — Deferred / evaluate later

| ID | Item | Description | Notes |
|----|------|-------------|-------|
| G-P3-1 | Leaderboard | Competitive earnings display | Evaluate if fits stock product |
| G-P3-2 | Limited-time multipliers | "2x earnings this weekend" | Need advertiser coordination |
| G-P3-3 | Push notifications | Re-engagement prompts | Mobile app prerequisite |

---

## 6. Design Rules

Eight transferable principles adapted from Anywhere Cash Founding Strategy v2 §2.1.1:

### Rule 1: Endowed Progress Works
Give users meaningful progress toward first threshold at signup. 35-50% feels substantial; company risk is capped.

### Rule 2: Headline ≠ Median
Aspirational earnings figures drive signups. Clearly distinguish "top earners" from "typical" in fine print, not headline.

### Rule 3: Single-Offer Lock Increases Completion
Paradox of choice: fewer options → higher conversion. New users don't need the full offerwall immediately.

### Rule 4: Progress Bars Beat Numbers
"$3.25 to go" < visual meter at 65%. Humans respond to spatial progress representation.

### Rule 5: Celebrate Thresholds
Cashout unlock is a win. Confetti, sound, modal — make it feel like achievement, not transaction.

### Rule 6: Streaks Create Habit
Daily return bonus + streak counter builds routine. Compound small rewards for consistency.

### Rule 7: Real Social Proof Only
Fake counters are detectable and destroy trust. Real-time "X earned today" with actual data, or nothing.

### Rule 8: Reject Dark Patterns by Name
Maintain explicit OUT list. When evaluating new feature, check against taxonomy. If it matches an OUT pattern, reject regardless of conversion lift.

---

## 7. Reference Assets

| Asset | Path / Location |
|-------|-----------------|
| FreeCash screenshots | `/research/freecash-captures/` (if collected) |
| Anywhere Cash v2 doc | External — Sampo internal docs |
| LootGO patterns | `/research/lootgo-patterns/` (if collected) |
| This document | `docs/FREECASH-GAMIFICATION.md` |

---

## 8. Closing

FreeCash's conversion advantage comes from **onboarding flow and gamification**, not the offerwall itself. Freestocks can adopt these patterns selectively:

- **Yes:** Endowed progress, progress meters, streaks, real social proof
- **No:** Ticking countdowns, fake urgency, misleading earnings claims
- **Experiment:** Single-offer lock for new users

The stock-on-Solana sink is Freestocks' moat. Gamification is the conversion multiplier.

---

*P2-1 research complete. Implementation backlog ready for prioritization.*
