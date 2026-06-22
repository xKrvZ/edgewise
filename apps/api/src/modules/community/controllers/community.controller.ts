import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { CommunityService } from '../services/community.service';
import {
  CommunityDetailDto,
  CommunitySummaryDto,
} from '../dtos/community.dto';
import { CreateCommunityDto } from '../dtos/create-community.dto';
import { UpdateCommunityDto } from '../dtos/update-community.dto';
import { CreateInvitationDto } from '../dtos/create-invitation.dto';
import { CommunityInvitationDto } from '../dtos/community-invitation.dto';
import {
  CommunityLeaderboardDto,
  CommunityStatsDto,
} from '../dtos/community-leaderboard.dto';
import { LeaderboardQueryDto } from '../dtos/leaderboard-query.dto';
import { LEADERBOARD_DEFAULT_DAYS } from '../constants/community.constants';

@ApiTags('Communities')
@Controller('communities')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post()
  @ApiOperation({ summary: 'Create a community (creator becomes owner, Elite plan required)' })
  @ApiCreatedResponse({ type: CommunityDetailDto })
  @ApiForbiddenResponse({ description: 'Elite plan required to create communities' })
  async create(
    @Body() dto: CreateCommunityDto,
    @Session() session: UserSession,
  ): Promise<CommunityDetailDto> {
    return this.communityService.create(
      session.user.id,
      dto,
      session.user.email,
      session.user.role,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List communities the authenticated user belongs to' })
  @ApiOkResponse({ type: CommunitySummaryDto, isArray: true })
  async list(@Session() session: UserSession): Promise<CommunitySummaryDto[]> {
    return this.communityService.list(session.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get community detail' })
  @ApiOkResponse({ type: CommunityDetailDto })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<CommunityDetailDto> {
    return this.communityService.getById(id, session.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update community name/description (owner only)' })
  @ApiOkResponse({ type: CommunityDetailDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommunityDto,
    @Session() session: UserSession,
  ): Promise<CommunityDetailDto> {
    return this.communityService.update(id, session.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a community (owner only)' })
  @ApiNoContentResponse()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.communityService.remove(id, session.user.id);
  }

  @Post(':id/invitations')
  @ApiOperation({ summary: 'Invite a user by email (owner/mentor)' })
  @ApiCreatedResponse({ type: CommunityInvitationDto })
  async createInvitation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateInvitationDto,
    @Session() session: UserSession,
  ): Promise<CommunityInvitationDto> {
    return this.communityService.createInvitation(id, session.user.id, dto);
  }

  @Get(':id/invitations')
  @ApiOperation({ summary: 'List pending invitations (owner/mentor)' })
  @ApiOkResponse({ type: CommunityInvitationDto, isArray: true })
  async listInvitations(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<CommunityInvitationDto[]> {
    return this.communityService.listInvitations(id, session.user.id);
  }

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Member leaderboard by net P&L (owner/mentor)' })
  @ApiOkResponse({ type: CommunityLeaderboardDto })
  async getLeaderboard(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: LeaderboardQueryDto,
    @Session() session: UserSession,
  ): Promise<CommunityLeaderboardDto> {
    return this.communityService.getLeaderboard(
      id,
      session.user.id,
      query.days ?? LEADERBOARD_DEFAULT_DAYS,
    );
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Community aggregate stats (owner/mentor)' })
  @ApiOkResponse({ type: CommunityStatsDto })
  async getStats(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: LeaderboardQueryDto,
    @Session() session: UserSession,
  ): Promise<CommunityStatsDto> {
    return this.communityService.getStats(
      id,
      session.user.id,
      query.days ?? LEADERBOARD_DEFAULT_DAYS,
    );
  }
}
