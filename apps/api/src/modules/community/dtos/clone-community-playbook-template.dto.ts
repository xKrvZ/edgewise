import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { COMMUNITY_PLAYBOOK_TEMPLATE_NAME_MAX_LENGTH } from '../constants/community.constants';

export class CloneCommunityPlaybookTemplateDto {
  @ApiPropertyOptional({
    example: 'Opening Range Breakout (copy)',
    description: 'Name for the cloned personal playbook. Defaults to the template name.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(COMMUNITY_PLAYBOOK_TEMPLATE_NAME_MAX_LENGTH)
  name?: string;
}
