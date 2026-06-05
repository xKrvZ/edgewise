import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";
import { ROLES } from "./constants/roles.constants";

/**
 * Access control statement - defines available resources and actions
 * We use defaultStatements to include the standard admin plugin permissions
 */
const statement = {
  ...defaultStatements,
} as const;

/**
 * Create the access control instance
 */
export const ac = createAccessControl(statement);

/**
 * Define all roles using the access control system
 * Since we're using simple role-based authorization (not fine-grained permissions),
 * we can create roles with empty permissions or minimal permissions
 */
export const roles = {
  [ROLES.ADMINISTRATOR]: ac.newRole({
    ...adminAc.statements,
  }),
  [ROLES.MODERATOR]: ac.newRole({}),
  [ROLES.CREATOR]: ac.newRole({}),
  [ROLES.VIP]: ac.newRole({}),
  [ROLES.MEMBER]: ac.newRole({}),
  [ROLES.USER]: ac.newRole({}),
};
