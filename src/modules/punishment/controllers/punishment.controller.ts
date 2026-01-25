import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
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
import { PunishmentService } from '../services/punishment.service';
import { PunishmentDto } from '../dtos/punishment.dto';
import { PublicPunishmentDto } from '../dtos/public-punishment.dto';
import { CreatePunishmentDto } from '../dtos/create-punishment.dto';
import { LiftPunishmentDto } from '../dtos/lift-punishment.dto';
import { LiftPunishmentsDto } from '../dtos/lift-punishments.dto';
import { UpdatePunishmentExpiryDto } from '../dtos/update-punishment-expiry.dto';
import { UpdateAppealLockedDto } from '../dtos/update-appeal-locked.dto';
import { PunishmentQueryDto } from '../dtos/punishment-query.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { Roles, Session, UserSession } from '@thallesp/nestjs-better-auth';
import { createPaginatedSchema } from '@/database/utils/paginated-schema.util';
import { validateIncludes } from '@/database/utils/validate-includes.util';
import { ROLES, STAFF_ROLES, hasRole } from '@/auth/constants/roles.constants';

@ApiTags('punishment')
@Controller('punishment')
@SerializeOptions({ excludeExtraneousValues: true })
export class PunishmentController {
  constructor(private readonly punishmentService: PunishmentService) {}

  /**
   * Validates and filters includes based on user role
   * - Moderators can include 'player' and 'note'
   * - Admins can include 'player', 'user', and 'note'
   */
  private validateIncludes(
    include?: string,
    userRole?: string | string[] | null,
  ): Set<string> {
    return validateIncludes(include, userRole, {
      staffIncludes: ['player', 'note'],
      adminIncludes: ['user'],
    });
  }

  // ==================== Query Endpoints ====================

