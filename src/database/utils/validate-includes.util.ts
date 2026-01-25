import { BadRequestException } from '@nestjs/common';
import { ROLES, hasRole } from '@/auth/constants/roles.constants';

export interface IncludeValidationConfig {
  /**
   * Includes available to all staff (moderators and admins)
   */
  staffIncludes?: string[];
  /**
   * Additional includes available only to administrators
   */
  adminIncludes?: string[];
  /**
   * Custom error message when an include is not allowed
   * If not provided, a default message will be used
   */
  errorMessage?: string;
}

/**
 * Validates and filters includes based on user role
 * 
 * @param include - Comma-separated string of requested includes
 * @param userRole - User's role(s)
 * @param config - Configuration for allowed includes
 * @returns Set of validated includes
 * @throws BadRequestException if an invalid include is requested
 * 
 * @example
 * ```typescript
 * // Moderators can include 'note', admins can include 'user' and 'note'
 * const includes = validateIncludes(include, session.user.role, {
 *   staffIncludes: ['note'],
 *   adminIncludes: ['user'],
 * });
 * ```
 */
export function validateIncludes(
  include?: string,
  userRole?: string | string[] | null,
  config: IncludeValidationConfig = {},
): Set<string> {
  if (!include) {
    return new Set();
  }

  const { staffIncludes = [], adminIncludes = [], errorMessage } = config;
  const isAdmin = hasRole(userRole, ROLES.ADMINISTRATOR);
  
  // Combine allowed includes based on role
  const allowedIncludes: string[] = isAdmin
    ? [...staffIncludes, ...adminIncludes]
    : staffIncludes;

  const requestedIncludes = new Set(
    include.split(',').map((i) => i.trim().toLowerCase()),
  );

  // Filter out any includes that aren't allowed
  const validatedIncludes = new Set<string>();
  for (const inc of requestedIncludes) {
    if (allowedIncludes.includes(inc)) {
      validatedIncludes.add(inc);
    } else {
      const message = errorMessage || 
        `Include '${inc}' is not allowed for your role. Allowed includes: ${allowedIncludes.join(', ') || 'none'}`;
      throw new BadRequestException(message);
    }
  }

  return validatedIncludes;
}
