export const TRADE_VISIBILITIES = ['private', 'unlisted', 'public'] as const;
export type TradeVisibility = (typeof TRADE_VISIBILITIES)[number];

/** Only public trades appear on the trader profile showcase; unlisted is link-only. */
export const PROFILE_SHOWCASE_TRADE_VISIBILITY = 'public' as const satisfies TradeVisibility;

export const STATS_VISIBILITIES = ['private', 'public'] as const;
export type StatsVisibility = (typeof STATS_VISIBILITIES)[number];

export const SHARE_TOKEN_LENGTH = 21;

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const MAX_HEADER_BYTES = 5 * 1024 * 1024;
export const MAX_FAVORITE_SYMBOLS = 10;
export const MAX_SHOWCASED_TRADES = 12;
export const DEFAULT_SHOWCASED_TRADES_PAGE_SIZE = 10;
export const MAX_SHOWCASED_TRADES_PAGE_SIZE = 50;

export const PROFILE_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
] as const;
