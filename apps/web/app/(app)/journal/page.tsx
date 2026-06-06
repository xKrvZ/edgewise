'use client';

import { DateRangeSelector } from '@/components/app/date-range-selector';
import { PageFilterBar } from '@/components/app/page-filter-bar';
import { PageHeader } from '@/components/app/page-header';
import { JournalEntryCard } from '@/components/journal/journal-entry-card';
import { JournalFeaturedCard } from '@/components/journal/journal-featured-card';
import { JournalFormDialog } from '@/components/journal/journal-form-dialog';
import { JournalGettingStartedCallout } from '@/components/journal/journal-getting-started-callout';
import { JournalMetricsBar } from '@/components/journal/journal-metrics-bar';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ListPageSkeleton } from '@/components/shared/list-page-skeleton';
import { ListSection } from '@/components/shared/list-section';
import { PageBody } from '@/components/shared/page-body';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { useQuery } from '@/lib/hooks/use-query';
import { summarizeJournalEntries } from '@/lib/journal-stats';
import type { JournalEntry } from '@/lib/types';
import { useDateRangeStore } from '@/stores/date-range-store';
import { NotebookPen, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function JournalPage() {
  const from = useDateRangeStore((s) => s.from);
  const to = useDateRangeStore((s) => s.to);

  const filterKey = `${from ?? ''}:${to ?? ''}`;
  const { data, isLoading, error, refetch } = useQuery(
    () =>
      api.journal.list({
        dateFrom: from ?? undefined,
        dateTo: to ?? undefined,
      }),
    [filterKey],
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | undefined>(undefined);
  const [deleting, setDeleting] = useState<JournalEntry | undefined>(undefined);

  const entries = useMemo(() => {
    const list = data?.items ?? [];
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data]);

  const summary = useMemo(() => summarizeJournalEntries(entries), [entries]);
  const featuredEntry = entries[0] ?? null;
  const otherEntries = entries.slice(1);

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await api.journal.remove(deleting.id);
      toast.success('Entry deleted');
      refetch();
    } catch {
      toast.error('Failed to delete entry');
    }
  }

  return (
    <PageBody>
      <PageHeader
        title="Notebook"
        description="Your trading journal — reflect on psychology, process, and lessons day by day."
        eyebrow="Reflection"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New entry
          </Button>
        }
      />

      <PageFilterBar>
        <DateRangeSelector />
      </PageFilterBar>

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <ListPageSkeleton rows={3} featured />
      ) : entries.length === 0 ? (
        <>
          <JournalGettingStartedCallout onCreate={openCreate} />
          <EmptyState
            icon={NotebookPen}
            title="Your journal is empty"
            message="Write your first entry to start tracking your mindset and lessons over time."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                New entry
              </Button>
            }
          />
        </>
      ) : (
        <>
          <JournalMetricsBar summary={summary} />

          {featuredEntry && (
            <JournalFeaturedCard
              entry={featuredEntry}
              onEdit={() => {
                setEditing(featuredEntry);
                setFormOpen(true);
              }}
              onDelete={() => setDeleting(featuredEntry)}
            />
          )}

          {otherEntries.length > 0 && (
            <ListSection
              title="Earlier entries"
              countLabel={`${otherEntries.length} more`}
            >
              <div className="space-y-3">
                {otherEntries.map((entry) => (
                  <JournalEntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={() => {
                      setEditing(entry);
                      setFormOpen(true);
                    }}
                    onDelete={() => setDeleting(entry)}
                  />
                ))}
              </div>
            </ListSection>
          )}
        </>
      )}

      <JournalFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        entry={editing}
        onSaved={() => refetch()}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title="Delete this entry?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </PageBody>
  );
}
