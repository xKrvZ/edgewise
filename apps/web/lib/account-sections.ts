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
  profile: 'User Profile',
  account: 'Account',
  billing: 'Billing',
  'trading-accounts': 'Journals',
};

export const ACCOUNT_SECTION_SUBTITLES: Partial<Record<AccountSection, string>> = {
  profile:
    'Manage your personal data and customize how you appear on your public trader profile.',
  'trading-accounts':
    'Create, edit, or delete journals for live, paper, or prop-firm trading. Deleting a journal removes all of its trades and uploads.',
};
