export type AccountSection = 'profile' | 'trading-accounts' | 'account' | 'billing';

export const ACCOUNT_SECTIONS: { id: AccountSection; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'account', label: 'Account' },
  { id: 'billing', label: 'Billing' },
  { id: 'trading-accounts', label: 'Journals' },
];

export const DEFAULT_ACCOUNT_SECTION: AccountSection = 'profile';

export function parseAccountSection(hash: string): AccountSection {
  const value = hash.replace(/^#/, '');
  if (
    value === 'account' ||
    value === 'billing' ||
    value === 'profile' ||
    value === 'trading-accounts'
  ) {
    return value;
  }
  return DEFAULT_ACCOUNT_SECTION;
}

export const ACCOUNT_SECTION_TITLES: Record<AccountSection, string> = {
  profile: 'Profile',
  account: 'Account',
  billing: 'Billing',
  'trading-accounts': 'Journals',
};

export const ACCOUNT_SECTION_SUBTITLES: Partial<Record<AccountSection, string>> = {
  profile:
    'Manage your personal data and customize how you appear on your public trader profile.',
  account: 'Manage sign-in details, security settings, and account deletion.',
  billing: 'View your subscription, manage billing through Polar, and download invoices.',
  'trading-accounts':
    'Create, edit, or delete journals for live, paper, or prop-firm trading. Each journal tracks separately — deletions are permanent.',
};
