import {
  PLATFORM_EVENT_TYPE,
  type PlatformEventType,
} from '../constants/platform-metrics.constants';

const AUDIT_LABELS: Record<string, string> = {
  [PLATFORM_EVENT_TYPE.USER_REGISTERED]: 'Created account',
  [PLATFORM_EVENT_TYPE.ORDER_PAID]: 'Payment received',
  [PLATFORM_EVENT_TYPE.ORDER_REFUNDED]: 'Payment refunded',
  [PLATFORM_EVENT_TYPE.SUBSCRIPTION_ACTIVE]: 'Subscription activated',
  [PLATFORM_EVENT_TYPE.SUBSCRIPTION_CANCELED]: 'Subscription canceled',
  [PLATFORM_EVENT_TYPE.SUBSCRIPTION_REVOKED]: 'Subscription revoked',
  [PLATFORM_EVENT_TYPE.ADMIN_USER_BANNED]: 'Banned by administrator',
  [PLATFORM_EVENT_TYPE.ADMIN_USER_UNBANNED]: 'Unbanned by administrator',
  [PLATFORM_EVENT_TYPE.ADMIN_USER_ROLE_CHANGED]: 'Role changed by administrator',
  [PLATFORM_EVENT_TYPE.ADMIN_SUBSCRIPTION_OVERRIDE]: 'Subscription updated by administrator',
  [PLATFORM_EVENT_TYPE.ADMIN_SUBSCRIPTION_PLAN_CHANGED]: 'Plan changed by administrator',
  [PLATFORM_EVENT_TYPE.ADMIN_SUBSCRIPTION_CANCELED]: 'Subscription canceled by administrator',
  [PLATFORM_EVENT_TYPE.ADMIN_ORDER_REFUNDED]: 'Order refunded by administrator',
  [PLATFORM_EVENT_TYPE.ADMIN_DISCOUNT_GRANTED]: 'Discount granted by administrator',
  [PLATFORM_EVENT_TYPE.ADMIN_ACCOUNT_LIMIT_CHANGED]: 'Account limit changed by administrator',
  [PLATFORM_EVENT_TYPE.ADMIN_COMMUNITY_DISCOVER_HIDDEN]: 'Community hidden from discover',
  [PLATFORM_EVENT_TYPE.ADMIN_COMMUNITY_DISCOVER_SHOWN]: 'Community shown on discover',
  [PLATFORM_EVENT_TYPE.ADMIN_COMMUNITY_FEATURED]: 'Community featured',
  [PLATFORM_EVENT_TYPE.ADMIN_COMMUNITY_UNFEATURED]: 'Community unfeatured',
  [PLATFORM_EVENT_TYPE.ADMIN_COMMUNITY_POST_DELETED]: 'Community post deleted by administrator',
  [PLATFORM_EVENT_TYPE.ADMIN_COMMUNITY_POST_RESTORED]: 'Community post restored by administrator',
  [PLATFORM_EVENT_TYPE.ADMIN_COMMUNITY_POST_DISCOVER_HIDDEN]: 'Community post hidden from discover',
  [PLATFORM_EVENT_TYPE.ADMIN_COMMUNITY_POST_DISCOVER_SHOWN]: 'Community post shown on discover',
};

export function formatAuditEventLabel(type: PlatformEventType | string): string {
  return AUDIT_LABELS[type] ?? type.replace(/\./g, ' ');
}

export function formatAuditEventDetail(
  type: PlatformEventType | string,
  payload: Record<string, unknown>,
): string | null {
  switch (type) {
    case PLATFORM_EVENT_TYPE.ADMIN_USER_ROLE_CHANGED:
      if (typeof payload.previousRole === 'string' && typeof payload.newRole === 'string') {
        return `${payload.previousRole} → ${payload.newRole}`;
      }
      return null;
    case PLATFORM_EVENT_TYPE.ADMIN_SUBSCRIPTION_OVERRIDE:
      if (typeof payload.previousStatus === 'string' && typeof payload.newStatus === 'string') {
        return `${payload.previousStatus} → ${payload.newStatus}`;
      }
      return null;
    case PLATFORM_EVENT_TYPE.ADMIN_SUBSCRIPTION_PLAN_CHANGED:
      if (typeof payload.previousPlan === 'string' && typeof payload.newPlan === 'string') {
        const billingNote = payload.excludeBilling === true ? ' (billing excluded)' : '';
        return `${payload.previousPlan} → ${payload.newPlan}${billingNote}`;
      }
      return null;
    case PLATFORM_EVENT_TYPE.ADMIN_SUBSCRIPTION_CANCELED:
      if (typeof payload.mode === 'string') {
        return payload.mode === 'immediate' ? 'Canceled immediately' : 'Canceled at period end';
      }
      return null;
    case PLATFORM_EVENT_TYPE.ADMIN_ORDER_REFUNDED:
      if (typeof payload.amount === 'number') {
        return `$${(payload.amount / 100).toFixed(2)}`;
      }
      return null;
    case PLATFORM_EVENT_TYPE.ADMIN_USER_BANNED:
      return typeof payload.banReason === 'string' ? payload.banReason : null;
    case PLATFORM_EVENT_TYPE.ADMIN_ACCOUNT_LIMIT_CHANGED: {
      const previous =
        payload.previousOverride === null || typeof payload.previousOverride === 'number'
          ? payload.previousOverride
          : typeof payload.previousMaxAccounts === 'number'
            ? payload.previousMaxAccounts
            : null;
      const next =
        payload.newOverride === null || typeof payload.newOverride === 'number'
          ? payload.newOverride
          : typeof payload.newMaxAccounts === 'number'
            ? payload.newMaxAccounts
            : null;
      if (previous === null && typeof next === 'number') {
        return `Plan default → ${next} (override)`;
      }
      if (typeof previous === 'number' && next === null) {
        return `${previous} (override) → plan default`;
      }
      if (typeof previous === 'number' && typeof next === 'number') {
        return `${previous} → ${next}`;
      }
      return null;
    }
    case PLATFORM_EVENT_TYPE.ORDER_PAID:
    case PLATFORM_EVENT_TYPE.ORDER_REFUNDED:
      if (typeof payload.amount === 'number') {
        return `$${(payload.amount / 100).toFixed(2)}`;
      }
      return null;
    case PLATFORM_EVENT_TYPE.ADMIN_COMMUNITY_DISCOVER_HIDDEN:
    case PLATFORM_EVENT_TYPE.ADMIN_COMMUNITY_DISCOVER_SHOWN:
    case PLATFORM_EVENT_TYPE.ADMIN_COMMUNITY_FEATURED:
    case PLATFORM_EVENT_TYPE.ADMIN_COMMUNITY_UNFEATURED:
      return typeof payload.communityName === 'string' ? payload.communityName : null;
    case PLATFORM_EVENT_TYPE.ADMIN_COMMUNITY_POST_DELETED:
    case PLATFORM_EVENT_TYPE.ADMIN_COMMUNITY_POST_RESTORED:
    case PLATFORM_EVENT_TYPE.ADMIN_COMMUNITY_POST_DISCOVER_HIDDEN:
    case PLATFORM_EVENT_TYPE.ADMIN_COMMUNITY_POST_DISCOVER_SHOWN:
      if (typeof payload.postTitle === 'string' && typeof payload.communityName === 'string') {
        return `${payload.postTitle} · ${payload.communityName}`;
      }
      return typeof payload.postTitle === 'string' ? payload.postTitle : null;
    default:
      return null;
  }
}
