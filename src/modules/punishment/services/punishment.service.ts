import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PunishmentDao } from '../daos/punishment.dao';
import { NoteDao } from '@/modules/note/daos/note.dao';
import { AppealDao } from '@/modules/appeal/daos/appeal.dao';
import { PunishmentDto } from '../dtos/punishment.dto';
import { CreatePunishmentDto } from '../dtos/create-punishment.dto';
import { LiftPunishmentsDto } from '../dtos/lift-punishments.dto';
import { PunishmentQueryDto } from '../dtos/punishment-query.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { LiftReason } from '../constants/lift-reason.constants';

@Injectable()
export class PunishmentService {
  constructor(
    private readonly punishmentDao: PunishmentDao,
    private readonly noteDao: NoteDao,
    @Inject(forwardRef(() => AppealDao))
    private readonly appealDao: AppealDao,
  ) {}

  // ==================== Query Methods ====================

  async getAll(
    punishmentType?: 'ban' | 'mute' | 'kick',
    lifted?: boolean,
    includes?: Set<string>,
  ): Promise<PunishmentDto[]> {
    const results = await this.punishmentDao.getAll(
      {
        punishmentType,
        lifted,
      },
      includes,
    );

    return results ?? [];
  }

  async getAllPaginated(
    queryDto: PunishmentQueryDto,
    includes?: Set<string>,
  ): Promise<PaginatedDto<PunishmentDto>> {
    return await this.punishmentDao.getAllPaginated(queryDto, includes);
  }

  async findById(id: string, includes?: Set<string>): Promise<PunishmentDto> {
    const result = await this.punishmentDao.findById(id, includes);

    if (!result) {
      throw new NotFoundException(`Punishment with ID ${id} not found`);
    }

    return result;
  }

  async findByPlayerId(playerId: string, includes?: Set<string>): Promise<PunishmentDto[]> {
    const results = await this.punishmentDao.findByPlayerId(playerId, includes);

    return results ?? [];
  }

  async findByIssuedBy(issuedById: string, includes?: Set<string>): Promise<PunishmentDto[]> {
    const results = await this.punishmentDao.findByIssuedBy(issuedById, includes);

    return results ?? [];
  }

  // ==================== Mutation Methods ====================

  async create(
    createPunishmentDto: CreatePunishmentDto,
    issuedById: string,
    includes?: Set<string>,
  ): Promise<PunishmentDto> {
    return await this.punishmentDao.create(
      createPunishmentDto,
      issuedById,
      createPunishmentDto.note,
      includes,
    );
  }

  async lift(
    id: string,
    liftedById: string,
    liftReason?: LiftReason | null,
    note?: string,
    includes?: Set<string>,
  ): Promise<PunishmentDto> {
    // First, check if the punishment exists
    const punishment = await this.punishmentDao.findById(id, includes);

    if (!punishment) {
      throw new NotFoundException(`Punishment with ID ${id} not found`);
    }

    // Check if the punishment is already lifted
    if (punishment.lifted) {
      throw new BadRequestException(
        `Punishment with ID ${id} has already been lifted`,
      );
    }

    // Check if there's a pending appeal for this punishment
    const appeals = await this.appealDao.findByPunishmentId(id);
    const pendingAppeal = appeals?.find((appeal) => appeal.status === 'pending');
    if (pendingAppeal) {
      throw new BadRequestException(
        `Cannot lift punishment with ID ${id} because there is a pending appeal. Please review the appeal first.`,
      );
    }

    // Use transaction to create note and lift punishment
    return await this.punishmentDao.transaction(async (trx) => {
      const punishmentDao = this.punishmentDao.transacting(trx);
      const noteDao = this.noteDao.transacting(trx);

      // Create note for the punishment lift if provided
      let liftNoteId: string | undefined;
      if (note) {
        const createdNote = await noteDao.create(
          {
            entityId: id,
            entityType: 'Punishment',
            text: note,
          },
          liftedById,
          false,
        );
        liftNoteId = createdNote.id;
      }

      // Lift the punishment with liftNoteId
      const result = await punishmentDao.lift(
        id,
        liftedById,
        liftReason,
        liftNoteId,
        includes,
      );

      if (!result) {
        throw new NotFoundException(`Punishment with ID ${id} not found`);
      }

      return result;
    });
  }

  async liftBulk(
    liftPunishmentsDto: LiftPunishmentsDto,
    liftedById: string,
  ): Promise<{ count: number }> {
    const { playerId, playerIds, startDate, endDate } = liftPunishmentsDto;

    if (!playerId && !playerIds) {
      throw new BadRequestException('Either playerId or playerIds must be provided');
    }

    if (playerId && playerIds) {
      throw new BadRequestException('Cannot provide both playerId and playerIds');
    }

    const targetPlayerIds = playerId ? [playerId] : playerIds!;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new BadRequestException('Start date must be before end date');
    }

    const count = await this.punishmentDao.liftBulk(
      targetPlayerIds,
      start,
      end,
      liftedById,
    );

    return { count };
  }
}
