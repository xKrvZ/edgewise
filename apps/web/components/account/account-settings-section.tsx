import { marketingCardClass } from '@/components/marketing/marketing-section';
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
        <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">{title}</h3>
      ) : null}
      <div className={cn(marketingCardClass, 'overflow-hidden border shadow-sm')}>{children}</div>
    </section>
  );
}
