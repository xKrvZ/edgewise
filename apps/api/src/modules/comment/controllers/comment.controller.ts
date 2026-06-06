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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { CommentService } from '../services/comment.service';
import {
  CommentAccessDto,
  CommentDto,
} from '../dtos/comment.dto';
import { CommentQueryDto } from '../dtos/comment-query.dto';
import { CreateCommentDto } from '../dtos/create-comment.dto';
import { UpdateCommentDto } from '../dtos/update-comment.dto';

@ApiTags('Comments')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get('access')
  @ApiOperation({ summary: 'Get comment permissions for a target' })
  @ApiOkResponse({ type: CommentAccessDto })
  async getAccess(
    @Query() query: CommentQueryDto,
    @Session() session: UserSession,
  ): Promise<CommentAccessDto> {
    return this.commentService.getAccess(
      session.user.id,
      query.targetType,
      query.targetId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List comments for a trade or playbook' })
  @ApiOkResponse({ type: CommentDto, isArray: true })
  async list(
    @Query() query: CommentQueryDto,
    @Session() session: UserSession,
  ): Promise<CommentDto[]> {
    return this.commentService.list(
      session.user.id,
      query.targetType,
      query.targetId,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a comment or reply' })
  @ApiCreatedResponse({ type: CommentDto })
  async create(
    @Body() dto: CreateCommentDto,
    @Session() session: UserSession,
  ): Promise<CommentDto> {
    return this.commentService.create(session.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit your own comment' })
  @ApiOkResponse({ type: CommentDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommentDto,
    @Session() session: UserSession,
  ): Promise<CommentDto> {
    return this.commentService.update(id, session.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete your comment or moderate as mentor/owner' })
  @ApiNoContentResponse()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<void> {
    return this.commentService.remove(id, session.user.id);
  }
}
