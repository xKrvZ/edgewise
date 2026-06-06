import { Module } from '@nestjs/common';
import { PrivacyModule } from '@/modules/privacy/privacy.module';
import { CommunityController } from './controllers/community.controller';
import { InvitationController } from './controllers/invitation.controller';
import { CommunityDao } from './daos/community.dao';
import { CommunityInvitationDao } from './daos/community-invitation.dao';
import { CommunityMemberDao } from './daos/community-member.dao';
import { CommunityStatsDao } from './daos/community-stats.dao';
import { CommunityService } from './services/community.service';

@Module({
  imports: [PrivacyModule],
  controllers: [CommunityController, InvitationController],
  providers: [
    CommunityService,
    CommunityDao,
    CommunityMemberDao,
    CommunityInvitationDao,
    CommunityStatsDao,
  ],
  exports: [
    CommunityService,
    CommunityDao,
    CommunityMemberDao,
  ],
})
export class CommunityModule {}
