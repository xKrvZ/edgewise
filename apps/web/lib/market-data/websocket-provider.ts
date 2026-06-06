'use client';

import { getMarketDataSocket } from '@/lib/market-data/socket-client';
import type {
  Candle,
  GetCandlesParams,
  MarketDataProvider,
  SubscribeParams,
} from '@/lib/market-data/types';

const SNAPSHOT_TIMEOUT_MS = 15_000;

let requestCounter = 0;
function nextRequestId(): string {
  requestCounter += 1;
  return `req_${Date.now()}_${requestCounter}`;
}

interface SnapshotPayload {
  requestId: string;
  candles: Candle[];
}
interface TickPayload {
  requestId: string;
  candle: Candle;
}
interface CompletePayload {
  requestId: string;
}
interface ErrorPayload {
  requestId: string;
  message: string;
}

/**
 * Market-data provider backed by the authenticated `/market-data` websocket.
 * Implements the same `MarketDataProvider` interface the UI already depends
 * on, so every existing consumer keeps working — the data is now sourced from
 * the server over an authenticated socket instead of generated in the browser.
 */
export class WebSocketMarketDataProvider implements MarketDataProvider {
  readonly id = 'websocket';

  getCandles({ symbol, from, to, interval }: GetCandlesParams): Promise<Candle[]> {
    const socket = getMarketDataSocket();
    const requestId = nextRequestId();

    return new Promise<Candle[]>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        socket.off('candles:snapshot', onSnapshot);
        socket.off('candles:error', onError);
        socket.off('connect_error', onConnectError);
      };

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Timed out waiting for market data'));
      }, SNAPSHOT_TIMEOUT_MS);

      const onSnapshot = (payload: SnapshotPayload) => {
        if (payload.requestId !== requestId) return;
        cleanup();
        resolve(payload.candles ?? []);
      };
      const onError = (payload: ErrorPayload) => {
        if (payload.requestId !== requestId) return;
        cleanup();
        reject(new Error(payload.message || 'Market data error'));
      };
      const onConnectError = (err: Error) => {
        cleanup();
        reject(new Error(err?.message || 'Could not connect to market data feed'));
      };

      socket.on('candles:snapshot', onSnapshot);
      socket.on('candles:error', onError);
      socket.on('connect_error', onConnectError);

      socket.emit('candles:subscribe', {
        requestId,
        symbol,
        interval,
        from,
        to,
        mode: 'snapshot',
      });
    });
  }

  /**
   * Server-driven replay: the backend streams candles in order at a cadence
   * derived from `speed`. Returns a canceller that unsubscribes the stream.
   */
  subscribe(
    { symbol, from, to, interval, speed = 1 }: SubscribeParams,
    onTick: (candle: Candle) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void,
  ): () => void {
    const socket = getMarketDataSocket();
    const requestId = nextRequestId();

    const cleanup = () => {
      socket.off('candles:tick', onTickEvt);
      socket.off('candles:complete', onCompleteEvt);
      socket.off('candles:error', onErrorEvt);
    };

    const onTickEvt = (payload: TickPayload) => {
      if (payload.requestId !== requestId) return;
      onTick(payload.candle);
    };
    const onCompleteEvt = (payload: CompletePayload) => {
      if (payload.requestId !== requestId) return;
      cleanup();
      onComplete?.();
    };
    const onErrorEvt = (payload: ErrorPayload) => {
      if (payload.requestId !== requestId) return;
      cleanup();
      onError?.(new Error(payload.message || 'Market data error'));
    };

    socket.on('candles:tick', onTickEvt);
    socket.on('candles:complete', onCompleteEvt);
    socket.on('candles:error', onErrorEvt);

    socket.emit('candles:subscribe', {
      requestId,
      symbol,
      interval,
      from,
      to,
      mode: 'replay',
      speed,
    });

    return () => {
      socket.emit('candles:unsubscribe', { requestId });
      cleanup();
    };
  }
}
