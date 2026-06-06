import { API_URL } from '@/lib/api';
import type {
  Account,
  AccountBalancePoint,
  AiReview,
  AiReviewQuery,
  AnalyticsDashboard,
  AnalyticsOverview,
  AnalyticsQuery,
  Backtest,
  BacktestAnalyticsDashboard,
  BacktestTrade,
  CalendarDay,
  CreateAccountInput,
  CreateBacktestInput,
  CreateBacktestTradeInput,
  CreateChecklistItemInput,
  CreateJournalEntryInput,
  CreateMistakeInput,
  CreatePlaybookInput,
  CreateScreenshotInput,
  CreateTagInput,
  CreateTradeInput,
  CreateTradingSessionInput,
  DrawdownPoint,
  EquityPoint,
  GroupStat,
  Instrument,
  JournalEntry,
  JournalEntryFilters,
  MediaKind,
  Mistake,
  Page,
  Paginated,
  Playbook,
  PlaybookChecklistItem,
  PnlPoint,
  RDistributionBucket,
  RawPage,
  RequestUploadInput,
  Screenshot,
  Tag,
  Trade,
  TradeAiReview,
  TradeDurationPoint,
  TradeFilters,
  TradingSession,
  UpdateAccountInput,
  UpdateBacktestInput,
  UpdateChecklistItemInput,
  UpdateJournalEntryInput,
  UpdateMistakeInput,
  UpdatePlaybookInput,
  UpdateScreenshotInput,
  UpdateTagInput,
  UpdateTradeInput,
  UpdateTradeSharingInput,
  UpdateTraderProfileInput,
  TraderProfile,
  ProfileUploadTarget,
  TradeSharing,
  UpdateTradingSessionInput,
  UploadTarget,
  CommunitySummary,
  CommunityDetail,
  CreateCommunityInput,
  UpdateCommunityInput,
  CommunityInvitation,
  CreateInvitationInput,
  CommunityLeaderboard,
  CommunityStats,
  CommunityQuery,
  Comment,
  CommentAccess,
  CommentQuery,
  CreateCommentInput,
  UpdateCommentInput,
  Notification,
  NotificationQuery,
  UnreadCount,
} from '@/lib/types';
export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// `object` so fixed-shape filter interfaces (which lack an index signature)
// can be passed directly as query params.
type QueryParams = object;

function buildQuery(params?: QueryParams): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: QueryParams;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = options;

  const res = await fetch(`${API_URL}${path}${buildQuery(query)}`, {
    method,
    credentials: 'include',
    signal,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (isJson && (payload as { message?: string | string[] })?.message) || res.statusText;
    throw new ApiError(
      res.status,
      Array.isArray(message) ? message.join(', ') : String(message),
      payload,
    );
  }

  return payload as T;
}

/**
 * Normalizes a paged payload that may arrive as `{ items }` or `{ data }`,
 * with possibly-missing pagination metadata, into a stable `Page<T>`.
 */
function normalizePage<T>(raw: RawPage<T> | T[], fallbackLimit = 25): Page<T> {
  if (Array.isArray(raw)) {
    return {
      items: raw,
      total: raw.length,
      page: 1,
      limit: raw.length || fallbackLimit,
      pageCount: 1,
    };
  }
  const items = raw.items ?? raw.data ?? [];
  const total = raw.total ?? items.length;
  const limit = raw.limit ?? fallbackLimit;
  const page = raw.page ?? 1;
  const pageCount = raw.pageCount ?? Math.max(1, Math.ceil(total / (limit || 1)));
  return { items, total, page, limit, pageCount };
}

function normalizePaginated<T>(raw: RawPage<T> | T[]): Paginated<T> {
  if (Array.isArray(raw)) {
    return { items: raw, previousCursor: null, nextCursor: null };
  }
  return {
    items: raw.items ?? raw.data ?? [],
    previousCursor: raw.previousCursor ?? null,
    nextCursor: raw.nextCursor ?? null,
  };
}

