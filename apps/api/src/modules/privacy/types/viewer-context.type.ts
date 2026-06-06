import type { UserVisibility } from '../constants/privacy.constants';

export interface ViewerContext {
  viewerId: string | null;
  visibility: UserVisibility;
}
