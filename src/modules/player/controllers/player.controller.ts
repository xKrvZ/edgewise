import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  SerializeOptions,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { PlayerService } from '../services/player.service';
import { PlayerDto } from '../dtos/player.dto';
import { PublicPlayerDto } from '../dtos/public-player.dto';
import { SyncPlayerDto } from '../dtos/sync-player.dto';
import { PlayerQueryDto } from '../dtos/player-query.dto';
import { PlayerSearchQueryDto } from '../dtos/player-search-query.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { Roles, Session, UserSession } from '@thallesp/nestjs-better-auth';
import { createPaginatedSchema } from '@/database/utils/paginated-schema.util';
import { ROLES, STAFF_ROLES } from '@/auth/constants/roles.constants';

@ApiTags('player')
@Controller('player')
@SerializeOptions({ excludeExtraneousValues: true })
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  // ==================== Query Endpoints ====================

  @Get()
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all players',
    description: 'Retrieves a paginated list of all players with optional filters, ordering, and cursor-based pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of players retrieved successfully',
    schema: createPaginatedSchema(getSchemaPath(PlayerDto)),
  })
  async getAll(@Query() queryDto: PlayerQueryDto): Promise<PaginatedDto<PlayerDto>> {
    return await this.playerService.getAllPaginated(queryDto);
  }

  @Get('games')
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all games supported by the platform',
    description: 'Retrieves a list of all unique games from the players table',
  })
  @ApiResponse({
    status: 200,
    description: 'List of games retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'string',
      },
      example: ['hytale', 'minecraft', 'terraria'],
    },
  })
  async getGameTypes(): Promise<string[]> {
    return await this.playerService.getGameTypes();
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search players by username and/or game (Public)',
    description: 'Public endpoint to search for players by username (optionally filtered by game) with pagination support. Returns limited player information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of players retrieved successfully',
    schema: createPaginatedSchema(getSchemaPath(PublicPlayerDto)),
  })
  async findByUsername(@Query() queryDto: PlayerSearchQueryDto): Promise<PaginatedDto<PublicPlayerDto>> {
    if (!queryDto.username) {
      throw new BadRequestException('Username parameter is required');
    }
    return await this.playerService.findByUsernamePaginated(queryDto);
  }

  @Get(':id')
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get player by ID',
    description: 'Retrieves a specific player by their unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the player',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Player retrieved successfully',
    type: PlayerDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Player not found',
  })
  async findById(@Param('id') id: string): Promise<PlayerDto> {
    return await this.playerService.findById(id);
  }

  // ==================== Mutation Endpoints ====================

  @Post('sync')
  @Roles(STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync player',
    description:
      'Creates a new player or updates the last known username for an existing player based on their external ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Player synced successfully',
    type: PlayerDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  async sync(@Session() session: UserSession, @Body() syncPlayerDto: SyncPlayerDto): Promise<PlayerDto> {
    return await this.playerService.sync(syncPlayerDto);
  }
}
