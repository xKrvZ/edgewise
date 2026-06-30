import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  icon?: ReactNode;
  centered?: boolean;
}

export function AuthCard({
  title,
  description,
  children,
  className,
  footer,
  icon,
  centered = false,
}: AuthCardProps) {
  return (
    <div className={cn('w-full max-w-[440px]', className)}>
      {icon ? <div className={cn('mb-5', centered && 'flex justify-center')}>{icon}</div> : null}

      <div className={cn('mb-6', centered && 'text-center')}>
        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{description}</p>
        ) : null}
      </div>

      {children}

      {footer ? <div className={cn('mt-8', centered && 'text-center')}>{footer}</div> : null}
    </div>
  );
}
