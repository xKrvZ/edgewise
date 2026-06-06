import { Module } from '@nestjs/common';
import { StorageModule } from '@/modules/storage/storage.module';
import { AccountDeletionController } from './controllers/account-deletion.controller';
import { AccountDeletionDao } from './daos/account-deletion.dao';
import { PrivacyUserDao } from './daos/privacy-user.dao';
import { AccountDeletionService } from './services/account-deletion.service';

@Module({
  imports: [StorageModule],
  controllers: [AccountDeletionController],
  providers: [AccountDeletionService, AccountDeletionDao, PrivacyUserDao],
  exports: [PrivacyUserDao],
})
export class PrivacyModule {}
