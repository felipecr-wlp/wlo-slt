import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'default' | 'ghost' | 'outline' | 'destructive';

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }>(({ className, variant = 'default', ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50',
      variant === 'ghost' && 'hover:bg-gray-100 dark:hover:bg-gray-800',
      variant === 'outline' && 'border border-input bg-transparent hover:bg-gray-100',
      variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-700',
      variant === 'default' && 'bg-blue-600 text-white hover:bg-blue-700',
      className
    )}
    {...props}
  />
));
Button.displayName = 'Button';