/**
 * Typed API surface for the Edgewise backend. Every call is credentialed
 * (cookies) and scoped server-side to the authenticated user.
 */
export const api = {
  // -------------------- Accounts --------------------
  accounts: {
    list: () => request<Account[]>('/accounts'),
    get: (id: string) => request<Account>(`/accounts/${id}`),
    create: (input: CreateAccountInput) =>
      request<Account>('/accounts', { method: 'POST', body: input }),
    update: (id: string, input: UpdateAccountInput) =>
      request<Account>(`/accounts/${id}`, { method: 'PATCH', body: input }),
    remove: (id: string) => request<void>(`/accounts/${id}`, { method: 'DELETE' }),
  },

  // -------------------- Trades --------------------
  trades: {
    list: async (filters?: TradeFilters) => {
      const raw = await request<RawPage<Trade> | Trade[]>('/trades', {
        query: filters,
      });
      return normalizePaginated<Trade>(raw);
    },
    get: (id: string) => request<Trade>(`/trades/${id}`),
    create: (input: CreateTradeInput) => request<Trade>('/trades', { method: 'POST', body: input }),
    update: (id: string, input: UpdateTradeInput) =>
      request<Trade>(`/trades/${id}`, { method: 'PATCH', body: input }),
    remove: (id: string) => request<void>(`/trades/${id}`, { method: 'DELETE' }),
    updateSharing: (id: string, input: UpdateTradeSharingInput) =>
      request<TradeSharing>(`/trades/${id}/sharing`, { method: 'PATCH', body: input }),
  },

  // -------------------- Profile / sharing --------------------
  profile: {
    get: () => request<TraderProfile>('/users/me/profile'),
    update: (input: UpdateTraderProfileInput) =>
      request<TraderProfile>('/users/me/profile', { method: 'PATCH', body: input }),
    requestAvatarUpload: (input: {
      filename: string;
      contentType: string;
      sizeBytes: number;
    }) =>
      request<ProfileUploadTarget>('/users/me/profile/avatar/upload-url', {
        method: 'POST',
        body: input,
      }),
    requestHeaderUpload: (input: {
      filename: string;
      contentType: string;
      sizeBytes: number;
    }) =>
      request<ProfileUploadTarget>('/users/me/profile/header/upload-url', {
        method: 'POST',
        body: input,
      }),
    uploadAvatar: async (file: File): Promise<TraderProfile> => {
      const target = await request<ProfileUploadTarget>(
        '/users/me/profile/avatar/upload-url',
        {
          method: 'POST',
          body: {
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
          },
        },
      );

      const put = await fetch(target.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      if (!put.ok) {
        throw new Error(`Avatar upload failed (${put.status})`);
      }

      return request<TraderProfile>('/users/me/profile', {
        method: 'PATCH',
        body: { avatarStorageKey: target.storageKey },
      });
    },
    uploadHeader: async (file: File): Promise<TraderProfile> => {
      const target = await request<ProfileUploadTarget>(
        '/users/me/profile/header/upload-url',
        {
          method: 'POST',
          body: {
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
          },
        },
      );

      const put = await fetch(target.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      if (!put.ok) {
        throw new Error(`Header upload failed (${put.status})`);
      }

      return request<TraderProfile>('/users/me/profile', {
        method: 'PATCH',
        body: { headerStorageKey: target.storageKey },
      });
    },
  },

  // -------------------- Instruments --------------------
  instruments: {
    search: (q: string, limit = 20) =>
      request<Instrument[]>('/instruments/search', { query: { q, limit } }),
    get: (symbol: string) => request<Instrument>(`/instruments/${encodeURIComponent(symbol)}`),
  },

  // -------------------- Tags --------------------
  tags: {
    list: () => request<Tag[]>('/tags'),
    get: (id: string) => request<Tag>(`/tags/${id}`),
    create: (input: CreateTagInput) => request<Tag>('/tags', { method: 'POST', body: input }),
    update: (id: string, input: UpdateTagInput) =>
      request<Tag>(`/tags/${id}`, { method: 'PATCH', body: input }),
    remove: (id: string) => request<void>(`/tags/${id}`, { method: 'DELETE' }),
  },

  // -------------------- Mistakes --------------------
  mistakes: {
    list: () => request<Mistake[]>('/mistakes'),
    get: (id: string) => request<Mistake>(`/mistakes/${id}`),
    create: (input: CreateMistakeInput) =>
      request<Mistake>('/mistakes', { method: 'POST', body: input }),
    update: (id: string, input: UpdateMistakeInput) =>
      request<Mistake>(`/mistakes/${id}`, { method: 'PATCH', body: input }),
    remove: (id: string) => request<void>(`/mistakes/${id}`, { method: 'DELETE' }),
  },

  // -------------------- Playbooks --------------------
  playbooks: {
    list: () => request<Playbook[]>('/playbooks'),
    get: (id: string) => request<Playbook>(`/playbooks/${id}`),
    create: (input: CreatePlaybookInput) =>
      request<Playbook>('/playbooks', { method: 'POST', body: input }),
    update: (id: string, input: UpdatePlaybookInput) =>
      request<Playbook>(`/playbooks/${id}`, { method: 'PATCH', body: input }),
    remove: (id: string) => request<void>(`/playbooks/${id}`, { method: 'DELETE' }),
    listChecklist: (id: string) => request<PlaybookChecklistItem[]>(`/playbooks/${id}/checklist`),
    addChecklistItem: (id: string, input: CreateChecklistItemInput) =>
      request<PlaybookChecklistItem>(`/playbooks/${id}/checklist`, {
        method: 'POST',
        body: input,
      }),
    updateChecklistItem: (id: string, itemId: string, input: UpdateChecklistItemInput) =>
      request<PlaybookChecklistItem>(`/playbooks/${id}/checklist/${itemId}`, {
        method: 'PATCH',
        body: input,
      }),
    removeChecklistItem: (id: string, itemId: string) =>
      request<void>(`/playbooks/${id}/checklist/${itemId}`, {
        method: 'DELETE',
      }),
  },

  // -------------------- Screenshots --------------------
  screenshots: {
    list: (filters?: { tradeId?: string; playbookId?: string }) =>
      request<Screenshot[]>('/screenshots', { query: filters }),
    get: (id: string) => request<Screenshot>(`/screenshots/${id}`),
    create: (input: CreateScreenshotInput) =>
      request<Screenshot>('/screenshots', { method: 'POST', body: input }),
    requestUpload: (input: RequestUploadInput) =>
      request<UploadTarget>('/screenshots/upload-url', {
        method: 'POST',
        body: input,
      }),
    update: (id: string, input: UpdateScreenshotInput) =>
      request<Screenshot>(`/screenshots/${id}`, {
        method: 'PATCH',
        body: input,
      }),
    remove: (id: string) => request<void>(`/screenshots/${id}`, { method: 'DELETE' }),

    /**
     * Full upload flow: ask the API for a presigned URL, PUT the file bytes
     * straight to object storage, then persist the reference. Large videos
     * never pass through the API process.
     */
    upload: async (
      file: File,
      meta: { tradeId?: string; playbookId?: string; caption?: string } = {},
    ): Promise<Screenshot> => {
      const kind: MediaKind = file.type.startsWith('video/') ? 'video' : 'image';

      const target = await request<UploadTarget>('/screenshots/upload-url', {
        method: 'POST',
        body: {
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          kind,
          sizeBytes: file.size,
        } satisfies RequestUploadInput,
      });

      const put = await fetch(target.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      if (!put.ok) {
        throw new ApiError(put.status, 'Upload to storage failed', null);
      }

      return request<Screenshot>('/screenshots', {
        method: 'POST',
        body: {
          storageKey: target.storageKey,
          kind,
          contentType: file.type || undefined,
          sizeBytes: file.size,
          tradeId: meta.tradeId,
          playbookId: meta.playbookId,
          caption: meta.caption,
        } satisfies CreateScreenshotInput,
      });
    },
  },

  // -------------------- Trading sessions --------------------
  tradingSessions: {
    list: () => request<TradingSession[]>('/trading-sessions'),
    get: (id: string) => request<TradingSession>(`/trading-sessions/${id}`),
    create: (input: CreateTradingSessionInput) =>
      request<TradingSession>('/trading-sessions', {
        method: 'POST',
        body: input,
      }),
    update: (id: string, input: UpdateTradingSessionInput) =>
      request<TradingSession>(`/trading-sessions/${id}`, {
        method: 'PATCH',
        body: input,
      }),
    remove: (id: string) => request<void>(`/trading-sessions/${id}`, { method: 'DELETE' }),
  },

  // -------------------- Backtests --------------------
  backtests: {
    list: () => request<Backtest[]>('/backtests'),
    get: (id: string) => request<Backtest>(`/backtests/${id}`),
    create: (input: CreateBacktestInput) =>
      request<Backtest>('/backtests', { method: 'POST', body: input }),
    update: (id: string, input: UpdateBacktestInput) =>
      request<Backtest>(`/backtests/${id}`, { method: 'PATCH', body: input }),
    remove: (id: string) => request<void>(`/backtests/${id}`, { method: 'DELETE' }),
    listTrades: (id: string) => request<BacktestTrade[]>(`/backtests/${id}/trades`),
    addTrade: (id: string, input: CreateBacktestTradeInput) =>
      request<BacktestTrade>(`/backtests/${id}/trades`, {
        method: 'POST',
        body: input,
      }),
    removeTrade: (id: string, tradeId: string) =>
      request<void>(`/backtests/${id}/trades/${tradeId}`, { method: 'DELETE' }),
    analytics: (id: string) =>
      request<BacktestAnalyticsDashboard>(`/backtests/${id}/analytics`),
  },

  // -------------------- Journal --------------------
  journal: {
    list: async (filters?: JournalEntryFilters) => {
      const raw = await request<RawPage<JournalEntry> | JournalEntry[]>('/journal-entries', {
        query: filters,
      });
      return normalizePaginated<JournalEntry>(raw);
    },
    get: (id: string) => request<JournalEntry>(`/journal-entries/${id}`),
    create: (input: CreateJournalEntryInput) =>
      request<JournalEntry>('/journal-entries', {
        method: 'POST',
        body: input,
      }),
    update: (id: string, input: UpdateJournalEntryInput) =>
      request<JournalEntry>(`/journal-entries/${id}`, {
        method: 'PATCH',
        body: input,
      }),
    remove: (id: string) => request<void>(`/journal-entries/${id}`, { method: 'DELETE' }),
  },

  // -------------------- Analytics --------------------
  analytics: {
    dashboard: (query?: AnalyticsQuery) =>
      request<AnalyticsDashboard>('/analytics/dashboard', { query }),
    overview: (query?: AnalyticsQuery) =>
      request<AnalyticsOverview>('/analytics/overview', { query }),
    equityCurve: (query?: AnalyticsQuery) =>
      request<EquityPoint[]>('/analytics/equity-curve', { query }),
    pnlOverTime: (query?: AnalyticsQuery) =>
      request<PnlPoint[]>('/analytics/pnl-over-time', { query }),
    rDistribution: (query?: AnalyticsQuery) =>
      request<RDistributionBucket[]>('/analytics/r-distribution', { query }),
    bySetup: (query?: AnalyticsQuery) => request<GroupStat[]>('/analytics/by-setup', { query }),
    bySymbol: (query?: AnalyticsQuery) => request<GroupStat[]>('/analytics/by-symbol', { query }),
    byDayOfWeek: (query?: AnalyticsQuery) =>
      request<GroupStat[]>('/analytics/by-day-of-week', { query }),
    byTimeOfDay: (query?: AnalyticsQuery) =>
      request<GroupStat[]>('/analytics/by-time-of-day', { query }),
    byMistake: (query?: AnalyticsQuery) => request<GroupStat[]>('/analytics/by-mistake', { query }),
    bySession: (query?: AnalyticsQuery) => request<GroupStat[]>('/analytics/by-session', { query }),
    byAccount: (query?: AnalyticsQuery) => request<GroupStat[]>('/analytics/by-account', { query }),
    byDirection: (query?: AnalyticsQuery) =>
      request<GroupStat[]>('/analytics/by-direction', { query }),
    calendar: (query?: AnalyticsQuery) => request<CalendarDay[]>('/analytics/calendar', { query }),
    drawdown: (query?: AnalyticsQuery) =>
      request<DrawdownPoint[]>('/analytics/drawdown', { query }),
    accountBalance: (query?: AnalyticsQuery) =>
      request<AccountBalancePoint[]>('/analytics/account-balance', { query }),
    tradeDuration: (query?: AnalyticsQuery) =>
      request<TradeDurationPoint[]>('/analytics/trade-duration', { query }),
  },

  // -------------------- AI Review --------------------
  aiReview: {
    generate: (query?: AiReviewQuery) => request<AiReview>('/ai-review', { query }),
    generateForTrade: (tradeId: string) =>
      request<TradeAiReview>(`/ai-review/trades/${tradeId}`),
  },

  // -------------------- Community --------------------
  communities: {
    list: () => request<CommunitySummary[]>('/communities'),
    get: (id: string) => request<CommunityDetail>(`/communities/${id}`),
    create: (input: CreateCommunityInput) =>
      request<CommunityDetail>('/communities', { method: 'POST', body: input }),
    update: (id: string, input: UpdateCommunityInput) =>
      request<CommunityDetail>(`/communities/${id}`, { method: 'PATCH', body: input }),
    remove: (id: string) => request<void>(`/communities/${id}`, { method: 'DELETE' }),
    listInvitations: (id: string) =>
      request<CommunityInvitation[]>(`/communities/${id}/invitations`),
    createInvitation: (id: string, input: CreateInvitationInput) =>
      request<CommunityInvitation>(`/communities/${id}/invitations`, {
        method: 'POST',
        body: input,
      }),
    leaderboard: (id: string, query?: CommunityQuery) =>
      request<CommunityLeaderboard>(`/communities/${id}/leaderboard`, { query }),
    stats: (id: string, query?: CommunityQuery) =>
      request<CommunityStats>(`/communities/${id}/stats`, { query }),
  },

  invitations: {
    listMine: () => request<CommunityInvitation[]>('/invitations/mine'),
    accept: (id: string) =>
      request<CommunityDetail>(`/invitations/${id}/accept`, { method: 'POST' }),
    reject: (id: string) =>
      request<CommunityInvitation>(`/invitations/${id}/reject`, { method: 'POST' }),
  },

  // -------------------- Comments --------------------
  comments: {
    getAccess: (query: CommentQuery) =>
      request<CommentAccess>('/comments/access', { query }),
    list: (query: CommentQuery) => request<Comment[]>('/comments', { query }),
    create: (input: CreateCommentInput) =>
      request<Comment>('/comments', { method: 'POST', body: input }),
    update: (id: string, input: UpdateCommentInput) =>
      request<Comment>(`/comments/${id}`, { method: 'PATCH', body: input }),
    remove: (id: string) => request<void>(`/comments/${id}`, { method: 'DELETE' }),
  },

  // -------------------- Notifications --------------------
  notifications: {
    list: async (query?: NotificationQuery) => {
      const raw = await request<RawPage<Notification> | Notification[]>('/notifications', {
        query,
      });
      return normalizePaginated<Notification>(raw);
    },
    unreadCount: () => request<UnreadCount>('/notifications/unread-count'),
    markRead: (id: string) =>
      request<Notification>(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => request<void>('/notifications/read-all', { method: 'POST' }),
  },

  // -------------------- Account privacy --------------------
  account: {
    delete: (confirmation: string) =>
      request<void>('/account/delete', {
        method: 'POST',
        body: { confirmation },
      }),
  },

  // -------------------- Billing --------------------
  billing: {
    features: () => request<import('@/lib/types/billing').UserFeaturesStatus>('/billing/features'),
    /** @deprecated Use features() */
    entitlements: () =>
      request<import('@/lib/types/billing').EntitlementsStatus>('/billing/entitlements'),
    invoices: () => request<import('@/lib/types/billing').InvoicesPage>('/billing/invoices'),
  },

  // -------------------- Admin --------------------
  admin: {
    stats: (period: import('@/lib/types/admin').AdminStatsPeriod = '30d') =>
      request<import('@/lib/types/admin').AdminStats>(`/admin/stats?period=${period}`),
    audit: (query?: { limit?: number; offset?: number }) =>
      request<import('@/lib/types/admin').AdminAuditPage>('/admin/audit', { query }),
    users: {
      list: (query?: { limit?: number; offset?: number; search?: string }) =>
        request<import('@/lib/types/admin').AdminUsersPage>('/admin/users', { query }),
      get: (id: string) =>
        request<import('@/lib/types/admin').AdminUserDetail>(`/admin/users/${id}`),
      invoices: (id: string) =>
        request<import('@/lib/types/billing').InvoicesPage>(`/admin/users/${id}/invoices`),
      audit: (id: string, query?: { limit?: number; offset?: number }) =>
        request<import('@/lib/types/admin').AdminAuditPage>(`/admin/users/${id}/audit`, {
          query,
        }),
      updateRole: (id: string, role: string) =>
        request<import('@/lib/types/admin').AdminUserDetail>(`/admin/users/${id}/role`, {
          method: 'PATCH',
          body: { role },
        }),
      updateSubscription: (
        id: string,
        status: import('@/lib/types/admin').AdminSubscriptionStatus,
      ) =>
        request<import('@/lib/types/admin').AdminUserDetail>(`/admin/users/${id}/subscription`, {
          method: 'PATCH',
          body: { status },
        }),
      ban: (id: string, banReason?: string) =>
        request<import('@/lib/types/admin').AdminUserDetail>(`/admin/users/${id}/ban`, {
          method: 'POST',
          body: banReason ? { banReason } : {},
        }),
      unban: (id: string) =>
        request<import('@/lib/types/admin').AdminUserDetail>(`/admin/users/${id}/unban`, {
          method: 'POST',
        }),
      subscription: (id: string) =>
        request<import('@/lib/types/admin').AdminSubscriptionDetail>(
          `/admin/users/${id}/subscription`,
        ),
      changePlan: (id: string, body: { productId?: string; planSlug?: string }) =>
        request<import('@/lib/types/admin').AdminSubscriptionDetail>(
          `/admin/users/${id}/subscription/plan`,
          { method: 'PATCH', body },
        ),
      cancelSubscription: (id: string, immediate = false) =>
        request<import('@/lib/types/admin').AdminSubscriptionDetail>(
          `/admin/users/${id}/subscription/cancel`,
          { method: 'POST', body: { immediate } },
        ),
      refundOrder: (
        id: string,
        orderId: string,
        body?: { amount?: number; reason?: string; comment?: string },
      ) =>
        request<import('@/lib/types/admin').AdminRefundResult>(
          `/admin/users/${id}/orders/${orderId}/refund`,
          { method: 'POST', body: body ?? {} },
        ),
    },
    subscriptions: (query?: {
      limit?: number;
      offset?: number;
      search?: string;
      status?: string;
    }) =>
      request<import('@/lib/types/admin').AdminSubscriptionsPage>('/admin/subscriptions', {
        query,
      }),
    plans: () =>
      request<{ plans: import('@/lib/types/admin').AdminPlan[] }>('/admin/plans'),
  },

  // -------------------- Socket --------------------
  socket: {
    /**
     * Exchanges the credentialed session for a short-lived JWT used to
     * authenticate websocket handshakes.
     */
    token: () =>
      request<{ accessToken: string; expiresIn: number }>('/socket/token', {
        method: 'POST',
      }),
  },
};
