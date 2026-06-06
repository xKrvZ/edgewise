'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export const REPLAY_SPEEDS = [0.5, 1, 2, 3, 5, 10] as const;
export type ReplaySpeed = (typeof REPLAY_SPEEDS)[number];

export interface ReplayEngine {
  index: number;
  isPlaying: boolean;
  speed: ReplaySpeed;
  total: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  stepForward: () => void;
  stepBack: () => void;
  seek: (index: number) => void;
  setSpeed: (speed: ReplaySpeed) => void;
}

/**
 * Drives progressive candle reveal for replay/backtesting. Advances one candle
 * every `baseIntervalMs / speed`. Stops automatically at the final candle.
 */
export function useReplayEngine(total: number, baseIntervalMs = 500): ReplayEngine {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<ReplaySpeed>(1);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // Keep index in bounds when the dataset changes.
  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, total - 1)));
  }, [total]);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isPlaying || total === 0) {
      stop();
      return;
    }

    const tickEvery = baseIntervalMs / speed;
    lastTickRef.current = performance.now();

    const loop = (now: number) => {
      if (now - lastTickRef.current >= tickEvery) {
        lastTickRef.current = now;
        setIndex((i) => {
          if (i >= total - 1) {
            setIsPlaying(false);
            return i;
          }
          return i + 1;
        });
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return stop;
  }, [isPlaying, speed, total, baseIntervalMs, stop]);

  const play = useCallback(() => {
    setIndex((i) => (i >= total - 1 ? 0 : i));
    setIsPlaying(true);
  }, [total]);
  const pause = useCallback(() => setIsPlaying(false), []);
  const toggle = useCallback(() => setIsPlaying((p) => !p), []);
  const reset = useCallback(() => {
    setIsPlaying(false);
    setIndex(0);
  }, []);
  const stepForward = useCallback(() => {
    setIsPlaying(false);
    setIndex((i) => Math.min(total - 1, i + 1));
  }, [total]);
  const stepBack = useCallback(() => {
    setIsPlaying(false);
    setIndex((i) => Math.max(0, i - 1));
  }, []);
  const seek = useCallback((i: number) => setIndex(Math.max(0, Math.min(total - 1, i))), [total]);

  return {
    index,
    isPlaying,
    speed,
    total,
    play,
    pause,
    toggle,
    reset,
    stepForward,
    stepBack,
    seek,
    setSpeed,
  };
}
