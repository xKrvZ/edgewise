import type { CandleInterval } from '@/lib/market-data';
import type { ResolutionString } from '@/lib/tradingview/types';

const INTERVAL_TO_TV: Record<CandleInterval, ResolutionString> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '1h': '60',
  '4h': '240',
  '1d': 'D',
};

const TV_TO_INTERVAL: Record<string, CandleInterval> = {
  '1': '1m',
  '5': '5m',
  '15': '15m',
  '60': '1h',
  '240': '4h',
  D: '1d',
  '1D': '1d',
};

export function candleIntervalToTvResolution(interval: CandleInterval): ResolutionString {
  return INTERVAL_TO_TV[interval];
}

export function tvResolutionToCandleInterval(resolution: ResolutionString): CandleInterval {
  return TV_TO_INTERVAL[resolution] ?? '5m';
}

export const SUPPORTED_TV_RESOLUTIONS = Object.keys(TV_TO_INTERVAL);
