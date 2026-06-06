'use client';

import { MarketChart, type ChartRenderer } from '@/components/charts/market-chart';
import type { ChartMarker } from '@/components/replay/candlestick-chart';
import { ReplayControls } from '@/components/replay/replay-controls';
import { type ReplayEngine, useReplayEngine } from '@/lib/hooks/use-replay-engine';
import type { Candle, CandleInterval } from '@/lib/market-data';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface ReplayViewerProps {
  symbol: string;
  interval: CandleInterval;
  candles: Candle[];
  markers?: ChartMarker[];
  height?: number;
  /** When true, fills the parent flex container and sizes the chart dynamically. */
  fill?: boolean;
  controlsVariant?: 'default' | 'dock';
  className?: string;
  /** Optional external replay engine (e.g. backtest workspace pauses on order entry). */
  engine?: ReplayEngine;
  onChartRendererResolved?: (renderer: ChartRenderer) => void;
}

export function ReplayViewer({
  symbol,
  interval,
  candles,
  markers = [],
  height = 420,
  fill = false,
  controlsVariant = 'default',
  className,
  engine: externalEngine,
  onChartRendererResolved,
}: ReplayViewerProps) {
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = useState(height);
  const internalEngine = useReplayEngine(candles.length, 450);
  const engine = externalEngine ?? internalEngine;
  const current = candles[engine.index];
  const positionLabel = current ? format(new Date(current.time), 'MMM d HH:mm') : undefined;

  useLayoutEffect(() => {
    if (!fill) {
      setChartHeight(height);
      return;
    }
    const el = chartAreaRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h && h > 0) setChartHeight(Math.floor(h));
    });
    observer.observe(el);
    setChartHeight(Math.floor(el.clientHeight));
    return () => observer.disconnect();
  }, [fill, height]);

  const { toggle, stepBack, stepForward, reset } = engine;

  useEffect(() => {
    if (!fill) return;
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      switch (e.key) {
        case ' ':
          e.preventDefault();
          toggle();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          stepBack();
          break;
        case 'ArrowRight':
          e.preventDefault();
          stepForward();
          break;
        case 'Home':
          e.preventDefault();
          reset();
          break;
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fill, toggle, stepBack, stepForward, reset]);

  if (fill) {
    return (
      <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
        <div ref={chartAreaRef} className="relative min-h-0 flex-1">
          <MarketChart
            symbol={symbol}
            interval={interval}
            candles={candles}
            visibleCount={engine.index + 1}
            markers={markers}
            height={chartHeight}
            fill
            className="absolute inset-0 h-full"
            onRendererResolved={onChartRendererResolved}
          />
        </div>
        <ReplayControls engine={engine} positionLabel={positionLabel} variant={controlsVariant} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <MarketChart
        symbol={symbol}
        interval={interval}
        candles={candles}
        visibleCount={engine.index + 1}
        markers={markers}
        height={height}
        onRendererResolved={onChartRendererResolved}
      />
      <ReplayControls engine={engine} positionLabel={positionLabel} variant={controlsVariant} />
    </div>
  );
}
