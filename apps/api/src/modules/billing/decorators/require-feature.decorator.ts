import { SetMetadata } from '@nestjs/common';
import type { PlatformFeature } from '../constants/features.constants';
import { REQUIRE_FEATURE_KEY } from '../constants/billing.constants';

/** Require one or more Edgewise features (all listed features must be enabled). */
export const RequireFeature = (...features: PlatformFeature[]) =>
  SetMetadata(REQUIRE_FEATURE_KEY, features);
