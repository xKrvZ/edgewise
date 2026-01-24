import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AbuseReportDao } from '../daos/abuse-report.dao';
import { PunishmentDao } from '../../punishment/daos/punishment.dao';
import { NoteDao } from '@/modules/note/daos/note.dao';
import { AbuseReportDto, ReportStatus } from '../dtos/abuse-report.dto';
import { CreateAbuseReportDto } from '../dtos/create-abuse-report.dto';
import { ReviewAbuseReportDto } from '../dtos/review-abuse-report.dto';
import { BulkReviewAbuseReportsDto } from '../dtos/bulk-review-abuse-reports.dto';
import { AbuseReportQueryDto } from '../dtos/abuse-report-query.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { PunishmentReason } from '../../punishment/constants/punishment-reason.constants';
import { CreatePunishmentDto } from '../../punishment/dtos/create-punishment.dto';
import { PunishmentDto } from '../../punishment/dtos/punishment.dto';

@Injectable()
export class AbuseReportService {
  constructor(
    private readonly abuseReportDao: AbuseReportDao,
    private readonly punishmentDao: PunishmentDao,
    private readonly noteDao: NoteDao,
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

  async create(
    createAbuseReportDto: CreateAbuseReportDto,
    reporterId: string,
    includes?: Set<string>,
  ): Promise<AbuseReportDto> {
    return await this.abuseReportDao.create(
      {
        reportedPlayerId: createAbuseReportDto.reportedPlayerId,
        reportReasons: createAbuseReportDto.reportReasons,
        description: createAbuseReportDto.description,
        metadata: createAbuseReportDto.metadata,
      },
      reporterId,
      includes,
    );
  }

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
        reviewedById,
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

    // Check if we need to create a note (before creating punishment)
    const needsNote =
      createPunishmentDto.punishmentReasons.includes('OTHER' as any) &&
      createPunishmentDto.note;

    // Use transaction to create punishment and update report
    return await this.abuseReportDao.transaction(async (trx) => {
      const abuseReportDao = this.abuseReportDao.transacting(trx);
      const punishmentDao = this.punishmentDao.transacting(trx);
      const noteDao = this.noteDao.transacting(trx);

      // Create punishment with the reported player as the target
      // Automatically add ABUSE_REPORT_ACCEPTED to the punishment reasons
      const punishmentReasons: PunishmentReason[] = [
        ...(createPunishmentDto.punishmentReasons || []),
        'ABUSE_REPORT_ACCEPTED' as PunishmentReason,
      ];

      // Create punishment first (without note ID)
      const punishment = await punishmentDao.create(
        {
          ...createPunishmentDto,
          punishmentReasons: punishmentReasons as any, // Cast to allow ABUSE_REPORT_ACCEPTED
          playerId: report.reportedPlayer!.id,
        } as any,
        reviewedById,
        undefined, // No note ID yet
        undefined, // includes
      );

      // Create note and update punishment if needed
      let punishmentNoteId: string | undefined = undefined;
      if (needsNote) {
        const createdNote = await noteDao.create(
          {
            entityId: punishment.id,
            entityType: 'Punishment',
            text: createPunishmentDto.note!,
          },
          reviewedById,
          false,
        );

        punishmentNoteId = createdNote.id;

        // Update punishment with note ID
        await punishmentDao.updatePunishment(punishment.id, {
          punishmentNoteId: createdNote.id,
        });
      }

      // Update report with punishment ID and reviewedById
      const updatedReport = await abuseReportDao.updateReview(
        id,
        reviewAbuseReportDto.status,
        punishment.id,
        reviewedById,
        includes,
      );

      if (!updatedReport) {
        throw new NotFoundException(`Failed to update abuse report with ID ${id}`);
      }

      return updatedReport;
    });
  }

  async bulkReviewByPlayerId(
    bulkReviewDto: BulkReviewAbuseReportsDto,
    reviewedById: string,
  ): Promise<{ punishment: PunishmentDto; reportsUpdated: number }> {
    // Find all pending abuse reports for the player
    const pendingReports = await this.abuseReportDao.findPendingByReportedPlayerId(
      bulkReviewDto.playerId,
    );

    if (pendingReports.length === 0) {
      throw new BadRequestException(
        `No pending abuse reports found for player with ID ${bulkReviewDto.playerId}`,
      );
    }

    // Use transaction to create punishment and update all reports
    return await this.abuseReportDao.transaction(async (trx) => {
      const abuseReportDao = this.abuseReportDao.transacting(trx);
      const punishmentDao = this.punishmentDao.transacting(trx);
      const noteDao = this.noteDao.transacting(trx);

      // Create punishment with the player as the target
      // Automatically add ABUSE_REPORT_ACCEPTED to the punishment reasons
      const punishmentReasons: PunishmentReason[] = [
        ...(bulkReviewDto.punishment.punishmentReasons || []),
        'ABUSE_REPORT_ACCEPTED' as PunishmentReason,
      ];

      // Create punishment first (without note ID)
      let punishment: PunishmentDto | null = await punishmentDao.create(
        {
          ...bulkReviewDto.punishment,
          punishmentReasons: punishmentReasons as any, // Cast to allow ABUSE_REPORT_ACCEPTED
          playerId: bulkReviewDto.playerId,
        } as any,
        reviewedById,
        undefined, // No note ID yet
        undefined, // includes
      );

      // Create note and update punishment if needed
      if (bulkReviewDto.punishment.punishmentReasons.includes('OTHER' as any) &&
      bulkReviewDto.punishment.note) {
        const createdNote = await noteDao.create(
          {
            entityId: punishment.id,
            entityType: 'Punishment',
            text: bulkReviewDto.punishment.note!,
          },
          reviewedById,
          false,
        );

        // Update punishment with note ID
        await punishmentDao.updatePunishment(punishment.id, {
          punishmentNoteId: createdNote.id,
        });
      }

      // Reload punishment to include the note ID (if note was created)
      punishment = await punishmentDao.findById(
        punishment.id,
        undefined,
      );

      if (!punishment) {
        throw new Error('Failed to retrieve created punishment');
      }

      // Update all pending reports with punishment ID and reviewedById
      const reportIds = pendingReports.map((report) => report.id);
      const reportsUpdated = await abuseReportDao.updateBulkReview(
        reportIds,
        'reviewed',
        punishment.id,
        reviewedById,
      );

      return {
        punishment,
        reportsUpdated,
      };
    });
  }
}
