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
        return `${payload.previousPlan} → ${payload.newPlan}`;
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
    case PLATFORM_EVENT_TYPE.ORDER_PAID:
    case PLATFORM_EVENT_TYPE.ORDER_REFUNDED:
      if (typeof payload.amount === 'number') {
        return `$${(payload.amount / 100).toFixed(2)}`;
      }
      return null;
    default:
      return null;
  }
}
