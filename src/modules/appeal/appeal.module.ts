import { Module, forwardRef } from '@nestjs/common';
import { AppealController } from './controllers/appeal.controller';
import { AppealService } from './services/appeal.service';
import { AppealDao } from './daos/appeal.dao';
import { PunishmentModule } from '../punishment/punishment.module';
import { NoteModule } from '../note/note.module';

@Module({
  imports: [forwardRef(() => PunishmentModule), NoteModule],
  controllers: [AppealController],
  providers: [AppealService, AppealDao],
  exports: [AppealService, AppealDao],
})
export class AppealModule {}
