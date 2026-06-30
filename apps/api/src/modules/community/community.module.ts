import { Module, forwardRef } from '@nestjs/common';
import { BillingModule } from '@/modules/billing/billing.module';
import { PrivacyModule } from '@/modules/privacy/privacy.module';
import { TradeModule } from '@/modules/trade/trade.module';
import { CommunityController } from './controllers/community.controller';
import { CommunityPublicController } from './controllers/community-public.controller';
import { InvitationController } from './controllers/invitation.controller';
import { CommunityDao } from './daos/community.dao';
import { CommunityInvitationDao } from './daos/community-invitation.dao';
import { CommunityBanDao } from './daos/community-ban.dao';
import { CommunityMemberDao } from './daos/community-member.dao';
import { CommunityMemberTagDao } from './daos/community-member-tag.dao';
import { CommunityStatsDao } from './daos/community-stats.dao';
import { CommunityPostDao } from './daos/community-post.dao';
import { CommunityPostCommentDao } from './daos/community-post-comment.dao';
import { CommunityPostCommentReactionDao } from './daos/community-post-comment-reaction.dao';
import { CommunityPlaybookTemplateDao } from './daos/community-playbook-template.dao';
import { CommunityPlaybookTemplateChecklistItemDao } from './daos/community-playbook-template-checklist-item.dao';
import { CommunityTagDao } from './daos/community-tag.dao';
import { PlaybookDao } from '@/modules/playbook/daos/playbook.dao';
import { PlaybookChecklistItemDao } from '@/modules/playbook/daos/playbook-checklist-item.dao';
import { CommunityService } from './services/community.service';
import { CommunityPostService } from './services/community-post.service';
import { CommunityPostCommentService } from './services/community-post-comment.service';
import { CommunityPlaybookTemplateService } from './services/community-playbook-template.service';
import { CommunityTagService } from './services/community-tag.service';

@Module({
  imports: [forwardRef(() => BillingModule), PrivacyModule, forwardRef(() => TradeModule)],
  controllers: [CommunityController, CommunityPublicController, InvitationController],
  providers: [
    CommunityService,
    CommunityTagService,
    CommunityPostService,
    CommunityPostCommentService,
    CommunityPlaybookTemplateService,
    CommunityDao,
    CommunityBanDao,
    CommunityMemberDao,
    CommunityMemberTagDao,
    CommunityPostDao,
    CommunityPostCommentDao,
    CommunityPostCommentReactionDao,
    CommunityPlaybookTemplateDao,
    CommunityPlaybookTemplateChecklistItemDao,
    CommunityTagDao,
    CommunityInvitationDao,
    CommunityStatsDao,
    PlaybookDao,
    PlaybookChecklistItemDao,
  ],
  exports: [
    CommunityService,
    CommunityTagService,
    CommunityDao,
    CommunityMemberDao,
  ],
})
export class CommunityModule {}
