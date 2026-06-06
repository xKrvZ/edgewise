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

function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === 'true';
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isMaintenanceMode() && pathname !== '/503') {
    return NextResponse.redirect(new URL('/503', request.url));
  }

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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

