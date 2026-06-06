import { PublicProfileView } from '@/components/share/public-profile-view';
import { fetchPublicProfile, PublicApiError } from '@/lib/public-api';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ token: string }>;
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

export default async function SharedProfilePage({ params }: PageProps) {
  const { token } = await params;

  try {
    const profile = await fetchPublicProfile(token);
    return <PublicProfileView profile={profile} />;
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
