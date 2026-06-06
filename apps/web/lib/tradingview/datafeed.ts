import { API_URL } from '@/lib/api';
import type { ChartMarker } from '@/components/replay/candlestick-chart';
import { chartMarkersToTvMarks } from '@/lib/tradingview/markers';
import { SUPPORTED_TV_RESOLUTIONS } from '@/lib/tradingview/resolutions';
import type {
  Bar,
  DatafeedConfiguration,
  HistoryMetadata,
  IBasicDataFeed,
  LibrarySymbolInfo,
  Mark,
  PeriodParams,
  ResolutionString,
} from '@/lib/tradingview/types';

interface UdfHistoryOk {
  s: 'ok';
  t: number[];
  o: number[];
  h: number[];
  l: number[];
  c: number[];
  v: number[];
}

interface UdfHistoryNoData {
  s: 'no_data';
  nextTime?: number;
}

interface UdfHistoryError {
  s: 'error';
  errmsg: string;
}

type UdfHistory = UdfHistoryOk | UdfHistoryNoData | UdfHistoryError;

export interface TradeJournalDatafeedOptions {
  /** Bar marks (entries/exits) shown on the chart. */
  markers?: ChartMarker[];
}

export type TradeJournalDatafeed = IBasicDataFeed & {
  setMarkers: (markers: ChartMarker[]) => void;
};

function pricescaleFor(symbol: string): number {
  const upper = symbol.toUpperCase();
  if (upper.includes('USD') && !upper.startsWith('BTC') && !upper.startsWith('ETH')) {
    return 100_000;
  }
  if (upper.startsWith('BTC') || upper.startsWith('ETH')) return 100;
  return 100;
}

/**
 * Custom TradingView datafeed backed by TradeJournal's UDF-compatible
 * `/api/market-data/history` endpoint. Session cookies are sent automatically.
 */
export function createTradeJournalDatafeed(
  options: TradeJournalDatafeedOptions = {},
): TradeJournalDatafeed {
  let markers: Mark[] = chartMarkersToTvMarks(options.markers ?? []);

  const datafeed: IBasicDataFeed = {
    onReady(callback) {
      fetch(`${API_URL}/market-data/config`, { credentials: 'include' })
        .then((res) => res.json())
        .then((config: DatafeedConfiguration) => {
          callback({
            ...config,
            supported_resolutions: SUPPORTED_TV_RESOLUTIONS,
            supports_marks: true,
            supports_timescale_marks: true,
          });
        })
        .catch(() => {
          callback({
            supported_resolutions: SUPPORTED_TV_RESOLUTIONS,
            supports_marks: true,
            supports_timescale_marks: true,
            exchanges: [{ value: 'TJ', name: 'TradeJournal', desc: 'Simulated feed' }],
          });
        });
    },

    resolveSymbol(symbolName, onResolve, onError) {
      try {
        const symbol: LibrarySymbolInfo = {
          name: symbolName,
          ticker: symbolName,
          description: symbolName,
          type: 'stock',
          session: '24x7',
          timezone: 'Etc/UTC',
          exchange: 'TJ',
          listed_exchange: 'TradeJournal',
          format: 'price',
          minmov: 1,
          pricescale: pricescaleFor(symbolName),
          has_intraday: true,
          has_daily: true,
          has_weekly_and_monthly: false,
          supported_resolutions: SUPPORTED_TV_RESOLUTIONS,
          volume_precision: 0,
          data_status: 'endofday',
        };
        setTimeout(() => onResolve(symbol), 0);
      } catch (error) {
        onError(String(error));
      }
    },

    getBars(_symbolInfo, resolution, periodParams, onResult, onError) {
      const { from, to } = periodParams;
      const url = new URL(`${API_URL}/market-data/history`);
      url.searchParams.set('symbol', _symbolInfo.name);
      url.searchParams.set('resolution', resolution);
      url.searchParams.set('from', String(from));
      url.searchParams.set('to', String(to));

      fetch(url, { credentials: 'include' })
        .then((res) => {
          if (!res.ok) throw new Error(res.statusText);
          return res.json() as Promise<UdfHistory>;
        })
        .then((payload) => {
          if (payload.s === 'error') {
            onError(payload.errmsg);
            return;
          }
          if (payload.s === 'no_data') {
            onResult([], { noData: true, nextTime: payload.nextTime ?? null });
            return;
          }

          const bars: Bar[] = payload.t.map((time, i) => ({
            time: time * 1000,
            open: payload.o[i],
            high: payload.h[i],
            low: payload.l[i],
            close: payload.c[i],
            volume: payload.v[i],
          }));
          onResult(bars, { noData: bars.length === 0 });
        })
        .catch((error: Error) => onError(error.message));
    },

    getMarks(_symbolInfo, from, to, onDataCallback, _resolution) {
      const visible = markers.filter((m) => m.time >= from && m.time <= to);
      onDataCallback(visible);
    },
  };

  return {
    ...datafeed,
    setMarkers(next: ChartMarker[]) {
      markers = chartMarkersToTvMarks(next);
    },
  };
}
