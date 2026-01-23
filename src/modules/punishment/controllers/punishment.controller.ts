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
import { CreatePunishmentDto } from '../dtos/create-punishment.dto';
import { LiftPunishmentDto } from '../dtos/lift-punishment.dto';
import { LiftPunishmentsDto } from '../dtos/lift-punishments.dto';
import { PunishmentQueryDto } from '../dtos/punishment-query.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { Roles, Session, UserSession } from '@thallesp/nestjs-better-auth';
import { createPaginatedSchema } from '@/database/utils/paginated-schema.util';
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
    if (!include) {
      return new Set();
    }

    const requestedIncludes = new Set(
      include.split(',').map((i) => i.trim().toLowerCase()),
    );

    // Check if user is administrator
    const isAdmin = hasRole(userRole, ROLES.ADMINISTRATOR);

    // Allowed includes based on role
    // Note: 'note' is available to all staff, 'user' is admin-only
    const allowedIncludes: string[] = isAdmin ? ['player', 'user', 'note'] : ['player', 'note'];

    // Filter out any includes that aren't allowed
    const validatedIncludes = new Set<string>();
    for (const inc of requestedIncludes) {
      if (allowedIncludes.includes(inc)) {
        validatedIncludes.add(inc);
      } else {
        throw new BadRequestException(
          `Include '${inc}' is not allowed for your role. Allowed includes: ${allowedIncludes.join(', ')}`,
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
    console.log(liftPunishmentDto);
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
    
    // Expiry must be provided unless user is admin
    if (!isAdmin && !createPunishmentDto.expiry) {
      throw new BadRequestException(
        'Expiry date is required for non-admin users. Only administrators can create permanent punishments.',
      );
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
}
