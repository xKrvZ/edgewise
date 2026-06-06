export const ACCOUNT_TYPES = ['live', 'paper', 'prop'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'CHF',
  'JPY',
  'NZD',
  'SGD',
  'HKD',
] as const;
export type AccountCurrency = (typeof ACCOUNT_CURRENCIES)[number];

export const CHALLENGE_STATUSES = ['active', 'passed', 'failed'] as const;
export type ChallengeStatus = (typeof CHALLENGE_STATUSES)[number];
