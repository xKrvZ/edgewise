# TradeJournal Feature Matrix

Competitor audit for `apps/web` + `apps/api`.  
Last updated: 2026-06-06.

## Summary counts

| Status | Count | Meaning |
|--------|------:|---------|
| ✅ Implemented | 52 | Works in code today |
| 🟡 Partial | 18 | Exists but incomplete |
| ❌ Missing | 12 | Not built |
| 🚫 Deferred | 22 | Out of scope this sprint |

---

## General

| Feature | Status | Notes |
|---------|--------|-------|
| Multiple trading accounts | ✅ | Live, paper, prop types; CRUD + archive |
| Account currency (multi-currency) | ✅ | 10 currencies in account form |
| Starting / current balance | ✅ | Per account |
| Prop firm risk limits on account | ✅ | Profit target, daily/max loss, trailing DD |
| Manual trade entry | ✅ | Multi-step wizard |
| CSV import | ✅ | Trades page; column mapping incl. fees |
| Broker auto-sync imports | 🚫 | Needs broker API partnerships |
| Trade sharing / public profile | 🚫 | Social layer not built |
| Shared playbooks | 🚫 | Single-user only |
| Commissions & fees on trades | ✅ | `fees` field; net P&L = gross − fees |
| Fees in analytics / dashboard | ✅ | `totalFees` in overview; dashboard hint |
| Storage tiers (1GB / 5GB) | 🚫 | SaaS tiering / billing not implemented |
| Screenshot & video upload | ✅ | S3-backed; trade + playbook pages |
| Image upload on trade form | 🟡 | Upload on trade **detail** page, not inline in form |

---

## Journal & Analytics

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard overview | ✅ | Net P&L, Sharpe, drawdown, trader score |
| Trader composite score | ✅ | 6-factor breakdown + radar |
| Equity curve | ✅ | Daily cumulative |
| P&L over time / calendar | ✅ | Bar chart + heatmap + full calendar |
| Account balance chart | ✅ | Starting balance + cumulative P&L |
| Drawdown chart | ✅ | Peak-to-trough |
| Trade duration scatter | ✅ | Hold time vs P&L |
| R-multiple distribution | ✅ | Bucketed histogram |
| Performance by setup/symbol | ✅ | Analytics tabs |
| Performance by session / DOW / TOD | ✅ | Timing tab |
| Performance by mistake / direction | ✅ | Behavior tab |
| Performance by account | ✅ | Accounts tab |
| Custom tags on trades | ✅ | Multi-select on trade form |
| Tag filter on trades list | ✅ | Filter bar + URL params |
| Tag categories (setup/mistake/custom) | ✅ | DB + API; shown in filters |
| Tag management UI | 🟡 | API exists; no dedicated settings page |
| Mistake tracking | ✅ | Separate entity + analytics |
| Win rate / profit factor / expectancy | ✅ | Dashboard + analytics |
| Wins vs losses report | ✅ | Analytics → Wins vs losses tab |
| Compare periods | ✅ | Analytics → Compare tab |
| Drill-down from stats to trades | 🟡 | Playbook links work; generic drill-down limited |
| Progress tracker / activity heatmap | ✅ | GitHub-style grid on dashboard |
| AI period review | ✅ | Deterministic provider |
| AI trade review | ✅ | Trade detail card |
| Notebook / journal | ✅ | Renamed in nav; daily entries + mood |
| Notebook templates | ✅ | Daily review, pre-market, post-session |
| Link journal entries to trades | ✅ | Multi-trade picker |
| Risk per trade (SL/TP calc) | ✅ | Risk, reward, R:R in trade form |
| Running P&L during trade | ❌ | Not tracked live (only final P&L) |
| MAE / MFE | 🟡 | Estimated from candles on replay page |
| MAE / MFE stored on trade | 🟡 | DB columns added; not auto-persisted yet |
| Level II / time & sales | 🚫 | Market data license + infra |
| Economic calendar | 🚫 | Third-party data feed |
| Options-specific analytics | 🚫 | No options greeks / exp reports |
| 50+ custom reports | 🚫 | Enterprise reporting suite |
| Seconds-level data | 🚫 | Mock candles min 1m |

---

## Reporting

| Feature | Status | Notes |
|---------|--------|-------|
| Date range filters (global) | ✅ | Date range store + filter bar |
| Account filter | ✅ | Account switcher |
| Market type / direction filters | ✅ | Analytics + trades |
| Wins vs losses breakdown | ✅ | Counts, gross, avg hold, fees |
| Compare two date ranges | ✅ | Compare periods section |
| Export PDF / share report | ❌ | Not built |
| Scheduled email reports | ❌ | Not built |

