import { SetMetadata } from '@nestjs/common';
import { ALLOW_WITHOUT_SUBSCRIPTION_KEY } from '../constants/billing.constants';

/** Skip subscription checks for this route (billing, profile, health, public). */
export const AllowWithoutSubscription = () =>
  SetMetadata(ALLOW_WITHOUT_SUBSCRIPTION_KEY, true);
