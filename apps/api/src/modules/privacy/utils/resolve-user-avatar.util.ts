import type { StorageService } from '@/modules/storage/storage.service';

export interface UserAvatarSource {
  userImage: string | null;
  avatarStorageKey: string | null;
}

export async function resolveUserAvatarUrl(
  storage: StorageService,
  source: UserAvatarSource,
): Promise<string | null> {
  if (source.avatarStorageKey) {
    return storage.presignDownload(source.avatarStorageKey);
  }

  return source.userImage;
}

export async function resolveAvatarUrlsForUsers(
  storage: StorageService,
  sources: Map<string, UserAvatarSource>,
): Promise<Map<string, string | null>> {
  const entries = await Promise.all(
    [...sources.entries()].map(async ([userId, source]) => {
      const url = await resolveUserAvatarUrl(storage, source);
      return [userId, url] as const;
    }),
  );

  return new Map(entries);
}

export function collectAvatarSources(
  rows: Array<{
    userId: string;
    userImage: string | null;
    avatarStorageKey: string | null;
  }>,
): Map<string, UserAvatarSource> {
  const sources = new Map<string, UserAvatarSource>();

  for (const row of rows) {
    if (!sources.has(row.userId)) {
      sources.set(row.userId, {
        userImage: row.userImage,
        avatarStorageKey: row.avatarStorageKey,
      });
    }
  }

  return sources;
}
