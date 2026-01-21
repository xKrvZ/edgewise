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
  getSchemaPath,
} from '@nestjs/swagger';
import { AppealService } from '../services/appeal.service';
import { AppealDto } from '../dtos/appeal.dto';
import { ReviewAppealDto } from '../dtos/review-appeal.dto';
import { AppealQueryDto } from '../dtos/appeal-query.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { Roles, Session, UserSession } from '@thallesp/nestjs-better-auth';
import { createPaginatedSchema } from '@/database/utils/paginated-schema.util';
import { ROLES, STAFF_ROLES, hasRole } from '@/auth/constants/roles.constants';

@ApiTags('appeal')
@Controller('appeal')
@SerializeOptions({ excludeExtraneousValues: true })
export class AppealController {
  constructor(private readonly appealService: AppealService) {}

  /**
   * Validates and filters includes based on user role
   * - Moderators: no includes allowed (reviewedBy is admin-only)
   * - Admins: can include 'user' for reviewedBy
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

    // Check if user is administrator
    const isAdmin = hasRole(userRole, ROLES.ADMINISTRATOR);

    // Allowed includes based on role
    const allowedIncludes = isAdmin ? ['user'] : [];

    // Filter out any includes that aren't allowed
    const validatedIncludes = new Set<string>();
    for (const inc of requestedIncludes) {
      if (allowedIncludes.includes(inc)) {
        validatedIncludes.add(inc);
      } else {
        throw new BadRequestException(
          `Include '${inc}' is not allowed for your role. Allowed includes: ${allowedIncludes.join(', ') || 'none'}`,
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
    summary: 'List all appeals',
    description: 'Retrieves a paginated list of all appeals with optional filters, ordering, and cursor-based pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of appeals retrieved successfully',
    schema: createPaginatedSchema(getSchemaPath(AppealDto)),
  })
  async getAll(
    @Session() session: UserSession,
    @Query() queryDto: AppealQueryDto,
  ): Promise<PaginatedDto<AppealDto>> {
    const includes = this.validateIncludes(queryDto.include, session.user.role);
    return await this.appealService.getAllPaginated(queryDto, includes);
  }

  @Get('player/:playerId')
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get appeals by player ID',
    description: 'Retrieves all appeals for a specific player',
  })
  @ApiParam({
    name: 'playerId',
    description: 'Unique identifier of the player',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of appeals retrieved successfully',
    type: [AppealDto],
  })
  async findByPlayerId(
    @Session() session: UserSession,
    @Param('playerId') playerId: string,
    @Query('include') include?: string,
  ): Promise<AppealDto[]> {
    const includes = this.validateIncludes(include, session.user.role);
    return await this.appealService.findByPlayerId(playerId, includes);
  }

  @Get('punishment/:punishmentId')
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get appeals by punishment ID',
    description: 'Retrieves all appeals for a specific punishment',
  })
  @ApiParam({
    name: 'punishmentId',
    description: 'Unique identifier of the punishment',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of appeals retrieved successfully',
    type: [AppealDto],
  })
  async findByPunishmentId(
    @Session() session: UserSession,
    @Param('punishmentId') punishmentId: string,
    @Query('include') include?: string,
  ): Promise<AppealDto[]> {
    const includes = this.validateIncludes(include, session.user.role);
    return await this.appealService.findByPunishmentId(punishmentId, includes);
  }

  @Get(':id')
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get appeal by ID',
    description: 'Retrieves a specific appeal by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the appeal',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Appeal retrieved successfully',
    type: AppealDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Appeal not found',
  })
  async findById(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('include') include?: string,
  ): Promise<AppealDto> {
    const includes = this.validateIncludes(include, session.user.role);
    return await this.appealService.findById(id, includes);
  }

  // ==================== Mutation Endpoints ====================

  @Patch(':id/review')
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Review an appeal',
    description: 'Reviews an appeal (accept or deny). If accepted, the punishment is automatically lifted in a transaction.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the appeal',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Appeal reviewed successfully',
    type: AppealDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Appeal not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Appeal has already been reviewed',
  })
  async review(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() reviewAppealDto: ReviewAppealDto,
    @Query('include') include?: string,
  ): Promise<AppealDto> {
    const includes = this.validateIncludes(include, session.user.role);
    return await this.appealService.review(id, reviewAppealDto, session.user.id, includes);
  }
}
