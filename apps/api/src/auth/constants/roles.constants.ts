/**
 * User role constants for the platform.
 *
 * Better Auth admin plugin stores roles on `session.user.role` (comma-separated
 * when multiple). In Nest guards/controllers, check with `hasRole` /
 * `hasAnyRole` against the session role, e.g.
 * `hasRole(session.user.role, ROLES.ADMINISTRATOR)`.
 */
export const ROLES = {
  ADMINISTRATOR: 'Administrator',
  MODERATOR: 'Moderator',
  CREATOR: 'Creator',
  VIP: 'VIP',
  MEMBER: 'Member',
  USER: 'User',
} as const;

/**
 * Staff roles that have elevated permissions (moderators and administrators)
 */
export const STAFF_ROLES: Role[] = [ROLES.MODERATOR, ROLES.ADMINISTRATOR];

/**
 * Type for role values
 */
export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Array of all role values
 */
export const ALL_ROLES = Object.values(ROLES);

/** Admin display value when `user.role` is null, empty, or legacy lowercase `user`. */
export function displayPlatformRole(role: string | null | undefined): Role {
  const trimmed = role?.trim();
  if (!trimmed) return ROLES.USER;
  if (trimmed.toLowerCase() === ROLES.USER.toLowerCase()) return ROLES.USER;
  return trimmed as Role;
}

/**
 * Helper function to check if a user has a specific role
 * Handles both string and array role formats from Better Auth
 */
export function hasRole(
  userRole: string | string[] | null | undefined,
  requiredRole: Role,
): boolean {
  if (!userRole) {
    return false;
  }
  const roleArray = Array.isArray(userRole) ? userRole : [userRole];
  return roleArray.includes(requiredRole);
}

/**
 * Helper function to check if a user has any of the required roles
 * Handles both string and array role formats from Better Auth
 */
export function hasAnyRole(
  userRole: string | string[] | null | undefined,
  requiredRoles: readonly Role[] | Role[],
): boolean {
  if (!userRole) {
    return false;
  }
  const roleArray = Array.isArray(userRole) ? userRole : [userRole];
  return requiredRoles.some((role) => roleArray.includes(role));
}
