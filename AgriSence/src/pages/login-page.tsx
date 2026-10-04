import React, { useEffect } from 'react';
import { Logo } from '@/src/components/logo';
import { ArrowRight, Lock, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '@/src/context/auth-context';
import { useLanguage } from '@/src/context/language-context';

export function LoginPage({ onNavigate }: { onNavigate?: (route: string) => void }) {
  const { openAuthModal, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (isAuthenticated) {
      if (onNavigate) onNavigate('/dashboard');
    } else {
      openAuthModal(
        t('page.auth.signIn', 'Farmer Sign In'),
        t('page.auth.signInDescription', 'Sign in to access your parcel telemetry, disease diagnostics, and mandis.'),
        () => onNavigate?.('/dashboard'),
        'signin'
      );
    }
  }, [isAuthenticated, onNavigate, openAuthModal, t]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md p-7 sm:p-8 rounded-[32px] frosted-card border border-white/80 dark:border-white/12 shadow-2xl space-y-6 text-slate-950 dark:text-slate-100 text-center">
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo onClick={() => (onNavigate ? onNavigate('/') : null)} />
          <h2 className="text-xl font-black text-slate-950 dark:text-white pt-2">
            {t('page.auth.signIn', 'Farmer Sign In')}
          </h2>
          <p className="text-xs text-slate-650 dark:text-slate-300 font-semibold">
            {t('page.auth.signInDescription', 'Unified agronomic authentication with Firebase and multi-step verification.')}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-[var(--brand-border)] text-xs text-slate-800 dark:text-slate-200 space-y-2">
          <div className="flex items-center justify-center gap-1.5 font-black text-[var(--brand-text,#0d7342)]">
            <Lock className="size-4" />
            <span>Unified Multi-Step Auth Gate Active</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            The secure farmer verification portal is currently open. Click below if you need to reopen the dialog.
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() =>
              openAuthModal(
                t('page.auth.signIn', 'Farmer Sign In'),
                t('page.auth.signInDescription', 'Sign in to access your parcel telemetry, disease diagnostics, and mandis.'),
                () => onNavigate?.('/dashboard'),
                'signin'
              )
            }
            className="w-full h-11 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
          >
            <span>{t('page.auth.openSignIn', 'Open Unified Sign In Dialog')}</span>
            <ArrowRight className="size-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              openAuthModal(
                'Farmer Registration',
                'Register your farm credentials to access real-time APMC intelligence.',
                () => onNavigate?.('/dashboard'),
                'signup'
              )
            }
            className="w-full h-10 rounded-2xl frosted-glass-sub text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="size-4 text-[var(--brand-color,#0f9a58)]" />
            <span>{t('page.auth.createAccount', 'Create New Farmer Account')}</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 text-center text-xs font-semibold text-slate-650 dark:text-slate-300 flex items-center justify-center gap-1">
          <ShieldCheck className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
          <span>Encrypted Firebase Auth Session</span>
        </div>
      </div>
    </div>
  );
}
