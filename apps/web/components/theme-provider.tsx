'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, scriptProps, ...props }: ThemeProviderProps) {
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
      {...props}
      scriptProps={resolvedScriptProps}
    >
      {children}
    </NextThemesProvider>
  );
}
