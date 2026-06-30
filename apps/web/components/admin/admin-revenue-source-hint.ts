import type { AdminRevenueSource } from '@/lib/types/admin';

export function adminRevenueSourceHint(source: AdminRevenueSource | undefined): string {
  switch (source) {
    case 'rollup':
      return 'Postgres daily revenue rollups';
    case 'polar':
      return 'Polar orders API';
    case 'mock':
      return 'Mock demo revenue';
    case 'estimate':
      return 'Estimated from active subscriptions';
    default:
      return 'Revenue source unknown';
  }
}
