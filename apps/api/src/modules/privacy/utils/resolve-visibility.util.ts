import { UserVisibility } from '../constants/privacy.constants';
import type { ViewerContext } from '../types/viewer-context.type';

export function resolveVisibility(
  viewerId: string | null,
  subjectUserId: string,
  isAdmin = false,
): UserVisibility {
  if (!viewerId) {
    return UserVisibility.PUBLIC;
  }
  if (isAdmin) {
    return UserVisibility.ADMIN;
  }
  if (viewerId === subjectUserId) {
    return UserVisibility.SELF;
  }
  return UserVisibility.AUTHENTICATED_OTHER;
}

export function buildViewerContext(
  viewerId: string | null,
  subjectUserId: string,
  isAdmin = false,
): ViewerContext {
  return {
    viewerId,
    visibility: resolveVisibility(viewerId, subjectUserId, isAdmin),
  };
}
