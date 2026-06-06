/**
 * Frontend mirror of the backend API contract (NestJS DTOs).
 *
 * These types are the single source of truth that frontend pages build against.
 * Keep them in sync with `apps/api/src/modules/**` DTOs. Timestamps are ISO
 * strings over the wire.
 */

// ==================== Enums ====================
export type AccountType = 'live' | 'paper' | 'prop';
export type MarketType = 'stocks' | 'futures' | 'forex' | 'crypto' | 'options';
export type TradeDirection = 'long' | 'short';
export type TradeStatus = 'open' | 'closed';
export type TradeVisibility = 'private' | 'unlisted' | 'public';
export type StatsVisibility = 'private' | 'public';
export type ChallengeStatus = 'active' | 'passed' | 'failed';

export const TRADE_VISIBILITIES: TradeVisibility[] = ['private', 'unlisted', 'public'];
export const STATS_VISIBILITIES: StatsVisibility[] = ['private', 'public'];

export type AccountCurrency =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'CAD'
  | 'AUD'
  | 'CHF'
  | 'JPY'
  | 'NZD'
  | 'SGD'
  | 'HKD';

export const MARKET_TYPES: MarketType[] = ['stocks', 'futures', 'forex', 'crypto', 'options'];
export const TRADE_DIRECTIONS: TradeDirection[] = ['long', 'short'];
export const ACCOUNT_TYPES: AccountType[] = ['live', 'paper', 'prop'];
export const ACCOUNT_CURRENCIES: AccountCurrency[] = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'CHF',
  'JPY',
  'NZD',
  'SGD',
  'HKD',
];
export const CHALLENGE_STATUSES: ChallengeStatus[] = ['active', 'passed', 'failed'];

// ==================== Pagination ====================
export interface Paginated<T> {
  items: T[];
  previousCursor: string | null;
  nextCursor: string | null;
}

/** @deprecated Offset pagination — only used where cursor is not yet adopted. */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

/** Raw paged payload as it may arrive from the backend (items or data). */
export interface RawPage<T> {
  items?: T[];
  data?: T[];
  total?: number;
  page?: number;
  limit?: number;
  pageCount?: number;
  previousCursor?: string | null;
  nextCursor?: string | null;
}

