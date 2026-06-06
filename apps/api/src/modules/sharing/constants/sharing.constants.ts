export const TRADE_VISIBILITIES = ['private', 'unlisted', 'public'] as const;
export type TradeVisibility = (typeof TRADE_VISIBILITIES)[number];

export const STATS_VISIBILITIES = ['private', 'public'] as const;
export type StatsVisibility = (typeof STATS_VISIBILITIES)[number];

export const SHARE_TOKEN_LENGTH = 21;

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const MAX_HEADER_BYTES = 5 * 1024 * 1024;
export const MAX_FAVORITE_SYMBOLS = 10;

export const PROFILE_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
] as const;
