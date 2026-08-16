import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variant === 'secondary' && 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        variant === 'destructive' && 'bg-red-100 text-red-800',
        variant === 'outline' && 'border border-input bg-transparent',
        variant === 'default' && 'bg-blue-100 text-blue-800',
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = 'Badge';