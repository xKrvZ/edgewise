import { PartialType } from '@nestjs/swagger';
import { CreateMistakeDto } from './create-mistake.dto';

export class UpdateMistakeDto extends PartialType(CreateMistakeDto) {}
