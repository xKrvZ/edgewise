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
  EyeOff,
  LineChart,
  Loader2,
  LogOut,
  UserCircle,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface CommunityLeaveConsentInfo {
  communityId: string;
  communityName: string;
  logoUrl?: string | null;
}

interface CommunityLeaveConsequence {
  icon: LucideIcon;
  label: string;
}

const COMMUNITY_LEAVE_CONSEQUENCES: CommunityLeaveConsequence[] = [
  {
    icon: LineChart,
    label: 'Community mentors and owners will no longer be able to view your trades or performance',
  },
  {
    icon: BarChart3,
    label: 'Your stats will no longer be included in mentor analytics',
  },
  {
    icon: UserCircle,
    label: 'Your profile, avatar, and community tags will no longer appear on the member roster',
  },
  {
    icon: EyeOff,
    label: 'You will lose access to member-only posts and the member list',
  },
];

function communityInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

interface CommunityLeaveConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  community: CommunityLeaveConsentInfo | null;
  confirming?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function CommunityLeaveConsentDialog({
  open,
  onOpenChange,
  community,
  confirming = false,
  onConfirm,
}: CommunityLeaveConsentDialogProps) {
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
            <DialogTitle className="text-xl">Leave {name}?</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-center sm:text-center">
              Leaving will revoke the access you granted when you joined. Community mentors and
              owners will no longer be able to view your trading activity in this community.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-3 px-6 py-5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            What changes
          </p>
          <ul className="space-y-2">
            {COMMUNITY_LEAVE_CONSEQUENCES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-start gap-3 rounded-lg border bg-muted/20 px-3 py-2.5"
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                    'bg-destructive/10 text-destructive',
                  )}
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm leading-snug text-foreground/90">{label}</span>
              </li>
            ))}
          </ul>
          <p className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            You can rejoin later if the community is public or you receive a new invitation.
          </p>
        </div>

        <DialogFooter className="grid w-full grid-cols-2 gap-2 border-t bg-muted/20 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            disabled={confirming}
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={confirming || !community}
            onClick={() => void onConfirm()}
            className="w-full"
          >
            {confirming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Leave community
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
