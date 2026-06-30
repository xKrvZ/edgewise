import posthog from 'posthog-js';

/**
 * SaaS analytics event catalog — organized by pillar.
 * Page views: `$pageview` (SPA route changes via PostHogPageView).
 * Retention / cohorts: built from these events in PostHog (no custom event required).
 */
export const AnalyticsEvents = {
  // Acquisition
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_UP: 'user_signed_up',
  EMAIL_VERIFIED: 'email_verified',

  // Activation
  ONBOARDING_COMPLETED: 'onboarding_completed',
  FIRST_TRADE_IMPORTED: 'first_trade_imported',
  JOURNAL_CREATED: 'journal_created',
  TRADE_LOGGED: 'trade_logged',
  TRADES_MILESTONE_10: 'trades_milestone_10',
  BROKER_CONNECTED: 'broker_connected',
  COMMUNITY_JOINED: 'community_joined',

  // Conversion
  CHECKOUT_STARTED: 'checkout_started',
  SUBSCRIPTION_COMPLETED: 'subscription_completed',
  PLAN_UPGRADED: 'plan_upgraded',

  // Feature adoption
  FEATURE_USED: 'feature_used',

  // Engagement
  SESSION_STARTED: 'session_started',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export type FeatureName =
  | 'trade_journal'
  | 'performance_dashboard'
  | 'community'
  | 'playbook'
  | 'goals'
  | 'import_wizard'
  | 'heatmaps'
  | 'replay'
  | 'reports'
  | 'tags'
  | 'calendar';

export type UpgradeTrigger =
  | 'paywall'
  | 'journal_limit'
  | 'import_limit'
  | 'community_feature'
  | 'analytics'
  | 'ai_review'
  | 'marketing'
  | 'manual'
  | 'unknown';

export type BillingPlanSlug = 'none' | 'starter' | 'pro' | 'elite';

export type AnalyticsEventProperties = {
  user_signed_in: { method: 'email' | 'discord' };
  user_signed_up: { method: 'email' };
  email_verified: Record<string, never>;
  onboarding_completed: { source: 'email_verification' | 'first_app_visit' };
  first_trade_imported: { trade_count: number; source: 'csv_import' };
  journal_created: { journal_id: string; is_first: boolean };
  trade_logged: { trade_id: string; status: string; trade_count: number };
  trades_milestone_10: { trade_count: number };
  broker_connected: { journal_id: string; broker: string };
  community_joined: { community_id: string; community_name: string };
  checkout_started: {
    plan_slug: string;
    upgrade_trigger?: UpgradeTrigger;
    trigger_feature?: string;
    from_plan?: BillingPlanSlug;
  };
  subscription_completed: {
    upgrade_trigger?: UpgradeTrigger;
    trigger_feature?: string;
    from_plan?: BillingPlanSlug;
    to_plan?: BillingPlanSlug;
  };
  plan_upgraded: {
    from_plan: BillingPlanSlug;
    to_plan: BillingPlanSlug;
    upgrade_trigger: UpgradeTrigger;
    trigger_feature?: string;
  };
  feature_used: { feature_name: FeatureName; action?: string };
  session_started: Record<string, never>;
};

export type ActivationMilestone =
  | 'onboarding_completed'
  | 'first_trade_imported'
  | 'journal_created'
  | 'trades_milestone_10'
  | 'broker_connected'
  | 'community_joined';

const EXCLUDED_PATH_PREFIXES = ['/admin', '/share'] as const;

const UPGRADE_TRIGGER_STORAGE_KEY = 'ew_upgrade_trigger';
const UPGRADE_FEATURE_STORAGE_KEY = 'ew_upgrade_trigger_feature';
const TRADE_COUNT_STORAGE_PREFIX = 'ew_trades_logged_';
const SESSION_STARTED_STORAGE_PREFIX = 'ew_session_started_';

let initialized = false;

export function isPostHogConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim());
}

