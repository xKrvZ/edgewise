import { Module } from '@nestjs/common';
import { AccountController } from './controllers/account.controller';
import { AccountService } from './services/account.service';
import { AccountDao } from './daos/account.dao';

@Module({
  controllers: [AccountController],
  providers: [AccountService, AccountDao],
  exports: [AccountService, AccountDao],
})
export class AccountModule {}
