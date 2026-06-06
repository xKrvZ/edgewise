import { Module } from '@nestjs/common';
import { InstrumentController } from './controllers/instrument.controller';
import { InstrumentService } from './services/instrument.service';
import { InstrumentDao } from './daos/instrument.dao';

@Module({
  controllers: [InstrumentController],
  providers: [InstrumentService, InstrumentDao],
  exports: [InstrumentService, InstrumentDao],
})
export class InstrumentModule {}
