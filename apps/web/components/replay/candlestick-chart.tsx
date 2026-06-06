'use client';

import { nearestCandleIndex } from '@/lib/chart-utils';
import { formatCurrency } from '@/lib/format';
import type { Candle } from '@/lib/market-data';
import { cn } from '@/lib/utils';
import {
  CandlestickSeries,
  type CandlestickData,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  createSeriesMarkers,
} from 'lightweight-charts';
import { useTheme } from 'next-themes';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

export interface ChartMarker {
  time: number;
  price: number;
  kind: 'entry' | 'exit' | 'stop' | 'target';
  label?: string;
}

interface CandlestickChartProps {
  candles: Candle[];
  /** Index of the last visible candle (inclusive). Defaults to all. */
  visibleCount?: number;
  markers?: ChartMarker[];
  height?: number;
  className?: string;
  /** Stretch chart to fill its container height. */
  fill?: boolean;
  /** Called with the candle index nearest a click (for manual order entry). */
  onPriceClick?: (candle: Candle, index: number) => void;
}

const MARKER_COLORS: Record<ChartMarker['kind'], string> = {
  entry: 'hsl(142 76% 36%)',
  exit: 'hsl(221 83% 53%)',
  stop: 'hsl(0 84% 60%)',
  target: 'hsl(38 92% 50%)',
};

function toChartTime(ms: number): UTCTimestamp {
  return Math.floor(ms / 1000) as UTCTimestamp;
}

function readThemeColor(variable: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return value ? `hsl(${value})` : fallback;
}

export function CandlestickChart({
  candles,
  visibleCount,
  markers = [],
  height = 380,
  className,
  fill = false,
  onPriceClick,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const { resolvedTheme } = useTheme();

  const count = candles.length;
  const shown = visibleCount === undefined ? count : Math.min(visibleCount, count);
  const visibleCandles = useMemo(
    () => candles.slice(0, shown),
    [candles, shown],
  );

  const candleData = useMemo(
    (): CandlestickData<Time>[] =>
      visibleCandles.map((c) => ({
        time: toChartTime(c.time),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    [visibleCandles],
  );

  const seriesMarkers = useMemo((): SeriesMarker<Time>[] => {
    const result: SeriesMarker<Time>[] = [];
    for (const m of markers) {
      if (m.time === 0) continue;
      const idx = nearestCandleIndex(visibleCandles, m.time);
      if (idx < 0 || idx >= shown) continue;
      const isEntry = m.kind === 'entry';
      result.push({
        time: toChartTime(m.time),
        position: isEntry ? 'belowBar' : 'aboveBar',
        color: MARKER_COLORS[m.kind],
        shape: isEntry ? 'arrowUp' : 'circle',
        text: m.label ?? m.kind,
      });
    }
    return result;
  }, [markers, visibleCandles, shown]);

  const horizontalMarkers = useMemo(
    () => markers.filter((m) => m.time === 0 || m.kind === 'stop' || m.kind === 'target'),
    [markers],
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || count === 0) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: fill ? container.clientHeight : height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: readThemeColor('--muted-foreground', 'hsl(215 16% 47%)'),
        fontSize: 11,
      },
      grid: {
        vertLines: { color: readThemeColor('--border', 'hsl(214 32% 91%)'), style: LineStyle.Dotted },
        horzLines: { color: readThemeColor('--border', 'hsl(214 32% 91%)'), style: LineStyle.Dotted },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: readThemeColor('--border', 'hsl(214 32% 91%)') },
      timeScale: {
        borderColor: readThemeColor('--border', 'hsl(214 32% 91%)'),
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: readThemeColor('--success', 'hsl(142 76% 36%)'),
      downColor: readThemeColor('--destructive', 'hsl(0 84% 60%)'),
      borderVisible: false,
      wickUpColor: readThemeColor('--success', 'hsl(142 76% 36%)'),
      wickDownColor: readThemeColor('--destructive', 'hsl(0 84% 60%)'),
    });

    const markersPlugin = createSeriesMarkers(series);
    chartRef.current = chart;
    seriesRef.current = series;
    markersRef.current = markersPlugin;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      chart.applyOptions({
        width: Math.floor(rect.width),
        height: fill ? Math.floor(rect.height) : height,
      });
    });
    observer.observe(container);

    if (onPriceClick) {
      chart.subscribeClick((param) => {
        if (!param.time || !param.point) return;
        const timeMs = Number(param.time) * 1000;
        const idx = nearestCandleIndex(candles, timeMs);
        if (idx >= 0 && idx < shown) {
          onPriceClick(candles[idx], idx);
        }
      });
    }

    chart.subscribeCrosshairMove((param) => {
      if (!param.time) {
        setHoverIndex(null);
        return;
      }
      const timeMs = Number(param.time) * 1000;
      const idx = nearestCandleIndex(candles, timeMs);
      setHoverIndex(idx >= 0 && idx < shown ? idx : null);
    });

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      markersRef.current = null;
      priceLinesRef.current = [];
    };
  }, [count, fill, height, onPriceClick, candles, shown, resolvedTheme]);

  useLayoutEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart || count === 0) return;
    series.setData(candleData);
    if (visibleCount !== undefined && shown < count) {
      chart.timeScale().setVisibleLogicalRange({
        from: Math.max(0, shown - 80),
        to: shown + 8,
      });
    } else {
      chart.timeScale().fitContent();
    }
  }, [candleData, count, shown, visibleCount]);

  useLayoutEffect(() => {
    const series = seriesRef.current;
    const plugin = markersRef.current;
    if (!series || !plugin) return;

    plugin.setMarkers(seriesMarkers);

    for (const line of priceLinesRef.current) {
      series.removePriceLine(line);
    }
    priceLinesRef.current = [];

    for (const m of horizontalMarkers) {
      const line = series.createPriceLine({
        price: m.price,
        color: MARKER_COLORS[m.kind],
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: m.label ?? m.kind,
      });
      priceLinesRef.current.push(line);
    }
  }, [seriesMarkers, horizontalMarkers]);

  if (!count) {
    return (
      <div
        ref={containerRef}
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

  const hoverCandle = hoverIndex !== null ? candles[hoverIndex] : undefined;
  const lastVisible = candles[Math.max(0, shown - 1)];

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full', fill && 'h-full bg-background', className)}
    >
      {hoverCandle && (
        <div className="pointer-events-none absolute left-2 top-2 z-10 flex gap-3 rounded-md border bg-popover/90 px-2.5 py-1 text-[11px] text-popover-foreground shadow-sm backdrop-blur">
          <span>O {formatCurrency(hoverCandle.open)}</span>
          <span>H {formatCurrency(hoverCandle.high)}</span>
          <span>L {formatCurrency(hoverCandle.low)}</span>
          <span>C {formatCurrency(hoverCandle.close)}</span>
        </div>
      )}
      {!hoverCandle && lastVisible && (
        <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-md border bg-popover/90 px-2.5 py-1 text-[11px] text-popover-foreground shadow-sm backdrop-blur">
          Close {formatCurrency(lastVisible.close)}
        </div>
      )}
    </div>
  );
}
