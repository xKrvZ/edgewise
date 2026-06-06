import { Module } from '@nestjs/common';
import { TradeModule } from '@/modules/trade/trade.module';
import { JournalEntryController } from './controllers/journal-entry.controller';
import { JournalEntryService } from './services/journal-entry.service';
import { JournalEntryDao } from './daos/journal-entry.dao';

@Module({
  imports: [TradeModule],
  controllers: [JournalEntryController],
  providers: [JournalEntryService, JournalEntryDao],
  exports: [JournalEntryService, JournalEntryDao],
})
export class JournalEntryModule {}
