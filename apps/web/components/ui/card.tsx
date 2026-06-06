import type * as React from 'react';

import { cn } from '@/lib/utils';

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'group/card flex flex-col gap-4 rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-[border-color,box-shadow] duration-150',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        'px-6 pt-6 pb-6 [[data-slot=card]:has(>[data-slot=card-header])>&]:pt-0',
        className,
      )}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  );
}

/** Horizontal padding for non-table sections inside cards (filters, footers). */
const cardSectionPaddingClass = 'px-4 sm:px-6';

/** Padding for empty, error, and loading sections inside CardTableContent (tables stay full-bleed). */
const cardTableStatePaddingClass = 'px-4 py-10 sm:px-6 sm:py-12';

/** Full-bleed table area — use with CardHeader (padded) + CardTableFooter (padded). */
function CardTableContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <CardContent
      data-slot="card-table-content"
      className={cn('space-y-0 p-0', className)}
      {...props}
    />
  );
}

/** Padded footer below a full-bleed table (pagination, counts). */
function CardTableFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-table-footer"
      className={cn(
        'flex flex-col gap-3 border-t border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6',
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardTableContent,
  CardTableFooter,
  cardSectionPaddingClass,
  cardTableStatePaddingClass,
};
