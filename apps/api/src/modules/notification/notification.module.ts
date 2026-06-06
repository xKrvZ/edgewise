import { Module } from '@nestjs/common';
import { PrivacyModule } from '@/modules/privacy/privacy.module';
import { NotificationController } from './controllers/notification.controller';
import { NotificationDao } from './daos/notification.dao';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [PrivacyModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationDao],
  exports: [NotificationService, NotificationDao],
})
export class NotificationModule {}
