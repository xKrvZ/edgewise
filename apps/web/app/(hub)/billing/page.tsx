'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    const query = checkout ? `?checkout=${checkout}` : '';
    router.replace(`/account${query}#billing`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      Redirecting to billing settings…
    </div>
  );
}
