export const MEDIA_VISIBILITIES = ['private', 'public'] as const;
export type MediaVisibility = (typeof MEDIA_VISIBILITIES)[number];
