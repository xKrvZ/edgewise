import { Module } from '@nestjs/common';
import { CommunityModule } from '@/modules/community/community.module';
import { PlaybookController } from './controllers/playbook.controller';
import { PlaybookService } from './services/playbook.service';
import { PlaybookDao } from './daos/playbook.dao';
import { PlaybookChecklistItemDao } from './daos/playbook-checklist-item.dao';

@Module({
  imports: [CommunityModule],
  controllers: [PlaybookController],
  providers: [PlaybookService, PlaybookDao, PlaybookChecklistItemDao],
  exports: [PlaybookService, PlaybookDao, PlaybookChecklistItemDao],
})
export class PlaybookModule {}
