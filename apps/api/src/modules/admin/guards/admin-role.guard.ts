import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { hasRole, ROLES } from '@/auth/constants/roles.constants';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.session?.user ?? request.user;

    if (!user?.id) {
      throw new ForbiddenException('Authentication required');
    }

    if (!hasRole(user.role, ROLES.ADMINISTRATOR)) {
      throw new ForbiddenException('Administrator access required');
    }

    return true;
  }
}
