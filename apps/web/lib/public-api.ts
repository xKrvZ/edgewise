import { API_URL } from '@/lib/api';
import type { PublicProfile, PublicStats, PublicTrade } from '@/lib/types';

export class PublicApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'PublicApiError';
    this.status = status;
  }
}

async function publicRequest<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'omit',
    cache: 'no-store',
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (isJson && (payload as { message?: string | string[] })?.message) || res.statusText;
    throw new PublicApiError(
      res.status,
      Array.isArray(message) ? message.join(', ') : String(message),
    );
  }

  return payload as T;
}

export function fetchPublicTrade(token: string): Promise<PublicTrade> {
  return publicRequest<PublicTrade>(`/public/trades/${token}`);
}

export function fetchPublicStats(token: string): Promise<PublicStats> {
  return publicRequest<PublicStats>(`/public/stats/${token}`);
}

export function fetchPublicProfile(token: string): Promise<PublicProfile> {
  return publicRequest<PublicProfile>(`/public/profile/${token}`);
}
