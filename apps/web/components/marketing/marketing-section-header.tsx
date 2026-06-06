import { cn } from '@/lib/utils';

interface MarketingSectionHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'center' | 'left';
  className?: string;
}

export function MarketingSectionHeader({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: MarketingSectionHeaderProps) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:leading-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">{description}</p>
      )}
    </div>
  );
}
