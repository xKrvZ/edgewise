'use client';

import { CommunityTagBadge, tagToMultiSelectOption } from '@/components/community/community-tag-manager';
import { canModerateCommunityMember } from '@/components/community/community-member-moderation.util';
import { InviteMemberDialog } from '@/components/community/invite-member-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { MultiSelect } from '@/components/shared/multi-select';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError, api } from '@/lib/api-client';
import { useSession } from '@/lib/auth-client';
import { useQuery } from '@/lib/hooks/use-query';
import type { CommunityMember, CommunityMemberRole, CommunityTag } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Eye, Loader2, Search, UserMinus, UserPlus, UserX, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const MENTOR_ROLES: CommunityMemberRole[] = ['owner', 'mentor'];

interface CommunityMemberListProps {
  communityId: string;
  myRole: CommunityMemberRole;
  tags: CommunityTag[];
  tagsLoading?: boolean;
  onMembersChanged: () => void;
}

export function CommunityMemberList({
  communityId,
  myRole,
  tags,
  tagsLoading = false,
  onMembersChanged,
}: CommunityMemberListProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const isMentorView = MENTOR_ROLES.includes(myRole);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const membersQuery = useQuery(
    () =>
      api.communities.listMembers(communityId, {
        search: debouncedSearch || undefined,
        tag: filterTagIds.length > 0 ? filterTagIds : undefined,
      }),
    [communityId, debouncedSearch, filterTagIds.join(',')],
  );

  const members = membersQuery.data ?? [];
  const tagOptions = useMemo(() => tags.map(tagToMultiSelectOption), [tags]);
  const tagFilterDisabled = tagsLoading || tags.length === 0;
  const showTagFilterHint = tags.length > 0 && !tagsLoading;

  function handleTagsSaved() {
    membersQuery.refetch();
    onMembersChanged();
  }

  function handleInvited() {
    membersQuery.refetch();
    onMembersChanged();
  }

  return (
    <>
      <Card>
        <CardHeader className="space-y-3 pb-3">
          <div className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">Member list</CardTitle>
            {isMentorView && (
              <Button type="button" size="sm" onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Invite member
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search members by name…"
              className="pl-9"
              aria-label="Search members"
            />
          </div>
          <MultiSelect
            options={tagOptions}
            selected={filterTagIds}
            onChange={setFilterTagIds}
            placeholder={tagsLoading ? 'Loading tags…' : 'Filter by tag'}
            emptyText="No tags yet. Create tags in Settings."
            disabled={tagFilterDisabled}
            className="w-full sm:w-56"
          />
        </div>
        {showTagFilterHint ? (
          <p className="text-xs text-muted-foreground">
            {filterTagIds.length > 1
              ? 'Showing members with all selected tags.'
              : 'Select one or more tags. Multiple tags require a member to have every selected tag.'}
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        {membersQuery.isLoading && members.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-52 w-full rounded-xl" />
            <Skeleton className="h-52 w-full rounded-xl" />
            <Skeleton className="h-52 w-full rounded-xl" />
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            variant="embedded"
            icon={Users}
            title={debouncedSearch || filterTagIds.length > 0 ? 'No members match' : 'No members yet'}
            message={
              debouncedSearch || filterTagIds.length > 0
                ? 'Try adjusting your search or tag filters.'
                : 'Invite members to grow your community.'
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <MemberProfileCard
                key={member.id}
                communityId={communityId}
                member={member}
                myRole={myRole}
                currentUserId={currentUserId}
                isMentorView={isMentorView}
                tagOptions={tagOptions}
                hasCommunityTags={tags.length > 0}
                onTagsSaved={handleTagsSaved}
                onMembersChanged={() => {
                  membersQuery.refetch();
                  onMembersChanged();
                }}
              />
            ))}
          </div>
        )}
      </CardContent>
      </Card>

      {isMentorView && (
        <InviteMemberDialog
          communityId={communityId}
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          onInvited={handleInvited}
        />
      )}
    </>
  );
}

interface MemberProfileCardProps {
  communityId: string;
  member: CommunityMember;
  myRole: CommunityMemberRole;
  currentUserId?: string;
  isMentorView: boolean;
  tagOptions: ReturnType<typeof tagToMultiSelectOption>[];
  hasCommunityTags: boolean;
  onTagsSaved: () => void;
  onMembersChanged: () => void;
}

function MemberProfileCard({
  communityId,
  member,
  myRole,
  currentUserId,
  isMentorView,
  tagOptions,
  hasCommunityTags,
  onTagsSaved,
  onMembersChanged,
}: MemberProfileCardProps) {
  const hasHeader = Boolean(member.headerUrl);
  const canModerate = canModerateCommunityMember(myRole, currentUserId, member);
  const [kickOpen, setKickOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);

  async function handleKick() {
    try {
      await api.communities.kickMember(communityId, member.userId);
      toast.success(`${member.displayName} was removed from the community`);
      onMembersChanged();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to kick member';
      toast.error(message);
      throw err;
    }
  }

  async function handleBan() {
    try {
      await api.communities.banMember(communityId, member.userId);
      toast.success(`${member.displayName} was banned from the community`);
      onMembersChanged();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to ban member';
      toast.error(message);
      throw err;
    }
  }

  return (
    <>
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div
        className={cn(
          'relative h-24 bg-linear-to-br from-primary/20 via-primary/10 to-muted',
          hasHeader && 'bg-muted',
        )}
        style={
          member.headerUrl
            ? {
                backgroundImage: `url(${member.headerUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {hasHeader && (
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/50 via-black/20 to-transparent"
            aria-hidden
          />
        )}
        {isMentorView && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'absolute top-2 right-2 h-8 w-8',
              hasHeader
                ? 'text-white hover:bg-white/10 hover:text-white'
                : 'text-muted-foreground hover:text-foreground',
            )}
            asChild
          >
            <Link
              href={`/community/${communityId}/members/${member.userId}`}
              aria-label={`View ${member.displayName}'s trades`}
            >
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      <div className="relative px-4 pb-4">
        <UserAvatar
          name={member.displayName}
          avatarUrl={member.avatarUrl}
          className="absolute -top-10 left-4 h-16 w-16 ring-4 ring-card"
        />

        <div className="pt-8">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold">{member.displayName}</h3>
            <Badge variant="outline" className="shrink-0 capitalize">
              {member.role}
            </Badge>
          </div>

          {hasCommunityTags ? (
            <div className="mt-3">
              {isMentorView ? (
                <MemberCardTagSelect
                  communityId={communityId}
                  member={member}
                  tagOptions={tagOptions}
                  onSaved={onTagsSaved}
                />
              ) : member.tags && member.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {member.tags.map((tag) => (
                    <CommunityTagBadge key={tag.id} tag={tag} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No tags assigned</p>
              )}
            </div>
          ) : null}
        </div>

        {canModerate ? (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setKickOpen(true)}
            >
              <UserMinus className="h-3.5 w-3.5" />
              Kick
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-8"
              onClick={() => setBanOpen(true)}
            >
              <UserX className="h-3.5 w-3.5" />
              Ban
            </Button>
          </div>
        ) : null}
      </div>
    </div>

      <ConfirmDialog
        open={kickOpen}
        onOpenChange={setKickOpen}
        title={`Kick ${member.displayName}?`}
        description="They will be removed from the community but can rejoin later unless you ban them."
        confirmLabel="Kick member"
        onConfirm={handleKick}
      />
      <ConfirmDialog
        open={banOpen}
        onOpenChange={setBanOpen}
        title={`Ban ${member.displayName}?`}
        description="They will be removed and blocked from rejoining until you unban them in Settings."
        confirmLabel="Ban member"
        onConfirm={handleBan}
      />
    </>
  );
}

interface MemberCardTagSelectProps {
  communityId: string;
  member: CommunityMember;
  tagOptions: ReturnType<typeof tagToMultiSelectOption>[];
  onSaved: () => void;
}

function MemberCardTagSelect({
  communityId,
  member,
  tagOptions,
  onSaved,
}: MemberCardTagSelectProps) {
  const memberTagIds = member.tags?.map((t) => t.id) ?? [];
  const [tagIds, setTagIds] = useState(memberTagIds);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTagIds(memberTagIds);
  }, [memberTagIds.join(',')]);

  async function handleChange(nextTagIds: string[]) {
    setTagIds(nextTagIds);
    setSaving(true);
    try {
      await api.communities.setMemberTags(communityId, member.userId, { tagIds: nextTagIds });
      onSaved();
    } catch (err) {
      setTagIds(memberTagIds);
      const message = err instanceof ApiError ? err.message : 'Failed to update tags';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      <MultiSelect
        options={tagOptions}
        selected={tagIds}
        onChange={handleChange}
        placeholder="Assign tags"
        emptyText="Create tags in Settings."
        className="min-h-8 w-full"
      />
      {saving && (
        <Loader2 className="pointer-events-none absolute top-1/2 right-10 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
