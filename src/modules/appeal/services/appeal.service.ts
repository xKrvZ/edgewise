import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AppealDao } from '../daos/appeal.dao';
import { PunishmentDao } from '../../punishment/daos/punishment.dao';
import { NoteDao } from '../../note/daos/note.dao';
import { AppealDto, AppealStatus } from '../dtos/appeal.dto';
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

  // ==================== Mutation Methods ====================

  async review(
    id: string,
    reviewAppealDto: ReviewAppealDto,
    reviewedById: string,
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
          reviewedById,
          false,
        );
        createdNoteId = createdNote.id;
      }

      // Update appeal status with reviewNoteId and reasons
      const updatedAppeal = await appealDao.updateStatus(
        id,
        reviewAppealDto.status,
        reviewedById,
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
          reviewedById,
          'APPEAL_ACCEPTED' as LiftReason,
          createdNoteId,
        );
      }

      return updatedAppeal;
    });
  }
}
