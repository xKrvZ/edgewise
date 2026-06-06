import { Module } from '@nestjs/common';
import { MistakeController } from './controllers/mistake.controller';
import { MistakeService } from './services/mistake.service';
import { MistakeDao } from './daos/mistake.dao';

@Module({
  controllers: [MistakeController],
  providers: [MistakeService, MistakeDao],
  exports: [MistakeService, MistakeDao],
})
export class MistakeModule {}
