import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface AccountSettingsSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
  hideTitle?: boolean;
}

export function AccountSettingsSection({
  title,
  children,
  className,
  hideTitle = false,
}: AccountSettingsSectionProps) {
  return (
    <section className={cn('space-y-3', className)}>
      {!hideTitle ? (
        <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">{title}</h3>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        {children}
      </div>
    </section>
  );
}
