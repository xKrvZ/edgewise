'use client';

import { API_URL } from '@/lib/api';
import { useEffect, useState } from 'react';

type Status = 'checking' | 'online' | 'offline';

export function ApiStatus() {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    let cancelled = false;

    const ping = async () => {
      try {
        const res = await fetch(`${API_URL}/health`, {
          method: 'GET',
        });
        if (!cancelled) setStatus(res.ok ? 'online' : 'offline');
      } catch {
        if (!cancelled) setStatus('offline');
      }
    };

    ping();
    const interval = setInterval(ping, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const config = {
    checking: { label: 'Checking API…', dot: 'bg-warning' },
    online: { label: 'API online', dot: 'bg-success' },
    offline: { label: 'API offline', dot: 'bg-destructive' },
  }[status];

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
      <span
        className={`h-2 w-2 rounded-full ${config.dot} ${status === 'checking' ? 'animate-pulse' : ''}`}
      />
      {config.label}
    </span>
  );
}
