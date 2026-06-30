import { cn } from '@/lib/utils';
import { Lightbulb } from 'lucide-react';

interface AccountHubTipBannerProps {
  title: string;
  description: string;
  className?: string;
}

export function AccountHubTipBanner({
  title,
  description,
  className,
}: AccountHubTipBannerProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5',
        className,
      )}
      role="note"
    >
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-violet-100 p-2.5"
        aria-hidden="true"
      >
        <Lightbulb className="h-4 w-4 text-violet-600" />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}
