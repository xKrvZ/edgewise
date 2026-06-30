/** Human-readable labels for app route segments. */
export const BREADCRUMB_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'My Journal',
  trades: 'Trades',
  journal: 'Notebook',
  analytics: 'Analytics',
  community: 'Community',
  discover: 'Discover',
  invitations: 'Pending invitations',
  playbooks: 'Playbooks',
  backtesting: 'Backtesting',
  replay: 'Replay',
  accounts: 'Accounts',
  'prop-firm': 'Prop Firm',
  'ai-review': 'AI Review',
  users: 'Users',
  reports: 'Finance reports',
  subscriptions: 'Subscriptions',
  settings: 'Settings',
  members: 'Members',
  posts: 'Posts',
  leaderboard: 'Leaderboard',
};

/** Labels for segments under `/admin/*` (overrides shared keys like `dashboard`). */
export const ADMIN_BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  analytics: 'Platform analytics',
};

/** Static label for the final segment on detail routes (`/:parent/:id`). */
export const BREADCRUMB_DETAIL_LABELS: Record<string, string> = {
  trades: 'Trade',
  playbooks: 'Playbook',
  community: 'Community',
  posts: 'Post',
  backtesting: 'Session',
  users: 'User',
};

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function getBreadcrumbs(
  pathname: string,
  dynamicLabels: Readonly<Record<string, string>> = {},
): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return [{ label: BREADCRUMB_LABELS.dashboard }];
  }

  const crumbs: BreadcrumbItem[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const isLast = i === segments.length - 1;
    const prevSegment = i > 0 ? segments[i - 1] : undefined;

    if (isDynamicSegment(segment) && prevSegment && BREADCRUMB_DETAIL_LABELS[prevSegment]) {
      const key = `${prevSegment}:${segment}`;
      const label = dynamicLabels[key] ?? BREADCRUMB_DETAIL_LABELS[prevSegment];
      const href = isLast ? undefined : `/${segments.slice(0, i + 1).join('/')}`;
      crumbs.push({ label, href });
      continue;
    }

    if (isDynamicSegment(segment)) {
      continue;
    }

    const inAdmin = segments[0] === 'admin';
    const label =
      (inAdmin ? ADMIN_BREADCRUMB_LABELS[segment] : undefined) ??
      BREADCRUMB_LABELS[segment] ??
      formatSegment(segment);
    const href = isLast ? undefined : `/${segments.slice(0, i + 1).join('/')}`;
    crumbs.push({ label, href });
  }

  return crumbs.length > 0 ? crumbs : [{ label: BREADCRUMB_LABELS.dashboard }];
}

function isDynamicSegment(segment: string): boolean {
  return segment.length > 0 && !BREADCRUMB_LABELS[segment];
}

function formatSegment(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
