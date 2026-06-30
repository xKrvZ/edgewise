'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';
import { usePathname } from 'next/navigation';

const LIGHT_THEME_ROUTE_PREFIXES = [
  '/account',
  '/billing',
  '/pricing',
  '/503',
  '/share',
] as const;

/** Marketing pages, account hub, and all public share links always render in light mode. */
export function shouldForceLightTheme(pathname: string): boolean {
  if (pathname === '/') return true;
  return LIGHT_THEME_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function ThemeProvider({ children, scriptProps, ...props }: ThemeProviderProps) {
  const pathname = usePathname();
  const forceLight = shouldForceLightTheme(pathname ?? '/');

  // next-themes injects an inline <script> to prevent theme flicker on first paint.
  // React 19 warns when that script hydrates on the client; keep SSR script executable
  // and use a non-executable type only during client render.
  const resolvedScriptProps =
    typeof window === 'undefined' ? scriptProps : (scriptProps ?? { type: 'application/json' });

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="edgewise-theme"
      {...props}
      forcedTheme={forceLight ? 'light' : undefined}
      scriptProps={resolvedScriptProps}
    >
      {children}
    </NextThemesProvider>
  );
}
