import type { HTMLAttributes } from 'react';
import { cn } from '@/src/lib/utils';

const tones = {
  primary: 'bg-emerald-500/15 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]',
  accent: 'bg-sky-500/15 text-sky-950 dark:text-sky-300 border border-sky-500/30',
  warning: 'bg-amber-500/15 text-amber-950 dark:text-amber-300 border border-amber-500/30',
  danger: 'bg-rose-500/15 text-rose-950 dark:text-rose-300 border border-rose-500/30',
  neutral: 'frosted-glass-sub text-slate-800 dark:text-slate-200 border border-white/60 dark:border-white/10',
} as const;

export function Badge({
  className,
  tone = 'primary',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border backdrop-blur-xs',
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
