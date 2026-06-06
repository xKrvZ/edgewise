'use client';

import type { ChartMarker } from '@/components/replay/candlestick-chart';
import type { Candle, CandleInterval } from '@/lib/market-data';
import { buildChartWidgetOptions } from '@/lib/tradingview/chart-options';
import { type TradeJournalDatafeed, createTradeJournalDatafeed } from '@/lib/tradingview/datafeed';
import { candleIntervalToTvResolution } from '@/lib/tradingview/resolutions';
import type {
  IChartWidgetApi,
  IChartingLibraryWidget,
  ResolutionString,
} from '@/lib/tradingview/types';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';

const MARKER_COLORS: Record<ChartMarker['kind'], string> = {
  entry: '#22c55e',
  exit: '#3b82f6',
  stop: '#ef4444',
  target: '#f59e0b',
};

export interface TradingViewChartProps {
  symbol: string;
  interval: CandleInterval;
  candles: Candle[];
  visibleCount?: number;
  markers?: ChartMarker[];
  className?: string;
  fill?: boolean;
  height?: number;
}

export function TradingViewChart({
  symbol,
  interval,
  candles,
  visibleCount,
  markers = [],
  className,
  fill = false,
  height = 380,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<IChartingLibraryWidget | null>(null);
  const chartApiRef = useRef<IChartWidgetApi | null>(null);
  const datafeedRef = useRef<TradeJournalDatafeed | null>(null);
  const shapeIdsRef = useRef<string[]>([]);
  const [ready, setReady] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container || candles.length === 0 || !window.TradingView?.widget) return;

    const datafeed = createTradeJournalDatafeed({ markers });
    datafeedRef.current = datafeed;

    const widget = new window.TradingView!.widget(
      buildChartWidgetOptions({
        symbol,
        interval: candleIntervalToTvResolution(interval) as ResolutionString,
        container,
        datafeed,
      }),
    );

    widgetRef.current = widget;
    widget.onChartReady(() => {
      if (cancelled) return;
      chartApiRef.current = widget.chart();
      setReady(true);
      applyReplayWindow(chartApiRef.current, candles, visibleCount);
      void drawPriceLines(chartApiRef.current, markers, shapeIdsRef);
    });

    return () => {
      cancelled = true;
      setReady(false);
      widgetRef.current?.remove();
      widgetRef.current = null;
      chartApiRef.current = null;
      datafeedRef.current = null;
      shapeIdsRef.current = [];
    };
  }, [symbol, interval, candles.length, resolvedTheme]);

  useEffect(() => {
    datafeedRef.current?.setMarkers(markers);
    if (!ready || !chartApiRef.current) return;
    applyReplayWindow(chartApiRef.current, candles, visibleCount);
    void redrawPriceLines(chartApiRef.current, markers, shapeIdsRef);
  }, [markers, visibleCount, candles, ready]);

  useEffect(() => {
    const container = containerRef.current;
    const widget = widgetRef.current;
    if (!container || !widget || !ready) return;

    const observer = new ResizeObserver(() => {
      const width = container.clientWidth;
      const chartHeight = fill ? container.clientHeight : height;
      if (width > 0 && chartHeight > 0) {
        try {
          widget.resize(width, chartHeight);
        } catch {
          // Widget may be tearing down during navigation.
        }
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [ready, fill, height]);

  if (!candles.length) {
    return (
      <div
        className={cn(
          'flex items-center justify-center border border-dashed border-border bg-muted/20 text-sm text-muted-foreground',
          fill ? 'h-full rounded-none' : 'rounded-lg',
          className,
        )}
        style={fill ? undefined : { height }}
      >
        No market data for this window.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full', fill && 'h-full', className)}
      style={fill ? undefined : { height }}
    />
  );
}

function applyReplayWindow(chart: IChartWidgetApi, candles: Candle[], visibleCount?: number) {
  if (visibleCount === undefined || candles.length === 0) return;
  const endIdx = Math.min(visibleCount, candles.length) - 1;
  if (endIdx < 0) return;

  const startIdx = Math.max(0, endIdx - 80);
  const from = Math.floor(candles[startIdx].time / 1000);
  const to = Math.floor(candles[endIdx].time / 1000) + 60;

  try {
    chart.setVisibleRange({ from, to });
  } catch {
    // Chart may not be ready for range changes on first paint.
  }
}

async function drawPriceLines(
  chart: IChartWidgetApi,
  markers: ChartMarker[],
  shapeIdsRef: { current: string[] },
) {
  for (const id of shapeIdsRef.current) {
    try {
      chart.removeEntity(id);
    } catch {
      // ignore stale ids
    }
  }
  shapeIdsRef.current = [];

  const horizontal = markers.filter(
    (m) => m.time === 0 || m.kind === 'stop' || m.kind === 'target',
  );

  for (const marker of horizontal) {
    const now = Math.floor(Date.now() / 1000);
    const id = await chart.createMultipointShape(
      [
        { time: now - 86_400, price: marker.price },
        { time: now, price: marker.price },
      ],
      {
        shape: 'horizontal_line',
        lock: true,
        disableSelection: true,
        disableSave: true,
        disableUndo: true,
        overrides: {
          linecolor: MARKER_COLORS[marker.kind],
          linewidth: 1,
          linestyle: 2,
          showLabel: true,
          text: marker.label ?? marker.kind,
        },
      },
    );
    if (id) shapeIdsRef.current.push(id);
  }
}

async function redrawPriceLines(
  chart: IChartWidgetApi,
  markers: ChartMarker[],
  shapeIdsRef: { current: string[] },
) {
  await drawPriceLines(chart, markers, shapeIdsRef);
}
