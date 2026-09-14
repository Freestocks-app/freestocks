# Tokenized Stocks on Solana

**Last Updated:** 2026-09-14  
**Purpose:** Document tokenized stock issuers available for Freestocks unlock feature

---

## Overview

Freestocks allows users to redeem earned USD credits for tokenized fractional shares of public companies. These are delivered as SPL tokens on Solana. This document tracks the three major issuer families we support.

**Data Module:** See `src/lib/tokenized-stocks.ts` for structured arrays used by UI components.

---

## 1. xStocks (Backed.fi)

**Suffix:** `x` (e.g., `TSLAx`, `NVDAx`)  
**Issuer:** Backed.fi  
**Characteristics:**
- Backed 1:1 by underlying assets
- Higher TVL per asset
- Established infrastructure

### TOP 10 by Market Cap (CMC-style)

| Rank | Token | Underlying | Notes |
|------|-------|------------|-------|
| 1 | STRCx | Strategy PP Variable | Variable rate product |
| 2 | CRCLx | Circle | Stablecoin issuer |
| 3 | MSTRx | Strategy (MicroStrategy) | Bitcoin treasury company |
| 4 | TSLAx | Tesla | EV / Energy |
| 5 | SPYx | S&P 500 ETF | Index tracking |
| 6 | SPCXx | SpaceX | Private / Pre-IPO |
| 7 | NVDAx | NVIDIA | AI / Semiconductors |
| 8 | QQQx | Nasdaq 100 ETF | Tech-heavy index |
| 9 | GOOGLx | Alphabet | Big tech |
| 10 | MIXUx | Mixue | F&B / China |

**Use in Freestocks:** Primary source for LP ticker and Unlock stock picker. xStocks TOP 10 serves as default exchange list.

---

## 2. Ondo Finance

**Suffix:** `on` (e.g., `TSLAon`, `NVDAon`)  
**Issuer:** Ondo Finance  
**Platform TVL:** ~$840M total (per RWA.xyz, figures fluctuate)

### Characteristics
- **Total-return trackers** — not 1:1 shareholder redeemable like Backpack
- Typically no US persons restrictions (verify per asset)
- Synthetic exposure model
- Higher liquidity for some assets

### Featured Assets

| Token | Underlying | Notes |
|-------|------------|-------|
| CRCLon | Circle | |
| IVVon | iShares Core S&P 500 | BlackRock ETF |
| SPYon | S&P 500 ETF | |
| MUon | Micron | Semiconductors |
| NVDAon | NVIDIA | |
| QQQon | Nasdaq 100 ETF | |
| TSLAon | Tesla | |
| GOOGLon | Alphabet | |
| SPCXon | SpaceX | |
| HIMSon | Hims & Hers | Healthcare / DTC |

**Use in Freestocks:** Secondary option. Flag as total-return trackers in UI when displaying.

---

## 3. Backpack Securities

**Naming:** Uses standard ticker symbols (no suffix)  
**Issuer:** Backpack Exchange / FTX successor entity  
**Total Assets:** ~41 tokenized stocks

### Characteristics
- **1:1 redeemable** — emphasis on direct ownership
- Users can redeem for actual shares through Backpack
- On-chain market cap often smaller than xStocks/Ondo TVL
- Volume-led trading activity
- US regulatory considerations apply

### Flagship & Featured

| Token | Company | Notes |
|-------|---------|-------|
| SPCX | SpaceX | Flagship offering |
| MU | Micron | |
| MSTR | Strategy | |
| NVDA | NVIDIA | |
| DNUT | Krispy Kreme | |
| TSLA | Tesla | |
| AAPL | Apple | |
| AMZN | Amazon | |
| GOOGL | Alphabet | |
| META | Meta | |
| MSFT | Microsoft | |

### September 2026 Expansion Batch

Added ~13 new tokens:

| Token | Company |
|-------|---------|
| BA | Boeing |
| BABA | Alibaba |
| COST | Costco |
| DELL | Dell |
| IBM | IBM |
| JNJ | Johnson & Johnson |
| PFE | Pfizer |
| RDDT | Reddit |
| RIVN | Rivian |
| SHOP | Shopify |
| SNAP | Snap |
| UPS | UPS |
| HIMS | Hims & Hers |

**Use in Freestocks:** Available as redemption option. Note 1:1 redeemability in UI.

---

## Data Freshness

| Metric | Notes |
|--------|-------|
| xStocks rankings | Per CoinMarketCap-style market cap, ~2026-09-14 |
| Ondo TVL | ~$840M total platform TVL, per RWA.xyz |
| Backpack count | ~41 assets as of Sep 2026 |

**Figures move.** Re-verify before major updates. TVL and rankings shift with market conditions.

---

## Implementation

### Data Module

```typescript
// src/lib/tokenized-stocks.ts
import { xStocksTop10, ondoFeatured, backpackFeatured, displayTop10 } from '@/lib/tokenized-stocks';

// LP ticker uses displayTop10 (xStocks-based)
// Unlock picker uses displayTop10 by default
// Issuer badges available via getIssuerBadge()
```

### UI Integration

1. **LP Ticker** — `displayTop10` array powers scrolling ticker
2. **Unlock Stock Picker** — User selects from `displayTop10`
3. **Issuer Badge** — Optional display showing xStocks/Ondo/Backpack source

---

## Regulatory Notes

- Tokenized securities involve securities law considerations
- Backpack 1:1 redeemable model has different regulatory profile than synthetic trackers
- Ondo total-return trackers typically exclude US persons
- Always verify current restrictions per issuer and jurisdiction
- Freestocks does not provide investment advice

---

## References

- Backed.fi: https://backed.fi
- Ondo Finance: https://ondo.finance
- Backpack Exchange: https://backpack.exchange
- RWA.xyz (TVL data): https://rwa.xyz
- CoinMarketCap (market cap rankings): https://coinmarketcap.com
