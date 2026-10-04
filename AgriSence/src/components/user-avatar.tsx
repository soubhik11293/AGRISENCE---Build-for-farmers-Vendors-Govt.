import React from 'react';
import type { User } from '@/src/types';

export interface UserAvatarProps {
  user?: Partial<User> | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBadge?: boolean;
  border?: boolean;
}

export const AVATAR_GRADIENTS: Record<string, { label: string; class: string; text: string }> = {
  emerald: {
    label: 'Emerald Crop',
    class: 'bg-gradient-to-br from-emerald-600 to-teal-800 text-white',
    text: 'text-white',
  },
  amber: {
    label: 'Harvest Gold',
    class: 'bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950',
    text: 'text-slate-950',
  },
  teal: {
    label: 'Irrigation Stream',
    class: 'bg-gradient-to-br from-cyan-600 to-teal-800 text-white',
    text: 'text-white',
  },
  indigo: {
    label: 'Monsoon Twilight',
    class: 'bg-gradient-to-br from-indigo-600 to-sky-700 text-white',
    text: 'text-white',
  },
  terracotta: {
    label: 'Fertile Soil',
    class: 'bg-gradient-to-br from-orange-600 to-rose-700 text-white',
    text: 'text-white',
  },
  violet: {
    label: 'Royal Kisan',
    class: 'bg-gradient-to-br from-purple-600 to-indigo-800 text-white',
    text: 'text-white',
  },
};

/**
 * Derives 2-letter initials from full name
 */
export function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'AG';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Returns deterministic gradient key based on name string
 */
export function getDeterministicGradient(name?: string): string {
  if (!name) return 'emerald';
  const keys = Object.keys(AVATAR_GRADIENTS);
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % keys.length;
  return keys[index];
}

export function UserAvatar({
  user,
  size = 'md',
  className = '',
  showBadge = false,
  border = true,
}: UserAvatarProps) {
  const sizeMap = {
    xs: 'size-6 text-[10px]',
    sm: 'size-8 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-14 text-lg',
    xl: 'size-20 text-2xl',
    '2xl': 'size-28 text-4xl',
  };

  const badgeSizeMap = {
    xs: 'size-1.5',
    sm: 'size-2',
    md: 'size-2.5',
    lg: 'size-3.5',
    xl: 'size-4',
    '2xl': 'size-5',
  };

  const name = user?.fullName || 'Progressive Farmer';
  const initials = getInitials(name);
  const colorKey = user?.avatarColor && AVATAR_GRADIENTS[user.avatarColor]
    ? user.avatarColor
    : getDeterministicGradient(name);
  const gradient = AVATAR_GRADIENTS[colorKey] || AVATAR_GRADIENTS.emerald;

  const hasCustomImage = Boolean(user?.avatarUrl && user.avatarUrl.trim().length > 0);

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <div
        className={`rounded-full overflow-hidden flex items-center justify-center font-black select-none shadow-xs transition-all ${
          sizeMap[size]
        } ${border ? 'ring-2 ring-white/80 dark:ring-white/20' : ''} ${
          hasCustomImage ? 'bg-slate-200 dark:bg-slate-800' : gradient.class
        }`}
      >
        {hasCustomImage ? (
          <img
            src={user?.avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span className="tracking-tight uppercase font-black">{initials}</span>
        )}
      </div>

      {showBadge && (
        <span
          className={`absolute bottom-0 right-0 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 ${badgeSizeMap[size]}`}
          title="Active AgriSence Farmer"
        />
      )}
    </div>
  );
}