// ==================== Account ====================
export interface Account {
  id: string;
  userId: string;
  name: string;
  broker: string | null;
  type: AccountType;
  currency: string;
  startingBalance: number;
  currentBalance: number;
  isArchived: boolean;
  firmName: string | null;
  profitTarget: number | null;
  dailyLossLimit: number | null;
  maxLossLimit: number | null;
  trailingDrawdown: boolean;
  challengeStatus: ChallengeStatus | null;
  challengeStartedAt: string | null;
  daysTraded: number;
  breakevenRange: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountInput {
  name: string;
  broker?: string;
  type?: AccountType;
  currency?: string;
  startingBalance?: number;
  currentBalance?: number;
  isArchived?: boolean;
  firmName?: string | null;
  profitTarget?: number | null;
  dailyLossLimit?: number | null;
  maxLossLimit?: number | null;
  trailingDrawdown?: boolean;
  challengeStatus?: ChallengeStatus | null;
  challengeStartedAt?: string | null;
  daysTraded?: number;
  breakevenRange?: number;
}
export type UpdateAccountInput = Partial<CreateAccountInput>;

// ==================== Trade ====================
export interface Trade {
  id: string;
  userId: string;
  accountId: string;
  symbol: string;
  marketType: MarketType;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  fees: number;
  pnl: number | null;
  rMultiple: number | null;
  entryTime: string;
  exitTime: string | null;
  setupId: string | null;
  playbookId: string | null;
  sessionId: string | null;
  /** Linked tag ids as returned by the backend. */
  tagIds?: string[];
  /** Linked mistake ids as returned by the backend. */
  mistakeIds?: string[];
  /** Linked tags, resolved client-side from `tagIds` via reference data. */
  tags?: Tag[];
  /** Linked mistakes, resolved client-side from `mistakeIds` via reference data. */
  mistakes?: Mistake[];
  emotion: string | null;
  executionRating: number | null;
  notes: string | null;
  status: TradeStatus;
  visibility?: TradeVisibility;
  shareToken?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TradeSharing {
  visibility: TradeVisibility;
  shareToken: string | null;
}

export interface UpdateTradeSharingInput {
  visibility: TradeVisibility;
}

export interface TraderProfile {
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  headerUrl: string | null;
  favoriteSymbols: string[];
  sharePlaybooks: boolean;
  sharedPlaybookIds: string[];
  statsVisibility: StatsVisibility;
  statsShareToken: string | null;
}

export interface UpdateTraderProfileInput {
  displayName?: string | null;
  bio?: string | null;
  avatarStorageKey?: string | null;
  headerStorageKey?: string | null;
  favoriteSymbols?: string[];
  sharePlaybooks?: boolean;
  sharedPlaybookIds?: string[];
  statsVisibility?: StatsVisibility;
}

export interface ProfileUploadTarget {
  uploadUrl: string;
  storageKey: string;
  expiresIn: number;
}

export interface PublicPlaybook {
  name: string;
  description: string | null;
}

export interface PublicProfile {
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  headerUrl: string | null;
  favoriteSymbols: string[];
  playbooks: PublicPlaybook[];
  overview: AnalyticsOverview | null;
  equityCurve: EquityPoint[] | null;
}

export interface PublicTradeMedia {
  id: string;
  kind: MediaKind;
  url: string;
  caption: string | null;
  contentType: string | null;
}

export interface PublicTrade {
  symbol: string;
  marketType: MarketType;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  fees: number;
  pnl: number | null;
  rMultiple: number | null;
  entryTime: string;
  exitTime: string | null;
  emotion: string | null;
  executionRating: number | null;
  notes: string | null;
  status: TradeStatus;
  setupName: string | null;
  sessionName: string | null;
  tagNames: string[];
  visibility: TradeVisibility;
  media: PublicTradeMedia[];
}

export interface PublicStats {
  displayName: string | null;
  bio: string | null;
  overview: AnalyticsOverview;
  equityCurve: EquityPoint[];
}

export interface CreateTradeInput {
  accountId: string;
  symbol: string;
  marketType: MarketType;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  fees?: number;
  entryTime: string;
  exitTime?: string;
  setupId?: string;
  playbookId?: string;
  sessionId?: string;
  tagIds?: string[];
  mistakeIds?: string[];
  emotion?: string;
  executionRating?: number;
  notes?: string;
  status?: TradeStatus;
}
export type UpdateTradeInput = Partial<CreateTradeInput>;

export interface TradeFilters {
  symbol?: string;
  dateFrom?: string;
  dateTo?: string;
  setupId?: string;
  playbookId?: string;
  tagId?: string;
  accountId?: string;
  direction?: TradeDirection;
  marketType?: MarketType;
  cursor?: string;
  limit?: number;
}

// ==================== Tag / Mistake ====================
export type TagCategory = 'setup' | 'mistake' | 'custom';
export const TAG_CATEGORIES: TagCategory[] = ['setup', 'mistake', 'custom'];

// ==================== Instruments ====================
export interface Instrument {
  id: string;
  symbol: string;
  name: string;
  assetClass: MarketType;
  exchange: string | null;
  currency: string | null;
  providerSymbol: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  category?: TagCategory;
  createdAt: string;
}
export interface CreateTagInput {
  name: string;
  color?: string;
  category?: TagCategory;
}
export type UpdateTagInput = Partial<CreateTagInput>;

export interface Mistake {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  createdAt: string;
}
export interface CreateMistakeInput {
  name: string;
  color?: string;
}
export type UpdateMistakeInput = Partial<CreateMistakeInput>;

// ==================== Playbook ====================
export interface PlaybookChecklistItem {
  id: string;
  playbookId: string;
  text: string;
  sortOrder: number;
  createdAt: string;
}
export interface Playbook {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  marketConditions: string | null;
  entryCriteria: string | null;
  exitCriteria: string | null;
  riskRules: string | null;
  invalidationRules: string | null;
  createdAt: string;
  updatedAt: string;
  checklist?: PlaybookChecklistItem[];
}
export interface CreatePlaybookInput {
  name: string;
  description?: string;
  marketConditions?: string;
  entryCriteria?: string;
  exitCriteria?: string;
  riskRules?: string;
  invalidationRules?: string;
}
export type UpdatePlaybookInput = Partial<CreatePlaybookInput>;
export interface CreateChecklistItemInput {
  text: string;
  sortOrder?: number;
}
export type UpdateChecklistItemInput = Partial<CreateChecklistItemInput>;

// ==================== Screenshot ====================
export type MediaKind = 'image' | 'video';
export const MEDIA_VISIBILITIES = ['private', 'public'] as const;
export type MediaVisibility = (typeof MEDIA_VISIBILITIES)[number];

export interface Screenshot {
  id: string;
  userId: string;
  tradeId: string | null;
  playbookId: string | null;
  kind: MediaKind;
  url: string;
  contentType: string | null;
  sizeBytes: number | null;
  caption: string | null;
  visibility: MediaVisibility;
  createdAt: string;
}
export interface CreateScreenshotInput {
  url?: string;
  storageKey?: string;
  kind?: MediaKind;
  contentType?: string;
  sizeBytes?: number;
  tradeId?: string;
  playbookId?: string;
  caption?: string;
  visibility?: MediaVisibility;
}
export interface UpdateScreenshotInput {
  caption?: string;
  visibility?: MediaVisibility;
}

export interface RequestUploadInput {
  filename: string;
  contentType: string;
  kind: MediaKind;
  sizeBytes: number;
}
export interface UploadTarget {
  uploadUrl: string;
  storageKey: string;
  expiresIn: number;
}

// ==================== Trading session ====================
export interface TradingSession {
  id: string;
  userId: string;
  name: string;
  startTime: string;
  endTime: string;
  timezone: string | null;
  createdAt: string;
}
export interface CreateTradingSessionInput {
  name: string;
  startTime: string;
  endTime: string;
  timezone?: string;
}
export type UpdateTradingSessionInput = Partial<CreateTradingSessionInput>;

// ==================== Backtest ====================
export interface Backtest {
  id: string;
  userId: string;
  name: string;
  symbol: string;
  marketType: MarketType;
  startDate: string;
  endDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  tradeCount: number;
  netPnl: number | null;
}
export interface CreateBacktestInput {
  name: string;
  symbol: string;
  marketType: MarketType;
  startDate: string;
  endDate: string;
  notes?: string;
}
export type UpdateBacktestInput = Partial<CreateBacktestInput>;

export interface BacktestTrade {
  id: string;
  backtestId: string;
  userId: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  fees: number;
  pnl: number | null;
  rMultiple: number | null;
  entryTime: string;
  exitTime: string | null;
  notes: string | null;
  createdAt: string;
}
export interface CreateBacktestTradeInput {
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  fees?: number;
  pnl?: number;
  rMultiple?: number;
  entryTime: string;
  exitTime?: string;
  notes?: string;
}

// ==================== Journal ====================
export const MAX_JOURNAL_ENTRY_TRADES = 50;

export interface JournalEntryTradeSummary {
  id: string;
  symbol: string;
  entryTime: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  tradeIds: string[];
  trades: JournalEntryTradeSummary[];
  date: string;
  title: string | null;
  content: string;
  mood: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface CreateJournalEntryInput {
  tradeIds?: string[];
  date: string;
  title?: string;
  content: string;
  mood?: string;
}
export type UpdateJournalEntryInput = Partial<CreateJournalEntryInput>;
export interface JournalEntryFilters {
  dateFrom?: string;
  dateTo?: string;
  tradeId?: string;
  cursor?: string;
  limit?: number;
}

// ==================== Analytics ====================
export interface AnalyticsQuery {
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  marketType?: MarketType;
  direction?: TradeDirection;
}

export interface SetupRef {
  playbookId: string | null;
  label: string;
  netPnl: number;
}
export interface MistakeRef {
  mistakeId: string | null;
  label: string;
  count: number;
  pnlImpact: number;
}

export interface TraderScoreBreakdown {
  winRate: number;
  profitFactor: number;
  avgWinLoss: number;
  recoveryFactor: number;
  maxDrawdown: number;
  consistency: number;
}

export interface AnalyticsOverview {
  netPnl: number;
  grossProfit: number;
  grossLoss: number;
  totalFees: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  profitFactor: number | null;
  expectancy: number;
  avgR: number | null;
  avgWinner: number;
  avgLoser: number;
  largestWin: number;
  largestLoss: number;
  avgHoldMinutes: number;
  avgWinHoldMinutes: number;
  avgLossHoldMinutes: number;
  sharpeRatio: number | null;
  maxDrawdown: number;
  maxDrawdownPct: number | null;
  recoveryFactor: number | null;
  traderScore: number;
  traderScoreBreakdown: TraderScoreBreakdown;
  tradingDays: number;
  profitableDays: number;
  greenDayRate: number;
  bestSetup: SetupRef | null;
  worstMistake: MistakeRef | null;
}

export interface DrawdownPoint {
  date: string;
  equity: number;
  drawdown: number;
}
export interface AccountBalancePoint {
  date: string;
  balance: number;
}
export interface TradeDurationPoint {
  durationMs: number;
  pnl: number;
  win: boolean;
}

export interface EquityPoint {
  date: string;
  pnl: number;
  cumulativePnl: number;
}
export interface PnlPoint {
  date: string;
  pnl: number;
}
export interface RDistributionBucket {
  bucket: string;
  count: number;
}

/** Shared shape for every /analytics/by-* grouping endpoint. */
export interface GroupStat {
  key: string;
  label: string;
  trades: number;
  netPnl: number;
  winRate: number;
  profitFactor: number | null;
  avgR: number | null;
  expectancy: number;
}

export interface CalendarDay {
  date: string;
  pnl: number;
  trades: number;
  winRate: number;
}

/** Consolidated dashboard payload from `GET /analytics/dashboard`. */
export interface AnalyticsDashboard {
  overview: AnalyticsOverview;
  equityCurve: EquityPoint[];
  pnlOverTime: PnlPoint[];
  drawdown: DrawdownPoint[];
  accountBalance: AccountBalancePoint[];
  tradeDuration: TradeDurationPoint[];
  calendar: CalendarDay[];
}

/** Analytics dashboard from `GET /backtests/:id/analytics`. */
export interface BacktestAnalyticsDashboard {
  overview: AnalyticsOverview;
  equityCurve: EquityPoint[];
  pnlOverTime: PnlPoint[];
  drawdown: DrawdownPoint[];
  tradeDuration: TradeDurationPoint[];
  calendar: CalendarDay[];
  rDistribution: RDistributionBucket[];
}

// ==================== AI Review ====================
export interface AiReviewQuery {
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
}
export interface AiSetupSummary {
  label: string;
  netPnl: number;
  winRate: number;
}
export interface AiReview {
  generatedAt: string;
  summary: string;
  biggestWeakness: string;
  bestSetup: AiSetupSummary | null;
  worstSetup: AiSetupSummary | null;
  overtradingWarnings: string[];
  timeOfDayInsights: string[];
  ruleBreakingPatterns: string[];
  suggestedFocus: string[];
}
export interface TradeAiReview {
  generatedAt: string;
  summary: string;
  insights: string[];
  mistakesFlagged: string[];
  suggestions: string[];
}

// ==================== Community ====================
export type CommunityMemberRole = 'owner' | 'mentor' | 'member';
export type InvitationRole = 'mentor' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface CommunitySummary {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  memberCount: number;
  myRole: CommunityMemberRole;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMember {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: CommunityMemberRole;
  joinedAt: string;
}

export interface CommunityDetail extends CommunitySummary {
  members?: CommunityMember[];
}

export interface CreateCommunityInput {
  name: string;
  description?: string;
}

export interface UpdateCommunityInput {
  name?: string;
  description?: string;
}

export interface CommunityInvitation {
  id: string;
  communityId: string;
  communityName: string;
  invitedBy: string;
  inviterName: string | null;
  inviteeEmail: string | null;
  inviteeUserId: string | null;
  role: InvitationRole;
  status: InvitationStatus;
  createdAt: string;
  respondedAt: string | null;
}

export interface CreateInvitationInput {
  email: string;
  role: InvitationRole;
}

export interface CommunityLeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: CommunityMemberRole;
  netPnl: number;
  winRate: number;
  tradeCount: number;
  profitFactor: number | null;
}

export interface CommunityLeaderboard {
  periodDays: number;
  entries: CommunityLeaderboardEntry[];
}

export interface CommunityStats {
  memberCount: number;
  activeTraders: number;
  aggregateNetPnl: number;
  periodDays: number;
}

export interface CommunityQuery {
  days?: number;
}

// ==================== Comments ====================
export type CommentTargetType = 'trade' | 'playbook';

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  targetType: CommentTargetType;
  targetId: string;
  communityId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

export interface CommentAccess {
  canView: boolean;
  canComment: boolean;
  isContentOwner: boolean;
  communities: Array<{ id: string; name: string }>;
}

export interface CreateCommentInput {
  targetType: CommentTargetType;
  targetId: string;
  communityId: string;
  parentId?: string;
  body: string;
}

export interface UpdateCommentInput {
  body: string;
}

export interface CommentQuery {
  targetType: CommentTargetType;
  targetId: string;
}

// ==================== Notifications ====================
export type NotificationType = 'comment' | 'reply';

export interface Notification {
  id: string;
  type: NotificationType;
  actorId: string;
  actorName: string;
  actorImage: string | null;
  commentId: string;
  targetType: CommentTargetType;
  targetId: string;
  communityId: string;
  communityName: string;
  read: boolean;
  createdAt: string;
}

export interface UnreadCount {
  count: number;
}

export interface NotificationQuery {
  cursor?: string;
  limit?: number;
}
