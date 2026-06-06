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
  last24h: number;
  last7d: number;
  last30d: number;
  growth: AdminStatsGrowth;
  series: AdminStatsUserSeriesPoint[];
}

export interface AdminStatsRevenue {
  total: number;
  last24h: number;
  last7d: number;
  last30d: number;
  growth: AdminStatsGrowth;
  series: AdminStatsRevenueSeriesPoint[];
}

export interface AdminStatsSubscriptions {
  active: number;
  canceled: number;
  growth: AdminStatsGrowth;
}

export type AdminStatsPeriod = '7d' | '30d' | '90d';

export type AdminRevenueSource = 'rollup' | 'polar' | 'mock' | 'estimate';

export interface AdminStats {
  users: AdminStatsUsers;
  revenue: AdminStatsRevenue;
  subscriptions: AdminStatsSubscriptions;
  revenueSource: AdminRevenueSource;
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

export interface AdminUserDetail extends AdminUserRow {
  image: string | null;
  banReason: string | null;
  banExpires: string | null;
  subscription: AdminUserSubscription;
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
