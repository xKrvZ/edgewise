'use client';

import { useEffect, type ReactNode } from 'react';

/** Locks document scroll while the dashboard shell is mounted. */
export function AppShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    const { documentElement: html, body } = document;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  return children;
}
