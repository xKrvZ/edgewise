import { Injectable, NotFoundException } from '@nestjs/common';
import { PlayerDao } from '../daos/player.dao';
import { PlayerDto } from '../dtos/player.dto';
import { SyncPlayerDto } from '../dtos/sync-player.dto';

@Injectable()
export class PlayerService {
  constructor(private readonly playerDao: PlayerDao) {}

  async getAll(): Promise<PlayerDto[]> {
    const players = await this.playerDao.getAll();

    return players ?? [];
  }

  async findById(id: string): Promise<PlayerDto> {
    const player = await this.playerDao.findById(id);

    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }

    return player;
  }

  async sync(syncPlayerDto: SyncPlayerDto): Promise<PlayerDto> {
    return await this.playerDao.upsert(
      syncPlayerDto.hytaleId,
      syncPlayerDto.lastKnownUsername,
    );
  }
}
