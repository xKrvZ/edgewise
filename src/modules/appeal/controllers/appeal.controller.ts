import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  SerializeOptions,
  BadRequestException,
  UnauthorizedException,
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
import { PublicAppealDto } from '../dtos/public-appeal.dto';
import { CreateAppealDto } from '../dtos/create-appeal.dto';
import { ReviewAppealDto } from '../dtos/review-appeal.dto';
import { AppealQueryDto } from '../dtos/appeal-query.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { Roles, Session, UserSession } from '@thallesp/nestjs-better-auth';
import { createPaginatedSchema } from '@/database/utils/paginated-schema.util';
import { validateIncludes as validateIncludesUtil } from '@/database/utils/validate-includes.util';
import { STAFF_ROLES } from '@/auth/constants/roles.constants';

@ApiTags('appeal')
@Controller('appeal')
@SerializeOptions({ excludeExtraneousValues: true })
export class AppealController {
  constructor(private readonly appealService: AppealService) {}

  /**
   * Validates and filters includes based on user role
   * - Moderators: can include 'note' for reviewNote
   * - Admins: can include 'user' for reviewedBy and 'note' for reviewNote
   */
  private validateIncludes(
    include?: string,
    userRole?: string | string[] | null,
  ): Set<string> {
    return validateIncludesUtil(include, userRole, {
      staffIncludes: ['note'],
      adminIncludes: ['user'],
    });
  }

  // ==================== Query Endpoints ====================

  @Get('public/punishment/:shortCodeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get appeals by punishment short code ID (public)',
    description: 'Retrieves all appeals for a punishment by its short code ID. This is a public endpoint that does not require authentication.',
  })
  @ApiParam({
    name: 'shortCodeId',
    description: 'Short code ID of the punishment (12 characters)',
    type: String,
    example: 'a1b2c3d4e5f6',
  })
  @ApiResponse({
    status: 200,
    description: 'List of appeals retrieved successfully',
    type: [PublicAppealDto],
  })
  async findByPunishmentShortCodeId(
    @Param('shortCodeId') shortCodeId: string,
  ): Promise<PublicAppealDto[]> {
    return await this.appealService.findByPunishmentShortCodeId(shortCodeId);
  }

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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an appeal',
    description: 'Creates a new appeal for a punishment. Requires authentication. Appeals can only be created if there are no pending appeals for the punishment and the punishment is not appeal-locked.',
  })
  @ApiResponse({
    status: 201,
    description: 'Appeal created successfully',
    type: AppealDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data, appeals are locked, or there is already a pending appeal',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Punishment not found',
  })
  async create(
    @Session() session: UserSession | null,
    @Body() createAppealDto: CreateAppealDto,
  ): Promise<AppealDto> {
    if (!session) {
      throw new UnauthorizedException('Authentication required to create an appeal');
    }
    return await this.appealService.create(createAppealDto, session.user.id);
  }

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
