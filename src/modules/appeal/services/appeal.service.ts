import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AppealDao } from '../daos/appeal.dao';
import { PunishmentDao } from '../../punishment/daos/punishment.dao';
import { AppealDto, AppealStatus } from '../dtos/appeal.dto';
import { ReviewAppealDto } from '../dtos/review-appeal.dto';
import { AppealQueryDto } from '../dtos/appeal-query.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';

@Injectable()
export class AppealService {
  constructor(
    private readonly appealDao: AppealDao,
    private readonly punishmentDao: PunishmentDao,
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

    // Use transaction to update appeal and lift punishment if accepted
    return await this.appealDao.transaction(async (trx) => {
      const appealDao = this.appealDao.transacting(trx);
      const punishmentDao = this.punishmentDao.transacting(trx);

      // Update appeal status
      const updatedAppeal = await appealDao.updateStatus(
        id,
        reviewAppealDto.status,
        reviewedById,
        includes,
      );

      if (!updatedAppeal) {
        throw new NotFoundException(`Failed to update appeal with ID ${id}`);
      }

      // If accepted, lift the punishment
      if (reviewAppealDto.status === 'accepted') {
        await punishmentDao.lift(appeal.punishmentId, reviewedById);
      }

      return updatedAppeal;
    });
  }
}
