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
