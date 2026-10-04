import React from 'react';
import { LogOut } from 'lucide-react';
import { useLanguage } from '@/src/context/language-context';

export function SignOutButton({ onSignOut }: { onSignOut?: () => void }) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={onSignOut}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 hover:border-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-950/40 text-slate-800 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold transition-all cursor-pointer shadow-2xs"
      title={t('command.signOutTitle', 'Sign out of AgriSence')}
    >
      <LogOut className="size-3.5" />
      <span>{t('dash.signOut', 'Sign Out')}</span>
    </button>
  );
}
