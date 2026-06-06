'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/format';
import { playbookRuleCount } from '@/lib/playbook-stats';
import type { Playbook } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowRight, Clock } from 'lucide-react';

interface PlaybookCardProps {
  playbook: Playbook;
  onOpen: () => void;
}

export function PlaybookCard({ playbook, onOpen }: PlaybookCardProps) {
  const ruleCount = playbookRuleCount(playbook);

  return (
    <Card
      className={cn(
        'group h-full cursor-pointer border-border bg-card',
        'transition-[border-color,box-shadow,transform] duration-150',
        'hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md',
        'focus-within:ring-2 focus-within:ring-ring/60 focus-within:ring-offset-2 focus-within:ring-offset-background',
      )}
      onClick={onOpen}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base leading-snug">{playbook.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex h-[calc(100%-3.5rem)] flex-col space-y-4">
        <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
          {playbook.description || 'No description yet.'}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {playbook.entryCriteria && (
            <Badge variant="secondary" className="font-normal">
              Entry
            </Badge>
          )}
          {playbook.exitCriteria && (
            <Badge variant="secondary" className="font-normal">
              Exit
            </Badge>
          )}
          {playbook.riskRules && (
            <Badge variant="secondary" className="font-normal">
              Risk
            </Badge>
          )}
          {ruleCount === 0 && (
            <Badge variant="outline" className="font-normal text-muted-foreground">
              Add rules
            </Badge>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            Updated {formatDate(playbook.updatedAt)}
          </p>
          <span className="flex items-center gap-0.5 text-xs font-medium text-primary opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            Open
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
