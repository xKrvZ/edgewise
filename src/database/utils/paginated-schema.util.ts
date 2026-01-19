import { getSchemaPath } from '@nestjs/swagger';

/**
 * Creates a standardized paginated response schema for Swagger documentation
 * 
 * @param itemSchemaRef - The schema reference for the items (e.g., '#/components/schemas/PunishmentDto' or getSchemaPath(PunishmentDto))
 * @returns A schema object that can be used in @ApiResponse decorators
 * 
 * @example
 * ```typescript
 * // Using schema path string
 * @ApiResponse({
 *   status: 200,
 *   schema: createPaginatedSchema('#/components/schemas/PunishmentDto'),
 * })
 * 
 * // Using getSchemaPath helper
 * @ApiExtraModels(PunishmentDto)
 * @ApiResponse({
 *   status: 200,
 *   schema: createPaginatedSchema(getSchemaPath(PunishmentDto)),
 * })
 * ```
 */
export function createPaginatedSchema(itemSchemaRef: string) {
  return {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: { $ref: itemSchemaRef },
      },
      nextCursor: {
        oneOf: [
          { type: 'string' },
          { type: 'number' },
          { type: 'string', format: 'date-time' },
        ],
        nullable: true,
      },
      hasMore: {
        type: 'boolean',
      },
    },
    required: ['items', 'hasMore'],
  };
}
