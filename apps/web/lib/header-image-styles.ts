import type { HeaderTextTheme } from '@/lib/hooks/use-header-image-contrast';

/** Ghost actions overlaid on a header image gradient. */
export const headerOverlayButtonClass =
  'text-white hover:bg-transparent hover:text-white focus-visible:ring-white/50';

/** Bottom-to-top overlay when the header image is dark (light foreground text). */
export const headerGradientDarkBg =
  'bg-gradient-to-t from-black/70 via-black/30 to-transparent';

/** Bottom-to-top overlay when the header image is light (dark foreground text). */
export const headerGradientLightBg =
  'bg-gradient-to-t from-white/80 via-white/40 to-transparent';

/** Shown while contrast analysis is in progress. */
export const headerGradientLoading =
  'bg-gradient-to-t from-background/90 via-background/40 to-transparent';

export interface ResolvedHeaderImageStyles {
  hasImage: boolean;
  useLightText: boolean;
  gradientClass: string | null;
}

export function resolveHeaderImageStyles(
  imageUrl: string | null | undefined,
  textTheme: HeaderTextTheme,
  analyzed: boolean,
  isLoading: boolean,
): ResolvedHeaderImageStyles {
  const hasImage = Boolean(imageUrl);
  const useLightText = hasImage && (textTheme === 'light' || !analyzed);

  const gradientClass = hasImage
    ? analyzed
      ? textTheme === 'light'
        ? headerGradientDarkBg
        : headerGradientLightBg
      : isLoading
        ? headerGradientLoading
        : headerGradientDarkBg
    : null;

  return { hasImage, useLightText, gradientClass };
}
