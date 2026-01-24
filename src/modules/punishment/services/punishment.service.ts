import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PunishmentDao } from '../daos/punishment.dao';
import { NoteDao } from '@/modules/note/daos/note.dao';
import { AppealDao } from '@/modules/appeal/daos/appeal.dao';
import { AbuseReportDao } from '@/modules/abuse-report/daos/abuse-report.dao';
import { PunishmentDto } from '../dtos/punishment.dto';
import { PublicPunishmentDto } from '../dtos/public-punishment.dto';
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
    @Inject(forwardRef(() => AbuseReportDao))
    private readonly abuseReportDao: AbuseReportDao,
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

  async isAppealLocked(punishmentId: string): Promise<boolean> {
    const punishment = await this.punishmentDao.findById(punishmentId);
    return punishment?.appealLocked ?? false;
  }

  async findByShortCodeId(shortCodeId: string): Promise<PublicPunishmentDto> {
    const result = await this.punishmentDao.findByShortCodeId(shortCodeId);

    if (!result) {
      throw new NotFoundException(`Punishment with short code ID ${shortCodeId} not found`);
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
    // Check if punishment is being created from an abuse report review
    // If not, validate that player has no pending abuse reports
    if (!createPunishmentDto.relatedAbuseReportId) {
      const pendingReports = await this.abuseReportDao.findPendingByReportedPlayerId(
        createPunishmentDto.playerId,
      );

      if (pendingReports.length > 0) {
        throw new BadRequestException(
          `Cannot create punishment for this player. There ${pendingReports.length === 1 ? 'is' : 'are'} ${pendingReports.length} pending abuse report${pendingReports.length === 1 ? '' : 's'} that must be reviewed first.`,
        );
      }
    }

    // Use transaction to create note and punishment
    return await this.punishmentDao.transaction(async (trx) => {
      const punishmentDao = this.punishmentDao.transacting(trx);
      const noteDao = this.noteDao.transacting(trx);

      // Create punishment first (without note ID)
      const punishment = await punishmentDao.create(
        createPunishmentDto,
        issuedById,
        undefined, // No note ID yet
        includes,
      );

      // Create note for the punishment if "OTHER" is selected and note is provided
      if (createPunishmentDto.punishmentReasons.includes('OTHER' as any) && createPunishmentDto.note) {
        const createdNote = await noteDao.create(
          {
            entityId: punishment.id,
            entityType: 'Punishment',
            text: createPunishmentDto.note,
          },
          issuedById,
          false,
        );

        // Update punishment with note ID
        await punishmentDao.updatePunishment(punishment.id, {
          punishmentNoteId: createdNote.id,
        });

        // Reload punishment to include the note ID
        const updatedPunishment = await punishmentDao.findById(punishment.id, includes);
        if (!updatedPunishment) {
          throw new Error('Failed to retrieve updated punishment');
        }
        return updatedPunishment;
      }

      return punishment;
    });
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

  async updateExpiry(
    id: string,
    expiry: string | null,
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
        `Cannot update expiry for punishment with ID ${id} because it has already been lifted`,
      );
    }

    // Check if punishment has already expired
    if (punishment.expiry) {
      const currentExpiry = new Date(punishment.expiry);
      const now = new Date();
      if (currentExpiry <= now) {
        throw new BadRequestException(
          `Cannot update expiry for punishment with ID ${id} because it has already expired`,
        );
      }
    }

    // Check if punishment type is kick (kicks don't have expiry)
    if (punishment.punishmentType === 'kick') {
      throw new BadRequestException(
        `Cannot update expiry for punishment with ID ${id} because kick punishments do not have an expiry`,
      );
    }

    // Handle null expiry (permanent punishment)
    if (expiry === null || expiry === undefined) {
      const result = await this.punishmentDao.updateExpiry(id, null, includes);
      if (!result) {
        throw new NotFoundException(`Punishment with ID ${id} not found`);
      }
      return result;
    }

    // Validate that the new expiry is in the future
    const newExpiry = new Date(expiry);
    const now = new Date();
    if (newExpiry <= now) {
      throw new BadRequestException('New expiry date must be in the future');
    }

    // Validate that the new expiry is different from the current expiry
    if (punishment.expiry) {
      const currentExpiry = new Date(punishment.expiry);
      if (newExpiry.getTime() === currentExpiry.getTime()) {
        throw new BadRequestException(
          'New expiry date must be different from the current expiry date',
        );
      }
    }

    const result = await this.punishmentDao.updateExpiry(id, newExpiry, includes);

    if (!result) {
      throw new NotFoundException(`Punishment with ID ${id} not found`);
    }

    return result;
  }

  async updateAppealLocked(
    id: string,
    appealLocked: boolean,
    includes?: Set<string>,
  ): Promise<PunishmentDto> {
    const result = await this.punishmentDao.updateAppealLocked(id, appealLocked, includes);

    if (!result) {
      throw new NotFoundException(`Punishment with ID ${id} not found`);
    }

    return result;
  }
}
