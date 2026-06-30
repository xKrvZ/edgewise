import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class SetMemberTagsDto {
  @ApiProperty({ type: String, isArray: true, description: 'Tag ids to assign to the member' })
  @IsArray()
  @IsUUID('all', { each: true })
  tagIds: string[];
}
