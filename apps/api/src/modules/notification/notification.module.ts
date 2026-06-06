import { Module } from '@nestjs/common';
import { NotificationController } from './controllers/notification.controller';
import { NotificationDao } from './daos/notification.dao';
import { NotificationService } from './services/notification.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationDao],
  exports: [NotificationService, NotificationDao],
})
export class NotificationModule {}
