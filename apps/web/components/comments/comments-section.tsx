'use client';

import { CommentThread } from '@/components/comments/comment-thread';
import { ErrorState } from '@/components/shared/error-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import type { CommentTargetType } from '@/lib/types';
import { MessageSquare } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface CommentsSectionProps {
  targetType: CommentTargetType;
  targetId: string;
  focus?: boolean;
}

export function CommentsSection({ targetType, targetId, focus }: CommentsSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  const accessQuery = useQuery(
    () => api.comments.getAccess({ targetType, targetId }),
    [targetType, targetId],
  );

  const commentsQuery = useQuery(
    () => api.comments.list({ targetType, targetId }),
    [targetType, targetId],
    { enabled: accessQuery.data?.canView ?? false },
  );

  useEffect(() => {
    if (focus && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focus]);

  if (accessQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (accessQuery.error) {
    return (
      <Card ref={sectionRef} id="comments">
        <CardHeader className="flex-row items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Community comments</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState
            title="Could not load comments"
            message={accessQuery.error.message}
            onRetry={accessQuery.refetch}
          />
        </CardContent>
      </Card>
    );
  }

  if (!accessQuery.data?.canView) {
    return null;
  }

  return (
    <Card ref={sectionRef} id="comments">
      <CardHeader className="flex-row items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <CardTitle className="text-base">Community comments</CardTitle>
      </CardHeader>
      <CardContent>
        {commentsQuery.error ? (
          <ErrorState
            title="Could not load comments"
            message={commentsQuery.error.message}
            onRetry={commentsQuery.refetch}
          />
        ) : commentsQuery.isLoading || !commentsQuery.data ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <CommentThread
            targetType={targetType}
            targetId={targetId}
            comments={commentsQuery.data}
            access={accessQuery.data}
            onChanged={() => {
              commentsQuery.refetch();
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