/** Admin and public share pages are excluded from analytics (see before_send). */
export function shouldExcludeAnalyticsPath(pathname: string): boolean {
  return EXCLUDED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function respectsDoNotTrack(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const dnt = navigator.doNotTrack ?? (navigator as Navigator & { msDoNotTrack?: string }).msDoNotTrack;
  return dnt === '1' || dnt === 'yes';
}

export function isPostHogReady(): boolean {
  return initialized && isPostHogConfigured() && !respectsDoNotTrack();
}

export function initPostHog(): typeof posthog | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!isPostHogConfigured() || respectsDoNotTrack()) {
    return null;
  }

  if (initialized) {
    return posthog;
  }

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY!.trim();
  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com').replace(/\/$/, '');

  posthog.init(key, {
    api_host: host,
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    disable_session_recording: false,
    disable_surveys: false,
    opt_in_site_apps: true,
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
    session_recording: {
      maskAllInputs: true,
    },
    before_send: (event) => {
      if (shouldExcludeAnalyticsPath(window.location.pathname)) {
        return null;
      }
      return event;
    },
    loaded: (client) => {
      if (process.env.NODE_ENV === 'development') {
        client.debug(false);
      }
    },
  });

  initialized = true;
  return posthog;
}

export function capturePageView(url: string): void {
  if (!isPostHogReady() || shouldExcludeAnalyticsPath(window.location.pathname)) {
    return;
  }

  posthog.capture('$pageview', { $current_url: url });
}

export function captureEvent<E extends AnalyticsEventName>(
  event: E,
  properties?: AnalyticsEventProperties[E],
): void {
  if (!isPostHogReady() || shouldExcludeAnalyticsPath(window.location.pathname)) {
    return;
  }

  posthog.capture(event, properties);
}

export function setPersonPropertiesOnce(properties: Record<string, unknown>): void {
  if (!isPostHogReady()) {
    return;
  }

  posthog.setPersonProperties(undefined, properties);
}

export function setPersonProperties(properties: Record<string, unknown>): void {
  if (!isPostHogReady()) {
    return;
  }

  posthog.setPersonProperties(properties);
}

export function identifyAnalyticsUser(user: {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  plan?: BillingPlanSlug;
  favoriteSymbols?: string[];
}): void {
  if (!isPostHogReady()) {
    return;
  }

  posthog.identify(user.id, {
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    role: user.role ?? undefined,
    plan: user.plan ?? undefined,
    favorite_symbols: user.favoriteSymbols?.length ? user.favoriteSymbols.join(',') : undefined,
  });
}

export function resetAnalyticsUser(): void {
  if (!initialized) {
    return;
  }

  posthog.reset();
}

export function captureAnalyticsException(error: unknown, context?: Record<string, unknown>): void {
  if (!isPostHogReady()) {
    return;
  }

  posthog.captureException(error, context);
}

/** Persist upgrade context before checkout so success events can attribute revenue. */
export function storeUpgradeContext(
  trigger: UpgradeTrigger,
  triggerFeature?: string,
): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }

  sessionStorage.setItem(UPGRADE_TRIGGER_STORAGE_KEY, trigger);
  if (triggerFeature) {
    sessionStorage.setItem(UPGRADE_FEATURE_STORAGE_KEY, triggerFeature);
  } else {
    sessionStorage.removeItem(UPGRADE_FEATURE_STORAGE_KEY);
  }
}

export function readUpgradeContext(): {
  upgrade_trigger?: UpgradeTrigger;
  trigger_feature?: string;
} {
  if (typeof sessionStorage === 'undefined') {
    return {};
  }

  const upgrade_trigger = sessionStorage.getItem(UPGRADE_TRIGGER_STORAGE_KEY) as UpgradeTrigger | null;
  const trigger_feature = sessionStorage.getItem(UPGRADE_FEATURE_STORAGE_KEY) ?? undefined;

  return {
    upgrade_trigger: upgrade_trigger ?? undefined,
    trigger_feature: trigger_feature || undefined,
  };
}

export function clearUpgradeContext(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }

  sessionStorage.removeItem(UPGRADE_TRIGGER_STORAGE_KEY);
  sessionStorage.removeItem(UPGRADE_FEATURE_STORAGE_KEY);
}

function isoNow(): string {
  return new Date().toISOString();
}

function tradeCountKey(userId: string): string {
  return `${TRADE_COUNT_STORAGE_PREFIX}${userId}`;
}

/** Increment per-user trade counter (manual log + import). Returns new total. */
export function incrementUserTradeCount(userId: string, delta = 1): number {
  if (typeof localStorage === 'undefined') {
    return delta;
  }

  const key = tradeCountKey(userId);
  const next = (Number.parseInt(localStorage.getItem(key) ?? '0', 10) || 0) + delta;
  localStorage.setItem(key, String(next));
  return next;
}

export function getUserTradeCount(userId: string): number {
  if (typeof localStorage === 'undefined') {
    return 0;
  }

  return Number.parseInt(localStorage.getItem(tradeCountKey(userId)) ?? '0', 10) || 0;
}

