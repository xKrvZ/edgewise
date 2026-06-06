import { Module, forwardRef } from '@nestjs/common';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { PlaybookModule } from '@/modules/playbook/playbook.module';
import { ScreenshotModule } from '@/modules/screenshot/screenshot.module';
import { TradeModule } from '@/modules/trade/trade.module';
import { PublicController } from './controllers/public.controller';
import { TraderProfileController } from './controllers/trader-profile.controller';
import { TraderProfilePlaybookDao } from './daos/trader-profile-playbook.dao';
import { TraderProfileDao } from './daos/trader-profile.dao';
import { SharingService } from './services/sharing.service';
import { TraderProfileService } from './services/trader-profile.service';

@Module({
  imports: [
    forwardRef(() => TradeModule),
    AnalyticsModule,
    ScreenshotModule,
    PlaybookModule,
  ],
  controllers: [PublicController, TraderProfileController],
  providers: [
    SharingService,
    TraderProfileService,
    TraderProfileDao,
    TraderProfilePlaybookDao,
  ],
  exports: [SharingService, TraderProfileService],
})
export class SharingModule {}
