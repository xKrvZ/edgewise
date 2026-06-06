import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ token: string }>;
}

/** Legacy stats URL — redirects to the full public profile page. */
export default async function SharedStatsRedirectPage({ params }: PageProps) {
  const { token } = await params;
  redirect(`/share/profile/${token}`);
}
