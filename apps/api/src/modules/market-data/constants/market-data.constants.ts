/**
 * Injection token for the active market-data provider. Bind a real vendor /
 * broker feed to this token to replace the mock without touching the gateway
 * or service.
 */
export const MARKET_DATA_PROVIDER = Symbol('MARKET_DATA_PROVIDER');

export const CANDLE_INTERVALS = [
  '1m',
  '5m',
  '15m',
  '1h',
  '4h',
  '1d',
] as const;

export type CandleInterval = (typeof CANDLE_INTERVALS)[number];

export const INTERVAL_MS: Record<CandleInterval, number> = {
  '1m': 60_000,
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
  '1h': 60 * 60_000,
  '4h': 4 * 60 * 60_000,
  '1d': 24 * 60 * 60_000,
};

/** Hard cap on candles returned/streamed for a single request. */
export const MAX_CANDLES = 5000;

/** Base cadence (ms) for a 1x replay tick; divided by `speed`. */
export const REPLAY_BASE_TICK_MS = 250;

export const MIN_REPLAY_SPEED = 0.25;
export const MAX_REPLAY_SPEED = 64;
