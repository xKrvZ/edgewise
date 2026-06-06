import { cn } from '@/lib/utils';
import Image from 'next/image';

const LOGO_SRC = {
  light: '/logo_light.png',
  dark: '/logo_dark.png',
} as const;

const LOGO_WIDTH = 1536;
const LOGO_HEIGHT = 1024;

export interface LogoProps {
  className?: string;
  /** Logo for light backgrounds (marketing, auth form panel, share pages). */
  variant?: 'light' | 'dark';
  /**
   * Reserved for a future icon-only asset. Logo images already include the wordmark.
   * @default false
   */
  showText?: boolean;
}

export function Logo({ className, variant = 'light', showText: _showText = false }: LogoProps) {
  return (
    <Image
      src={LOGO_SRC[variant]}
      alt="Edgewise"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      className={cn('h-8 w-auto object-contain', className)}
      priority
    />
  );
}
