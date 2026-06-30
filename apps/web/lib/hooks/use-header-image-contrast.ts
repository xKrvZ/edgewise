'use client';

import { useEffect, useState } from 'react';

/** WCAG relative luminance threshold: below → use light (white) text. */
export const HEADER_LUMINANCE_THRESHOLD = 0.5;

export type HeaderTextTheme = 'light' | 'dark';

export interface HeaderImageContrast {
  textTheme: HeaderTextTheme;
  /** True when canvas sampling succeeded. */
  analyzed: boolean;
  isLoading: boolean;
}

const SAMPLE_MAX_WIDTH = 120;

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.x relative luminance for an sRGB pixel. */
function relativeLuminance(r: number, g: number, b: number): number {
  const rs = srgbToLinear(r);
  const gs = srgbToLinear(g);
  const bs = srgbToLinear(b);
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const isBlob = url.startsWith('blob:');

    if (!isBlob) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load header image'));
    img.src = url;
  });
}

/**
 * Samples the left-center band of the header image (where title/description sit)
 * and returns whether light or dark foreground text reads better.
 */
export async function analyzeHeaderImageContrast(
  imageUrl: string,
  signal?: AbortSignal,
): Promise<HeaderTextTheme> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const img = await loadImage(imageUrl);
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const scale = Math.min(1, SAMPLE_MAX_WIDTH / img.naturalWidth);
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas not supported');
  }

  ctx.drawImage(img, 0, 0, width, height);

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, width, height);
  } catch {
    throw new Error('Canvas tainted by cross-origin image');
  }

  const { data } = imageData;
  const xEnd = Math.floor(width * 0.75);
  const yStart = Math.floor(height * 0.15);
  const yEnd = Math.floor(height * 0.85);

  let luminanceSum = 0;
  let count = 0;

  for (let y = yStart; y < yEnd; y++) {
    for (let x = 0; x < xEnd; x++) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3] / 255;
      if (alpha < 0.05) continue;

      luminanceSum += relativeLuminance(data[i], data[i + 1], data[i + 2]);
      count++;
    }
  }

  if (count === 0) {
    return 'light';
  }

  const averageLuminance = luminanceSum / count;
  return averageLuminance < HEADER_LUMINANCE_THRESHOLD ? 'light' : 'dark';
}

export function useHeaderImageContrast(imageUrl: string | null): HeaderImageContrast {
  const [textTheme, setTextTheme] = useState<HeaderTextTheme>('light');
  const [analyzed, setAnalyzed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setTextTheme('light');
      setAnalyzed(false);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    setIsLoading(true);
    setAnalyzed(false);

    analyzeHeaderImageContrast(imageUrl, controller.signal)
      .then((theme) => {
        if (!active) return;
        setTextTheme(theme);
        setAnalyzed(true);
      })
      .catch((error: unknown) => {
        if (!active || (error instanceof DOMException && error.name === 'AbortError')) {
          return;
        }
        setTextTheme('light');
        setAnalyzed(false);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [imageUrl]);

  return { textTheme, analyzed, isLoading };
}
