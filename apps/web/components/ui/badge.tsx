import { type VariantProps, cva } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border px-2 py-0.5 text-xs font-medium tracking-tight whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring/60 aria-invalid:border-destructive aria-invalid:ring-destructive/30 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80',
        destructive:
          'border-destructive/25 bg-destructive/12 text-destructive [a&]:hover:bg-destructive/20',
        success: 'border-success/25 bg-success/12 text-success [a&]:hover:bg-success/20',
        warning: 'border-warning/25 bg-warning/12 text-warning [a&]:hover:bg-warning/20',
        outline:
          'border-border bg-transparent text-muted-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        ghost: 'border-transparent [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        link: 'border-transparent text-primary underline-offset-4 [a&]:hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
