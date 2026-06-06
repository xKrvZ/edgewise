import type { ChartMarker } from '@/components/replay/candlestick-chart';
import { nearestCandleIndex } from '@/lib/chart-utils';
import { formatCurrency } from '@/lib/format';
import type { Candle } from '@/lib/market-data';
import type { BacktestTrade, TradeDirection } from '@/lib/types';

interface OpenPositionMarker {
  entryTime: number;
  entryPrice: number;
  direction: TradeDirection;
}

/**
 * Builds chart markers for recorded backtest trades and an optional open position,
 * respecting the current replay scrub position.
 */
export function buildBacktestTradeMarkers(
  trades: BacktestTrade[],
  candles: Candle[],
  visibleUntilIndex: number,
  openPosition?: OpenPositionMarker | null,
): ChartMarker[] {
  const markers: ChartMarker[] = [];

  for (const trade of trades) {
    const entryTime = new Date(trade.entryTime).getTime();
    const entryIdx = nearestCandleIndex(candles, entryTime);
    if (entryIdx > visibleUntilIndex) continue;

    markers.push({
      time: entryTime,
      price: trade.entryPrice,
      kind: 'entry',
      label: `${trade.direction === 'long' ? 'Long' : 'Short'} ${formatCurrency(trade.entryPrice)}`,
    });

    if (trade.exitPrice !== null && trade.exitTime) {
      const exitTime = new Date(trade.exitTime).getTime();
      const exitIdx = nearestCandleIndex(candles, exitTime);
      if (exitIdx <= visibleUntilIndex) {
        markers.push({
          time: exitTime,
          price: trade.exitPrice,
          kind: 'exit',
          label: `Exit ${formatCurrency(trade.exitPrice)}`,
        });
      }
    }

    if (trade.stopLoss !== null) {
      markers.push({ time: 0, price: trade.stopLoss, kind: 'stop', label: 'Stop' });
    }
    if (trade.takeProfit !== null) {
      markers.push({ time: 0, price: trade.takeProfit, kind: 'target', label: 'Target' });
    }
  }

  if (openPosition) {
    markers.push({
      time: openPosition.entryTime,
      price: openPosition.entryPrice,
      kind: 'entry',
      label: `Open ${formatCurrency(openPosition.entryPrice)}`,
    });
  }

  return markers;
}
