import * as React from 'react';
import { cn } from '@/src/lib/utils';

export type ButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-sm';

const variantStyles: Record<ButtonVariant, string> = {
  default:
    'bg-[var(--brand-color,#0f9a58)] text-white hover:bg-[var(--brand-hover,#0d844b)] shadow-sm active:scale-98',
  outline:
    'border border-slate-200 dark:border-white/12 frosted-glass-sub hover:bg-white dark:hover:bg-slate-700 text-slate-950 dark:text-slate-100 shadow-none',
  secondary:
    'bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] hover:bg-emerald-100 dark:hover:bg-slate-700 border border-[var(--brand-border)] shadow-none',
  ghost:
    'hover:bg-emerald-500/10 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200',
  destructive:
    'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
};

const sizeStyles: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2 text-sm',
  xs: 'h-7 px-2.5 text-xs rounded-xl',
  sm: 'h-8 px-3 text-xs rounded-xl',
  lg: 'h-12 px-6 text-base rounded-xl',
  icon: 'size-10 rounded-xl',
  'icon-sm': 'size-8 rounded-lg',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-bold transition-colors duration-200 outline-none select-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
