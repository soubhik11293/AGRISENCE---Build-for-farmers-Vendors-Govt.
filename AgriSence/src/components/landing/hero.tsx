import React from 'react';
import {
  ArrowRight,
  Bug,
} from 'lucide-react';
import { FloatingCards } from './floating-cards';
import { useLanguage } from '@/src/context/language-context';

interface HeroProps {
  onOpenWeather: () => void;
  onOpenMarket: () => void;
  onOpenAiScan: () => void;
  onNavigate?: (route: string) => void;
}

export function Hero({
  onOpenWeather,
  onOpenMarket,
  onOpenAiScan,
  onNavigate,
}: HeroProps) {
  const { t } = useLanguage();

  return (
    <section className="relative pt-32 sm:pt-36 pb-16 px-4 sm:px-6 lg:px-8 w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto">
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Heading, Value Prop, CTA */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 dark:text-white tracking-tight leading-[1.12]">
            {t('hero.title1', 'Smart Farming.')}{' '}
            <span className="text-[var(--brand-color,#0f9a58)]">
              {t('hero.title2', 'Better Future.')}
            </span>
          </h1>

          {/* Subtitle / Paragraph */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-750 dark:text-slate-200 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
            {t(
              'hero.desc',
              'One platform for every farming decision — weather intelligence, AI pest diagnosis, real-time outbreak warnings, satellite monitoring, APMC marketplace, and agricultural subsidies. AgriSence unites the entire farming ecosystem into a single, beautiful experience.'
            )}
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
            <button
              type="button"
              onClick={() => (onNavigate ? onNavigate('/dashboard') : null)}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-sm font-black shadow-lg shadow-emerald-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>{t('hero.btnDashboard', 'Launch Dashboard →')}</span>
            </button>

            <button
              type="button"
              onClick={onOpenAiScan}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl frosted-card hover:bg-white dark:hover:bg-slate-800 text-sm font-black text-slate-900 dark:text-white border border-white/80 dark:border-white/10 shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Bug className="size-4 text-[var(--brand-color,#0f9a58)]" />
              <span>{t('hero.btnPestScan', 'AI Pest Scan')}</span>
            </button>
          </div>

          {/* Metrics row */}
          <div className="pt-4 grid grid-cols-3 gap-3 max-w-lg mx-auto lg:mx-0">
            <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60 dark:border-white/10 text-center lg:text-left">
              <div className="text-base sm:text-lg font-black text-[var(--brand-color,#0f9a58)]">98.4%</div>
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {t('hero.metric1', '98.4% AI Accuracy')}
              </div>
            </div>
            <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60 dark:border-white/10 text-center lg:text-left">
              <div className="text-base sm:text-lg font-black text-teal-600 dark:text-teal-400">72-hr</div>
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {t('hero.metric2', '72-hr Outbreak Warning')}
              </div>
            </div>
            <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60 dark:border-white/10 text-center lg:text-left">
              <div className="text-base sm:text-lg font-black text-sky-600 dark:text-sky-400">24/7</div>
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {t('hero.metric3', '24/7 Agro Assistant')}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Floating Animated Cards */}
        <div className="lg:col-span-5 relative w-full">
          <FloatingCards
            onOpenWeather={onOpenWeather}
            onOpenMarket={onOpenMarket}
            onOpenAiScan={onOpenAiScan}
          />
        </div>
      </div>
    </section>
  );
}
