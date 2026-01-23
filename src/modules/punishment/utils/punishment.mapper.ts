import { PunishmentDto, PunishmentType } from '../dtos/punishment.dto';
import { PunishmentReason } from '../constants/punishment-reason.constants';

/**
 * Maps punishment data from joined query results to PunishmentDto or partial PunishmentDto
 * 
 * @param row - The raw query result row
 * @param prefix - The prefix used for the punishment fields in the query (e.g., 'punishment')
 * @returns A partial PunishmentDto with available fields, or null if no punishment data exists
 * 
 * @example
 * ```typescript
 * // In a DAO query with joined punishment data:
 * .select([
 *   'punishment.id as punishment_id',
 *   'punishment.punishmentType as punishment_punishmentType',
 * ])
 * 
 * // Then in mapToDto:
 * punishmentType: PunishmentMapper.mapType(row, 'punishment')
 * ```
 */
export class PunishmentMapper {
  /**
   * Maps only the punishmentType field
   * Used when only the type is needed (e.g., in Appeal)
   */
  static mapType(row: any, prefix: string = 'punishment'): PunishmentType | null {
    const punishmentType = row[`${prefix}_punishmentType`] || row[`${prefix}.punishmentType`] || row.punishmentType;

    if (!punishmentType) {
      return null;
    }

    return punishmentType as PunishmentType;
  }

  /**
   * Maps a minimal punishment object with id and punishmentType
   * Used when you need basic punishment info
   */
  static mapBasic(
    row: any,
    prefix: string = 'punishment',
  ): Pick<PunishmentDto, 'id' | 'punishmentType'> | null {
    const id = row[`${prefix}_id`] || row[`${prefix}.id`];
    const punishmentType = row[`${prefix}_punishmentType`] || row[`${prefix}.punishmentType`];

    if (!id || !punishmentType) {
      return null;
    }

    return {
      id,
      punishmentType: punishmentType as PunishmentType,
    };
  }

  /**
   * Maps a full PunishmentDto from query results
   * Used when all punishment fields are selected
   */
  static mapFull(row: any, prefix: string = 'punishment'): PunishmentDto | null {
    const id = row[`${prefix}_id`] || row[`${prefix}.id`];
    const punishmentType = row[`${prefix}_punishmentType`] || row[`${prefix}.punishmentType`];
    const punishmentReasons = row[`${prefix}_punishmentReasons`] || row[`${prefix}.punishmentReasons`] || row.punishmentReasons || [];
    const expiry = row[`${prefix}_expiry`] || row[`${prefix}.expiry`];
    const createdAt = row[`${prefix}_createdAt`] || row[`${prefix}.createdAt`];
    const lifted = row[`${prefix}_lifted`] || row[`${prefix}.lifted`];
    const liftedAt = row[`${prefix}_liftedAt`] || row[`${prefix}.liftedAt`];
    const relatedAbuseReportId =
      row[`${prefix}_relatedAbuseReportId`] || row[`${prefix}.relatedAbuseReportId`];

    if (!id) {
      return null;
    }

    // Extract reasons from JSON structure if needed
    let reasons: PunishmentReason[] = [];
    if (punishmentReasons) {
      if (punishmentReasons.reasons && Array.isArray(punishmentReasons.reasons)) {
        reasons = punishmentReasons.reasons as PunishmentReason[];
      } else if (Array.isArray(punishmentReasons)) {
        reasons = punishmentReasons as PunishmentReason[];
      }
    }

    return {
      id,
      punishmentType: punishmentType as PunishmentType,
      punishmentReasons: reasons,
      expiry: expiry ? (expiry instanceof Date ? expiry.toISOString() : expiry) : null,
      createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
      player: row.player, // Should be mapped separately using PlayerMapper
      issuedBy: row.issuedBy, // Should be mapped separately using UserMapper
      lifted: lifted ?? false,
      liftedBy: row.liftedBy, // Should be mapped separately using UserMapper
      liftedAt: liftedAt ? (liftedAt instanceof Date ? liftedAt.toISOString() : liftedAt) : null,
      relatedAbuseReportId: relatedAbuseReportId ?? null,
    };
  }
}
