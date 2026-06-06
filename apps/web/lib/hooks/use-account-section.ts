'use client';

import {
  DEFAULT_ACCOUNT_SECTION,
  type AccountSection,
  parseAccountSection,
} from '@/lib/account-sections';
import { useCallback, useEffect, useState } from 'react';

export function useAccountSection() {
  const [section, setSectionState] = useState<AccountSection>(DEFAULT_ACCOUNT_SECTION);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSectionState(parseAccountSection(window.location.hash));
    setHydrated(true);

    const onHashChange = () => {
      setSectionState(parseAccountSection(window.location.hash));
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const setSection = useCallback((next: AccountSection) => {
    const hash = next === DEFAULT_ACCOUNT_SECTION ? '#profile' : `#${next}`;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
    setSectionState(next);
  }, []);

  return { section, setSection, hydrated };
}
