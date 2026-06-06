'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export interface WizardStepConfig {
  /** Stable identifier for the step. */
  id: string;
  /** Short label shown in the step indicator. */
  label: string;
  /** Optional helper text shown under the step title. */
  description?: string;
}

export interface UseWizardOptions {
  /**
   * When this value changes the wizard resets to the first step. Useful for
   * dialogs that should restart whenever they re-open or switch records.
   */
  resetKey?: unknown;
  /**
   * Per-step validity. `next()` and forward navigation are blocked while the
   * current (or an intervening) step is invalid. Steps default to valid.
   */
  stepValidity?: boolean[];
}

export interface UseWizardResult {
  steps: WizardStepConfig[];
  /** Index of the active step. */
  current: number;
  currentStep: WizardStepConfig;
  isFirst: boolean;
  isLast: boolean;
  /** Completion ratio (0–100) used for progress bars. */
  progress: number;
  /** Whether the active step currently passes validation. */
  canAdvance: boolean;
  next: () => void;
  back: () => void;
  /** Jump to a step. Forward jumps are blocked unless every step in between is valid. */
  goTo: (index: number) => void;
  /** Whether a given step has been completed (all prior steps valid). */
  isStepComplete: (index: number) => boolean;
  reset: () => void;
}

export function useWizard(
  steps: WizardStepConfig[],
  options: UseWizardOptions = {},
): UseWizardResult {
  const { resetKey, stepValidity } = options;
  const [current, setCurrent] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset is intentionally keyed off resetKey only.
  useEffect(() => {
    setCurrent(0);
  }, [resetKey]);

  const validity = useMemo(
    () => steps.map((_, i) => stepValidity?.[i] ?? true),
    [steps, stepValidity],
  );

  const canAdvance = validity[current] ?? true;
  const isLast = current === steps.length - 1;
  const isFirst = current === 0;

  const next = useCallback(() => {
    setCurrent((c) => {
      if (c >= steps.length - 1) return c;
      if (!(validity[c] ?? true)) return c;
      return c + 1;
    });
  }, [steps.length, validity]);

  const back = useCallback(() => {
    setCurrent((c) => Math.max(0, c - 1));
  }, []);

  const isStepComplete = useCallback(
    (index: number) => validity.slice(0, index).every(Boolean),
    [validity],
  );

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= steps.length) return;
      setCurrent((c) => {
        if (index <= c) return index;
        const reachable = validity.slice(c, index).every(Boolean);
        return reachable ? index : c;
      });
    },
    [steps.length, validity],
  );

  const reset = useCallback(() => setCurrent(0), []);

  return {
    steps,
    current,
    currentStep: steps[current],
    isFirst,
    isLast,
    progress: steps.length > 1 ? (current / (steps.length - 1)) * 100 : 100,
    canAdvance,
    next,
    back,
    goTo,
    isStepComplete,
    reset,
  };
}
