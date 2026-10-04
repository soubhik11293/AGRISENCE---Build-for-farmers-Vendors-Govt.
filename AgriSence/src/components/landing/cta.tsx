import React from 'react';
import { ArrowRight, Sprout as Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/src/context/language-context';
import { useAuth } from '@/src/context/auth-context';

export function CTA({ onNavigate }: { onNavigate?: (route: string) => void }) {
  const { t } = useLanguage();
  const { openAuthModal, isAuthenticated, user } = useAuth();

  const handleStartNow = () => {
    onNavigate?.('/harvest-protection');
  };

  const handleStartFree = () => {
    onNavigate?.('/pest-soil-protection');
  };

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto space-y-10">
      {/* ============================================================== */}
      {/* BANNER 1: 4.png - Free 30-Day AgTech Pilot Frosted Glass Card */}
      {/* ============================================================== */}
      <div className="relative rounded-[36px] frosted-card border border-white/80 dark:border-white/15 p-8 sm:p-12 shadow-2xl overflow-hidden text-center space-y-6">
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] text-xs font-black uppercase tracking-wider shadow-2xs">
            <Sparkles className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
            <span>{t('cta1.badge', 'Free 30-Day AgTech Pilot')}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-tight">
            {t('cta1.title', 'Protect Your Harvest, Maximize Your Mandi Profits')}
          </h2>

          <p className="text-xs sm:text-sm text-slate-750 dark:text-slate-200 font-medium leading-relaxed max-w-2xl mx-auto">
            {t(
              'cta1.desc',
              'Use AgriSence field intelligence to reduce avoidable input waste, inspect pest risks early, and compare observed market quotes.'
            )}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleStartNow}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-sm font-black shadow-lg shadow-emerald-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>{t('cta1.btnStart', 'Get Started Now →')}</span>
            </button>

            <button
              type="button"
              onClick={() => (onNavigate ? onNavigate('/dashboard') : null)}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl frosted-glass-sub hover:bg-white dark:hover:bg-slate-800 text-sm font-black text-slate-900 dark:text-white border border-white/70 dark:border-white/10 shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>{t('cta1.btnDash', 'View Live Dashboard')}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-650 dark:text-slate-300 pt-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
              <span>{t('cta1.chk1', 'Zero Hardware Setup')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
              <span>{t('cta1.chk2', 'Instant Edge AI in Deep Fields')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
              <span>{t('cta1.chk3', 'Regional Dialects (Hindi, Marathi, Bengali, Telugu)')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BANNER 2: 5.png - Vibrant Green High-Conversion CTA Banner   */}
      {/* ============================================================== */}
      <div className="relative rounded-[36px] bg-[#087a43] p-8 sm:p-12 shadow-md text-white text-center space-y-6 overflow-hidden">

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/25 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-2xs">
            <Sparkles className="size-3.5 text-emerald-200" />
            <span>{t('cta2.badge', 'Ready For Smarter Harvests')}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {t('cta2.title', 'Transform Your Agricultural Yield with Intelligent Pest & Soil Protection')}
          </h2>

          <p className="text-xs sm:text-sm text-emerald-50/90 font-medium leading-relaxed max-w-2xl mx-auto">
            {t(
              'cta2.desc',
              'Join thousands of modern cultivators using AgriSence for early infestation diagnosis, precision spraying, and verified mandi linkages.'
            )}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleStartFree}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-emerald-50 text-emerald-900 text-sm font-black shadow-lg shadow-black/10 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>{t('cta2.btnStart', 'Get Started Free →')}</span>
            </button>

            <button
              type="button"
              onClick={() => (onNavigate ? onNavigate('/dashboard') : null)}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-emerald-950/40 hover:bg-emerald-950/60 text-white text-sm font-black border border-white/30 shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
            >
              <span>{t('cta2.btnDash', 'Go to Dashboard')}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
