import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface PageBodyProps {
  children: ReactNode;
  className?: string;
}

/** Consistent vertical rhythm between major page sections. */
export function PageBody({ children, className }: PageBodyProps) {
  return <div className={cn('space-y-8', className)}>{children}</div>;
}
