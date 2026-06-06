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
