'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import { playbookRuleCount } from '@/lib/playbook-stats';
import type { Playbook } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowRight, BookOpenCheck } from 'lucide-react';

interface PlaybookFeaturedCardProps {
  playbook: Playbook;
  onOpen: () => void;
}

export function PlaybookFeaturedCard({ playbook, onOpen }: PlaybookFeaturedCardProps) {
  const ruleCount = playbookRuleCount(playbook);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        'group mb-6 w-full cursor-pointer rounded-lg border border-border bg-card text-left',
        'transition-[border-color,box-shadow,transform] duration-150',
        'hover:-translate-y-px hover:border-primary/45 hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-primary">
              Continue editing
            </span>
            <Badge variant="secondary" className="font-normal">
              <BookOpenCheck className="mr-1 h-3 w-3" />
              {ruleCount} {ruleCount === 1 ? 'rule' : 'rules'}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="truncate text-lg font-semibold tracking-tight text-foreground">
              {playbook.name}
            </p>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {playbook.description || 'No description yet — add context for this setup.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {playbook.entryCriteria && (
              <Badge variant="outline" className="font-normal">
                Entry
              </Badge>
            )}
            {playbook.exitCriteria && (
              <Badge variant="outline" className="font-normal">
                Exit
              </Badge>
            )}
            {playbook.riskRules && (
              <Badge variant="outline" className="font-normal">
                Risk
              </Badge>
            )}
            {ruleCount === 0 && (
              <Badge variant="outline" className="font-normal text-muted-foreground">
                Add rules
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Updated {formatDate(playbook.updatedAt)}
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-end">
          <span className="flex items-center gap-1 text-sm font-medium text-primary opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
            Open
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </div>
  );
}
