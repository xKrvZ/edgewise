import { Module } from '@nestjs/common';
import { AppealController } from './controllers/appeal.controller';
import { AppealService } from './services/appeal.service';
import { AppealDao } from './daos/appeal.dao';
import { PunishmentModule } from '../punishment/punishment.module';

@Module({
  imports: [PunishmentModule],
  controllers: [AppealController],
  providers: [AppealService, AppealDao],
  exports: [AppealService, AppealDao],
})
export class AppealModule {}
