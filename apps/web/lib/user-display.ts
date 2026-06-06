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

export function userDisplayName(fields: UserDisplayFields): string;
export function userDisplayName(name?: string | null, email?: string | null): string;
export function userDisplayName(
  nameOrFields?: UserDisplayFields | string | null,
  email?: string | null,
): string {
  if (typeof nameOrFields === 'object' && nameOrFields !== null) {
    return resolveUserDisplayLabel(nameOrFields);
  }
  return resolveUserDisplayLabel({ name: nameOrFields, email });
}

export function userInitials(fields: UserDisplayFields): string;
export function userInitials(name?: string | null, email?: string | null): string;
export function userInitials(
  nameOrFields?: UserDisplayFields | string | null,
  email?: string | null,
): string {
  const fields =
    typeof nameOrFields === 'object' && nameOrFields !== null
      ? nameOrFields
      : { name: nameOrFields, email };

  const source = fields.displayName?.trim() || fields.name || fields.email;
  if (!source) {
    return 'U';
  }
  if (source.includes('@')) {
    return source[0]!.toUpperCase();
  }
  return source
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function userAvatarUrl(user?: {
  image?: string | null;
  avatarUrl?: string | null;
} | null): string | undefined {
  if (!user) {
    return undefined;
  }

  const url = user.avatarUrl ?? user.image;
  return url ?? undefined;
}
