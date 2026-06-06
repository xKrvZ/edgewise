import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasRole, ROLES } from '@/auth/constants/roles.constants';
import {
  ALLOW_WITHOUT_SUBSCRIPTION_KEY,
  REQUIRE_FEATURE_KEY,
} from '../constants/billing.constants';
import { DEFAULT_ACCESS_FEATURE, type PlatformFeature } from '../constants/features.constants';
import { FeatureAccessService } from '../services/feature-access.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureAccess: FeatureAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('PUBLIC', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const allowWithoutSubscription = this.reflector.getAllAndOverride<boolean>(
      ALLOW_WITHOUT_SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowWithoutSubscription) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.session?.user ?? request.user;
    if (!user?.id) {
      return true;
    }

    if (hasRole(user.role, ROLES.ADMINISTRATOR)) {
      return true;
    }

    const requiredFeatures =
      this.reflector.getAllAndOverride<PlatformFeature[] | undefined>(REQUIRE_FEATURE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [DEFAULT_ACCESS_FEATURE];

    for (const feature of requiredFeatures) {
      const allowed = await this.featureAccess.hasFeature(user.id, feature, user.email);
      if (!allowed) {
        throw new ForbiddenException(
          requiredFeatures.length === 1
            ? `Feature "${feature}" required`
            : 'Required subscription features missing',
        );
      }
    }

    return true;
  }
}