export function captureActivationMilestone(
  milestone: ActivationMilestone,
  properties: AnalyticsEventProperties[ActivationMilestone],
): void {
  captureEvent(milestone, properties);

  const now = isoNow();
  switch (milestone) {
    case 'first_trade_imported':
      setPersonPropertiesOnce({ first_import_at: now });
      break;
    case 'journal_created':
      if ('is_first' in properties && properties.is_first) {
        setPersonPropertiesOnce({ first_journal_at: now });
      }
      break;
    case 'trades_milestone_10':
      setPersonPropertiesOnce({ trades_milestone_10_at: now });
      break;
    case 'broker_connected':
      setPersonPropertiesOnce({ first_broker_connected_at: now });
      break;
    case 'community_joined':
      setPersonPropertiesOnce({ first_community_joined_at: now });
      break;
    case 'onboarding_completed':
      setPersonPropertiesOnce({ onboarding_completed_at: now });
      break;
    default:
      break;
  }
}

export function captureFeatureUsed(
  featureName: FeatureName,
  context?: { action?: string },
): void {
  captureEvent(AnalyticsEvents.FEATURE_USED, {
    feature_name: featureName,
    action: context?.action,
  });
}

export function captureUpgrade(params: {
  from_plan: BillingPlanSlug;
  to_plan: BillingPlanSlug;
  upgrade_trigger: UpgradeTrigger;
  trigger_feature?: string;
}): void {
  captureEvent(AnalyticsEvents.PLAN_UPGRADED, params);
  setPersonPropertiesOnce({ first_upgrade_at: isoNow() });
  setPersonProperties({ plan: params.to_plan });
}

export function captureTradeActivity(params: {
  userId: string;
  tradeId: string;
  status: string;
  source: 'manual' | 'csv_import';
  importBatchSize?: number;
}): void {
  const delta = params.source === 'csv_import' ? (params.importBatchSize ?? 1) : 1;
  const previousCount = getUserTradeCount(params.userId);
  const tradeCount = incrementUserTradeCount(params.userId, delta);

  if (params.source === 'manual') {
    captureEvent(AnalyticsEvents.TRADE_LOGGED, {
      trade_id: params.tradeId,
      status: params.status,
      trade_count: tradeCount,
    });
  }

  if (previousCount === 0 && tradeCount > 0) {
    setPersonPropertiesOnce({ first_trade_at: isoNow() });
  }

  if (previousCount < 10 && tradeCount >= 10) {
    captureActivationMilestone(AnalyticsEvents.TRADES_MILESTONE_10, { trade_count: tradeCount });
  }
}

export function captureSessionStarted(userId: string): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }

  const key = `${SESSION_STARTED_STORAGE_PREFIX}${userId}`;
  if (sessionStorage.getItem(key)) {
    return;
  }

  sessionStorage.setItem(key, '1');
  captureEvent(AnalyticsEvents.SESSION_STARTED, {});
}

export function captureSubscriptionSuccess(params: {
  from_plan?: BillingPlanSlug;
  to_plan?: BillingPlanSlug;
}): void {
  const context = readUpgradeContext();

  captureEvent(AnalyticsEvents.SUBSCRIPTION_COMPLETED, {
    upgrade_trigger: context.upgrade_trigger,
    trigger_feature: context.trigger_feature,
    from_plan: params.from_plan,
    to_plan: params.to_plan,
  });

  setPersonPropertiesOnce({ first_upgrade_at: isoNow() });
  if (params.to_plan) {
    setPersonProperties({ plan: params.to_plan });
  }

  if (
    params.from_plan &&
    params.to_plan &&
    params.from_plan !== 'none' &&
    params.from_plan !== params.to_plan
  ) {
    captureUpgrade({
      from_plan: params.from_plan,
      to_plan: params.to_plan,
      upgrade_trigger: context.upgrade_trigger ?? 'unknown',
      trigger_feature: context.trigger_feature,
    });
  }

  clearUpgradeContext();
}

export function captureCheckoutStarted(params: {
  plan_slug: string;
  from_plan?: BillingPlanSlug;
  upgrade_trigger?: UpgradeTrigger;
  trigger_feature?: string;
}): void {
  if (params.upgrade_trigger) {
    storeUpgradeContext(params.upgrade_trigger, params.trigger_feature);
  }

  captureEvent(AnalyticsEvents.CHECKOUT_STARTED, {
    plan_slug: params.plan_slug,
    upgrade_trigger: params.upgrade_trigger,
    trigger_feature: params.trigger_feature,
    from_plan: params.from_plan,
  });
}
