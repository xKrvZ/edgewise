import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AbuseReportDao } from '../daos/abuse-report.dao';
import { PunishmentDao } from '../../punishment/daos/punishment.dao';
import { AbuseReportDto, ReportStatus } from '../dtos/abuse-report.dto';
import { ReviewAbuseReportDto } from '../dtos/review-abuse-report.dto';
import { AbuseReportQueryDto } from '../dtos/abuse-report-query.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';

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

    // If action is "no-punishment", just update the report
    if (reviewAbuseReportDto.actionTaken === 'no-punishment') {
      const updatedReport = await this.abuseReportDao.updateReview(
        id,
        reviewAbuseReportDto.status,
        reviewAbuseReportDto.actionTaken,
        undefined,
        includes,
      );

      if (!updatedReport) {
        throw new NotFoundException(`Failed to update abuse report with ID ${id}`);
      }

      return updatedReport;
    }

    // If action is "punishment", require punishment data and create it in transaction
    if (reviewAbuseReportDto.actionTaken === 'punishment') {
      if (!reviewAbuseReportDto.punishment) {
        throw new BadRequestException(
          'Punishment data is required when actionTaken is "punishment"',
        );
      }

      if (!report.reportedPlayer) {
        throw new BadRequestException('Reported player information is required');
      }

      // Use transaction to create punishment and update report
      return await this.abuseReportDao.transaction(async (trx) => {
        const abuseReportDao = this.abuseReportDao.transacting(trx);
        const punishmentDao = this.punishmentDao.transacting(trx);

        // Create punishment with the reported player as the target
        const punishment = await punishmentDao.create(
          {
            ...reviewAbuseReportDto.punishment!,
            playerId: report.reportedPlayer!.id,
            relatedAbuseReportId: id,
          },
          reviewedById,
        );

        // Update report with punishment ID
        const updatedReport = await abuseReportDao.updateReview(
          id,
          reviewAbuseReportDto.status,
          reviewAbuseReportDto.actionTaken,
          punishment.id,
          includes,
        );

        if (!updatedReport) {
          throw new NotFoundException(`Failed to update abuse report with ID ${id}`);
        }

        return updatedReport;
      });
    }

    throw new BadRequestException('Invalid actionTaken value');
  }
}
