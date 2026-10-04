import React from 'react';
import { Sprout } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function Logo({
  href = '#/',
  className,
  showText = true,
  invert = false,
  onClick,
}: {
  href?: string;
  className?: string;
  showText?: boolean;
  invert?: boolean;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn('group inline-flex items-center gap-2.5 cursor-pointer select-none', className)}
      aria-label="AgriSence home"
    >
      <span className="relative flex size-10 items-center justify-center overflow-hidden rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/30 transition-transform group-hover:scale-105">
        <Sprout className="size-5 stroke-[2.4]" />
      </span>
      {showText && (
        <span
          className={cn(
            'text-xl font-black tracking-tight',
            invert ? 'text-white' : 'text-[var(--brand-color,#0f9a58)]'
          )}
        >
          AgriSence
        </span>
      )}
    </a>
  );
}
