'use client';

import { Button } from '@/components/ui/button';
import { REPLAY_SPEEDS, type ReplayEngine, type ReplaySpeed } from '@/lib/hooks/use-replay-engine';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';

interface ReplayControlsProps {
  engine: ReplayEngine;
  /** Optional label for the current position (e.g. candle timestamp). */
  positionLabel?: string;
  className?: string;
  variant?: 'default' | 'dock';
}

export function ReplayControls({
  engine,
  positionLabel,
  className,
  variant = 'default',
}: ReplayControlsProps) {
  const {
    index,
    total,
    isPlaying,
    speed,
    play,
    pause,
    reset,
    stepBack,
    stepForward,
    seek,
    setSpeed,
  } = engine;

  const max = Math.max(0, total - 1);
  const isDock = variant === 'dock';

  return (
    <div
      className={cn(
        isDock
          ? 'shrink-0 border-t border-border bg-card/90 px-3 py-2.5 backdrop-blur-sm sm:px-4'
          : 'space-y-3',
        className,
      )}
    >
      <input
        type="range"
        min={0}
        max={max}
        value={index}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label="Replay timeline"
        className={cn(
          'w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary',
          isDock ? 'h-1' : 'h-1.5',
        )}
      />
      <div
        className={cn(
          'flex flex-wrap items-center gap-2',
          isDock ? 'justify-between pt-2' : 'justify-between',
        )}
      >
        <div className="flex items-center gap-0.5 sm:gap-1">
          <Button
            variant="outline"
            size={isDock ? 'icon-sm' : 'icon-sm'}
            onClick={reset}
            title="Reset"
            aria-label="Reset replay"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={stepBack}
            title="Step back"
            aria-label="Step back one candle"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size={isDock ? 'icon' : 'icon'}
            onClick={isPlaying ? pause : play}
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={stepForward}
            title="Step forward"
            aria-label="Step forward one candle"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums sm:gap-3">
          <span className="hidden sm:inline">
            {total === 0 ? '0 / 0' : `${index + 1} / ${total}`}
            {positionLabel ? ` · ${positionLabel}` : ''}
          </span>
          <span className="sm:hidden">{total === 0 ? '0/0' : `${index + 1}/${total}`}</span>
          <fieldset className="m-0 flex min-w-0 items-center gap-0.5 rounded-md border border-border bg-background/60 p-0.5">
            <legend className="sr-only">Playback speed</legend>
            {REPLAY_SPEEDS.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSpeed(s as ReplaySpeed)}
                aria-label={`${s}x speed`}
                aria-pressed={speed === s}
                className={cn(
                  'rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors sm:text-xs',
                  speed === s
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {s}×
              </button>
            ))}
          </fieldset>
        </div>
      </div>
    </div>
  );
}
