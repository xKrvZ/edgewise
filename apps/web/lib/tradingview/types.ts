/**
 * Minimal TradingView Charting Library types for compile-time safety without
 * the licensed `charting_library` package in the repo. When you add the
 * library under `public/charting_library/`, these shapes match the official
 * `datafeed-api.d.ts` / `charting_library.d.ts` exports.
 */

export type ResolutionString = string;

export interface LibrarySymbolInfo {
  name: string;
  ticker?: string;
  description: string;
  type: string;
  session: string;
  timezone: string;
  exchange: string;
  listed_exchange?: string;
  format: 'price' | 'volume';
  minmov: number;
  pricescale: number;
  has_intraday: boolean;
  has_daily: boolean;
  has_weekly_and_monthly: boolean;
  supported_resolutions: ResolutionString[];
  volume_precision?: number;
  data_status?: 'streaming' | 'endofday' | 'pulsed' | 'delayed_streaming';
}

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface HistoryMetadata {
  noData?: boolean;
  nextTime?: number | null;
}

export interface PeriodParams {
  from: number;
  to: number;
  countBack: number;
  firstDataRequest: boolean;
}

export interface DatafeedConfiguration {
  supported_resolutions?: ResolutionString[];
  supports_marks?: boolean;
  supports_timescale_marks?: boolean;
  supports_time?: boolean;
  exchanges?: Array<{ value: string; name: string; desc: string }>;
  symbols_types?: Array<{ name: string; value: string }>;
}

export interface Mark {
  id: string | number;
  time: number;
  color: string;
  text: string;
  label: string;
  labelFontColor: string;
  minSize: number;
}

export interface MarkConstColors {
  red: string;
  green: string;
  blue: string;
  yellow: string;
}

export interface IBasicDataFeed {
  onReady: (callback: (config: DatafeedConfiguration) => void) => void;
  resolveSymbol: (
    symbolName: string,
    onResolve: (symbolInfo: LibrarySymbolInfo) => void,
    onError: (reason: string) => void,
  ) => void;
  getBars: (
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: PeriodParams,
    onResult: (bars: Bar[], meta: HistoryMetadata) => void,
    onError: (reason: string) => void,
  ) => void;
  subscribeBars?: (
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    onTick: (bar: Bar) => void,
    listenerGuid: string,
    onResetCacheNeededCallback: () => void,
  ) => void;
  unsubscribeBars?: (listenerGuid: string) => void;
  getMarks?: (
    symbolInfo: LibrarySymbolInfo,
    from: number,
    to: number,
    onDataCallback: (marks: Mark[]) => void,
    resolution: ResolutionString,
  ) => void;
}

export interface ChartingLibraryWidgetOptions {
  symbol: string;
  interval: ResolutionString;
  container: HTMLElement | string;
  library_path: string;
  locale: string;
  datafeed: IBasicDataFeed;
  theme?: 'light' | 'dark';
  autosize?: boolean;
  fullscreen?: boolean;
  disabled_features?: string[];
  enabled_features?: string[];
  studies_access?: {
    type: 'black' | 'white';
    tools: Array<{ name: string; grayed?: boolean }>;
  };
  drawings_access?: {
    type: 'black' | 'white';
    tools: Array<{ name: string; grayed?: boolean }>;
  };
  overrides?: Record<string, string | number | boolean>;
  studies_overrides?: Record<string, string | number | boolean>;
  custom_css_url?: string;
  loading_screen?: { backgroundColor?: string; foregroundColor?: string };
  timezone?: string;
}

export interface IChartWidgetApi {
  createShape: (
    point: { time: number; price: number },
    options: Record<string, unknown>,
  ) => Promise<string | null>;
  createMultipointShape: (
    points: Array<{ time: number; price: number }>,
    options: Record<string, unknown>,
  ) => Promise<string | null>;
  removeEntity: (entityId: string) => void;
  setVisibleRange: (range: { from: number; to: number }) => void;
  createStudy: (
    name: string,
    forceOverlay: boolean,
    lock: boolean,
    inputs?: Record<string, unknown>,
    overrides?: Record<string, string | number | boolean>,
  ) => Promise<string | null>;
}

export interface IChartingLibraryWidget {
  onChartReady: (callback: () => void) => void;
  chart: () => IChartWidgetApi;
  remove: () => void;
  resize: (width: number, height: number) => void;
  applyOverrides: (overrides: Record<string, string | number | boolean>) => void;
}

export interface ChartingLibraryGlobal {
  widget: new (options: ChartingLibraryWidgetOptions) => IChartingLibraryWidget;
}

declare global {
  interface Window {
    TradingView?: ChartingLibraryGlobal;
    Datafeeds?: {
      UDFCompatibleDatafeed: new (url: string) => IBasicDataFeed;
    };
  }
}
