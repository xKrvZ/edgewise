/** Mirrors `apps/api/src/auth/constants/roles.constants.ts` for client-side role checks. */
export const ROLES = {
  ADMINISTRATOR: 'Administrator',
  MODERATOR: 'Moderator',
  CREATOR: 'Creator',
  VIP: 'VIP',
  MEMBER: 'Member',
  USER: 'User',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES = Object.values(ROLES);

/** Admin display value when `user.role` is null, empty, or legacy lowercase `user`. */
export function displayPlatformRole(role: string | null | undefined): Role {
  const trimmed = role?.trim();
  if (!trimmed) return ROLES.USER;
  if (trimmed.toLowerCase() === ROLES.USER.toLowerCase()) return ROLES.USER;
  return trimmed as Role;
}

export function hasRole(
  userRole: string | string[] | null | undefined,
  requiredRole: Role,
): boolean {
  if (!userRole) return false;
  const roleArray = Array.isArray(userRole) ? userRole : userRole.split(',').map((r) => r.trim());
  return roleArray.includes(requiredRole);
}

export function isAdministrator(userRole: string | string[] | null | undefined): boolean {
  return hasRole(userRole, ROLES.ADMINISTRATOR);
}
