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
 *       nextCursor: { 
 *         oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'string', format: 'date-time' }],
 *         nullable: true 
 *       },
 *       hasMore: { type: 'boolean' }
 *     },
 *     required: ['items', 'hasMore']
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
    description: 'Cursor for the next page. Use this value in the next request to fetch the next page.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
    oneOf: [
      { type: 'string' },
      { type: 'number' },
      { type: 'string', format: 'date-time' },
    ],
  })
  nextCursor: string | number | Date | null;

  @Expose()
  @ApiProperty({
    description: 'Whether there are more items available after the current page',
    example: true,
  })
  hasMore: boolean;

  constructor(data: { items: T[]; nextCursor: string | number | Date | null; hasMore: boolean }) {
    this.items = data.items;
    this.nextCursor = data.nextCursor;
    this.hasMore = data.hasMore;
  }
}
