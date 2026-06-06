import type { IncomingHttpHeaders } from 'node:http';
import type { AuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';

type AdminAuthApi = {
  setRole: (input: {
    body: { userId: string; role: string };
    headers: Headers;
  }) => Promise<unknown>;
  banUser: (input: {
    body: { userId: string; banReason?: string };
    headers: Headers;
  }) => Promise<unknown>;
  unbanUser: (input: {
    body: { userId: string };
    headers: Headers;
  }) => Promise<unknown>;
};

function adminApi(authService: AuthService): AdminAuthApi {
  return authService.api as unknown as AdminAuthApi;
}

export async function setUserRole(
  authService: AuthService,
  userId: string,
  role: string,
  headers: IncomingHttpHeaders,
): Promise<void> {
  await adminApi(authService).setRole({
    body: { userId, role },
    headers: fromNodeHeaders(headers),
  });
}

export async function banUserAccount(
  authService: AuthService,
  userId: string,
  headers: IncomingHttpHeaders,
  banReason?: string,
): Promise<void> {
  await adminApi(authService).banUser({
    body: { userId, banReason },
    headers: fromNodeHeaders(headers),
  });
}

export async function unbanUserAccount(
  authService: AuthService,
  userId: string,
  headers: IncomingHttpHeaders,
): Promise<void> {
  await adminApi(authService).unbanUser({
    body: { userId },
    headers: fromNodeHeaders(headers),
  });
}
