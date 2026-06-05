/**
 * User role constants for the platform
 * These roles define the authorization levels for API endpoints
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
