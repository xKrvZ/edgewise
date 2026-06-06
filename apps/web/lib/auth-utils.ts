import { DEFAULT_AUTHENTICATED_REDIRECT } from '@/lib/auth-routes';

export function resolvePostAuthRedirect(callbackUrl: string | null): string {
  if (callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//')) {
    return callbackUrl;
  }

  return DEFAULT_AUTHENTICATED_REDIRECT;
}

export function isEmailNotVerifiedError(message: string | undefined): boolean {
  if (!message) return false;

  const normalized = message.toLowerCase();
  return (
    normalized.includes('email not verified') ||
    normalized.includes('verify your email') ||
    normalized.includes('email is not verified')
  );
}

export function isNetworkFetchError(error: unknown): boolean {
  return error instanceof TypeError && error.message === 'Failed to fetch';
}

export const AUTH_SERVER_UNAVAILABLE_MESSAGE =
  'Cannot reach the server. Is the API running? Start Docker (`docker compose up -d`) and run `bun run dev`.';
