# TradingView Charting Library — TradeJournal integration

TradeJournal backtest and replay use a **unified chart** (`MarketChart`) that prefers the licensed **TradingView Advanced Charting Library** when its files are hosted locally. Without those files, the app **falls back to Lightweight Charts** (no built-in indicators or drawing tools).

## What is integrated

| Layer | Status |
| --- | --- |
| **Advanced Charting Library** | Wrapper + custom datafeed ready; requires licensed files in `public/charting_library/` |
| **UDF datafeed API** | `GET /api/market-data/history` + `GET /api/market-data/config` |
| **Indicators & drawings** | Enabled via `studies_access` / `drawings_access` when the library is present |
| **Meridian theme** | `chart-options.ts` overrides + `public/tradingview-theme.css` |
| **Trade markers** | Bar marks (entry/exit) via datafeed `getMarks`; stop/target as horizontal shapes |
| **Fallback** | Lightweight Charts (existing `candlestick-chart.tsx`) |

## Obtaining the Charting Library (license required)

1. Apply at [TradingView Charting Library](https://www.tradingview.com/free-charting-libraries/) (company / public web project; personal/hobby use is not granted).
2. After approval, clone the private repo or download the release bundle.
3. Copy these folders into the web app:

```
apps/web/public/charting_library/     # entire folder from the distribution
```

The app probes for:

```
/charting_library/charting_library.standalone.js
```

4. Restart `bun run --filter @platform/web dev` and open **Backtesting** or **Replay**. The side panel will show **TradingView Advanced Charts** instead of Lightweight Charts.

> **Do not commit** `charting_library/` to git — it is not redistributable. It is listed in the root `.gitignore`.

## Datafeed

The custom datafeed (`lib/tradingview/datafeed.ts`) implements TradingView's `IBasicDataFeed` and calls:

- `GET /api/market-data/config` — supported resolutions, marks
- `GET /api/market-data/history?symbol=&resolution=&from=&to=` — UDF OHLCV (`t/o/h/l/c/v` in Unix **seconds**)

Session cookies are sent (`credentials: 'include'`), same auth as the rest of the API.

### Resolutions

| TradingView | TradeJournal |
| --- | --- |
| `1` | `1m` |
| `5` | `5m` |
| `15` | `15m` |
| `60` | `1h` |
| `240` | `4h` |
| `D` | `1d` |

## Enabling indicators & drawings

Configured in `lib/tradingview/chart-options.ts`:

- `studies_access: { type: 'white', tools: [{ name: '*' }] }` — all built-in indicators
- `drawings_access: { type: 'white', tools: [{ name: '*' }] }` — all drawing tools
- `enabled_features` — study templates, fullscreen toolbar
- `disabled_features` — symbol search (single-symbol backtest context)

Add default studies after chart ready:

```ts
widget.onChartReady(() => {
  widget.chart().createStudy('Moving Average', false, false, { length: 20 });
});
```

## Optional: TradingView embed widget

The free **Advanced Chart embed widget** (iframe) includes some indicators but uses **TradingView-hosted data**, not TradeJournal's simulated feed. It is **not wired by default** because it cannot replay backtest candles from our API.

For a symbol-only preview you can embed manually from [TradingView widget docs](https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/).

## Files

| Path | Role |
| --- | --- |
| `components/charts/market-chart.tsx` | Chooses TV vs Lightweight |
| `components/charts/tradingview-chart.tsx` | Advanced Library widget host |
| `lib/tradingview/datafeed.ts` | Custom UDF datafeed |
| `lib/tradingview/chart-options.ts` | Widget config + Meridian overrides |
| `lib/tradingview/types.ts` | Minimal TV types (no licensed package) |
| `public/tradingview-theme.css` | Dark theme CSS variables |

## Next.js notes

- Chart loads **client-only** via `dynamic(..., { ssr: false })`.
- Library script is injected at runtime from `/charting_library/`.
- See [TradingView Next.js example](https://github.com/tradingview/charting-library-examples/tree/master/nextjs) for reference.
