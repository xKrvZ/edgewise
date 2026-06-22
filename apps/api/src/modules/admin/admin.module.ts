import { Module } from '@nestjs/common';
import { AccountModule } from '@/modules/account/account.module';
import { BillingModule } from '@/modules/billing/billing.module';
import { PlatformMetricsModule } from '@/modules/platform-metrics/platform-metrics.module';
import { AdminController } from './controllers/admin.controller';
import { AdminDao } from './daos/admin.dao';
import { AdminRoleGuard } from './guards/admin-role.guard';
import { AdminAuditService } from './services/admin-audit.service';
import { AdminService } from './services/admin.service';
import { AdminBillingService } from './services/admin-billing.service';
import { AdminUsersService } from './services/admin-users.service';

@Module({
  imports: [AccountModule, BillingModule, PlatformMetricsModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminUsersService,
    AdminBillingService,
    AdminAuditService,
    AdminDao,
    AdminRoleGuard,
  ],
})
export class AdminModule {}
