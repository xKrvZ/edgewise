'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CommunitySummary } from '@/lib/types';
import { Users } from 'lucide-react';

interface CommunityCardProps {
  community: CommunitySummary;
  onOpen: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  mentor: 'Mentor',
  member: 'Member',
};

export function CommunityCard({ community, onOpen }: CommunityCardProps) {
  return (
    <Card
      className="cursor-pointer transition-[border-color,box-shadow,background-color] duration-150 hover:border-primary/25 hover:bg-muted/30 hover:shadow-sm"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold">{community.name}</CardTitle>
          <Badge variant="secondary">{ROLE_LABELS[community.myRole] ?? community.myRole}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {community.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{community.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No description</p>
        )}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>
            {community.memberCount} member{community.memberCount === 1 ? '' : 's'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
