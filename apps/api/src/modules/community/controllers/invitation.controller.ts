import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { CommunityService } from '../services/community.service';
import { CommunityDetailDto } from '../dtos/community.dto';
import { CommunityInvitationDto } from '../dtos/community-invitation.dto';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('mine')
  @ApiOperation({ summary: 'List my pending community invitations' })
  @ApiOkResponse({ type: CommunityInvitationDto, isArray: true })
  async listMine(@Session() session: UserSession): Promise<CommunityInvitationDto[]> {
    return this.communityService.listMyInvitations(session.user.id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a community invitation' })
  @ApiOkResponse({ type: CommunityDetailDto })
  async accept(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<CommunityDetailDto> {
    return this.communityService.acceptInvitation(id, session.user.id);
  }

  @Post(':id/reject')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reject a community invitation' })
  @ApiOkResponse({ type: CommunityInvitationDto })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<CommunityInvitationDto> {
    return this.communityService.rejectInvitation(id, session.user.id);
  }
}