  @Get('public/:shortCodeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get punishment by short code ID (public)',
    description: 'Retrieves a punishment by its short code ID. This is a public endpoint that does not require authentication.',
  })
  @ApiParam({
    name: 'shortCodeId',
    description: 'Short code ID of the punishment (12 characters)',
    type: String,
    example: 'a1b2c3d4e5f6',
  })
  @ApiResponse({
    status: 200,
    description: 'Punishment retrieved successfully',
    type: PublicPunishmentDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Punishment not found',
  })
  async findByShortCodeId(
    @Param('shortCodeId') shortCodeId: string,
  ): Promise<PublicPunishmentDto> {
    return await this.punishmentService.findByShortCodeId(shortCodeId);
  }

  @Get()
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all punishments',
    description: 'Retrieves a paginated list of all punishments with optional filters, ordering, and cursor-based pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of punishments retrieved successfully',
    schema: createPaginatedSchema(getSchemaPath(PunishmentDto)),
  })
  async getAll(
    @Session() session: UserSession,
    @Query() queryDto: PunishmentQueryDto,
  ): Promise<PaginatedDto<PunishmentDto>> {
    const includes = this.validateIncludes(queryDto.include, session.user.role);
    return await this.punishmentService.getAllPaginated(queryDto, includes);
  }

  @Get('issued-by/:issuedById')
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get punishments issued by a user',
    description: 'Retrieves all punishments issued by a specific user',
  })
  @ApiParam({
    name: 'issuedById',
    description: 'User ID who issued the punishments',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of punishments retrieved successfully',
    type: [PunishmentDto],
  })
  async findByIssuedBy(
    @Session() session: UserSession,
    @Param('issuedById') issuedById: string,
    @Query('include') include?: string,
  ): Promise<PunishmentDto[]> {
    const includes = this.validateIncludes(include, session.user.role);
    return await this.punishmentService.findByIssuedBy(issuedById, includes);
  }

  @Get('player/:playerId')
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get punishments by player ID',
    description: 'Retrieves all punishments for a specific player',
  })
  @ApiParam({
    name: 'playerId',
    description: 'Unique identifier of the player',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of punishments retrieved successfully',
    type: [PunishmentDto],
  })
  async findByPlayerId(
    @Session() session: UserSession,
    @Param('playerId') playerId: string,
    @Query('include') include?: string,
  ): Promise<PunishmentDto[]> {
    const includes = this.validateIncludes(include, session.user.role);
    return await this.punishmentService.findByPlayerId(playerId, includes);
  }

  @Get(':id')
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get punishment by ID',
    description: 'Retrieves a specific punishment by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the punishment',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Punishment retrieved successfully',
    type: PunishmentDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Punishment not found',
  })
  async findById(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('include') include?: string,
  ): Promise<PunishmentDto> {
    const includes = this.validateIncludes(include, session.user.role);
    return await this.punishmentService.findById(id, includes);
  }

  // ==================== Mutation Endpoints ====================

  @Post(':id/lift')
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lift a punishment',
    description: 'Lifts a specific punishment',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the punishment',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Punishment lifted successfully',
    type: PunishmentDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Punishment not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Punishment has already been lifted',
  })
  async lift(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() liftPunishmentDto?: LiftPunishmentDto,
    @Query('include') include?: string,
  ): Promise<PunishmentDto> {
    const includes = this.validateIncludes(include, session.user.role);
    return await this.punishmentService.lift(
      id,
      session.user.id,
      liftPunishmentDto?.liftReason,
      liftPunishmentDto?.note,
      includes,
    );
  }

  @Post()
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a punishment',
    description: 'Creates a new punishment',
  })
  @ApiResponse({
    status: 201,
    description: 'Punishment created successfully',
    type: PunishmentDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  async create(
    @Session() session: UserSession,
    @Body() createPunishmentDto: CreatePunishmentDto,
    @Query('include') include?: string,
  ): Promise<PunishmentDto> {
    const includes = this.validateIncludes(include, session.user.role);
    
    // Check if user is admin
    const isAdmin = hasRole(session.user.role, ROLES.ADMINISTRATOR);
    
    // Expiry must be provided unless user is admin or punishment type is "kick"
    // Kick punishments don't require expiry regardless of role
    if (!isAdmin && !createPunishmentDto.expiry && createPunishmentDto.punishmentType !== 'kick') {
      throw new BadRequestException(
        'Expiry date is required for non-admin users. Only administrators can create permanent punishments.',
      );
    }

    // Validate moderator expiry limits (max 1 year from creation)
    if (!isAdmin && createPunishmentDto.expiry && createPunishmentDto.punishmentType !== 'kick') {
      const expiryDate = new Date(createPunishmentDto.expiry);
      const now = new Date();
      const oneYearFromNow = new Date(now);
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      if (expiryDate > oneYearFromNow) {
        throw new BadRequestException(
          'Moderators can only create punishments with expiry up to 1 year from creation.',
        );
      }
    }
    
    return await this.punishmentService.create(createPunishmentDto, session.user.id, includes);
  }

  @Post('lift-bulk')
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lift multiple punishments',
    description: 'Lifts all punishments for specific player(s) within a date range',
  })
  @ApiResponse({
    status: 200,
    description: 'Punishments lifted successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', description: 'Number of punishments lifted' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  async liftBulk(
    @Session() session: UserSession,
    @Body() liftPunishmentsDto: LiftPunishmentsDto,
  ): Promise<{ count: number }> {
    return await this.punishmentService.liftBulk(liftPunishmentsDto, session.user.id);
  }

  @Patch(':id/expiry')
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update punishment expiry',
    description: 'Updates the expiry date of a punishment. Can extend or reduce the expiry. Only works for ban and mute punishments that are not lifted. Moderators can only extend up to 1 year from creation date. Admins can extend indefinitely or set expiry to null for permanent punishments. All users can only reduce to a minimum of 1 hour from now. If the current expiry is less than 1 hour away, reduction is not allowed.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the punishment',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Punishment expiry updated successfully',
    type: PunishmentDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Punishment not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data or punishment cannot be updated',
  })
  async updateExpiry(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() updatePunishmentExpiryDto: UpdatePunishmentExpiryDto,
    @Query('include') include?: string,
  ): Promise<PunishmentDto> {
    const includes = this.validateIncludes(include, session.user.role);
    const isAdmin = hasRole(session.user.role, ROLES.ADMINISTRATOR);

    // Get the punishment to check current expiry and creation date
    const punishment = await this.punishmentService.findById(id, includes);

    // Validate null expiry (permanent punishment - admin only)
    if (updatePunishmentExpiryDto.expiry === null || updatePunishmentExpiryDto.expiry === undefined) {
      if (!isAdmin) {
        throw new BadRequestException(
          'Only administrators can set punishments to permanent (null expiry)',
        );
      }
      return await this.punishmentService.updateExpiry(id, null, includes);
    }

    const newExpiry = new Date(updatePunishmentExpiryDto.expiry);
    const now = new Date();
    const oneHourFromNow = new Date(now);
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

    // Determine if we're extending or reducing
    const currentExpiry = punishment.expiry ? new Date(punishment.expiry) : null;
    const isExtending = currentExpiry ? newExpiry > currentExpiry : true;
    const isReducing = currentExpiry ? newExpiry < currentExpiry : false;

    // Validation for extending
    if (isExtending) {
      // Validate moderator expiry limits (max 1 year from creation date)
      if (!isAdmin) {
        const createdAt = new Date(punishment.createdAt);
        const oneYearFromCreation = new Date(createdAt);
        oneYearFromCreation.setFullYear(oneYearFromCreation.getFullYear() + 1);

        if (newExpiry > oneYearFromCreation) {
          throw new BadRequestException(
            'Moderators can only extend punishments up to 1 year from the creation date',
          );
        }
      }
    }

    // Validation for reducing
    if (isReducing) {
      // Validate minimum expiry (1 hour from now) - applies to all users
      if (newExpiry < oneHourFromNow) {
        throw new BadRequestException(
          'Cannot reduce punishment below 1 hour from now. The minimum expiry is 1 hour from the current time.',
        );
      }

      // Check if current expiry is less than 1 hour from now
      if (currentExpiry && currentExpiry < oneHourFromNow) {
        throw new BadRequestException(
          'Cannot reduce punishment further. The current expiry is less than 1 hour away.',
        );
      }
    }

    return await this.punishmentService.updateExpiry(id, updatePunishmentExpiryDto.expiry, includes);
  }

  @Patch(':id/appeal-locked')
  @Roles([ROLES.ADMINISTRATOR])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update punishment appeal lock status',
    description: 'Locks or unlocks appeals for a punishment. Only administrators can perform this action.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the punishment',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Punishment appeal lock status updated successfully',
    type: PunishmentDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Punishment not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only administrators can update appeal lock status',
  })
  async updateAppealLocked(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() updateAppealLockedDto: UpdateAppealLockedDto,
    @Query('include') include?: string,
  ): Promise<PunishmentDto> {
    const includes = this.validateIncludes(include, session.user.role);
    return await this.punishmentService.updateAppealLocked(
      id,
      updateAppealLockedDto.appealLocked,
      includes,
    );
  }
}
