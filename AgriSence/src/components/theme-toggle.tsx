import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/src/components/theme-provider';
import { cn } from '@/src/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label="Toggle light/dark theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-2xl frosted-glass-sub hover:bg-white dark:hover:bg-slate-700 border border-white/70 dark:border-white/12 text-slate-850 dark:text-white shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md',
        className
      )}
    >
      {isDark ? (
        <Sun className="size-4 text-[var(--brand-color,#0f9a58)]" />
      ) : (
        <Moon className="size-4 text-slate-800" />
      )}
    </button>
  );
}
