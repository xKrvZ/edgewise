import { API_URL } from '@/lib/api';
import type {
  CommunityPostComment,
  CommunityPostSummary,
  PublicCommunityPostDetail,
  PublicProfile,
  PublicProfileQuery,
  PublicStats,
  PublicTrade,
  CommunityPostsQuery,
} from '@/lib/types';

export class PublicApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'PublicApiError';
    this.status = status;
  }
}

async function publicRequest<T>(
  path: string,
  query?: CommunityPostsQuery | PublicProfileQuery,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}${buildPublicQuery(query)}`, {
    credentials: 'omit',
    cache: 'no-store',
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (isJson && (payload as { message?: string | string[] })?.message) || res.statusText;
    throw new PublicApiError(
      res.status,
      Array.isArray(message) ? message.join(', ') : String(message),
    );
  }

  return payload as T;
}

function buildPublicQuery(params?: CommunityPostsQuery | PublicProfileQuery): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function fetchPublicCommunityPosts(
  communityId: string,
  query?: CommunityPostsQuery,
): Promise<CommunityPostSummary[]> {
  return publicRequest<CommunityPostSummary[]>(
    `/public/communities/${communityId}/posts`,
    query,
  );
}

export function fetchPublicTrade(token: string): Promise<PublicTrade> {
  return publicRequest<PublicTrade>(`/public/trades/${token}`);
}

export function fetchPublicStats(token: string): Promise<PublicStats> {
  return publicRequest<PublicStats>(`/public/stats/${token}`);
}

export function fetchPublicProfile(
  token: string,
  query?: PublicProfileQuery,
): Promise<PublicProfile> {
  return publicRequest<PublicProfile>(`/public/profile/${token}`, query);
}

export function fetchPublicCommunityPost(
  communityId: string,
  postId: string,
): Promise<PublicCommunityPostDetail> {
  return publicRequest<PublicCommunityPostDetail>(
    `/public/communities/${communityId}/posts/${postId}`,
  );
}

export function fetchPublicCommunityPostComments(
  communityId: string,
  postId: string,
): Promise<CommunityPostComment[]> {
  return publicRequest(`/public/communities/${communityId}/posts/${postId}/comments`);
}
