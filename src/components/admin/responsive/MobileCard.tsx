import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Presentational primitives for the "table on desktop, stacked cards on mobile"
 * pattern used across the admin surface. Wrap the desktop <Table> in
 * `hidden md:block` and render a list of <MobileCard> inside `md:hidden`.
 */
export const MobileCard = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'rounded-lg border border-border bg-card p-4 space-y-3',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

interface MobileFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

/** A single labeled key/value row inside a MobileCard. */
export const MobileField = ({ label, children, className }: MobileFieldProps) => (
  <div className={cn('flex items-start justify-between gap-3 text-sm', className)}>
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className="text-right font-medium min-w-0 break-words">{children}</span>
  </div>
);

/** Full-width action row at the bottom of a MobileCard. */
export const MobileActions = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-wrap items-center gap-2 pt-1', className)}
    {...props}
  >
    {children}
  </div>
);