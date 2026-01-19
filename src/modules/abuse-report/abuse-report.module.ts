import { Module } from '@nestjs/common';
import { AbuseReportController } from './controllers/abuse-report.controller';
import { AbuseReportService } from './services/abuse-report.service';
import { AbuseReportDao } from './daos/abuse-report.dao';
import { PunishmentModule } from '../punishment/punishment.module';

@Module({
  imports: [PunishmentModule],
  controllers: [AbuseReportController],
  providers: [AbuseReportService, AbuseReportDao],
  exports: [AbuseReportService, AbuseReportDao],
})
export class AbuseReportModule {}
