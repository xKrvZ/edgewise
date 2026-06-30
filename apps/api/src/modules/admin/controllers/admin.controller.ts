import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AllowWithoutSubscription } from '@/modules/billing/decorators/allow-without-subscription.decorator';
import { AdminRoleGuard } from '../guards/admin-role.guard';
import { AdminAuditService } from '../services/admin-audit.service';
import { AdminBillingService } from '../services/admin-billing.service';
import { AdminService } from '../services/admin.service';
import { AdminUsersService } from '../services/admin-users.service';
import { AdminAuditPageDto, AdminAuditQueryDto } from '../dtos/admin-audit.dto';
import { InvoicesPageDto } from '@/modules/billing/dtos/invoice.dto';
import { AdminStatsQueryDto } from '../dtos/admin-stats-query.dto';
import { AdminDashboardStatsDto, AdminStatsDto } from '../dtos/admin-stats.dto';
import {
  AdminBanUserDto,
  AdminUpdateAccountLimitDto,
  AdminUpdateUserRoleDto,
  AdminUpdateUserSubscriptionDto,
  AdminUserDetailDto,
  AdminUsersPageDto,
  AdminUsersQueryDto,
} from '../dtos/admin-user.dto';
import { AdminCommunitiesService } from '../services/admin-communities.service';
import {
  AdminCommunitiesPageDto,
  AdminCommunitiesQueryDto,
  AdminCommunityDetailDto,
  AdminCommunityPostRowDto,
  AdminCommunityPostsPageDto,
  AdminCommunityPostsQueryDto,
} from '../dtos/admin-community.dto';
import {
  AdminCancelSubscriptionDto,
  AdminChangePlanDto,
  AdminPlansResponseDto,
  AdminRefundOrderDto,
  AdminRefundResultDto,
  AdminSubscriptionDetailDto,
  AdminSubscriptionsPageDto,
  AdminSubscriptionsQueryDto,
} from '../dtos/admin-billing.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AdminRoleGuard)
@AllowWithoutSubscription()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminUsersService: AdminUsersService,
    private readonly adminBillingService: AdminBillingService,
    private readonly adminAuditService: AdminAuditService,
    private readonly adminCommunitiesService: AdminCommunitiesService,
  ) {}

  private resolveActorUserId(req: Request): string {
    const request = req as Request & {
      session?: { user?: { id?: string } };
      user?: { id?: string };
    };
    const user = request.session?.user ?? request.user;
    if (!user?.id || typeof user.id !== 'string') {
      throw new ForbiddenException('Authenticated administrator required');
    }

    return user.id;
  }

  @Get('stats/dashboard')
  @ApiOperation({ summary: 'Aggregate platform snapshot for the admin dashboard' })
  @ApiOkResponse({ type: AdminDashboardStatsDto })
  @ApiForbiddenResponse({ description: 'Administrator access required' })
  async getDashboardStats(): Promise<AdminDashboardStatsDto> {
    return this.adminService.getDashboardStats();
  }

  @Get('stats/analytics')
  @ApiOperation({ summary: 'Period-based PostHog metrics for admin analytics' })
  @ApiOkResponse({ type: AdminStatsDto })
  @ApiForbiddenResponse({ description: 'Administrator access required' })
  async getAnalyticsStats(@Query() query: AdminStatsQueryDto): Promise<AdminStatsDto> {
    return this.adminService.getAnalyticsStats(query.period ?? '30d');
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Deprecated — use /admin/stats/dashboard or /admin/stats/analytics',
    deprecated: true,
  })
  @ApiOkResponse({ type: AdminStatsDto })
  @ApiForbiddenResponse({ description: 'Administrator access required' })
  async getStats(@Query() query: AdminStatsQueryDto): Promise<AdminStatsDto> {
    return this.adminService.getAnalyticsStats(query.period ?? '30d');
  }

  @Get('audit')
  @ApiOperation({ summary: 'List administrative actions performed on the platform' })
  @ApiOkResponse({ type: AdminAuditPageDto })
  async listAdminAudit(@Query() query: AdminAuditQueryDto): Promise<AdminAuditPageDto> {
    return this.adminAuditService.listAdminAudit(query);
  }

  @Get('users')
  @ApiOperation({ summary: 'List platform users with subscription status' })
  @ApiOkResponse({ type: AdminUsersPageDto })
  async listUsers(@Query() query: AdminUsersQueryDto): Promise<AdminUsersPageDto> {
    return this.adminUsersService.listUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get a user with role, ban, and subscription details' })
  @ApiOkResponse({ type: AdminUserDetailDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getUser(@Param('id') id: string): Promise<AdminUserDetailDto> {
    return this.adminUsersService.getUser(id);
  }

  @Get('users/:id/invoices')
  @ApiOperation({ summary: 'List Polar invoices for a user (admin)' })
  @ApiOkResponse({ type: InvoicesPageDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  async listUserInvoices(@Param('id') id: string): Promise<InvoicesPageDto> {
    return this.adminUsersService.listInvoices(id);
  }

  @Get('users/:id/subscription')
  @ApiOperation({ summary: 'Full subscription state for admin management' })
  @ApiOkResponse({ type: AdminSubscriptionDetailDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getUserSubscription(@Param('id') id: string): Promise<AdminSubscriptionDetailDto> {
    return this.adminBillingService.getSubscription(id);
  }

  @Patch('users/:id/subscription/plan')
  @ApiOperation({ summary: 'Change subscription plan (upgrade/downgrade)' })
  @ApiOkResponse({ type: AdminSubscriptionDetailDto })
  async changeUserSubscriptionPlan(
    @Param('id') id: string,
    @Body() body: AdminChangePlanDto,
    @Req() req: Request,
  ): Promise<AdminSubscriptionDetailDto> {
    return this.adminBillingService.changePlan(id, body, this.resolveActorUserId(req));
  }

  @Post('users/:id/subscription/cancel')
  @ApiOperation({ summary: 'Cancel subscription at period end or immediately' })
  @ApiOkResponse({ type: AdminSubscriptionDetailDto })
  async cancelUserSubscription(
    @Param('id') id: string,
    @Body() body: AdminCancelSubscriptionDto,
    @Req() req: Request,
  ): Promise<AdminSubscriptionDetailDto> {
    return this.adminBillingService.cancelSubscription(id, body, this.resolveActorUserId(req));
  }

  @Post('users/:id/orders/:orderId/refund')
  @ApiOperation({ summary: 'Issue a refund for an order' })
  @ApiOkResponse({ type: AdminRefundResultDto })
  async refundUserOrder(
    @Param('id') id: string,
    @Param('orderId') orderId: string,
    @Body() body: AdminRefundOrderDto,
    @Req() req: Request,
  ): Promise<AdminRefundResultDto> {
    return this.adminBillingService.refundOrder(id, orderId, body, this.resolveActorUserId(req));
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'List subscriptions across users (paginated)' })
  @ApiOkResponse({ type: AdminSubscriptionsPageDto })
  async listSubscriptions(
    @Query() query: AdminSubscriptionsQueryDto,
  ): Promise<AdminSubscriptionsPageDto> {
    return this.adminBillingService.listSubscriptions(query);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Available billing plans for admin plan changes' })
  @ApiOkResponse({ type: AdminPlansResponseDto })
  async listPlans(): Promise<AdminPlansResponseDto> {
    const plans = await this.adminBillingService.listPlans();
    return { plans };
  }

  @Get('users/:id/audit')
  @ApiOperation({ summary: 'List audit events for a specific user' })
  @ApiOkResponse({ type: AdminAuditPageDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  async listUserAudit(
    @Param('id') id: string,
    @Query() query: AdminAuditQueryDto,
  ): Promise<AdminAuditPageDto> {
    await this.adminUsersService.getUser(id);
    return this.adminAuditService.listUserAudit(id, query);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update a user role via Better Auth admin API' })
  @ApiOkResponse({ type: AdminUserDetailDto })
  async updateRole(
    @Param('id') id: string,
    @Body() body: AdminUpdateUserRoleDto,
    @Req() req: Request,
  ): Promise<AdminUserDetailDto> {
    return this.adminUsersService.updateRole(
      id,
      body,
      req.headers,
      this.resolveActorUserId(req),
    );
  }

  @Patch('users/:id/subscription')
  @ApiOperation({ summary: 'Override subscription status (mock billing only)' })
  @ApiOkResponse({ type: AdminUserDetailDto })
  async updateSubscription(
    @Param('id') id: string,
    @Body() body: AdminUpdateUserSubscriptionDto,
    @Req() req: Request,
  ): Promise<AdminUserDetailDto> {
    return this.adminUsersService.updateSubscription(
      id,
      body,
      this.resolveActorUserId(req),
    );
  }

  @Patch('users/:id/account-limit')
  @ApiOperation({ summary: 'Set or clear per-user max trading accounts override' })
  @ApiOkResponse({ type: AdminUserDetailDto })
  async updateAccountLimit(
    @Param('id') id: string,
    @Body() body: AdminUpdateAccountLimitDto,
    @Req() req: Request,
  ): Promise<AdminUserDetailDto> {
    return this.adminUsersService.updateAccountLimit(
      id,
      body,
      this.resolveActorUserId(req),
    );
  }

  @Post('users/:id/ban')
  @ApiOperation({ summary: 'Ban a user via Better Auth admin API' })
  @ApiOkResponse({ type: AdminUserDetailDto })
  async banUser(
    @Param('id') id: string,
    @Body() body: AdminBanUserDto,
    @Req() req: Request,
  ): Promise<AdminUserDetailDto> {
    return this.adminUsersService.banUser(
      id,
      req.headers,
      this.resolveActorUserId(req),
      body.banReason,
    );
  }

  @Post('users/:id/unban')
  @ApiOperation({ summary: 'Remove a user ban via Better Auth admin API' })
  @ApiOkResponse({ type: AdminUserDetailDto })
  async unbanUser(@Param('id') id: string, @Req() req: Request): Promise<AdminUserDetailDto> {
    return this.adminUsersService.unbanUser(id, req.headers, this.resolveActorUserId(req));
  }

  @Get('communities')
  @ApiOperation({ summary: 'List communities for admin management' })
  @ApiOkResponse({ type: AdminCommunitiesPageDto })
  async listCommunities(
    @Query() query: AdminCommunitiesQueryDto,
  ): Promise<AdminCommunitiesPageDto> {
    return this.adminCommunitiesService.listCommunities(query);
  }

  @Get('communities/:id')
  @ApiOperation({ summary: 'Get community details for admin management' })
  @ApiOkResponse({ type: AdminCommunityDetailDto })
  @ApiNotFoundResponse({ description: 'Community not found' })
  async getCommunity(@Param('id') id: string): Promise<AdminCommunityDetailDto> {
    return this.adminCommunitiesService.getCommunity(id);
  }

  @Get('communities/:id/posts')
  @ApiOperation({ summary: 'List posts in a community for admin management' })
  @ApiOkResponse({ type: AdminCommunityPostsPageDto })
  @ApiNotFoundResponse({ description: 'Community not found' })
  async listCommunityPosts(
    @Param('id') id: string,
    @Query() query: AdminCommunityPostsQueryDto,
  ): Promise<AdminCommunityPostsPageDto> {
    return this.adminCommunitiesService.listPosts(id, query);
  }

  @Post('communities/:id/hide-from-discover')
  @ApiOperation({ summary: 'Hide a community from the discover page' })
  @ApiOkResponse({ type: AdminCommunityDetailDto })
  async hideCommunityFromDiscover(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<AdminCommunityDetailDto> {
    return this.adminCommunitiesService.hideCommunityFromDiscover(
      id,
      this.resolveActorUserId(req),
    );
  }

  @Post('communities/:id/show-on-discover')
  @ApiOperation({ summary: 'Restore a community on the discover page' })
  @ApiOkResponse({ type: AdminCommunityDetailDto })
  async showCommunityOnDiscover(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<AdminCommunityDetailDto> {
    return this.adminCommunitiesService.showCommunityOnDiscover(
      id,
      this.resolveActorUserId(req),
    );
  }

  @Post('communities/:id/feature')
  @ApiOperation({ summary: 'Feature a community on discover' })
  @ApiOkResponse({ type: AdminCommunityDetailDto })
  async featureCommunity(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<AdminCommunityDetailDto> {
    return this.adminCommunitiesService.featureCommunity(id, this.resolveActorUserId(req));
  }

  @Post('communities/:id/unfeature')
  @ApiOperation({ summary: 'Remove featured status from a community' })
  @ApiOkResponse({ type: AdminCommunityDetailDto })
  async unfeatureCommunity(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<AdminCommunityDetailDto> {
    return this.adminCommunitiesService.unfeatureCommunity(id, this.resolveActorUserId(req));
  }

  @Post('communities/:communityId/posts/:postId/soft-delete')
  @ApiOperation({ summary: 'Soft delete a community post (admin)' })
  @ApiOkResponse({ type: AdminCommunityPostRowDto })
  async softDeleteCommunityPost(
    @Param('communityId') communityId: string,
    @Param('postId') postId: string,
    @Req() req: Request,
  ): Promise<AdminCommunityPostRowDto> {
    return this.adminCommunitiesService.softDeletePost(
      communityId,
      postId,
      this.resolveActorUserId(req),
    );
  }

  @Post('communities/:communityId/posts/:postId/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted community post (admin)' })
  @ApiOkResponse({ type: AdminCommunityPostRowDto })
  async restoreCommunityPost(
    @Param('communityId') communityId: string,
    @Param('postId') postId: string,
    @Req() req: Request,
  ): Promise<AdminCommunityPostRowDto> {
    return this.adminCommunitiesService.restorePost(
      communityId,
      postId,
      this.resolveActorUserId(req),
    );
  }

  @Post('communities/:communityId/posts/:postId/hide-from-discover')
  @ApiOperation({ summary: 'Hide a public post from discover listings' })
  @ApiOkResponse({ type: AdminCommunityPostRowDto })
  async hideCommunityPostFromDiscover(
    @Param('communityId') communityId: string,
    @Param('postId') postId: string,
    @Req() req: Request,
  ): Promise<AdminCommunityPostRowDto> {
    return this.adminCommunitiesService.hidePostFromDiscover(
      communityId,
      postId,
      this.resolveActorUserId(req),
    );
  }

  @Post('communities/:communityId/posts/:postId/show-on-discover')
  @ApiOperation({ summary: 'Restore a post on discover listings' })
  @ApiOkResponse({ type: AdminCommunityPostRowDto })
  async showCommunityPostOnDiscover(
    @Param('communityId') communityId: string,
    @Param('postId') postId: string,
    @Req() req: Request,
  ): Promise<AdminCommunityPostRowDto> {
    return this.adminCommunitiesService.showPostOnDiscover(
      communityId,
      postId,
      this.resolveActorUserId(req),
    );
  }
}
