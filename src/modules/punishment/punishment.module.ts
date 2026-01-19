import { Module } from '@nestjs/common';
import { PunishmentController } from './controllers/punishment.controller';
import { PunishmentService } from './services/punishment.service';
import { PunishmentDao } from './daos/punishment.dao';

@Module({
  controllers: [PunishmentController],
  providers: [PunishmentService, PunishmentDao],
  exports: [PunishmentService, PunishmentDao],
})
export class PunishmentModule {}
