import { Module, forwardRef } from '@nestjs/common';
import { PunishmentController } from './controllers/punishment.controller';
import { PunishmentService } from './services/punishment.service';
import { PunishmentDao } from './daos/punishment.dao';
import { NoteModule } from '@/modules/note/note.module';
import { AppealModule } from '@/modules/appeal/appeal.module';
import { AbuseReportModule } from '@/modules/abuse-report/abuse-report.module';

@Module({
  imports: [NoteModule, forwardRef(() => AppealModule), forwardRef(() => AbuseReportModule)],
  controllers: [PunishmentController],
  providers: [PunishmentService, PunishmentDao],
  exports: [PunishmentService, PunishmentDao],
})
export class PunishmentModule {}
