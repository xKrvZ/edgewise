import type { PlatformFeature } from '@/lib/features';

export interface AdminStatsGrowth {
  daily: number;
  weekly: number;
  monthly: number;
}

export interface AdminStatsUserSeriesPoint {
  date: string;
  count: number;
}

export interface AdminStatsRevenueSeriesPoint {
  date: string;
  amount: number;
}

export interface AdminStatsUsers {
  total: number;
  newInPeriod?: number;
  last24h: number;
  last7d: number;
  last30d: number;
  growth: AdminStatsGrowth;
  series: AdminStatsUserSeriesPoint[];
}

export interface AdminStatsRevenue {
  total: number;
  monthToDate?: number;
  mrr?: number;
  last24h: number;
  last7d: number;
  last30d: number;
  growth: AdminStatsGrowth;
  series: AdminStatsRevenueSeriesPoint[];
}

export interface AdminStatsSubscriptions {
  active: number;
  canceled: number;
  newActive?: number;
  newCanceled?: number;
  growth: AdminStatsGrowth;
  series?: AdminStatsUserSeriesPoint[];
  cancellationSeries?: AdminStatsUserSeriesPoint[];
}

export interface AdminStatsMetricsSeriesPoint {
  date: string;
  signups: number;
  subscriptions: number;
  cancellations: number;
  trades: number;
  journals: number;
  communityJoins: number;
  revenue: number;
}

export interface AdminStatsActivationTrendPoint {
  weekStart: string;
  signups: number;
  journalsCreated: number;
  firstTrades: number;
  communityJoins: number;
  subscriptions: number;
  journalRate: number;
  tradeRate: number;
  communityRate: number;
  subscriptionRate: number;
}

export interface AdminStatsPeriodComparisons {
  users: number;
  subscriptions: number;
  revenue: number;
  cancellations: number;
  trades?: number;
  journals?: number;
}

export interface AdminStatsActivationFunnelStep {
  key: string;
  label: string;
  shortLabel: string;
  event: string;
  count: number;
}

export type AdminActivationFunnelSource = 'posthog';

export interface AdminStatsActivationFunnel {
  source: AdminActivationFunnelSource;
  steps: AdminStatsActivationFunnelStep[];
  periodSteps?: AdminStatsActivationFunnelStep[];
}

export type AdminStatsPeriod = '7d' | '30d' | '90d';

export type AdminRevenueSource = 'rollup' | 'polar' | 'mock' | 'estimate';

export interface AdminStats {
  period?: AdminStatsPeriod;
  posthogConfigured: boolean;
  posthogFunnelError?: boolean;
  posthogFunnelAvailable?: boolean;
  users: AdminStatsUsers;
  revenue: AdminStatsRevenue;
  subscriptions: AdminStatsSubscriptions;
  activation: AdminStatsActivationFunnel;
  series?: AdminStatsMetricsSeriesPoint[];
  activationTrend?: AdminStatsActivationTrendPoint[];
  comparisons?: AdminStatsPeriodComparisons;
  revenueSource: AdminRevenueSource;
}

export interface AdminDashboardStats {
  users: { total: number };
  subscriptions: { active: number };
  trades: { total: number; thisMonth: number };
  journals: { total: number; thisMonth: number };
  communities: { total: number; thisMonth: number };
  posts: { total: number; thisMonth: number };
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  displayName?: string | null;
  role: string | null;
  subscriptionStatus: string | null;
  createdAt: string;
  emailVerified: boolean;
  banned: boolean;
  image?: string | null;
}

export interface AdminUsersPage {
  items: AdminUserRow[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminPlan {
  id: string;
  name: string;
  slug?: string | null;
  productId: string | null;
}

export interface AdminUserSubscription {
  provider: 'mock' | 'polar';
  status: string;
  active: boolean;
  productId: string | null;
  currentPeriodEnd: string | null;
  polarCustomerId: string | null;
  polarDashboardUrl: string | null;
  features: PlatformFeature[];
  adminEditable: boolean;
}

export interface AdminSubscriptionDetail {
  provider: 'mock' | 'polar';
  status: string;
  active: boolean;
  productId: string | null;
  planSlug?: string | null;
  currentPeriodEnd: string | null;
  polarCustomerId: string | null;
  polarSubscriptionId: string | null;
  polarDashboardUrl: string | null;
  features: PlatformFeature[];
  managementEnabled: boolean;
  cancelAtPeriodEnd?: boolean;
  adminPlanOverride?: boolean;
  plans: AdminPlan[];
}

export interface AdminSubscriptionRow {
  userId: string;
  email: string;
  name: string | null;
  displayName?: string | null;
  status: string;
  productId: string | null;
  planName?: string | null;
  currentPeriodEnd: string | null;
  provider: 'mock' | 'polar';
}

export interface AdminSubscriptionsPage {
  items: AdminSubscriptionRow[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminRefundResult {
  orderId: string;
  status: string;
  amount: number;
  currency: string;
}

export interface AdminUserAccountQuota {
  accountCount: number;
  maxAccounts: number;
  planMaxAccounts: number;
  maxTradingAccountsOverride: number | null;
  planId: 'starter' | 'pro' | 'elite' | 'none';
}

export interface AdminUserDetail extends AdminUserRow {
  image: string | null;
  banReason: string | null;
  banExpires: string | null;
  subscription: AdminUserSubscription;
  accountQuota: AdminUserAccountQuota;
}

export type AdminSubscriptionStatus = 'active' | 'inactive' | 'canceled';

export interface AdminAuditEntry {
  id: string;
  type: string;
  label: string;
  detail: string | null;
  source: string;
  occurredAt: string;
  subjectUserId: string | null;
  subjectEmail: string | null;
  subjectName: string | null;
  subjectDisplayName?: string | null;
  actorUserId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  actorDisplayName?: string | null;
  payload: Record<string, unknown>;
}

export interface AdminAuditPage {
  items: AdminAuditEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminCommunityRow {
  id: string;
  name: string;
  description: string | null;
  joinPolicy: string;
  createdBy: string;
  creatorEmail: string;
  creatorName: string | null;
  creatorDisplayName: string | null;
  memberCount: number;
  postCount: number;
  discoverHiddenAt: string | null;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCommunitiesPage {
  items: AdminCommunityRow[];
  total: number;
  limit: number;
  offset: number;
}

export type AdminCommunityDetail = AdminCommunityRow;

export interface AdminCommunityPostRow {
  id: string;
  communityId: string;
  title: string;
  visibility: string;
  authorUserId: string;
  authorEmail: string;
  authorName: string | null;
  authorDisplayName: string | null;
  publishedAt: string;
  deletedAt: string | null;
  discoverHiddenAt: string | null;
}

export interface AdminCommunityPostsPage {
  items: AdminCommunityPostRow[];
  total: number;
  limit: number;
  offset: number;
}
