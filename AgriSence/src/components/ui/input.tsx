import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/src/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-11 w-full rounded-2xl border border-white/70 dark:border-white/12 frosted-glass-sub px-4 text-sm font-semibold text-slate-950 dark:text-slate-100 shadow-2xs backdrop-blur-md transition-all',
          'placeholder:text-slate-400 dark:placeholder:text-slate-500',
          'focus-visible:border-[var(--brand-color,#0f9a58)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/25 focus-visible:bg-white dark:focus-visible:bg-slate-800/95',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
