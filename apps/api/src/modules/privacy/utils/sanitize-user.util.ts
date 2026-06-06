import type { AdminUserDetailDto, AdminUserRowDto } from '@/modules/admin/dtos/admin-user.dto';
import type { CommunityInvitationDto } from '@/modules/community/dtos/community-invitation.dto';
import type { UserDto } from '@/modules/user/dtos/user.dto';
import {
  ANONYMIZED_EMAIL_DOMAIN,
  DELETED_USER_DISPLAY_NAME,
  UserVisibility,
} from '../constants/privacy.constants';
import type { ViewerContext } from '../types/viewer-context.type';

export function isAnonymizedEmail(email: string): boolean {
  return email.endsWith(ANONYMIZED_EMAIL_DOMAIN);
}

export function isDeletedUserRecord(params: {
  deletedAt?: Date | string | null;
  anonymizedAt?: Date | string | null;
  email?: string | null;
}): boolean {
  if (params.deletedAt || params.anonymizedAt) {
    return true;
  }
  return params.email ? isAnonymizedEmail(params.email) : false;
}

export function sanitizeUserDto(
  user: UserDto,
  context: ViewerContext,
  subjectDeleted = false,
): UserDto {
  if (context.visibility === UserVisibility.SELF) {
    return user;
  }

  if (context.visibility === UserVisibility.ADMIN) {
    if (subjectDeleted) {
      return {
        ...user,
        name: DELETED_USER_DISPLAY_NAME,
        role: user.role ?? '',
      };
    }
    return user;
  }

  return {
    id: user.id,
    name: subjectDeleted ? DELETED_USER_DISPLAY_NAME : user.name,
    role: '',
  };
}

export function sanitizeAuthorPresentation(
  authorId: string,
  authorName: string,
  deletedUserIds: ReadonlySet<string>,
): { authorId: string; authorName: string } {
  if (deletedUserIds.has(authorId)) {
    return { authorId, authorName: DELETED_USER_DISPLAY_NAME };
  }
  return { authorId, authorName };
}

export function sanitizeInvitationDto(
  dto: CommunityInvitationDto,
  viewerId: string,
  options: { isAdmin?: boolean; canViewInviteeEmail?: boolean } = {},
): CommunityInvitationDto {
  const isInviter = dto.invitedBy === viewerId;
  const isInvitee = dto.inviteeUserId === viewerId;

  if (options.isAdmin || options.canViewInviteeEmail || isInviter || isInvitee) {
    return dto;
  }

  return { ...dto, inviteeEmail: null };
}

export function sanitizeAdminUserRow(
  user: AdminUserRowDto & {
    deletedAt?: string | null;
    anonymizedAt?: string | null;
  },
): AdminUserRowDto {
  const deleted = isDeletedUserRecord({
    deletedAt: user.deletedAt,
    anonymizedAt: user.anonymizedAt,
    email: user.email,
  });

  if (!deleted) {
    const { deletedAt: _d, anonymizedAt: _a, ...row } = user;
    return row;
  }

  return {
    id: user.id,
    email: user.email,
    name: DELETED_USER_DISPLAY_NAME,
    displayName: null,
    role: null,
    subscriptionStatus: user.subscriptionStatus,
    createdAt: user.createdAt,
    emailVerified: false,
    banned: false,
    image: null,
    deletedAt: user.deletedAt ?? user.anonymizedAt ?? null,
  };
}

export function sanitizeAdminUserDetail(
  user: AdminUserDetailDto & {
    deletedAt?: string | null;
    anonymizedAt?: string | null;
  },
): AdminUserDetailDto {
  const row = sanitizeAdminUserRow(user);
  if (!isDeletedUserRecord({ deletedAt: user.deletedAt, anonymizedAt: user.anonymizedAt, email: user.email })) {
    const { deletedAt: _d, anonymizedAt: _a, ...detail } = user;
    return detail;
  }

  return {
    ...row,
    image: null,
    banReason: null,
    banExpires: null,
    subscription: user.subscription,
  };
}
