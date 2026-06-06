'use client';

import dynamic from 'next/dynamic';
import {
  CandlestickChart,
  type ChartMarker,
} from '@/components/replay/candlestick-chart';
import type { Candle, CandleInterval } from '@/lib/market-data';
import { isChartingLibraryAvailable } from '@/lib/tradingview/library';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const TradingViewChart = dynamic(
  () =>
    import('@/components/charts/tradingview-chart').then((mod) => mod.TradingViewChart),
  { ssr: false },
);

export type ChartRenderer = 'tradingview' | 'lightweight';

export interface MarketChartProps {
  symbol: string;
  interval: CandleInterval;
  candles: Candle[];
  visibleCount?: number;
  markers?: ChartMarker[];
  height?: number;
  className?: string;
  fill?: boolean;
  onPriceClick?: (candle: Candle, index: number) => void;
  /** Called once the preferred renderer is chosen. */
  onRendererResolved?: (renderer: ChartRenderer) => void;
}

/**
 * Unified chart for backtest/replay: uses TradingView Advanced Charting Library
 * when licensed files are present under `public/charting_library/`, otherwise
 * falls back to Lightweight Charts with the same candle/marker props.
 */
export function MarketChart({
  symbol,
  interval,
  candles,
  visibleCount,
  markers = [],
  height = 380,
  className,
  fill = false,
  onPriceClick,
  onRendererResolved,
}: MarketChartProps) {
  const [renderer, setRenderer] = useState<ChartRenderer | null>(null);
  const [useTradingView, setUseTradingView] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void isChartingLibraryAvailable().then((available) => {
      if (cancelled) return;
      const chosen: ChartRenderer = available ? 'tradingview' : 'lightweight';
      setUseTradingView(available);
      setRenderer(chosen);
      onRendererResolved?.(chosen);
    });
    return () => {
      cancelled = true;
    };
  }, [onRendererResolved]);

  if (renderer === null) {
    return (
      <div
        className={cn(
          'animate-pulse bg-muted/30',
          fill ? 'h-full w-full' : 'rounded-lg',
          className,
        )}
        style={fill ? undefined : { height }}
      />
    );
  }

  if (useTradingView) {
    return (
      <TradingViewChart
        symbol={symbol}
        interval={interval}
        candles={candles}
        visibleCount={visibleCount}
        markers={markers}
        height={height}
        fill={fill}
        className={className}
      />
    );
  }

  return (
    <CandlestickChart
      candles={candles}
      visibleCount={visibleCount}
      markers={markers}
      height={height}
      fill={fill}
      className={className}
      onPriceClick={onPriceClick}
    />
  );
}
