import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import { sql } from 'kysely';
import { PlayerDto } from '../dtos/player.dto';

@Injectable()
export class PlayerDao extends KyselyDao<PlayerDao> {
  async getAll(): Promise<PlayerDto[] | null> {
    const players = await this.kysely
      .selectFrom('player')
      .select([
        'id',
        'hytaleId',
        'lastKnownUsername',
        'createdAt',
        'updatedAt',
      ])
      .execute();

    return players.length > 0 ? (players as PlayerDto[]) : null;
  }

  async findById(id: string): Promise<PlayerDto | null> {
    const player = await this.kysely
      .selectFrom('player')
      .select([
        'id',
        'hytaleId',
        'lastKnownUsername',
        'createdAt',
        'updatedAt',
      ])
      .where('id', '=', id)
      .executeTakeFirst();

    return (player as PlayerDto | undefined) ?? null;
  }

  async findByHytaleId(hytaleId: string): Promise<PlayerDto | null> {
    const player = await this.kysely
      .selectFrom('player')
      .select([
        'id',
        'hytaleId',
        'lastKnownUsername',
        'createdAt',
        'updatedAt',
      ])
      .where('hytaleId', '=', hytaleId)
      .executeTakeFirst();

    return (player as PlayerDto | undefined) ?? null;
  }

  async upsert(
    hytaleId: string,
    lastKnownUsername: string,
  ): Promise<PlayerDto> {
    const result = await this.kysely
      .insertInto('player')
      .values({
        hytaleId,
        lastKnownUsername,
        updatedAt: sql`now()`,
      })
      .onConflict((oc) =>
        oc.column('hytaleId').doUpdateSet({
          lastKnownUsername,
          updatedAt: sql`now()`,
        }),
      )
      .returning([
        'id',
        'hytaleId',
        'lastKnownUsername',
        'createdAt',
        'updatedAt',
      ])
      .executeTakeFirstOrThrow();

    return result as PlayerDto;
  }
}
