import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'blockquote',
  'div',
  'iframe',
];

const ALLOWED_ATTR = [
  'href',
  'target',
  'rel',
  'src',
  'alt',
  'title',
  'class',
  'data-storage-key',
  'data-youtube-video',
  'data-vimeo-video',
  'frameborder',
  'allowfullscreen',
  'allow',
  'width',
  'height',
];

const ALLOWED_IFRAME_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
]);

function isAllowedIframeSrc(src: string | null): boolean {
  if (!src) {
    return false;
  }
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && ALLOWED_IFRAME_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function isLikelyHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

/** Strip HTML tags and collapse whitespace for plain-text comparisons and excerpts. */
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

/** Sanitize rich post HTML before rendering in the browser. */
export function sanitizePostHtml(html: string): string {
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName === 'iframe' && node instanceof Element) {
      if (!isAllowedIframeSrc(node.getAttribute('src'))) {
        node.remove();
      }
    }
  });

  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });

  DOMPurify.removeHook('uponSanitizeElement');
  return sanitized;
}

const YOUTUBE_PATTERN =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})(?:\S*)?$/i;
const VIMEO_PATTERN = /^(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)(?:\S*)?$/i;

export type VideoEmbedKind = 'youtube' | 'vimeo';

export interface ParsedVideoEmbed {
  kind: VideoEmbedKind;
  videoId: string;
}

export function parseVideoEmbedUrl(input: string): ParsedVideoEmbed | null {
  const trimmed = input.trim();
  const youtube = trimmed.match(YOUTUBE_PATTERN);
  if (youtube) {
    return { kind: 'youtube', videoId: youtube[1] };
  }
  const vimeo = trimmed.match(VIMEO_PATTERN);
  if (vimeo) {
    return { kind: 'vimeo', videoId: vimeo[1] };
  }
  return null;
}

export function buildVimeoEmbedSrc(videoId: string): string {
  return `https://player.vimeo.com/video/${videoId}`;
}
