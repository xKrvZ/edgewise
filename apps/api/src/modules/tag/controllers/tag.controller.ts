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
import { TagService } from '../services/tag.service';
import { TagDto } from '../dtos/tag.dto';
import { CreateTagDto } from '../dtos/create-tag.dto';
import { UpdateTagDto } from '../dtos/update-tag.dto';

@ApiTags('Tags')
@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  @ApiOperation({ summary: 'List trade tags' })
  @ApiOkResponse({ type: TagDto, isArray: true })
  async list(@Session() session: UserSession): Promise<TagDto[]> {
    return this.tagService.list(session.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tag by id' })
  @ApiOkResponse({ type: TagDto })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<TagDto> {
    return this.tagService.getById(id, session.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a tag' })
  @ApiCreatedResponse({ type: TagDto })
  async create(
    @Body() dto: CreateTagDto,
    @Session() session: UserSession,
  ): Promise<TagDto> {
    return this.tagService.create(session.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tag' })
  @ApiOkResponse({ type: TagDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTagDto,
    @Session() session: UserSession,
  ): Promise<TagDto> {
    return this.tagService.update(id, session.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a tag' })
  @ApiNoContentResponse()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.tagService.remove(id, session.user.id);
  }
}
