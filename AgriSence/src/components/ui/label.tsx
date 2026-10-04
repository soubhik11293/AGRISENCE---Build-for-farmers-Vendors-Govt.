import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/src/lib/utils';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200', className)}
      {...props}
    />
  );
}
