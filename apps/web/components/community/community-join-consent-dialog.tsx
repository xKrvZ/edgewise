'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  LineChart,
  Loader2,
  ShieldCheck,
  Trophy,
  UserCircle,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface CommunityJoinConsentInfo {
  communityId: string;
  communityName: string;
  logoUrl?: string | null;
}

interface CommunityJoinPermission {
  icon: LucideIcon;
  label: string;
}

const COMMUNITY_JOIN_PERMISSIONS: CommunityJoinPermission[] = [
  {
    icon: LineChart,
    label: 'View your trades and trading performance within this community',
  },
  {
    icon: BarChart3,
    label: 'Use your stats for mentor analytics',
  },
  {
    icon: UserCircle,
    label: 'See your profile name, avatar, and community tags assigned to you',
  },
  {
    icon: Users,
    label: 'List you on the member roster visible to other community members',
  },
];

function communityInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

interface CommunityJoinConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  community: CommunityJoinConsentInfo | null;
  confirmLabel?: string;
  confirming?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function CommunityJoinConsentDialog({
  open,
  onOpenChange,
  community,
  confirmLabel = 'Accept and join',
  confirming = false,
  onConfirm,
}: CommunityJoinConsentDialogProps) {
  const name = community?.communityName ?? 'this community';
  const initials = communityInitials(name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md" showCloseButton={!confirming}>
        <div className="border-b bg-muted/30 px-6 py-8 text-center">
          <Avatar className="mx-auto mb-4 h-20 w-20 ring-4 ring-background shadow-md">
            <AvatarImage src={community?.logoUrl ?? undefined} alt={name} />
            <AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">
              {initials || <Users className="h-7 w-7" />}
            </AvatarFallback>
          </Avatar>
          <DialogHeader className="items-center space-y-2 text-center sm:text-center">
            <DialogTitle className="text-xl">Join {name}?</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-center sm:text-center">
              By joining, you allow community <span className="font-medium text-foreground">mentors</span>{' '}
              and <span className="font-medium text-foreground">owners</span> to access the following
              information about you.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-3 px-6 py-5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Permissions
          </p>
          <ul className="space-y-2">
            {COMMUNITY_JOIN_PERMISSIONS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-start gap-3 rounded-lg border bg-muted/20 px-3 py-2.5"
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                    'bg-primary/10 text-primary',
                  )}
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm leading-snug text-foreground/90">{label}</span>
              </li>
            ))}
          </ul>
          <p className="flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            You can leave this community at any time. Browsing without joining is not affected.
          </p>
        </div>

        <DialogFooter className="grid w-full grid-cols-2 gap-2 border-t bg-muted/20 px-6 py-4">
          <Button
            type="button"
            variant="destructive"
            disabled={confirming}
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Decline
          </Button>
          <Button
            type="button"
            variant="success"
            disabled={confirming || !community}
            onClick={() => void onConfirm()}
            className="w-full"
          >
            {confirming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trophy className="h-4 w-4" />
            )}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