---

## Playbook

| Feature | Status | Notes |
|---------|--------|-------|
| Create / edit playbooks | ✅ | Name, description, rules fields |
| Checklist items | ✅ | Sortable checklist editor |
| Link trades to playbook | ✅ | Trade form setup field |
| Playbook detail + linked trades | ✅ | Stats + table |
| Playbook screenshots | ✅ | Gallery on detail page |
| Playbook performance analytics | ✅ | List page + analytics by-setup |
| Playbook adherence score | 🟡 | Client-side from execution rating |
| Shared / community playbooks | 🚫 | Social feature |

---

## Backtesting

| Feature | Status | Notes |
|---------|--------|-------|
| Create backtest sessions | ✅ | Symbol, date range, notes |
| Chart replay while backtesting | ✅ | Shared replay engine |
| Log backtest trades on chart | ✅ | Entry/exit from replay position |
| Backtest analytics dashboard | ✅ | Overview, equity, drawdown |
| Compare backtest vs live | ✅ | Side panel in workspace |
| Speed control 0.5×–10× | ✅ | Replay engine speeds |
| Multi-chart (8 charts) | 🚫 | Single chart workspace |
| Multi-pair (5 pairs) | 🚫 | One symbol per session |
| Historical tick data | 🚫 | Mock OHLC only |

---

## Trade Replay

| Feature | Status | Notes |
|---------|--------|-------|
| Replay by trade | ✅ | From trade detail → replay |
| Replay by symbol/day | ✅ | Manual setup mode |
| Playback controls | ✅ | Play, step, seek, reset |
| Speed 0.5×–10× | ✅ | 0.5, 1, 2, 3, 5, 10 |
| Entry/exit markers | ✅ | Chart markers |
| Stop / target lines | ✅ | Horizontal markers |
| TradingView chart option | 🟡 | Lightweight default; TV if library present |
| Keyboard shortcuts | ✅ | Space, arrows, Home |
| Replay notes panel | ✅ | Side panel textarea |
| MAE/MFE during replay | 🟡 | Candle-based estimate in side panel |

---

## Mentor / Education / Support

| Feature | Status | Notes |
|---------|--------|-------|
| Mentor mode | 🚫 | Multi-user coaching not built |
| Unlimited mentor invites | 🚫 | SaaS / roles not implemented |
| Education hub / university | 🚫 | Content platform out of scope |
| Community / forums | 🚫 | Not built |
| In-app chat support | ❌ | Not built |
| MFA / 2FA | 🚫 | Better Auth supports; not configured in UI |
| Prop firm challenge tracker | 🟡 | Merged into prop accounts; dedicated page exists |

---

## Implemented this session

- Analytics **total fees** in overview
- **Wins vs losses** analytics tab
- **Compare periods** analytics tab
- **Notebook** framing + **3 journal templates**
- **Tag categories** (setup / mistake / custom)
- **Risk / reward / R:R** display in trade form
- **MAE/MFE estimates** on replay page
- **Playbook performance** section on playbooks page
- Replay speeds extended to **0.5×–10×**
- Fees surfaced prominently in trade form + dashboard

---

## Top 10 recommended next features

1. **Broker CSV templates** — preset mappings for TD, IBKR, Tradovate
2. **Tag & mistake settings page** — CRUD UI with category picker
3. **Persist MAE/MFE** — compute on trade close from market data job
4. **Generic report drill-down** — click any analytics row → filtered trades list
5. **Running P&L overlay** — live unrealized P&L line during replay
6. **PDF/export** — downloadable monthly performance report
7. **Trade import API** — webhook for future broker sync
8. **Notebook full-text search** — search entries by content/tag
9. **TradingView indicators in replay** — EMA/VWAP presets for review

---

## Migration instructions

Run the new migration after pulling:

```bash
cd apps/api
bun run knex migrate:latest
```

Migration file: `apps/api/src/database/migrations/20260609000000_feature_gaps.ts`

Adds:
- `tag.category` (text, default `'custom'`)
- `trade.mae`, `trade.mfe` (nullable numeric)

Optional: regenerate Kysely types:

```bash
cd apps/api
bun run kysely-codegen
```

---

## Verification

```bash
bun run --filter @platform/api build
bun run --filter @platform/web build
```
