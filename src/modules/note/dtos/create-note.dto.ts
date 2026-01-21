import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { SUPPORTED_ENTITY_TYPES } from '../constants/entity-types.constants';

export class CreateNoteDto {
  @ApiProperty({
    description: 'ID of the entity this note is attached to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({
    description: 'Type of entity this note is attached to',
    example: 'Punishment',
    enum: SUPPORTED_ENTITY_TYPES,
  })
  @Transform(({ value }) => {
    if (typeof value === 'string' && value.length > 0) {
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }
    return value;
  })
  @IsString()
  @IsNotEmpty()
  @IsIn([...SUPPORTED_ENTITY_TYPES], {
    message: `entityType must be one of: ${SUPPORTED_ENTITY_TYPES.join(', ')}`,
  })
  entityType: string;

  @ApiProperty({
    description: 'Text content of the note',
    example: 'This player has been warned multiple times.',
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}
