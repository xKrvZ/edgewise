import { Module, forwardRef } from '@nestjs/common';
import { AbuseReportController } from './controllers/abuse-report.controller';
import { AbuseReportService } from './services/abuse-report.service';
import { AbuseReportDao } from './daos/abuse-report.dao';
import { PunishmentModule } from '../punishment/punishment.module';
import { NoteModule } from '../note/note.module';

@Module({
  imports: [forwardRef(() => PunishmentModule), NoteModule],
  controllers: [AbuseReportController],
  providers: [AbuseReportService, AbuseReportDao],
  exports: [AbuseReportService, AbuseReportDao],
})
export class AbuseReportModule {}
