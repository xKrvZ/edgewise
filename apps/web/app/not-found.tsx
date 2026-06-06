import { NotFoundRouter } from '@/components/errors/not-found-router';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundRouter />;
}
