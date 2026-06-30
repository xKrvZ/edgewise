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
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { createPaginatedSchema } from '@/database/utils/paginated-schema.util';
import { TradeDto } from '@/modules/trade/dtos/trade.dto';
import { TradeQueryDto } from '@/modules/trade/dtos/trade-query.dto';
import { CommunityService } from '../services/community.service';
import {
  CommunityDetailDto,
  CommunityMemberWithTagsDto,
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
import { CommunityPostService } from '../services/community-post.service';
import { CommunityTagService } from '../services/community-tag.service';
import {
  CommunityPostDetailDto,
  CommunityPostSummaryDto,
} from '../dtos/community-post.dto';
import { CommunityPostsQueryDto } from '../dtos/community-posts-query.dto';
import { CreateCommunityPostDto } from '../dtos/create-community-post.dto';
import { UpdateCommunityPostDto } from '../dtos/update-community-post.dto';
import { CommunityTagDto } from '../dtos/community-tag.dto';
import { CreateCommunityTagDto } from '../dtos/create-community-tag.dto';
import { UpdateCommunityTagDto } from '../dtos/update-community-tag.dto';
import { SetMemberTagsDto } from '../dtos/set-member-tags.dto';
import { CommunityMembersQueryDto } from '../dtos/community-members-query.dto';
import {
  CommunityHeaderUploadRequestDto,
  CommunityLogoUploadRequestDto,
  CommunityUploadTargetDto,
} from '../dtos/community-upload.dto';
import {
  CommunityPostContentImageUploadRequestDto,
  CommunityPostContentUploadTargetDto,
  CommunityPostHeaderUploadRequestDto,
} from '../dtos/community-post-upload.dto';
import { CommunityPostCommentDto } from '../dtos/community-post-comment.dto';
import { CreateCommunityPostCommentDto } from '../dtos/create-community-post-comment.dto';
import {
  CommunityPostCommentReactionResultDto,
  SetCommunityPostCommentReactionDto,
} from '../dtos/set-community-post-comment-reaction.dto';
import { CommunityPostCommentService } from '../services/community-post-comment.service';
import { CommunityPlaybookTemplateService } from '../services/community-playbook-template.service';
import { CommunityPlaybookTemplateDto } from '../dtos/community-playbook-template.dto';
import {
  CreateCommunityPlaybookTemplateDto,
  UpdateCommunityPlaybookTemplateDto,
} from '../dtos/create-community-playbook-template.dto';
import { CloneCommunityPlaybookTemplateDto } from '../dtos/clone-community-playbook-template.dto';
import { PlaybookDto } from '@/modules/playbook/dtos/playbook.dto';

@ApiTags('Communities')
@ApiExtraModels(PaginatedDto, TradeDto)
@Controller('communities')
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly communityTagService: CommunityTagService,
    private readonly communityPostService: CommunityPostService,
    private readonly communityPostCommentService: CommunityPostCommentService,
    private readonly communityPlaybookTemplateService: CommunityPlaybookTemplateService,
  ) {}

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
  @ApiOperation({ summary: 'List all communities with membership status for the current user' })
  @ApiOkResponse({ type: CommunitySummaryDto, isArray: true })
  async list(@Session() session: UserSession): Promise<CommunitySummaryDto[]> {
    return this.communityService.list(session.user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get community detail (full for members; overview fields only for non-members)',
  })
  @ApiOkResponse({ type: CommunityDetailDto })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<CommunityDetailDto> {
    return this.communityService.getById(id, session.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update community profile, social links, and branding (owner only)' })
  @ApiOkResponse({ type: CommunityDetailDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommunityDto,
    @Session() session: UserSession,
  ): Promise<CommunityDetailDto> {
    return this.communityService.update(id, session.user.id, dto);
  }

  @Post(':id/logo/upload-url')
  @ApiOperation({ summary: 'Get a presigned URL to upload a community logo (owner only)' })
  @ApiCreatedResponse({ type: CommunityUploadTargetDto })
  @ApiForbiddenResponse({ description: 'Only the community owner can upload branding' })
  async requestLogoUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CommunityLogoUploadRequestDto,
    @Session() session: UserSession,
  ): Promise<CommunityUploadTargetDto> {
    return this.communityService.requestLogoUpload(id, session.user.id, dto);
  }

  @Post(':id/header/upload-url')
  @ApiOperation({ summary: 'Get a presigned URL to upload a community header banner (owner only)' })
  @ApiCreatedResponse({ type: CommunityUploadTargetDto })
  @ApiForbiddenResponse({ description: 'Only the community owner can upload branding' })
  async requestHeaderUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CommunityHeaderUploadRequestDto,
    @Session() session: UserSession,
  ): Promise<CommunityUploadTargetDto> {
    return this.communityService.requestHeaderUpload(id, session.user.id, dto);
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

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a public community (authenticated users)' })
  @ApiCreatedResponse({ type: CommunityDetailDto })
  @ApiForbiddenResponse({ description: 'Community is invite-only or user lacks access' })
  async join(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<CommunityDetailDto> {
    return this.communityService.join(id, session.user.id);
  }

  @Post(':id/leave')
  @HttpCode(204)
  @ApiOperation({ summary: 'Leave a community (members and mentors; owners cannot leave)' })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ description: 'Community owners cannot leave their community' })
  async leave(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.communityService.leave(id, session.user.id);
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
  @ApiOperation({
    summary: 'Member leaderboard by net P&L (visibility: public / members / mentors)',
  })
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

  @Get(':id/members/:userId/trades')
  @ApiOperation({ summary: 'List a member\'s trades (owner/mentor only)' })
  @ApiOkResponse({ schema: createPaginatedSchema(getSchemaPath(TradeDto)) })
  @ApiForbiddenResponse({ description: 'Only mentors and owners can view member trades' })
  async getMemberTrades(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId') memberUserId: string,
    @Query() query: TradeQueryDto,
    @Session() session: UserSession,
  ): Promise<PaginatedDto<TradeDto>> {
    return this.communityService.getMemberTrades(
      id,
      session.user.id,
      memberUserId,
      query,
    );
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List community members with optional tag/search filters' })
  @ApiOkResponse({ type: CommunityMemberWithTagsDto, isArray: true })
  async listMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CommunityMembersQueryDto,
    @Session() session: UserSession,
  ): Promise<CommunityMemberWithTagsDto[]> {
    return this.communityTagService.listMembers(id, session.user.id, query);
  }

  @Get(':id/tags')
  @ApiOperation({ summary: 'List community tags' })
  @ApiOkResponse({ type: CommunityTagDto, isArray: true })
  async listTags(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<CommunityTagDto[]> {
    return this.communityTagService.listTags(id, session.user.id);
  }

  @Post(':id/tags')
  @ApiOperation({ summary: 'Create a community tag (owner/mentor)' })
  @ApiCreatedResponse({ type: CommunityTagDto })
  async createTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommunityTagDto,
    @Session() session: UserSession,
  ): Promise<CommunityTagDto> {
    return this.communityTagService.createTag(id, session.user.id, dto);
  }

  @Patch(':id/tags/:tagId')
  @ApiOperation({ summary: 'Update a community tag (owner/mentor)' })
  @ApiOkResponse({ type: CommunityTagDto })
  async updateTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
    @Body() dto: UpdateCommunityTagDto,
    @Session() session: UserSession,
  ): Promise<CommunityTagDto> {
    return this.communityTagService.updateTag(id, tagId, session.user.id, dto);
  }

  @Delete(':id/tags/:tagId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a community tag (owner/mentor)' })
  @ApiNoContentResponse()
  async removeTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.communityTagService.removeTag(id, tagId, session.user.id);
  }

  @Patch(':id/members/:userId/tags')
  @ApiOperation({ summary: 'Set tags on a community member (owner/mentor)' })
  @ApiOkResponse({ type: CommunityMemberWithTagsDto })
  async setMemberTags(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId') memberUserId: string,
    @Body() dto: SetMemberTagsDto,
    @Session() session: UserSession,
  ): Promise<CommunityMemberWithTagsDto> {
    return this.communityTagService.setMemberTags(
      id,
      memberUserId,
      session.user.id,
      dto.tagIds,
    );
  }

  @Get(':id/posts')
  @ApiOperation({ summary: 'List community blog posts (all members)' })
  @ApiOkResponse({ type: CommunityPostSummaryDto, isArray: true })
  async listPosts(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CommunityPostsQueryDto,
    @Session() session: UserSession,
  ): Promise<CommunityPostSummaryDto[]> {
    return this.communityPostService.listPosts(id, session.user.id, query);
  }

  @Post(':id/posts')
  @ApiOperation({ summary: 'Create a community blog post (owner/mentor)' })
  @ApiCreatedResponse({ type: CommunityPostDetailDto })
  @ApiForbiddenResponse({ description: 'Only mentors and owners can create posts' })
  async createPost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommunityPostDto,
    @Session() session: UserSession,
  ): Promise<CommunityPostDetailDto> {
    return this.communityPostService.createPost(id, session.user.id, dto);
  }

  @Post(':id/posts/header/upload-url')
  @ApiOperation({ summary: 'Get a presigned URL to upload a post hero header (owner/mentor)' })
  @ApiCreatedResponse({ type: CommunityUploadTargetDto })
  @ApiForbiddenResponse({ description: 'Only mentors and owners can upload post headers' })
  async requestPostHeaderUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CommunityPostHeaderUploadRequestDto,
    @Session() session: UserSession,
  ): Promise<CommunityUploadTargetDto> {
    return this.communityPostService.requestPostHeaderUpload(id, session.user.id, dto);
  }

  @Post(':id/posts/content/upload-url')
  @ApiOperation({ summary: 'Get a presigned URL to upload an inline post image (owner/mentor)' })
  @ApiCreatedResponse({ type: CommunityPostContentUploadTargetDto })
  @ApiForbiddenResponse({ description: 'Only mentors and owners can upload post images' })
  async requestPostContentImageUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CommunityPostContentImageUploadRequestDto,
    @Session() session: UserSession,
  ): Promise<CommunityPostContentUploadTargetDto> {
    return this.communityPostService.requestPostContentImageUpload(id, session.user.id, dto);
  }

  @Get(':id/posts/:postId')
  @ApiOperation({ summary: 'Get a community blog post (all members)' })
  @ApiOkResponse({ type: CommunityPostDetailDto })
  async getPost(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Session() session: UserSession,
  ): Promise<CommunityPostDetailDto> {
    return this.communityPostService.getPost(id, postId, session.user.id);
  }

  @Patch(':id/posts/:postId')
  @ApiOperation({ summary: 'Update a community blog post (author or owner)' })
  @ApiOkResponse({ type: CommunityPostDetailDto })
  @ApiForbiddenResponse({ description: 'Only the author or community owner can edit posts' })
  async updatePost(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: UpdateCommunityPostDto,
    @Session() session: UserSession,
  ): Promise<CommunityPostDetailDto> {
    return this.communityPostService.updatePost(id, postId, session.user.id, dto);
  }

  @Delete(':id/posts/:postId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a community blog post (author or owner)' })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ description: 'Only the author or community owner can delete posts' })
  async removePost(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.communityPostService.removePost(id, postId, session.user.id);
  }

  @Get(':id/posts/:postId/comments')
  @ApiOperation({ summary: 'List comments on a community post' })
  @ApiOkResponse({ type: CommunityPostCommentDto, isArray: true })
  @ApiForbiddenResponse({ description: 'No access to this post or comments disabled' })
  async listPostComments(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Session() session: UserSession,
  ): Promise<CommunityPostCommentDto[]> {
    return this.communityPostCommentService.listComments(id, postId, session.user.id);
  }

  @Post(':id/posts/:postId/comments')
  @ApiOperation({ summary: 'Add a comment to a community post (auth required)' })
  @ApiCreatedResponse({ type: CommunityPostCommentDto })
  @ApiForbiddenResponse({ description: 'Comments disabled or insufficient permissions' })
  async createPostComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: CreateCommunityPostCommentDto,
    @Session() session: UserSession,
  ): Promise<CommunityPostCommentDto> {
    return this.communityPostCommentService.createComment(id, postId, session.user.id, dto);
  }

  @Delete(':id/posts/:postId/comments/:commentId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a post comment (author, post author, or community owner)' })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async removePostComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.communityPostCommentService.removeComment(
      id,
      postId,
      commentId,
      session.user.id,
    );
  }

  @Patch(':id/posts/:postId/comments/:commentId/reaction')
  @ApiOperation({ summary: 'Like, dislike, or remove reaction on a post comment' })
  @ApiOkResponse({ type: CommunityPostCommentReactionResultDto })
  @ApiForbiddenResponse({ description: 'Comments disabled or insufficient permissions' })
  async setPostCommentReaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: SetCommunityPostCommentReactionDto,
    @Session() session: UserSession,
  ): Promise<CommunityPostCommentReactionResultDto> {
    return this.communityPostCommentService.setCommentReaction(
      id,
      postId,
      commentId,
      session.user.id,
      dto,
    );
  }

  @Get(':id/playbook-templates')
  @ApiOperation({ summary: 'List community playbook templates' })
  @ApiOkResponse({ type: CommunityPlaybookTemplateDto, isArray: true })
  async listPlaybookTemplates(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<CommunityPlaybookTemplateDto[]> {
    return this.communityPlaybookTemplateService.listTemplates(id, session.user.id);
  }

  @Get(':id/playbook-templates/:templateId')
  @ApiOperation({ summary: 'Get a community playbook template' })
  @ApiOkResponse({ type: CommunityPlaybookTemplateDto })
  async getPlaybookTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Session() session: UserSession,
  ): Promise<CommunityPlaybookTemplateDto> {
    return this.communityPlaybookTemplateService.getTemplate(id, templateId, session.user.id);
  }

  @Post(':id/playbook-templates')
  @ApiOperation({ summary: 'Create a community playbook template (owner/mentor)' })
  @ApiCreatedResponse({ type: CommunityPlaybookTemplateDto })
  @ApiForbiddenResponse({ description: 'Only mentors and owners can create templates' })
  async createPlaybookTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommunityPlaybookTemplateDto,
    @Session() session: UserSession,
  ): Promise<CommunityPlaybookTemplateDto> {
    return this.communityPlaybookTemplateService.createTemplate(id, session.user.id, dto);
  }

  @Patch(':id/playbook-templates/:templateId')
  @ApiOperation({ summary: 'Update a community playbook template' })
  @ApiOkResponse({ type: CommunityPlaybookTemplateDto })
  @ApiForbiddenResponse({ description: 'Only the creator or community owner/mentor can edit' })
  async updatePlaybookTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() dto: UpdateCommunityPlaybookTemplateDto,
    @Session() session: UserSession,
  ): Promise<CommunityPlaybookTemplateDto> {
    return this.communityPlaybookTemplateService.updateTemplate(
      id,
      templateId,
      session.user.id,
      dto,
    );
  }

  @Delete(':id/playbook-templates/:templateId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a community playbook template' })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ description: 'Only the creator or community owner/mentor can delete' })
  async removePlaybookTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.communityPlaybookTemplateService.removeTemplate(id, templateId, session.user.id);
  }

  @Post(':id/playbook-templates/:templateId/clone')
  @ApiOperation({ summary: 'Clone a template into the member personal playbooks' })
  @ApiCreatedResponse({ type: PlaybookDto })
  @ApiForbiddenResponse({ description: 'Community membership required' })
  async clonePlaybookTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() dto: CloneCommunityPlaybookTemplateDto,
    @Session() session: UserSession,
  ): Promise<PlaybookDto> {
    return this.communityPlaybookTemplateService.cloneTemplate(
      id,
      templateId,
      session.user.id,
      dto,
    );
  }
}
