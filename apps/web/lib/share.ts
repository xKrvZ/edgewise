export function appOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

export function tradeShareUrl(token: string): string {
  return `${appOrigin()}/share/trade/${token}`;
}

export function statsShareUrl(token: string): string {
  return `${appOrigin()}/share/profile/${token}`;
}

export function profileShareUrl(token: string): string {
  return `${appOrigin()}/share/profile/${token}`;
}

export type PublicProfileTab = 'about' | 'statistics' | 'trades';

export function buildProfileTabHref(
  profileToken: string,
  tab: PublicProfileTab,
  options?: { page?: number; limit?: number },
): string {
  const params = new URLSearchParams();
  if (tab !== 'about') {
    params.set('tab', tab);
  }
  if (tab === 'trades') {
    if (options?.page && options.page > 1) {
      params.set('page', String(options.page));
    }
    if (options?.limit && options.limit !== 10) {
      params.set('limit', String(options.limit));
    }
  }
  const qs = params.toString();
  const base = profileShareUrl(profileToken);
  return qs ? `${base}?${qs}` : base;
}
