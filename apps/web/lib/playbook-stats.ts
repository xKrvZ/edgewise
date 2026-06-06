import type { Playbook } from '@/lib/types';

export interface PlaybookListSummary {
  total: number;
  withRules: number;
  totalRules: number;
  mostRecent: Playbook | null;
}

function hasRules(playbook: Playbook): boolean {
  return Boolean(
    playbook.entryCriteria || playbook.exitCriteria || playbook.riskRules,
  );
}

export function summarizePlaybooks(playbooks: Playbook[]): PlaybookListSummary {
  const mostRecent =
    playbooks.length > 0
      ? [...playbooks].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )[0]
      : null;

  return {
    total: playbooks.length,
    withRules: playbooks.filter(hasRules).length,
    totalRules: playbooks.reduce((sum, p) => sum + playbookRuleCount(p), 0),
    mostRecent,
  };
}

export function playbookRuleCount(playbook: Playbook): number {
  let count = 0;
  if (playbook.entryCriteria) count += 1;
  if (playbook.exitCriteria) count += 1;
  if (playbook.riskRules) count += 1;
  if (playbook.invalidationRules) count += 1;
  if (playbook.marketConditions) count += 1;
  return count;
}
