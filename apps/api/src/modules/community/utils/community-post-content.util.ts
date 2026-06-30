import type { StorageService } from '@/modules/storage/storage.service';

const STORAGE_KEY_ATTR = 'data-storage-key';
const STORAGE_KEY_PATTERN = /data-storage-key="([^"]+)"/g;

/** Strip HTML tags and collapse whitespace for list-card excerpts. */
export function stripHtmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function collectPostContentStorageKeys(html: string): string[] {
  const keys = new Set<string>();
  for (const match of html.matchAll(STORAGE_KEY_PATTERN)) {
    keys.add(match[1]);
  }
  return [...keys];
}

/** Replace inline image storage keys with short-lived download URLs for display/editing. */
export async function resolvePostContentImageUrls(
  storage: StorageService,
  html: string,
): Promise<string> {
  const keys = collectPostContentStorageKeys(html);
  if (keys.length === 0) {
    return html;
  }

  const urlByKey = new Map<string, string>();
  await Promise.all(
    keys.map(async (key) => {
      urlByKey.set(key, await storage.presignDownload(key));
    }),
  );

  return html.replace(STORAGE_KEY_PATTERN, (_match, key: string) => {
    const url = urlByKey.get(key);
    if (!url) {
      return `data-storage-key="${key}"`;
    }
    return `data-storage-key="${key}" src="${url}"`;
  });
}

/** Normalize editor HTML so expiring presigned URLs are not persisted. */
export function normalizePostContentForStorage(html: string): string {
  return html.replace(
    /<img\b([^>]*?)>/gi,
    (tag, attrs: string) => {
      const keyMatch = attrs.match(/data-storage-key="([^"]+)"/i);
      if (!keyMatch) {
        return tag;
      }
      const key = keyMatch[1];
      const altMatch = attrs.match(/\balt="([^"]*)"/i);
      const alt = altMatch ? ` alt="${altMatch[1]}"` : '';
      return `<img data-storage-key="${key}"${alt}>`;
    },
  );
}

export function isLikelyHtmlContent(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

export { STORAGE_KEY_ATTR };
