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
import { PlaybookService } from '../services/playbook.service';
import { PlaybookDto } from '../dtos/playbook.dto';
import { CreatePlaybookDto } from '../dtos/create-playbook.dto';
import { UpdatePlaybookDto } from '../dtos/update-playbook.dto';
import {
  CreateChecklistItemDto,
  PlaybookChecklistItemDto,
  UpdateChecklistItemDto,
} from '../dtos/playbook-checklist-item.dto';

@ApiTags('Playbooks')
@Controller('playbooks')
export class PlaybookController {
  constructor(private readonly playbookService: PlaybookService) {}

  @Get()
  @ApiOperation({ summary: 'List playbooks' })
  @ApiOkResponse({ type: PlaybookDto, isArray: true })
  async list(@Session() session: UserSession): Promise<PlaybookDto[]> {
    return this.playbookService.list(session.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a playbook (with checklist) by id' })
  @ApiOkResponse({ type: PlaybookDto })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<PlaybookDto> {
    return this.playbookService.getById(id, session.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a playbook' })
  @ApiCreatedResponse({ type: PlaybookDto })
  async create(
    @Body() dto: CreatePlaybookDto,
    @Session() session: UserSession,
  ): Promise<PlaybookDto> {
    return this.playbookService.create(session.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a playbook' })
  @ApiOkResponse({ type: PlaybookDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlaybookDto,
    @Session() session: UserSession,
  ): Promise<PlaybookDto> {
    return this.playbookService.update(id, session.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a playbook' })
  @ApiNoContentResponse()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.playbookService.remove(id, session.user.id);
  }

  // ==================== Checklist items ====================

  @Get(':id/checklist')
  @ApiOperation({ summary: 'List checklist items for a playbook' })
  @ApiOkResponse({ type: PlaybookChecklistItemDto, isArray: true })
  async listChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<PlaybookChecklistItemDto[]> {
    return this.playbookService.listChecklist(id, session.user.id);
  }

  @Post(':id/checklist')
  @ApiOperation({ summary: 'Add a checklist item to a playbook' })
  @ApiCreatedResponse({ type: PlaybookChecklistItemDto })
  async addChecklistItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateChecklistItemDto,
    @Session() session: UserSession,
  ): Promise<PlaybookChecklistItemDto> {
    return this.playbookService.addChecklistItem(id, session.user.id, dto);
  }

  @Patch(':id/checklist/:itemId')
  @ApiOperation({ summary: 'Update a checklist item' })
  @ApiOkResponse({ type: PlaybookChecklistItemDto })
  async updateChecklistItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateChecklistItemDto,
    @Session() session: UserSession,
  ): Promise<PlaybookChecklistItemDto> {
    return this.playbookService.updateChecklistItem(
      id,
      itemId,
      session.user.id,
      dto,
    );
  }

  @Delete(':id/checklist/:itemId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a checklist item' })
  @ApiNoContentResponse()
  async removeChecklistItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.playbookService.removeChecklistItem(id, itemId, session.user.id);
  }
}
