import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AbuseReportDao } from '../daos/abuse-report.dao';
import { PunishmentDao } from '../../punishment/daos/punishment.dao';
import { AbuseReportDto, ReportStatus } from '../dtos/abuse-report.dto';
import { ReviewAbuseReportDto } from '../dtos/review-abuse-report.dto';
import { AbuseReportQueryDto } from '../dtos/abuse-report-query.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { PunishmentReason } from '../../punishment/constants/punishment-reason.constants';
import { CreatePunishmentDto } from '../../punishment/dtos/create-punishment.dto';

@Injectable()
export class AbuseReportService {
  constructor(
    private readonly abuseReportDao: AbuseReportDao,
    private readonly punishmentDao: PunishmentDao,
  ) {}

  // ==================== Query Methods ====================

  async getAll(status?: ReportStatus, includes?: Set<string>): Promise<AbuseReportDto[]> {
    const results = await this.abuseReportDao.getAll(status, includes);

    return results ?? [];
  }

  async getAllPaginated(
    queryDto: AbuseReportQueryDto,
    includes?: Set<string>,
  ): Promise<PaginatedDto<AbuseReportDto>> {
    return await this.abuseReportDao.getAllPaginated(queryDto, includes);
  }

  async findById(id: string, includes?: Set<string>): Promise<AbuseReportDto> {
    const result = await this.abuseReportDao.findById(id, includes);

    if (!result) {
      throw new NotFoundException(`Abuse report with ID ${id} not found`);
    }

    return result;
  }

  // ==================== Mutation Methods ====================

  async review(
    id: string,
    reviewAbuseReportDto: ReviewAbuseReportDto,
    createPunishmentDto: CreatePunishmentDto | null,
    reviewedById: string,
    includes?: Set<string>,
  ): Promise<AbuseReportDto> {
    // Always include player for review operation as we need reportedPlayer.id
    const reviewIncludes = new Set<string>(includes || []);
    reviewIncludes.add('player');

    const report = await this.abuseReportDao.findById(id, reviewIncludes);

    if (!report) {
      throw new NotFoundException(`Abuse report with ID ${id} not found`);
    }

    if (report.status === 'reviewed') {
      throw new BadRequestException('Abuse report has already been reviewed');
    }

    // If no punishment is provided, just update the report (no-punishment)
    if (!createPunishmentDto) {
      const updatedReport = await this.abuseReportDao.updateReview(
        id,
        reviewAbuseReportDto.status,
        undefined, // No punishment ID
        includes,
      );

      if (!updatedReport) {
        throw new NotFoundException(`Failed to update abuse report with ID ${id}`);
      }

      return updatedReport;
    }

    // If punishment is provided, create it in transaction
    if (!report.reportedPlayer) {
      throw new BadRequestException('Reported player information is required');
    }

    // Use transaction to create punishment and update report
    return await this.abuseReportDao.transaction(async (trx) => {
      const abuseReportDao = this.abuseReportDao.transacting(trx);
      const punishmentDao = this.punishmentDao.transacting(trx);

      // Create punishment with the reported player as the target
      // Automatically add ABUSE_REPORT_ACCEPTED to the punishment reasons
      const punishmentReasons: PunishmentReason[] = [
        ...(createPunishmentDto.punishmentReasons || []),
        'ABUSE_REPORT_ACCEPTED' as PunishmentReason,
      ];

      // Create punishment with all reasons including ABUSE_REPORT_ACCEPTED
      // We need to cast because CreatePunishmentDto expects ManualPunishmentReason[],
      // but internally the DAO can handle PunishmentReason[] which includes ABUSE_REPORT_ACCEPTED
      const punishment = await punishmentDao.create(
        {
          ...createPunishmentDto,
          punishmentReasons: punishmentReasons as any, // Cast to allow ABUSE_REPORT_ACCEPTED
          playerId: report.reportedPlayer!.id,
          relatedAbuseReportId: id,
        } as any,
        reviewedById,
        createPunishmentDto.note,
      );

      // Update report with punishment ID
      const updatedReport = await abuseReportDao.updateReview(
        id,
        reviewAbuseReportDto.status,
        punishment.id,
        includes,
      );

      if (!updatedReport) {
        throw new NotFoundException(`Failed to update abuse report with ID ${id}`);
      }

      return updatedReport;
    });
  }
}
