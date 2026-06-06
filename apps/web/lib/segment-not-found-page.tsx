import { notFound } from 'next/navigation';

/** Catch-all page target — triggers the nearest segment `not-found.tsx`. */
export default function SegmentNotFoundPage(): never {
  notFound();
}
