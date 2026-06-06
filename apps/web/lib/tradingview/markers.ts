import type { ChartMarker } from '@/components/replay/candlestick-chart';
import type { Mark } from '@/lib/tradingview/types';

const MARK_COLORS: Record<ChartMarker['kind'], { color: string; label: string }> = {
  entry: { color: 'green', label: 'E' },
  exit: { color: 'blue', label: 'X' },
  stop: { color: 'red', label: 'S' },
  target: { color: 'yellow', label: 'T' },
};

/** Converts replay/backtest markers into TradingView bar marks (excludes horizontal lines). */
export function chartMarkersToTvMarks(markers: ChartMarker[]): Mark[] {
  const result: Mark[] = [];
  let id = 1;

  for (const marker of markers) {
    if (marker.time === 0) continue;
    const style = MARK_COLORS[marker.kind];
    result.push({
      id: id++,
      time: Math.floor(marker.time / 1000),
      color: style.color,
      text: marker.label ?? marker.kind,
      label: style.label,
      labelFontColor: '#ffffff',
      minSize: 14,
    });
  }

  return result;
}
