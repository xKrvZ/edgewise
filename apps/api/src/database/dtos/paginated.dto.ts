import { ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Generic paginated response DTO for cursor-based pagination
 * 
 * @example
 * ```typescript
 * // In your controller:
 * @ApiExtraModels(PunishmentDto)
 * @ApiResponse({
 *   status: 200,
 *   description: 'Paginated list of punishments',
 *   schema: {
 *     type: 'object',
 *     properties: {
 *       items: {
 *         type: 'array',
 *         items: { $ref: getSchemaPath(PunishmentDto) }
 *       },
 *       previousCursor: { 
 *         type: 'string',
 *         description: 'Base64 encoded cursor for the previous page',
 *         nullable: true 
 *       },
 *       nextCursor: { 
 *         type: 'string',
 *         description: 'Base64 encoded cursor for the next page',
 *         nullable: true 
 *       }
 *     },
 *     required: ['items']
 *   }
 * })
 * ```
 */
export class PaginatedDto<T> {
  @Expose()
  @ApiProperty({
    description: 'Array of items in the current page',
    isArray: true,
  })
  items: T[];

  @Expose()
  @ApiPropertyOptional({
    description: 'Base64 encoded cursor for the previous page. Use this to navigate to the previous page.',
    example: 'eyJ2YWx1ZSI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCIsImZpbHRlcnMiOnt9fQ==',
    nullable: true,
    type: String,
  })
  previousCursor: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Base64 encoded cursor for the next page. Use this to navigate to the next page.',
    example: 'eyJ2YWx1ZSI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMiIsImZpbHRlcnMiOnt9fQ==',
    nullable: true,
    type: String,
  })
  nextCursor: string | null;

  constructor(data: { 
    items: T[]; 
    previousCursor: string | null; 
    nextCursor: string | null;
  }) {
    this.items = data.items;
    this.previousCursor = data.previousCursor;
    this.nextCursor = data.nextCursor;
  }
}
