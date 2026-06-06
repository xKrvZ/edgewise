import {
  BarChart3,
  BookOpenCheck,
  FlaskConical,
  LayoutDashboard,
  LineChart,
  type LucideIcon,
  NotebookPen,
  Play,
  Users,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Trading',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Trades', href: '/trades', icon: LineChart },
      { label: 'Notebook', href: '/journal', icon: NotebookPen },
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Social',
    items: [{ label: 'Community', href: '/community', icon: Users }],
  },
  {
    label: 'Strategy',
    items: [
      { label: 'Playbooks', href: '/playbooks', icon: BookOpenCheck },
      { label: 'Backtesting', href: '/backtesting', icon: FlaskConical },
      { label: 'Replay', href: '/replay', icon: Play },
    ],
  },
];

/** Flat list for consumers that only need ordered nav items. */
export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);
