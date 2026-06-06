/**
 * URL prefixes for routes under `app/(app)/`. Route groups are not part of the URL.
 * Keep in sync when adding new authenticated app pages.
 */
export const PROTECTED_ROUTE_PREFIXES = [
  '/account',
  '/accounts',
  '/admin',
  '/ai-review',
  '/analytics',
  '/backtesting',
  '/billing',
  '/community',
  '/dashboard',
  '/journal',
  '/playbooks',
  '/profile',
  '/prop-firm',
  '/replay',
  '/trades',
] as const;

/** Routes authenticated users can access without an active subscription. */
export const SUBSCRIPTION_EXEMPT_ROUTE_PREFIXES = [
  '/account',
  '/admin',
  '/billing',
] as const;

export const DEFAULT_AUTHENTICATED_REDIRECT = '/account';

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isSubscriptionExemptRoute(pathname: string): boolean {
  return SUBSCRIPTION_EXEMPT_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export const PUBLIC_MARKETING_ROUTES = ['/', '/pricing'] as const;

export const AUTH_PUBLIC_ROUTES = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
] as const;

export function isAuthRoute(pathname: string): boolean {
  return AUTH_PUBLIC_ROUTES.includes(pathname as (typeof AUTH_PUBLIC_ROUTES)[number]);
}

export function isPublicRoute(pathname: string): boolean {
  if (isAuthRoute(pathname)) {
    return true;
  }

  if (PUBLIC_MARKETING_ROUTES.includes(pathname as (typeof PUBLIC_MARKETING_ROUTES)[number])) {
    return true;
  }

  return pathname === '/share' || pathname.startsWith('/share/');
}
