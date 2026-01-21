import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { NoteDao } from '../daos/note.dao';
import { NoteDto } from '../dtos/note.dto';
import { CreateNoteDto } from '../dtos/create-note.dto';
import { NoteQueryDto } from '../dtos/note-query.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { ROLES, hasRole } from '@/auth/constants/roles.constants';

const USER_ENTITY_TYPE = 'User';

@Injectable()
export class NoteService {
  constructor(private readonly noteDao: NoteDao) {}

  // ==================== Query Methods ====================

  async findByEntity(
    entityId: string,
    entityType: string,
    includeUser: boolean = false,
    userRole?: string | string[] | null,
  ): Promise<NoteDto[]> {
    // Check if accessing User entity type - only admins allowed
    if (entityType === USER_ENTITY_TYPE && !hasRole(userRole, ROLES.ADMINISTRATOR)) {
      throw new ForbiddenException('Only administrators can access notes for User entities');
    }

    // Entity type is already normalized and validated by EntityTypePipe
    return await this.noteDao.findByEntity(entityId, entityType, includeUser);
  }

  async getAllPaginated(
    queryDto: NoteQueryDto,
    includeUser: boolean = false,
    userRole?: string | string[] | null,
  ): Promise<PaginatedDto<NoteDto>> {
    // Check if filtering by User entity type - only admins allowed
    if (queryDto.entityType === USER_ENTITY_TYPE && !hasRole(userRole, ROLES.ADMINISTRATOR)) {
      throw new ForbiddenException('Only administrators can access notes for User entities');
    }

    const result = await this.noteDao.getAllPaginated(queryDto, includeUser);

    // Filter out User entity notes if user is not admin
    if (!hasRole(userRole, ROLES.ADMINISTRATOR)) {
      result.items = result.items.filter((note) => note.entityType !== USER_ENTITY_TYPE);
    }

    return result;
  }

  async findById(
    id: string,
    includeUser: boolean = false,
    userRole?: string | string[] | null,
  ): Promise<NoteDto> {
    const result = await this.noteDao.findById(id, includeUser);

    if (!result) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }

    // Check if note is for User entity type - only admins allowed
    if (result.entityType === USER_ENTITY_TYPE && !hasRole(userRole, ROLES.ADMINISTRATOR)) {
      throw new ForbiddenException('Only administrators can access notes for User entities');
    }

    return result;
  }

  // ==================== Mutation Methods ====================

  async create(
    data: CreateNoteDto,
    createdById: string,
    includeUser: boolean = false,
    userRole?: string | string[] | null,
  ): Promise<NoteDto> {
    // Check if creating note for User entity type - only admins allowed
    if (data.entityType === USER_ENTITY_TYPE && !hasRole(userRole, ROLES.ADMINISTRATOR)) {
      throw new ForbiddenException('Only administrators can create notes for User entities');
    }

    return await this.noteDao.create(data, createdById, includeUser);
  }

  async delete(
    id: string,
    userId: string,
    userRole: string | string[] | null | undefined,
  ): Promise<void> {
    const createdById = await this.noteDao.getCreatedById(id);

    if (!createdById) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }

    // Check if user is admin (can delete any note) or if user created the note
    const isAdmin = hasRole(userRole, ROLES.ADMINISTRATOR);
    const isOwner = createdById === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You can only delete your own notes');
    }

    const deleted = await this.noteDao.delete(id);

    if (!deleted) {
      throw new NotFoundException(`Failed to delete note with ID ${id}`);
    }
  }
}
