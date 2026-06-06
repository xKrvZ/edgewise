export const TAG_CATEGORIES = ['setup', 'mistake', 'custom'] as const;
export type TagCategory = (typeof TAG_CATEGORIES)[number];
