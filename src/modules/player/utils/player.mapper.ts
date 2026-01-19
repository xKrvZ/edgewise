import { PlayerDto } from '../dtos/player.dto';

/**
 * Maps player data from joined query results to PlayerDto or partial PlayerDto
 * 
 * @param row - The raw query result row
 * @param prefix - The prefix used for the player fields in the query (e.g., 'player', 'reportingPlayer', 'reportedPlayer')
 * @returns A partial PlayerDto with available fields, or null if no player data exists
 * 
 * @example
 * ```typescript
 * // In a DAO query with joined player data:
 * .select([
 *   'player.id as player_id',
 *   'player.lastKnownUsername as player_lastKnownUsername',
 *   'player.externalId as player_externalId',
 * ])
 * 
 * // Then in mapToDto:
 * player: PlayerMapper.map(row, 'player')
 * ```
 */
export class PlayerMapper {
  /**
   * Maps player data with all fields (id, lastKnownUsername, externalId)
   * Used when you need the full player subset for DTOs
   */
  static map(
    row: any,
    prefix: string,
  ): Pick<PlayerDto, 'id' | 'lastKnownUsername' | 'externalId'> | null {
    const id = row[`${prefix}_id`];
    const lastKnownUsername = row[`${prefix}_lastKnownUsername`];
    const externalId = row[`${prefix}_externalId`];

    if (!id) {
      return null;
    }

    return {
      id,
      lastKnownUsername: lastKnownUsername!,
      externalId: externalId ?? undefined,
    };
  }

  /**
   * Maps player data with only id and lastKnownUsername
   * Used when externalId is not needed
   */
  static mapBasic(
    row: any,
    prefix: string,
  ): Pick<PlayerDto, 'id' | 'lastKnownUsername'> | null {
    const id = row[`${prefix}_id`];
    const lastKnownUsername = row[`${prefix}_lastKnownUsername`];

    if (!id) {
      return null;
    }

    return {
      id,
      lastKnownUsername: lastKnownUsername!,
    };
  }

  /**
   * Maps a full PlayerDto from query results
   * Used when all player fields are selected
   */
  static mapFull(row: any, prefix: string = 'player'): PlayerDto | null {
    const id = row[`${prefix}_id`] || row[`${prefix}.id`] || row.id;
    const externalId = row[`${prefix}_externalId`] || row[`${prefix}.externalId`] || row.externalId;
    const lastKnownUsername =
      row[`${prefix}_lastKnownUsername`] ||
      row[`${prefix}.lastKnownUsername`] ||
      row.lastKnownUsername;
    const game = row[`${prefix}_game`] || row[`${prefix}.game`] || row.game;
    const createdAt = row[`${prefix}_createdAt`] || row[`${prefix}.createdAt`] || row.createdAt;
    const updatedAt = row[`${prefix}_updatedAt`] || row[`${prefix}.updatedAt`] || row.updatedAt;

    if (!id) {
      return null;
    }

    return {
      id,
      externalId: externalId!,
      lastKnownUsername: lastKnownUsername!,
      game: game!,
      createdAt: createdAt instanceof Date ? createdAt : new Date(createdAt),
      updatedAt: updatedAt instanceof Date ? updatedAt : new Date(updatedAt),
    };
  }
}
