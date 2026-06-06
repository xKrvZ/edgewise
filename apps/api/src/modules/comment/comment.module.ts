import { Module } from '@nestjs/common';
import { CommunityModule } from '@/modules/community/community.module';
import { NotificationModule } from '@/modules/notification/notification.module';
import { PlaybookModule } from '@/modules/playbook/playbook.module';
import { PrivacyModule } from '@/modules/privacy/privacy.module';
import { TradeModule } from '@/modules/trade/trade.module';
import { CommentController } from './controllers/comment.controller';
import { CommentDao } from './daos/comment.dao';
import { CommentPermissionService } from './services/comment-permission.service';
import { CommentService } from './services/comment.service';

@Module({
  imports: [CommunityModule, TradeModule, PlaybookModule, NotificationModule, PrivacyModule],
  controllers: [CommentController],
  providers: [CommentService, CommentPermissionService, CommentDao],
  exports: [CommentService, CommentPermissionService],
})
export class CommentModule {}
