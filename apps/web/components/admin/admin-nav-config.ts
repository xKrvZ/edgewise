import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface AdminNavSection {
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Management',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Reports', href: '/admin/reports', icon: Wallet },
      { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_SECTIONS.flatMap(
  (section) => section.items,
);
