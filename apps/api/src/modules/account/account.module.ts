import { Module, forwardRef } from '@nestjs/common';
import { BillingModule } from '@/modules/billing/billing.module';
import { StorageModule } from '@/modules/storage/storage.module';
import { AccountController } from './controllers/account.controller';
import { AccountService } from './services/account.service';
import { AccountDao } from './daos/account.dao';

@Module({
  imports: [forwardRef(() => BillingModule), StorageModule],
  controllers: [AccountController],
  providers: [AccountService, AccountDao],
  exports: [AccountService, AccountDao],
})
export class AccountModule {}
