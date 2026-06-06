'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { Fragment } from 'react';

export interface StepperStep {
  id: string;
  label: string;
}

interface StepperProps {
  steps: StepperStep[];
  current: number;
  onStepClick?: (index: number) => void;
  /** Whether a step is reachable/clickable (all prior steps valid). */
  isStepComplete?: (index: number) => boolean;
  className?: string;
}

/**
 * Horizontal step indicator for multi-step wizards. Collapses to a compact
 * "Step x of n" summary with a progress bar on small screens.
 */
export function Stepper({ steps, current, onStepClick, isStepComplete, className }: StepperProps) {
  const total = steps.length;
  const progress = total > 1 ? (current / (total - 1)) * 100 : 100;

  return (
    <div className={className}>
      <div className="sm:hidden">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-muted-foreground">
            Step {current + 1} of {total}
          </span>
          <span className="text-foreground">{steps[current]?.label}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ol className="hidden items-center sm:flex">
        {steps.map((step, index) => {
          const isActive = index === current;
          const isDone = index < current;
          const reachable = index <= current || (isStepComplete?.(index) ?? false);
          const clickable = Boolean(onStepClick) && reachable && !isActive;

          return (
            <Fragment key={step.id}>
              <li className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onStepClick?.(index)}
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    isActive && 'border-primary bg-primary text-primary-foreground',
                    isDone && 'border-primary bg-primary/15 text-primary',
                    !isActive && !isDone && 'border-input bg-background text-muted-foreground',
                    clickable && 'cursor-pointer hover:border-primary/60',
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </button>
                <span
                  className={cn(
                    'truncate text-xs font-medium transition-colors',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </li>
              {index < total - 1 && (
                <span
                  className={cn(
                    'mx-2 h-px flex-1 transition-colors',
                    index < current ? 'bg-primary/40' : 'bg-border',
                  )}
                />
              )}
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}
