import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PunishmentDao } from '../daos/punishment.dao';
import { PunishmentDto } from '../dtos/punishment.dto';
import { CreatePunishmentDto } from '../dtos/create-punishment.dto';
import { LiftPunishmentsDto } from '../dtos/lift-punishments.dto';
import { PunishmentQueryDto } from '../dtos/punishment-query.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';

@Injectable()
export class PunishmentService {
  constructor(private readonly punishmentDao: PunishmentDao) {}

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
    return await this.punishmentDao.create(createPunishmentDto, issuedById, includes);
  }

  async lift(id: string, liftedById: string, includes?: Set<string>): Promise<PunishmentDto> {
    const result = await this.punishmentDao.lift(id, liftedById, includes);

    if (!result) {
      throw new NotFoundException(
        `Punishment with ID ${id} not found or already lifted`,
      );
    }

    return result;
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
