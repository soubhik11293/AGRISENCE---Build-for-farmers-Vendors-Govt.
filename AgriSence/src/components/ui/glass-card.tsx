import React, { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/src/lib/utils';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
  hover?: boolean;
  variant?: 'default' | 'subcard' | 'elevated' | 'modal';
}

export function GlassCard({
  children,
  className,
  hover = false,
  variant = 'default',
  ...props
}: GlassCardProps) {
  const variantStyles = {
    default: 'frosted-card rounded-[28px]',
    subcard: 'frosted-glass-sub rounded-2xl',
    elevated: 'frosted-card rounded-[28px] shadow-2xl',
    modal: 'frosted-card rounded-[32px] shadow-2xl',
  };

  return (
    <div
      className={cn(
        'transition-all duration-300',
        variantStyles[variant],
        hover &&
          'hover:-translate-y-0.5 hover:shadow-xl hover:border-slate-300 dark:hover:border-white/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
