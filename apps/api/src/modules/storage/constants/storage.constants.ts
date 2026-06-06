export const S3_CLIENT = Symbol('S3_CLIENT');

/** Allowed upload content types, grouped by media kind. */
export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
] as const;

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

/** Per-kind upload size ceilings (bytes). */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB

export type MediaKind = 'image' | 'video';
export const MEDIA_KINDS: MediaKind[] = ['image', 'video'];
