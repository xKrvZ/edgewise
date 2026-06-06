import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PageDto } from '@/database/dtos/page.dto';
import { NotificationService } from '../services/notification.service';
import {
  NotificationDto,
  UnreadCountDto,
} from '../dtos/notification.dto';
import { NotificationQueryDto } from '../dtos/notification-query.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiExtraModels(PageDto, NotificationDto)
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(PageDto) },
        {
          properties: {
            items: {
              type: 'array',
              items: { $ref: getSchemaPath(NotificationDto) },
            },
          },
        },
      ],
    },
  })
  async list(
    @Query() query: NotificationQueryDto,
    @Session() session: UserSession,
  ): Promise<PageDto<NotificationDto>> {
    return this.notificationService.list(session.user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiOkResponse({ type: UnreadCountDto })
  async unreadCount(@Session() session: UserSession): Promise<UnreadCountDto> {
    return this.notificationService.getUnreadCount(session.user.id);
  }

  @Post('read-all')
  @HttpCode(204)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiNoContentResponse()
  async markAllRead(@Session() session: UserSession): Promise<void> {
    return this.notificationService.markAllRead(session.user.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiOkResponse({ type: NotificationDto })
  async markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() session: UserSession,
  ): Promise<NotificationDto> {
    return this.notificationService.markRead(id, session.user.id);
  }
}
