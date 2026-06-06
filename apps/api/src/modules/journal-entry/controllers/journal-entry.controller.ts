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
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { JournalEntryService } from '../services/journal-entry.service';
import {
  CreateJournalEntryDto,
  JournalEntryDto,
  JournalEntryQueryDto,
  UpdateJournalEntryDto,
} from '../dtos/journal-entry.dto';

@ApiTags('Journal')
@Controller('journal-entries')
export class JournalEntryController {
  constructor(private readonly journalEntryService: JournalEntryService) {}

  @Get()
  @ApiOperation({ summary: 'List journal entries (filter by date/trade)' })
  @ApiOkResponse({ type: JournalEntryDto, isArray: true })
  async list(
    @Query() query: JournalEntryQueryDto,
    @Session() session: UserSession,
  ): Promise<JournalEntryDto[]> {
    return this.journalEntryService.list(session.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a journal entry by id' })
  @ApiOkResponse({ type: JournalEntryDto })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<JournalEntryDto> {
    return this.journalEntryService.getById(id, session.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a journal entry' })
  @ApiCreatedResponse({ type: JournalEntryDto })
  async create(
    @Body() dto: CreateJournalEntryDto,
    @Session() session: UserSession,
  ): Promise<JournalEntryDto> {
    return this.journalEntryService.create(session.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a journal entry' })
  @ApiOkResponse({ type: JournalEntryDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJournalEntryDto,
    @Session() session: UserSession,
  ): Promise<JournalEntryDto> {
    return this.journalEntryService.update(id, session.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a journal entry' })
  @ApiNoContentResponse()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.journalEntryService.remove(id, session.user.id);
  }
}
