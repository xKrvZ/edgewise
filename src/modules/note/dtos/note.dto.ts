import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserDto } from '@/modules/user/dtos/user.dto';
import { SUPPORTED_ENTITY_TYPES } from '../constants/entity-types.constants';

export class NoteDto {
  @Expose()
  @ApiProperty({
    description: 'Unique identifier for the note',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'ID of the entity this note is attached to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  entityId: string;

  @Expose()
  @ApiProperty({
    description: `Type of entity this note is attached to. Supported types: ${SUPPORTED_ENTITY_TYPES.join(', ')}`,
    example: 'Punishment',
    enum: SUPPORTED_ENTITY_TYPES,
  })
  entityType: string;

  @Expose()
  @ApiProperty({
    description: 'Text content of the note',
    example: 'This player has been warned multiple times.',
  })
  text: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'User who created the note',
    type: UserDto,
  })
  createdBy?: UserDto;

  @Expose()
  @ApiProperty({
    description: 'Timestamp when the note was created',
    example: '2025-01-20T19:16:10.000Z',
  })
  createdAt: string;

  @Expose()
  @ApiProperty({
    description: 'Timestamp when the note was last updated',
    example: '2025-01-20T19:16:10.000Z',
  })
  updatedAt: string;
}
