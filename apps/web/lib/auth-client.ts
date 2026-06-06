import { adminClient, emailOTPClient, jwtClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

/**
 * Origin of the NestJS backend that hosts Better Auth.
 * The backend mounts Better Auth at `/api/auth`, which the client appends
 * automatically — so this must be the bare origin (no `/api` suffix).
 */
function resolveAuthBaseURL(): string {
  if (process.env.NEXT_PUBLIC_AUTH_URL) {
    return process.env.NEXT_PUBLIC_AUTH_URL.replace(/\/$/, '');
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  return apiUrl.replace(/\/api\/?$/, '');
}

const authBaseURL = resolveAuthBaseURL();

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  plugins: [adminClient(), emailOTPClient(), jwtClient()],
});

export const { signIn, signUp, signOut, useSession, getSession, emailOtp } = authClient;
