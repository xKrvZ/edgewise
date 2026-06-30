import { PublicProfileView } from '@/components/share/public-profile-view';
import { fetchPublicProfile, PublicApiError } from '@/lib/public-api';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ page?: string; limit?: string }>;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  try {
    const profile = await fetchPublicProfile(token);
    return {
      title: `${profile.displayName ?? 'Trader'} — Edgewise`,
      description: profile.bio ?? 'Public trader profile on Edgewise.',
      robots: 'index,follow',
    };
  } catch {
    return { title: 'Shared profile — Edgewise' };
  }
}

export default async function SharedProfilePage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const query = await searchParams;
  const page = parsePositiveInt(query.page, 1);
  const limit = parsePositiveInt(query.limit, 10);

  try {
    const profile = await fetchPublicProfile(token, { page, limit });
    return (
      <Suspense>
        <PublicProfileView profile={profile} profileToken={token} />
      </Suspense>
    );
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
