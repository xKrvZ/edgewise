import type { ChartingLibraryWidgetOptions } from '@/lib/tradingview/types';

export type ChartColorScheme = 'light' | 'dark';

function readThemeHsl(variable: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return raw ? `hsl(${raw})` : fallback;
}

/** Resolves the active Meridian color scheme from the document root class. */
export function getResolvedChartTheme(): ChartColorScheme {
  if (typeof window === 'undefined') return 'dark';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/** Meridian theme overrides for TradingView Charting Library. */
export function buildMeridianOverrides(): Record<string, string | number | boolean> {
  const background = readThemeHsl('--background', 'hsl(238 35% 7%)');
  const foreground = readThemeHsl('--foreground', 'hsl(238 20% 95%)');
  const border = readThemeHsl('--border', 'hsl(238 20% 18%)');
  const success = readThemeHsl('--success', 'hsl(152 64% 42%)');
  const destructive = readThemeHsl('--destructive', 'hsl(356 70% 55%)');
  const primary = readThemeHsl('--primary', 'hsl(238 65% 55%)');

  return {
    'paneProperties.background': background,
    'paneProperties.backgroundType': 'solid',
    'paneProperties.vertGridProperties.color': border,
    'paneProperties.horzGridProperties.color': border,
    'scalesProperties.textColor': foreground,
    'scalesProperties.lineColor': border,
    'mainSeriesProperties.candleStyle.upColor': success,
    'mainSeriesProperties.candleStyle.downColor': destructive,
    'mainSeriesProperties.candleStyle.borderUpColor': success,
    'mainSeriesProperties.candleStyle.borderDownColor': destructive,
    'mainSeriesProperties.candleStyle.wickUpColor': success,
    'mainSeriesProperties.candleStyle.wickDownColor': destructive,
    'mainSeriesProperties.priceLineColor': primary,
  };
}

/** Widget constructor options with indicators and drawings enabled. */
export function buildChartWidgetOptions(
  partial: Pick<ChartingLibraryWidgetOptions, 'symbol' | 'interval' | 'container' | 'datafeed'>,
): ChartingLibraryWidgetOptions {
  const colorScheme = getResolvedChartTheme();
  const background = readThemeHsl(
    '--background',
    colorScheme === 'dark' ? 'hsl(238 35% 7%)' : 'hsl(220 33% 98%)',
  );
  const foreground = readThemeHsl(
    '--foreground',
    colorScheme === 'dark' ? 'hsl(238 20% 95%)' : 'hsl(224 32% 12%)',
  );

  return {
    ...partial,
    library_path: '/charting_library/',
    locale: 'en',
    theme: colorScheme,
    autosize: true,
    fullscreen: false,
    timezone: 'Etc/UTC',
    custom_css_url: '/tradingview-theme.css',
    loading_screen: { backgroundColor: background, foregroundColor: foreground },
    overrides: buildMeridianOverrides(),
    enabled_features: [
      'study_templates',
      'side_toolbar_in_fullscreen_mode',
      'header_in_fullscreen_mode',
      'hide_left_toolbar_by_default',
    ],
    disabled_features: [
      'use_localstorage_for_settings',
      'header_symbol_search',
      'symbol_search_hot_key',
    ],
    studies_access: { type: 'white', tools: [{ name: '*' }] },
    drawings_access: { type: 'white', tools: [{ name: '*' }] },
  };
}
