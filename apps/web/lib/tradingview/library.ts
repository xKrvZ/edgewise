const LIBRARY_SCRIPT = '/charting_library/charting_library.standalone.js';

let libraryPromise: Promise<boolean> | null = null;

/** Returns true when the licensed Charting Library bundle is hosted under `/public/charting_library/`. */
export async function isChartingLibraryAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (window.TradingView?.widget) return true;

  libraryPromise ??= fetch(LIBRARY_SCRIPT, { method: 'HEAD' })
    .then((res) => {
      if (!res.ok) return false;
      return loadChartingLibraryScript();
    })
    .catch(() => false);

  return libraryPromise;
}

function loadChartingLibraryScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.TradingView?.widget) {
      resolve(true);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-tv-library="true"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.TradingView?.widget)));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = LIBRARY_SCRIPT;
    script.async = true;
    script.dataset.tvLibrary = 'true';
    script.onload = () => resolve(Boolean(window.TradingView?.widget));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}
