import { Injectable, NotFoundException } from '@nestjs/common';
import { PlayerDao } from '../daos/player.dao';
import { PlayerDto } from '../dtos/player.dto';
import { SyncPlayerDto } from '../dtos/sync-player.dto';
import { PlayerQueryDto } from '../dtos/player-query.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';

@Injectable()
export class PlayerService {
  constructor(private readonly playerDao: PlayerDao) {}

  // ==================== Query Methods ====================

  async getAll(game?: string): Promise<PlayerDto[]> {
    const results = await this.playerDao.getAll(game);

    return results ?? [];
  }

  async getAllPaginated(queryDto: PlayerQueryDto): Promise<PaginatedDto<PlayerDto>> {
    return await this.playerDao.getAllPaginated(queryDto);
  }

  async findById(id: string): Promise<PlayerDto> {
    const result = await this.playerDao.findById(id);

    if (!result) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }

    return result;
  }

  // ==================== Mutation Methods ====================

  async sync(syncPlayerDto: SyncPlayerDto): Promise<PlayerDto> {
    return await this.playerDao.upsert(
      syncPlayerDto.externalId,
      syncPlayerDto.lastKnownUsername,
      syncPlayerDto.game,
    );
  }
}
