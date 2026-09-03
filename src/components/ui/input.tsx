import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import type { LabelHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type || 'text'}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background placeholder:text-gray-400 focus-within:ring-2 focus-within:ring-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn('text-sm font-medium leading-none', className)} {...props} />
  )
);
Label.displayName = 'Label';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-within:ring-2 focus-within:ring-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
