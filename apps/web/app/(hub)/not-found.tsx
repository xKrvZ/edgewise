import { AppNotFound } from '@/components/errors/app-not-found';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function HubNotFoundPage() {
  return <AppNotFound embedded />;
}
