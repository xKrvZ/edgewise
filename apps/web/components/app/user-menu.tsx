'use client';

import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggleMenu } from '@/components/app/theme-toggle-menu';
import { signOut, useSession } from '@/lib/auth-client';
import { useUserDisplayLabel } from '@/lib/hooks/use-user-display-label';
import { useUserAvatarUrl } from '@/lib/hooks/use-user-avatar-url';
import { isAdministrator } from '@/lib/roles';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  ChevronsUpDown,
  CreditCard,
  LayoutGrid,
  LogOut,
  Shield,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserMenuProps {
  /** Compact avatar trigger for headers; sidebar shows name and opens upward; marketing shows name on light nav. */
  variant?: 'compact' | 'sidebar' | 'marketing';
  /** Icon-only avatar when the desktop sidebar is collapsed. */
  collapsed?: boolean;
  className?: string;
}

export function UserMenu({ variant = 'compact', collapsed = false, className }: UserMenuProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const avatarUrl = useUserAvatarUrl();
  const { label: displayName, fields: displayFields } = useUserDisplayLabel();

  if (isPending) {
    return (
      <Skeleton
        className={cn(
          variant === 'sidebar'
            ? collapsed
              ? 'h-10 w-10 rounded-md'
              : 'h-12 w-full rounded-md'
            : variant === 'marketing'
              ? 'h-8 w-28 rounded-xl'
              : 'h-9 w-9 rounded-full',
          className,
        )}
      />
    );
  }

  const user = session?.user;

  if (!user) {
    return (
      <Button
        size={variant === 'sidebar' ? 'default' : 'sm'}
        className={cn(variant === 'sidebar' && 'h-10 w-full', className)}
        onClick={() => router.push('/sign-in')}
      >
        Sign in
      </Button>
    );
  }

  const showAdminLink = isAdministrator(
    (user as { role?: string | string[] | null }).role,
  );

  const sidebarTrigger = collapsed ? (
    <button
      type="button"
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-md text-sidebar-foreground outline-none transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
        className,
      )}
      aria-label={`User menu: ${displayName}`}
    >
      <UserAvatar
        displayName={displayFields.displayName}
        name={user.name}
        email={user.email}
        image={avatarUrl}
        className="h-8 w-8 shrink-0 border border-sidebar-border"
        fallbackClassName="bg-sidebar-accent text-xs text-sidebar-accent-foreground"
      />
    </button>
  ) : (
    <button
      type="button"
      className={cn(
        'flex h-12 w-full items-center gap-2.5 rounded-md px-2 text-left text-sidebar-foreground outline-none transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
        className,
      )}
    >
      <UserAvatar
        displayName={displayFields.displayName}
        name={user.name}
        email={user.email}
        image={avatarUrl}
        className="h-8 w-8 shrink-0 border border-sidebar-border"
        fallbackClassName="bg-sidebar-accent text-xs text-sidebar-accent-foreground"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-sidebar-foreground">
          {displayName}
        </span>
        <span className="block truncate text-xs text-sidebar-muted-foreground">{user.email}</span>
      </span>
      <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-muted-foreground" />
    </button>
  );

  const menuTrigger =
    variant === 'sidebar' ? (
      collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>{sidebarTrigger}</DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {displayName}
          </TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger asChild>{sidebarTrigger}</DropdownMenuTrigger>
      )
    ) : variant === 'marketing' ? (
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm font-semibold text-slate-800 outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary/30',
            className,
          )}
          aria-label={`User menu: ${displayName}`}
        >
          <UserAvatar
            displayName={displayFields.displayName}
            name={user.name}
            email={user.email}
            image={avatarUrl}
            className="h-8 w-8 shrink-0 border border-slate-200"
            fallbackClassName="bg-primary/10 text-xs text-primary"
          />
          <span className="max-w-[9rem] truncate sm:max-w-[11rem]">{displayName}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
    ) : (
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className,
          )}
        >
          <UserAvatar
            displayName={displayFields.displayName}
            name={user.name}
            email={user.email}
            image={avatarUrl}
            className="h-9 w-9 border border-border"
            fallbackClassName="bg-primary/15 text-xs text-primary"
          />
        </button>
      </DropdownMenuTrigger>
    );

  return (
    <DropdownMenu>
      {menuTrigger}
      <DropdownMenuContent
        align={variant === 'sidebar' ? 'start' : 'end'}
        side={variant === 'sidebar' ? 'top' : 'bottom'}
        className={cn(variant === 'sidebar' ? 'w-(--radix-dropdown-menu-trigger-width)' : 'w-56')}
      >
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-sm font-medium">{displayName}</span>
          <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <LayoutGrid className="h-4 w-4" />
            {variant === 'marketing' ? 'Account' : 'Account settings'}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account#profile">
            <User className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account#billing">
            <CreditCard className="h-4 w-4" />
            Billing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <BookOpen className="h-4 w-4" />
            My Journal
          </Link>
        </DropdownMenuItem>
        {showAdminLink ? (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          </DropdownMenuItem>
        ) : null}
        {variant === 'marketing' ? null : <ThemeToggleMenu />}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={async () => {
            await signOut();
            router.push('/sign-in');
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
