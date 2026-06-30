import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import {
  CommunityPostCommentDto,
} from '../dtos/community-post-comment.dto';
import { CommunityPostsQueryDto } from '../dtos/community-posts-query.dto';
import {
  CommunityPostSummaryDto,
  PublicCommunityPostDetailDto,
} from '../dtos/community-post.dto';
import { CommunityPostCommentService } from '../services/community-post-comment.service';
import { CommunityPostService } from '../services/community-post.service';

@ApiTags('Public')
@Controller('public/communities')
export class CommunityPublicController {
  constructor(
    private readonly communityPostService: CommunityPostService,
    private readonly communityPostCommentService: CommunityPostCommentService,
  ) {}

  @Get(':id/posts')
  @AllowAnonymous()
  @ApiOperation({ summary: 'List public community blog posts (no auth)' })
  @ApiOkResponse({ type: CommunityPostSummaryDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Community not found' })
  listPublicPosts(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CommunityPostsQueryDto,
  ): Promise<CommunityPostSummaryDto[]> {
    return this.communityPostService.listPublicPosts(id, query);
  }

  @Get(':id/posts/:postId')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get a public community post (no auth)' })
  @ApiOkResponse({ type: PublicCommunityPostDetailDto })
  @ApiNotFoundResponse({ description: 'Post not found or not public' })
  getPublicPost(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('postId', ParseUUIDPipe) postId: string,
  ): Promise<PublicCommunityPostDetailDto> {
    return this.communityPostService.getPublicPost(id, postId);
  }

  @Get(':id/posts/:postId/comments')
  @AllowAnonymous()
  @ApiOperation({ summary: 'List comments on a public post (no auth)' })
  @ApiOkResponse({ type: CommunityPostCommentDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Post not found, not public, or comments disabled' })
  listPublicComments(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('postId', ParseUUIDPipe) postId: string,
  ): Promise<CommunityPostCommentDto[]> {
    return this.communityPostCommentService.listComments(id, postId, null);
  }
}
