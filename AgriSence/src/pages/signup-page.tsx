import React, { useEffect } from 'react';
import { Logo } from '@/src/components/logo';
import { ArrowRight, Sprout as Sparkles, ShieldCheck, LogIn } from 'lucide-react';
import { WorkflowGuideCard } from '@/src/components/workflow-guide-card';
import { useAuth } from '@/src/context/auth-context';
import { useLanguage } from '@/src/context/language-context';

export function SignupPage({ onNavigate }: { onNavigate?: (route: string) => void }) {
  const { openAuthModal, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (isAuthenticated) {
      if (onNavigate) onNavigate('/dashboard');
    } else {
      openAuthModal(
        t('page.auth.signUp', 'Farmer Registration'),
        t('page.auth.signUpDescription', 'Create a farmer account with Firebase email verification and saved field telemetry.'),
        () => onNavigate?.('/dashboard'),
        'signup'
      );
    }
  }, [isAuthenticated, onNavigate, openAuthModal, t]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Main Standalone Card 1: Create Account */}
        <div className="w-full p-6 sm:p-8 rounded-[32px] frosted-card border border-white/70 dark:border-white/12 shadow-2xl backdrop-blur-2xl backdrop-saturate-190 space-y-6 text-slate-950 dark:text-slate-100 text-center">
          <div className="flex flex-col items-center text-center space-y-2">
            <Logo onClick={() => (onNavigate ? onNavigate('/') : null)} />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full frosted-glass-sub text-[11px] font-black text-[var(--brand-text,#0d7342)] border border-white/50 dark:border-white/10 mt-1 shadow-2xs">
              <Sparkles className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
              <span>Full Precision Agronomic Access</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white pt-1">
              {t('page.auth.signUp', 'Farmer Onboarding & Registration')}
            </h2>
            <p className="text-xs text-slate-650 dark:text-slate-300 font-semibold max-w-sm">
              {t('page.auth.signUpDescription', 'Unified multi-step onboarding with Firebase email verification and instant Firestore telemetry synchronization.')}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-[var(--brand-border)] text-xs text-slate-800 dark:text-slate-200 space-y-2">
            <p className="font-bold text-[var(--brand-text,#0d7342)]">
              Multi-Step Registration Modal Active
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              The full 3-step farmer registration modal is open on your screen. If closed, click below to resume.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() =>
                openAuthModal(
                  t('page.auth.signUp', 'Farmer Registration'),
                  t('page.auth.signUpDescription', 'Create a farmer account with Firebase email verification and saved field telemetry.'),
                  () => onNavigate?.('/dashboard'),
                  'signup'
                )
              }
              className="w-full h-11 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
            >
              <span>{t('page.auth.openSignUp', 'Open Unified Registration Dialog')}</span>
              <ArrowRight className="size-4" />
            </button>

            <button
              type="button"
              onClick={() =>
                openAuthModal(
                  'Farmer Sign In',
                  'Sign in to access your parcel telemetry, disease diagnostics, and mandis.',
                  () => onNavigate?.('/dashboard'),
                  'signin'
                )
              }
              className="w-full h-10 rounded-2xl frosted-glass-sub text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="size-4 text-[var(--brand-color,#0f9a58)]" />
              <span>{t('page.auth.already', 'Already Registered? Sign In')}</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 text-center text-xs font-semibold text-slate-650 dark:text-slate-300 flex items-center justify-center gap-1">
            <ShieldCheck className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
            <span>Digital Agriculture Mission e-KYC Ready</span>
          </div>
        </div>

        {/* Standalone Card 2: How AgriSence Works */}
        <WorkflowGuideCard onNavigate={onNavigate} />
      </div>
    </div>
  );
}
