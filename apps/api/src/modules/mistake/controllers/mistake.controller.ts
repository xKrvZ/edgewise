import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { MistakeService } from '../services/mistake.service';
import { MistakeDto } from '../dtos/mistake.dto';
import { CreateMistakeDto } from '../dtos/create-mistake.dto';
import { UpdateMistakeDto } from '../dtos/update-mistake.dto';

@ApiTags('Mistakes')
@Controller('mistakes')
export class MistakeController {
  constructor(private readonly mistakeService: MistakeService) {}

  @Get()
  @ApiOperation({ summary: 'List trade mistakes' })
  @ApiOkResponse({ type: MistakeDto, isArray: true })
  async list(@Session() session: UserSession): Promise<MistakeDto[]> {
    return this.mistakeService.list(session.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a mistake by id' })
  @ApiOkResponse({ type: MistakeDto })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<MistakeDto> {
    return this.mistakeService.getById(id, session.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a mistake' })
  @ApiCreatedResponse({ type: MistakeDto })
  async create(
    @Body() dto: CreateMistakeDto,
    @Session() session: UserSession,
  ): Promise<MistakeDto> {
    return this.mistakeService.create(session.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a mistake' })
  @ApiOkResponse({ type: MistakeDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMistakeDto,
    @Session() session: UserSession,
  ): Promise<MistakeDto> {
    return this.mistakeService.update(id, session.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a mistake' })
  @ApiNoContentResponse()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.mistakeService.remove(id, session.user.id);
  }
}
