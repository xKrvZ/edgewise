import { cn } from '@/lib/utils';
import Image from 'next/image';

const LOGO_SRC = {
  light: '/logo_light.png',
  dark: '/logo_dark.png',
} as const;

const LOGOMARK_SRC = {
  light: '/logomark_light.png',
  dark: '/logomark_dark.png',
} as const;

const LOGO_WIDTH = 1536;
const LOGO_HEIGHT = 1024;
const LOGOMARK_SIZE = 1024;

export interface LogoProps {
  className?: string;
  /** Logo for light backgrounds (marketing, auth form panel, share pages). */
  variant?: 'light' | 'dark';
  /** Logomark variant when `mark` is true. Defaults to `variant`. */
  markVariant?: 'light' | 'dark';
  /** Icon-only logomark for collapsed sidebars and compact layouts. */
  mark?: boolean;
  /**
   * Reserved for a future icon-only asset. Logo images already include the wordmark.
   * @default false
   */
  showText?: boolean;
}

export function Logo({
  className,
  variant = 'light',
  markVariant,
  mark = false,
  showText: _showText = false,
}: LogoProps) {
  if (mark) {
    return (
      <Image
        src={LOGOMARK_SRC[markVariant ?? variant]}
        alt="Edgewise"
        width={LOGOMARK_SIZE}
        height={LOGOMARK_SIZE}
        className={cn('size-9 object-contain', className)}
        priority
      />
    );
  }

  return (
    <Image
      src={LOGO_SRC[variant]}
      alt="Edgewise"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      className={cn('h-10 w-auto min-w-[5rem] object-contain', className)}
      priority
    />
  );
}
