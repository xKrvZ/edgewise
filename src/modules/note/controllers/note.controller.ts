import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  SerializeOptions,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiTags,
  ApiQuery,
  getSchemaPath,
} from '@nestjs/swagger';
import { NoteService } from '../services/note.service';
import { NoteDto } from '../dtos/note.dto';
import { CreateNoteDto } from '../dtos/create-note.dto';
import { NoteQueryDto } from '../dtos/note-query.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { Roles, Session, UserSession } from '@thallesp/nestjs-better-auth';
import { createPaginatedSchema } from '@/database/utils/paginated-schema.util';
import { ROLES, STAFF_ROLES, hasRole, hasAnyRole } from '@/auth/constants/roles.constants';
import { SUPPORTED_ENTITY_TYPES } from '../constants/entity-types.constants';
import { EntityTypePipe } from '../pipes/entity-type.pipe';

@ApiTags('note')
@Controller('note')
@SerializeOptions({ excludeExtraneousValues: true })
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  /**
   * Validates and determines if user data should be included
   * - Moderators can include 'user'
   * - Admins can include 'user'
   */
  private shouldIncludeUser(
    include?: string,
    userRole?: string | string[] | null,
  ): boolean {
    if (!include) {
      return false;
    }

    const requestedIncludes = new Set(
      include.split(',').map((i) => i.trim().toLowerCase()),
    );

    if (requestedIncludes.has('user')) {
      // Only staff (moderator or admin) can include user data
      return hasAnyRole(userRole, STAFF_ROLES);
    }

    return false;
  }

  // ==================== Query Endpoints ====================

  @Get()
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all notes',
    description: 'Retrieves a paginated list of notes with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Notes retrieved successfully',
    schema: createPaginatedSchema(getSchemaPath(NoteDto)),
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only administrators can access notes for User entities',
  })
  async getAll(
    @Session() session: UserSession,
    @Query() queryDto: NoteQueryDto,
    @Query('include') include?: string,
  ): Promise<PaginatedDto<NoteDto>> {
    const includeUser = this.shouldIncludeUser(include, session.user.role);
    return await this.noteService.getAllPaginated(queryDto, includeUser, session.user.role);
  }

  @Get('entity/:entityId/:entityType')
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get notes for a specific entity',
    description: 'Retrieves all notes for a specific entity ID and type',
  })
  @ApiParam({
    name: 'entityId',
    description: 'ID of the entity',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'entityType',
    description: `Type of the entity. Supported types: ${SUPPORTED_ENTITY_TYPES.join(', ')}`,
    example: 'Punishment',
    enum: SUPPORTED_ENTITY_TYPES,
  })
  @ApiQuery({
    name: 'include',
    required: false,
    description: 'Comma-separated list of related entities to include (e.g., "user")',
    example: 'user',
  })
  @ApiResponse({
    status: 200,
    description: 'Notes retrieved successfully',
    type: [NoteDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only administrators can access notes for User entities',
  })
  async findByEntity(
    @Session() session: UserSession,
    @Param('entityId') entityId: string,
    @Param('entityType', EntityTypePipe) entityType: string,
    @Query('include') include?: string,
  ): Promise<NoteDto[]> {
    const includeUser = this.shouldIncludeUser(include, session.user.role);
    return await this.noteService.findByEntity(entityId, entityType, includeUser, session.user.role);
  }

  @Get(':id')
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get note by ID',
    description: 'Retrieves a specific note by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Note ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'include',
    required: false,
    description: 'Comma-separated list of related entities to include (e.g., "user")',
    example: 'user',
  })
  @ApiResponse({
    status: 200,
    description: 'Note retrieved successfully',
    type: NoteDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only administrators can access notes for User entities',
  })
  @ApiResponse({
    status: 404,
    description: 'Note not found',
  })
  async findById(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('include') include?: string,
  ): Promise<NoteDto> {
    const includeUser = this.shouldIncludeUser(include, session.user.role);
    return await this.noteService.findById(id, includeUser, session.user.role);
  }

  // ==================== Mutation Endpoints ====================

  @Post()
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a note',
    description: 'Creates a new note for an entity',
  })
  @ApiResponse({
    status: 201,
    description: 'Note created successfully',
    type: NoteDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only administrators can create notes for User entities',
  })
  async create(
    @Session() session: UserSession,
    @Body() createNoteDto: CreateNoteDto,
    @Query('include') include?: string,
  ): Promise<NoteDto> {
    const includeUser = this.shouldIncludeUser(include, session.user.role);
    return await this.noteService.create(createNoteDto, session.user.id, includeUser, session.user.role);
  }

  @Delete(':id')
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a note',
    description:
      'Deletes a note. Users can only delete their own notes, admins can delete any note.',
  })
  @ApiParam({
    name: 'id',
    description: 'Note ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Note deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You can only delete your own notes',
  })
  @ApiResponse({
    status: 404,
    description: 'Note not found',
  })
  async delete(
    @Session() session: UserSession,
    @Param('id') id: string,
  ): Promise<void> {
    await this.noteService.delete(id, session.user.id, session.user.role);
  }
}
