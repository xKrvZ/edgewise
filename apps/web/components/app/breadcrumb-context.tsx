'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface BreadcrumbContextValue {
  dynamicLabels: Readonly<Record<string, string>>;
  setDynamicLabel: (key: string, label: string | undefined) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [dynamicLabels, setDynamicLabels] = useState<Record<string, string>>({});

  const setDynamicLabel = useCallback((key: string, label: string | undefined) => {
    setDynamicLabels((prev) => {
      if (label === undefined) {
        if (!(key in prev)) return prev;
        const { [key]: _removed, ...rest } = prev;
        return rest;
      }
      if (prev[key] === label) return prev;
      return { ...prev, [key]: label };
    });
  }, []);

  const value = useMemo(
    () => ({ dynamicLabels, setDynamicLabel }),
    [dynamicLabels, setDynamicLabel],
  );

  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
}

function useBreadcrumbContext(): BreadcrumbContextValue | null {
  return useContext(BreadcrumbContext);
}

/** Register a dynamic breadcrumb label for a route entity (e.g. `community:${id}`). */
export function useBreadcrumbDynamicLabel(key: string, label: string | undefined) {
  const setDynamicLabel = useBreadcrumbContext()?.setDynamicLabel;

  useEffect(() => {
    if (!setDynamicLabel) return;
    setDynamicLabel(key, label);
    return () => setDynamicLabel(key, undefined);
  }, [setDynamicLabel, key, label]);
}

export function useBreadcrumbDynamicLabels(): Readonly<Record<string, string>> {
  return useBreadcrumbContext()?.dynamicLabels ?? {};
}
