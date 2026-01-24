import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AppealDao } from '../daos/appeal.dao';
import { PunishmentDao } from '../../punishment/daos/punishment.dao';
import { NoteDao } from '../../note/daos/note.dao';
import { AppealDto, AppealStatus } from '../dtos/appeal.dto';
import { PublicAppealDto } from '../dtos/public-appeal.dto';
import { CreateAppealDto } from '../dtos/create-appeal.dto';
import { ReviewAppealDto } from '../dtos/review-appeal.dto';
import { AppealQueryDto } from '../dtos/appeal-query.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { LiftReason } from '../../punishment/constants/lift-reason.constants';

@Injectable()
export class AppealService {
  constructor(
    private readonly appealDao: AppealDao,
    private readonly punishmentDao: PunishmentDao,
    private readonly noteDao: NoteDao,
  ) {}

  // ==================== Query Methods ====================

  async getAll(status?: AppealStatus, includes?: Set<string>): Promise<AppealDto[]> {
    const results = await this.appealDao.getAll(status, includes);

    return results ?? [];
  }

  async getAllPaginated(
    queryDto: AppealQueryDto,
    includes?: Set<string>,
  ): Promise<PaginatedDto<AppealDto>> {
    return await this.appealDao.getAllPaginated(queryDto, includes);
  }

  async findById(id: string, includes?: Set<string>): Promise<AppealDto> {
    const result = await this.appealDao.findById(id, includes);

    if (!result) {
      throw new NotFoundException(`Appeal with ID ${id} not found`);
    }

    return result;
  }

  async findByPlayerId(playerId: string, includes?: Set<string>): Promise<AppealDto[]> {
    const results = await this.appealDao.findByPlayerId(playerId, includes);

    return results ?? [];
  }

  async findByPunishmentId(punishmentId: string, includes?: Set<string>): Promise<AppealDto[]> {
    const results = await this.appealDao.findByPunishmentId(punishmentId, includes);

    return results ?? [];
  }

  async findByPunishmentShortCodeId(shortCodeId: string): Promise<PublicAppealDto[]> {
    const results = await this.appealDao.findByPunishmentShortCodeId(shortCodeId);

    return results ?? [];
  }

  // ==================== Mutation Methods ====================

  /**
   * Validates that a punishment can be appealed.
   * This should be called before creating a new appeal.
   * @throws NotFoundException if punishment is not found
   * @throws BadRequestException if appeals are locked or punishment is already lifted
   */
  async validatePunishmentCanBeAppealed(punishmentId: string): Promise<void> {
    const punishment = await this.punishmentDao.findById(punishmentId);
    
    if (!punishment) {
      throw new NotFoundException(`Punishment with ID ${punishmentId} not found`);
    }

    if (punishment.lifted) {
      throw new BadRequestException(
        'This punishment has already been lifted. Appeals cannot be created for lifted punishments.',
      );
    }

    if (punishment.appealLocked) {
      throw new BadRequestException(
        'Appeals are locked for this punishment. New appeals cannot be submitted.',
      );
    }
  }

  async create(
    createAppealDto: CreateAppealDto,
    appealedByUserId: string,
    includes?: Set<string>,
  ): Promise<AppealDto> {
    // Validate that the punishment exists, is not lifted, and appeals are not locked
    await this.validatePunishmentCanBeAppealed(createAppealDto.punishmentId);

    // Check if there are any pending appeals for this punishment
    const existingAppeals = await this.appealDao.findByPunishmentId(createAppealDto.punishmentId);
    const pendingAppeal = existingAppeals?.find((appeal) => appeal.status === 'pending');

    if (pendingAppeal) {
      throw new BadRequestException(
        'There is already a pending appeal for this punishment. Please wait for it to be reviewed before submitting a new appeal.',
      );
    }

    return await this.appealDao.create(createAppealDto, appealedByUserId, includes);
  }

  async review(
    id: string,
    reviewAppealDto: ReviewAppealDto,
    reviewedBy: string,
    includes?: Set<string>,
  ): Promise<AppealDto> {
    const appeal = await this.appealDao.findById(id, includes);

    if (!appeal) {
      throw new NotFoundException(`Appeal with ID ${id} not found`);
    }

    if (appeal.status !== 'pending') {
      throw new BadRequestException('Appeal has already been reviewed');
    }

    // Use transaction to update appeal, create note, and lift punishment if accepted
    return await this.appealDao.transaction(async (trx) => {
      const appealDao = this.appealDao.transacting(trx);
      const punishmentDao = this.punishmentDao.transacting(trx);
      const noteDao = this.noteDao.transacting(trx);

      // Create note for the appeal review if provided
      let createdNoteId: string | undefined;
      if (reviewAppealDto.note) {
        const createdNote = await noteDao.create(
          {
            entityId: id,
            entityType: 'Appeal',
            text: reviewAppealDto.note,
          },
          reviewedBy,
          false,
        );
        createdNoteId = createdNote.id;
      }

      // Update appeal status with reviewNoteId and reasons
      const updatedAppeal = await appealDao.updateStatus(
        id,
        reviewAppealDto.status,
        reviewedBy,
        createdNoteId,
        reviewAppealDto.status === 'accepted' ? reviewAppealDto.acceptanceReason : null,
        reviewAppealDto.status === 'denied' ? reviewAppealDto.rejectionReason : null,
        includes,
      );

      if (!updatedAppeal) {
        throw new NotFoundException(`Failed to update appeal with ID ${id}`);
      }

      // If accepted, lift the punishment with APPEAL_ACCEPTED reason and the review note
      if (reviewAppealDto.status === 'accepted') {
        await punishmentDao.lift(
          appeal.punishmentId,
          reviewedBy,
          'APPEAL_ACCEPTED' as LiftReason,
          createdNoteId,
        );
      }

      return updatedAppeal;
    });
  }
}
