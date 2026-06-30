export const MARKET_TYPES = [
  'stocks',
  'futures',
  'forex',
  'crypto',
  'options',
] as const;
export type MarketType = (typeof MARKET_TYPES)[number];

export const TRADE_DIRECTIONS = ['long', 'short'] as const;
export type TradeDirection = (typeof TRADE_DIRECTIONS)[number];

export const TRADE_STATUSES = ['open', 'closed'] as const;
export type TradeStatus = (typeof TRADE_STATUSES)[number];

export const TRADE_EXIT_TYPES = ['stop_loss', 'take_profit', 'custom'] as const;
export type TradeExitType = (typeof TRADE_EXIT_TYPES)[number];
