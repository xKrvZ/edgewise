import {
  CANDLE_INTERVALS,
  type CandleInterval,
} from '@/modules/market-data/constants/market-data.constants';

/** TradingView resolution string → internal candle interval. */
const TV_TO_INTERVAL: Record<string, CandleInterval> = {
  '1': '1m',
  '5': '5m',
  '15': '15m',
  '60': '1h',
  '240': '4h',
  D: '1d',
  '1D': '1d',
};

/** Internal candle interval → TradingView resolution string. */
const INTERVAL_TO_TV: Record<CandleInterval, string> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '1h': '60',
  '4h': '240',
  '1d': 'D',
};

export function parseResolution(resolution: string): CandleInterval | null {
  const normalized = resolution.trim();
  if ((CANDLE_INTERVALS as readonly string[]).includes(normalized)) {
    return normalized as CandleInterval;
  }
  return TV_TO_INTERVAL[normalized] ?? null;
}

export function toTradingViewResolution(interval: CandleInterval): string {
  return INTERVAL_TO_TV[interval];
}

export const SUPPORTED_TV_RESOLUTIONS = Object.keys(TV_TO_INTERVAL);
