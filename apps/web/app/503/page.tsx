import { ServiceUnavailablePage } from '@/components/errors/service-unavailable-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Service unavailable',
  description: 'Edgewise is temporarily unavailable. Please try again shortly.',
  robots: { index: false, follow: false },
};

export default function ServiceUnavailableRoute() {
  return <ServiceUnavailablePage />;
}
