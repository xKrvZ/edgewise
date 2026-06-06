import {
  DEFAULT_AUTHENTICATED_REDIRECT,
  isAuthRoute,
  isProtectedRoute,
} from '@/lib/auth-routes';
import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

function hasSession(request: NextRequest): boolean {
  return getSessionCookie(request) !== null;
}

function safeCallbackUrl(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  return value;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAuthenticated = hasSession(request);

  if (isAuthRoute(pathname)) {
    if (isAuthenticated) {
      const callbackUrl =
        safeCallbackUrl(request.nextUrl.searchParams.get('callbackUrl')) ??
        DEFAULT_AUTHENTICATED_REDIRECT;
      return NextResponse.redirect(new URL(callbackUrl, request.url));
    }

    return NextResponse.next();
  }

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  if (isAuthenticated) {
    return NextResponse.next();
  }

  const signInUrl = new URL('/sign-in', request.url);
  signInUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    '/sign-in',
    '/sign-up',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/accounts/:path*',
    '/ai-review/:path*',
    '/analytics/:path*',
    '/backtesting/:path*',
    '/community/:path*',
    '/dashboard/:path*',
    '/journal/:path*',
    '/playbooks/:path*',
    '/profile/:path*',
    '/prop-firm/:path*',
    '/replay/:path*',
    '/trades/:path*',
  ],
};
