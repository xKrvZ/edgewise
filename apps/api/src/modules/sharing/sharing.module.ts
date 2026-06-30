import { Module, forwardRef } from '@nestjs/common';
import { AccountModule } from '@/modules/account/account.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { PlaybookModule } from '@/modules/playbook/playbook.module';
import { ScreenshotModule } from '@/modules/screenshot/screenshot.module';
import { TradeModule } from '@/modules/trade/trade.module';
import { PublicController } from './controllers/public.controller';
import { TraderProfileController } from './controllers/trader-profile.controller';
import { TraderProfileHiddenTradeDao } from './daos/trader-profile-hidden-trade.dao';
import { TraderProfilePlaybookDao } from './daos/trader-profile-playbook.dao';
import { TraderProfileTradeDao } from './daos/trader-profile-trade.dao';
import { TraderProfileTradingAccountDao } from './daos/trader-profile-trading-account.dao';
import { TraderProfileDao } from './daos/trader-profile.dao';
import { SharingService } from './services/sharing.service';
import { TraderProfileService } from './services/trader-profile.service';

@Module({
  imports: [
    forwardRef(() => TradeModule),
    AccountModule,
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
    TraderProfileTradeDao,
    TraderProfileHiddenTradeDao,
    TraderProfileTradingAccountDao,
  ],
  exports: [SharingService, TraderProfileService],
})
export class SharingModule {}
