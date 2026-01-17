import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  SerializeOptions,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PlayerService } from '../services/player.service';
import { PlayerDto } from '../dtos/player.dto';
import { SyncPlayerDto } from '../dtos/sync-player.dto';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('player')
@Controller('player')
@SerializeOptions({ excludeExtraneousValues: true })
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all players',
    description: 'Retrieves a list of all players in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'List of players retrieved successfully',
    type: [PlayerDto],
  })
  async getAll(): Promise<PlayerDto[]> {
    return await this.playerService.getAll();
  }

  @Get(':id')
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

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync player',
    description:
      'Creates a new player or updates the last known username for an existing player based on their Hytale ID',
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
