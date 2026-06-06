import { Module } from '@nestjs/common';
import { TagController } from './controllers/tag.controller';
import { TagService } from './services/tag.service';
import { TagDao } from './daos/tag.dao';

@Module({
  controllers: [TagController],
  providers: [TagService, TagDao],
  exports: [TagService, TagDao],
})
export class TagModule {}
