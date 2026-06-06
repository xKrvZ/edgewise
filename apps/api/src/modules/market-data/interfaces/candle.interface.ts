/** A single OHLCV candle. Times are epoch milliseconds for the candle open. */
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
