import { PublicTradeView } from '@/components/share/public-trade-view';
import { fetchPublicTrade, PublicApiError } from '@/lib/public-api';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  try {
    const trade = await fetchPublicTrade(token);
    return {
      title: `${trade.symbol} trade — Edgewise`,
      description: `Shared ${trade.direction} ${trade.symbol} trade on Edgewise.`,
      robots: trade.visibility === 'public' ? 'index,follow' : 'noindex,nofollow',
    };
  } catch {
    return { title: 'Shared trade — Edgewise' };
  }
}

export default async function SharedTradePage({ params }: PageProps) {
  const { token } = await params;

  try {
    const trade = await fetchPublicTrade(token);
    return <PublicTradeView trade={trade} />;
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
