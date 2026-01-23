import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  SerializeOptions,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiTags,
  ApiBody,
  getSchemaPath,
} from '@nestjs/swagger';
import { AbuseReportService } from '../services/abuse-report.service';
import { AbuseReportDto } from '../dtos/abuse-report.dto';
import { ReviewAbuseReportDto } from '../dtos/review-abuse-report.dto';
import { AbuseReportQueryDto } from '../dtos/abuse-report-query.dto';
import { CreatePunishmentDto } from '../../punishment/dtos/create-punishment.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { Roles, Session, UserSession } from '@thallesp/nestjs-better-auth';
import { createPaginatedSchema } from '@/database/utils/paginated-schema.util';
import { ROLES, STAFF_ROLES, hasRole } from '@/auth/constants/roles.constants';

@ApiTags('abuse-report')
@Controller('abuse-report')
@SerializeOptions({ excludeExtraneousValues: true })
export class AbuseReportController {
  constructor(private readonly abuseReportService: AbuseReportService) {}

  /**
   * Validates and filters includes based on user role
   * - Moderators: can include 'player'
   * - Admins: can include 'player'
   */
  private validateIncludes(
    include?: string,
    userRole?: string | string[] | null,
  ): Set<string> {
    if (!include) {
      return new Set();
    }

    const requestedIncludes = new Set(
      include.split(',').map((i) => i.trim().toLowerCase()),
    );

    // Allowed includes (both moderators and admins can see player data)
    const allowedIncludes = ['player'];

    // Filter out any includes that aren't allowed
    const validatedIncludes = new Set<string>();
    for (const inc of requestedIncludes) {
      if (allowedIncludes.includes(inc)) {
        validatedIncludes.add(inc);
      } else {
        throw new BadRequestException(
          `Include '${inc}' is not allowed. Allowed includes: ${allowedIncludes.join(', ')}`,
        );
      }
    }

    return validatedIncludes;
  }

  // ==================== Query Endpoints ====================

  @Get()
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all abuse reports',
    description: 'Retrieves a paginated list of all abuse reports with optional filters, ordering, and cursor-based pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of abuse reports retrieved successfully',
    schema: createPaginatedSchema(getSchemaPath(AbuseReportDto)),
  })
  async getAll(
    @Session() session: UserSession,
    @Query() queryDto: AbuseReportQueryDto,
  ): Promise<PaginatedDto<AbuseReportDto>> {
    const includes = this.validateIncludes(queryDto.include, session.user.role);
    return await this.abuseReportService.getAllPaginated(queryDto, includes);
  }

  @Get(':id')
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get abuse report by ID',
    description: 'Retrieves a specific abuse report by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the abuse report',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Abuse report retrieved successfully',
    type: AbuseReportDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Abuse report not found',
  })
  async findById(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('include') include?: string,
  ): Promise<AbuseReportDto> {
    const includes = this.validateIncludes(include, session.user.role);
    return await this.abuseReportService.findById(id, includes);
  }

  // ==================== Mutation Endpoints ====================

  @Patch(':id/review')
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Review an abuse report',
    description: 'Reviews an abuse report. If action is "no-punishment", only updates status. If action is "punishment", requires punishment data in the request body and creates the punishment in a transaction.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the abuse report',
    type: String,
  })
  @ApiBody({
    description: 'Review data and optional punishment data. If punishment is provided, a punishment will be created. If not, the report will be marked as reviewed without punishment.',
    type: ReviewAbuseReportDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Abuse report reviewed successfully',
    type: AbuseReportDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Abuse report not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data or report already reviewed',
  })
  async review(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() reviewAbuseReportDto: ReviewAbuseReportDto,
    @Query('include') include?: string,
  ): Promise<AbuseReportDto> {
    const includes = this.validateIncludes(include, session.user.role);
    
    const { punishment, ...reviewData } = reviewAbuseReportDto;
    
    // If punishment is provided, validate expiry requirement (same as punishment controller)
    if (punishment) {
      const isAdmin = hasRole(session.user.role, ROLES.ADMINISTRATOR);
      
      // Expiry must be provided unless user is admin
      if (!isAdmin && !punishment.expiry) {
        throw new BadRequestException(
          'Expiry date is required for non-admin users. Only administrators can create permanent punishments.',
        );
      }
    }
    
    return await this.abuseReportService.review(
      id,
      { status: reviewData.status },
      punishment || null,
      session.user.id,
      includes,
    );
  }
}
