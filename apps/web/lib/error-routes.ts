/** Route prefixes that use the in-app (journal) 404 experience. */
const APP_ROUTE_PREFIXES = [
  '/dashboard',
  '/trades',
  '/analytics',
  '/accounts',
  '/community',
  '/journal',
  '/playbooks',
  '/prop-firm',
  '/backtesting',
  '/replay',
  '/ai-review',
  '/admin',
  '/account',
  '/billing',
  '/profile',
] as const;

export function isAppRoute(pathname: string): boolean {
  return APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
