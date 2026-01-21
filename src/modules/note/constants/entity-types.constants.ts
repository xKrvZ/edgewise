/**
 * Supported entity types that can have notes attached to them
 */
export const SUPPORTED_ENTITY_TYPES = [
  'Punishment',
  'Player',
  'AbuseReport',
  'Appeal',
  'User',
] as const;

/**
 * Type for supported entity type values
 */
export type SupportedEntityType = (typeof SUPPORTED_ENTITY_TYPES)[number];

/**
 * Check if an entity type is supported
 */
export function isSupportedEntityType(
  entityType: string,
): entityType is SupportedEntityType {
  return SUPPORTED_ENTITY_TYPES.includes(entityType as SupportedEntityType);
}
