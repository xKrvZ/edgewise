export type UserDisplayFields = {
  displayName?: string | null;
  name?: string | null;
  email?: string | null;
};

const DEFAULT_DISPLAY_FALLBACK = 'Trader';

export function resolveUserDisplayLabel(
  fields: UserDisplayFields,
  fallback: string = DEFAULT_DISPLAY_FALLBACK,
): string {
  const trimmedDisplayName = fields.displayName?.trim();
  if (trimmedDisplayName) {
    return trimmedDisplayName;
  }
  if (fields.name) {
    return fields.name;
  }
  if (fields.email) {
    return fields.email.split('@')[0] ?? fields.email;
  }
  return fallback;
}
