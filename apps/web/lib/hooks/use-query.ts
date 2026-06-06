'use client';

import type { ApiError } from '@/lib/api-client';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface QueryState<T> {
  data: T | undefined;
  error: ApiError | Error | undefined;
  isLoading: boolean;
  isRefetching: boolean;
  refetch: () => void;
}

/**
 * Lightweight client-side data hook. Re-runs whenever any value in `deps`
 * changes. Auth cookies are forwarded by the api-client (`credentials:
 * "include"`), so all fetching is done client-side after hydration.
 */
export function useQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
  options: { enabled?: boolean } = {},
): QueryState<T> {
  const { enabled = true } = options;
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<ApiError | Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [isRefetching, setIsRefetching] = useState(false);
  const [nonce, setNonce] = useState(0);
  const hasData = useRef(false);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are caller-controlled.
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    let active = true;

    if (hasData.current) setIsRefetching(true);
    else setIsLoading(true);

    fetcher(controller.signal)
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(undefined);
        hasData.current = true;
      })
      .catch((err: unknown) => {
        if (!active || controller.signal.aborted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
        setIsRefetching(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, nonce, ...deps]);

  return { data, error, isLoading, isRefetching, refetch };
}
