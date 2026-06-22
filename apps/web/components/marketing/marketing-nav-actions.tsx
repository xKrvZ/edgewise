'use client';

import { UserMenu } from '@/components/app/user-menu';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { signOut, useSession } from '@/lib/auth-client';
import { useUserDisplayLabel } from '@/lib/hooks/use-user-display-label';
import { useUserAvatarUrl } from '@/lib/hooks/use-user-avatar-url';
import {
  ArrowRight,
  BookOpen,
  CreditCard,
  LayoutGrid,
  LogOut,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MarketingNavActionsProps {
  placement: 'desktop' | 'mobile';
  /** Mobile sheet only: identity row at top vs account links at bottom. */
  mobileSection?: 'header' | 'footer';
  onNavigate?: () => void;
}

function MarketingNavSkeleton({ placement, mobileSection }: MarketingNavActionsProps) {
  if (placement === 'desktop') {
    return (
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  if (mobileSection === 'header') {
    return (
      <div className="mt-6 flex items-center gap-3 border-b border-slate-200 pb-6">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-8">
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}

function MarketingLoggedOutActions({
  placement,
  onNavigate,
}: {
  placement: 'desktop' | 'mobile';
  onNavigate?: () => void;
}) {
  const linkClass =
    placement === 'desktop'
      ? 'rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950'
      : 'rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50';

  const ctaClass =
    placement === 'desktop'
      ? 'inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30'
      : 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25';

  const signInLink = (
    <Link href="/sign-in" className={linkClass} onClick={onNavigate}>
      Sign in
    </Link>
  );

  const ctaLink = (
    <Link href="/sign-in" className={ctaClass} onClick={onNavigate}>
      Get started
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );

  if (placement === 'desktop') {
    return (
      <div className="flex items-center gap-3 text-sm font-semibold sm:gap-4">
        {signInLink}
        {ctaLink}
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-8">
      {signInLink}
      {ctaLink}
    </div>
  );
}

function MarketingMobileUserHeader() {
  const { data: session } = useSession();
  const avatarUrl = useUserAvatarUrl();
  const user = session?.user;

  if (!user) {
    return null;
  }

  const { label: displayName, fields: displayFields } = useUserDisplayLabel();

  return (
    <div className="mt-6 flex items-center gap-3 border-b border-slate-200 pb-6">
      <UserAvatar
        displayName={displayFields.displayName}
        name={user.name}
        email={user.email}
        image={avatarUrl}
        className="h-10 w-10 border border-slate-200"
        fallbackClassName="bg-primary/10 text-sm text-primary"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
        <p className="truncate text-xs text-slate-500">{user.email}</p>
      </div>
    </div>
  );
}

function MarketingMobileAccountLinks({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();

  return (
    <div className="mt-8 flex flex-col gap-1 border-t border-slate-200 pt-8">
      <Link
        href="/account"
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-100"
        onClick={onNavigate}
      >
        <LayoutGrid className="h-4 w-4 text-slate-500" />
        Account
      </Link>
      <Link
        href="/account#profile"
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-100"
        onClick={onNavigate}
      >
        <User className="h-4 w-4 text-slate-500" />
        Profile
      </Link>
      <Link
        href="/account#billing"
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-100"
        onClick={onNavigate}
      >
        <CreditCard className="h-4 w-4 text-slate-500" />
        Billing
      </Link>
      <Link
        href="/dashboard"
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-100"
        onClick={onNavigate}
      >
        <BookOpen className="h-4 w-4 text-slate-500" />
        My Journal
      </Link>
      <button
        type="button"
        className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
        onClick={async () => {
          onNavigate?.();
          await signOut();
          router.push('/sign-in');
        }}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );
}

export function MarketingNavActions({
  placement,
  mobileSection = 'footer',
  onNavigate,
}: MarketingNavActionsProps) {
  const { data: session, isPending } = useSession();
  const isAuthenticated = Boolean(session?.user);

  if (isPending) {
    return <MarketingNavSkeleton placement={placement} mobileSection={mobileSection} />;
  }

  if (placement === 'desktop') {
    if (!isAuthenticated) {
      return <MarketingLoggedOutActions placement="desktop" />;
    }
    return <UserMenu variant="marketing" />;
  }

  if (mobileSection === 'header') {
    return isAuthenticated ? <MarketingMobileUserHeader /> : null;
  }

  if (!isAuthenticated) {
    return <MarketingLoggedOutActions placement="mobile" onNavigate={onNavigate} />;
  }

  return <MarketingMobileAccountLinks onNavigate={onNavigate} />;
}
