import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { PublicProfileDto } from '../dtos/public-profile.dto';
import { PublicStatsDto } from '../dtos/public-stats.dto';
import { PublicTradeDto } from '../dtos/public-trade.dto';
import { SharingService } from '../services/sharing.service';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly sharingService: SharingService) {}

  @Get('trades/:shareToken')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get a shared trade by opaque share token (no auth)' })
  @ApiOkResponse({ type: PublicTradeDto })
  @ApiNotFoundResponse({ description: 'Trade not found or not shared' })
  getSharedTrade(@Param('shareToken') shareToken: string): Promise<PublicTradeDto> {
    return this.sharingService.getPublicTrade(shareToken);
  }

  @Get('stats/:shareToken')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get shared trader stats by opaque share token (no auth)' })
  @ApiOkResponse({ type: PublicStatsDto })
  @ApiNotFoundResponse({ description: 'Stats not found or not public' })
  getSharedStats(@Param('shareToken') shareToken: string): Promise<PublicStatsDto> {
    return this.sharingService.getPublicStats(shareToken);
  }

  @Get('profile/:shareToken')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get a public trader profile by opaque share token (no auth)' })
  @ApiOkResponse({ type: PublicProfileDto })
  @ApiNotFoundResponse({ description: 'Profile not found' })
  getSharedProfile(@Param('shareToken') shareToken: string): Promise<PublicProfileDto> {
    return this.sharingService.getPublicProfile(shareToken);
  }
}
