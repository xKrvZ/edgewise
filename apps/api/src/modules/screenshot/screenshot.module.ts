import { Module } from '@nestjs/common';
import { ScreenshotController } from './controllers/screenshot.controller';
import { ScreenshotService } from './services/screenshot.service';
import { ScreenshotDao } from './daos/screenshot.dao';

@Module({
  controllers: [ScreenshotController],
  providers: [ScreenshotService, ScreenshotDao],
  exports: [ScreenshotService, ScreenshotDao],
})
export class ScreenshotModule {}
