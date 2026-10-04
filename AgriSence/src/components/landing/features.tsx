import React, { useState } from 'react';
import {
  Bug,
  ShieldAlert,
  Wind,
  FlaskConical,
  TrendingUp,
  Sprout,
  Sprout as Sparkles,
  Droplets,
  Layers,
  Compass,
  CheckCircle2,
  Share2,
  Activity,
  Satellite,
  Gauge,
  Coins,
  Calculator,
  FileText,
  CreditCard,
  Building,
  CloudLightning,
  Map,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { featuresData } from '@/src/lib/site-data';
import { useAuth, AuthGateModal } from '@/src/components/auth-gate-modal';
import { useLanguage } from '@/src/context/language-context';
import { getFeatureTranslation } from '@/src/lib/data/feature-translations';
import type { FeatureItem } from '@/src/types';

interface FeaturesProps {
  onOpenPestDiagnosis: () => void;
  onOpenOutbreakWarning: () => void;
  onOpenFeatureModal: (target: string) => void;
  onNavigate?: (route: string) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Bug,
  ShieldAlert,
  Wind,
  FlaskConical,
  TrendingUp,
  Sprout,
  Sparkles,
  Droplets,
  Layers,
  Compass,
  CheckCircle2,
  Share2,
  Activity,
  Satellite,
  Gauge,
  Coins,
  Calculator,
  FileText,
  CreditCard,
  Building,
  CloudLightning,
  Map,
};

export function Features({
  onOpenPestDiagnosis,
  onOpenOutbreakWarning,
  onOpenFeatureModal,
  onNavigate,
}: FeaturesProps) {
  const { isAuthenticated, requireAuth } = useAuth();
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'Diagnostics',
    'Application Tech',
    'Chemical Safety',
    'Market Strategy',
    'Soil Science',
    'Water Management',
    'Remote Sensing',
  ];

  const filteredFeatures =
    selectedCategory === 'All'
      ? featuresData
      : featuresData.filter(
          (f) =>
            f.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
            selectedCategory.toLowerCase().includes(f.category.toLowerCase())
        );

  const handleCardClick = (feature: FeatureItem) => {
    // 100% Free Access Features: Only Pest Diagnosis & Outbreak Warning
    if (feature.isFree) {
      if (feature.target === 'pest-diagnosis') {
        onOpenPestDiagnosis();
      } else if (feature.target === 'outbreak-warning') {
        onOpenOutbreakWarning();
      } else {
        onOpenFeatureModal(feature.target);
      }
      return;
    }

    // All other capabilities are gated and require signup or login
    requireAuth(
      () => {
        onOpenFeatureModal(feature.target);
      },
      feature.title,
      `Sign in or register to access ${feature.title}, continuous telemetry, and automated calculations.`
    );
  };

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto space-y-10">
      {/* Section Header with exact requested hierarchy */}
      <div className="text-center max-w-4xl mx-auto space-y-3.5">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] text-xs font-black uppercase tracking-wider shadow-2xs">
          <Sparkles className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
          <span>{t('feat.eyebrow', ' 20+ PLATFORM CAPABILITIES')}</span>
        </div>

        {/* Main Broad Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-tight">
          {t('feat.title', 'Intelligent Pest Control & Agronomic Precision')}
        </h2>

        {/* Sub Broad Heading */}
        <h3 className="text-base sm:text-lg lg:text-xl font-black text-[var(--brand-color,#0f9a58)] tracking-tight">
          {t('feat.tag', '20+ Precision Agronomic Simulators & Capabilities')}
        </h3>

        {/* Subtitle paragraph */}
        <p className="text-xs sm:text-sm text-slate-650 dark:text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
          {t(
            'feat.desc',
            'Real-time crop health monitoring, biological pest mitigation, and operational telemetry calibrated for Indian smallholders.'
          )}
        </p>
      </div>

      {/* Category Filter Pills with Equal Spacing */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-4xl mx-auto">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const label = t(`feat.cat.${cat}`, cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-sm scale-105'
                  : 'frosted-glass-sub text-slate-800 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 border border-white/70 dark:border-white/10'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Features Grid with Equal Geometric Spacing & Equal Card Heights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
        {filteredFeatures.map((feature) => {
          const Icon = ICON_MAP[feature.iconName] || Sprout;
          const isFree = Boolean(feature.isFree);

          // Get language-specific translation if available
          const translation = getFeatureTranslation(feature.id, language);
          const title = translation?.title || feature.title;
          const tagline = translation?.tagline || feature.tagline;
          const description = translation?.description || feature.description;

          return (
            <div
              key={feature.id}
              onClick={() => handleCardClick(feature)}
              className="p-6 rounded-[28px] frosted-card border border-white/80 dark:border-white/12 shadow-[0_8px_24px_-4px_var(--brand-glow)] dark:shadow-none hover:shadow-xl transition-all duration-200 hover:scale-[1.02] cursor-pointer flex flex-col justify-between h-full group select-none relative overflow-hidden"
            >
              <div className="space-y-3">
                {/* Header Row: Icon + Badge / Lock */}
                <div className="flex items-center justify-between gap-2">
                  <div className="size-11 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-color,#0f9a58)] flex items-center justify-center border border-[var(--brand-border)] shadow-2xs group-hover:scale-110 transition-transform shrink-0">
                    <Icon className="size-5 stroke-[2.2]" />
                  </div>

                  {isFree ? (
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/15 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] uppercase tracking-wider">
                      {t('feat.free', 'Free Access')}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full frosted-glass-sub text-slate-600 dark:text-slate-300 flex items-center gap-1 border border-white/60 dark:border-white/10 uppercase tracking-wider">
                      <Lock className="size-2.5 text-amber-500" />
                      <span>{t('feat.member', 'Member Access')}</span>
                    </span>
                  )}
                </div>

                {/* Tagline */}
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--brand-text,#0d7342)] block">
                  {tagline}
                </span>

                {/* Title with fixed minimum height for equal row alignment */}
                <h4 className="text-base font-black text-slate-950 dark:text-white tracking-tight group-hover:text-[var(--brand-color,#0f9a58)] transition-colors line-clamp-2 min-h-[48px]">
                  {title}
                </h4>

                {/* Description with fixed minimum height for uniform visual balance */}
                <p className="text-xs text-slate-650 dark:text-slate-300 font-medium leading-relaxed line-clamp-3 min-h-[54px]">
                  {description}
                </p>
              </div>

              {/* Action trigger footer */}
              <div className="mt-4 pt-3.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs font-black text-[var(--brand-text,#0d7342)] group-hover:underline">
                <span>
                  {isFree
                    ? t('feat.openScan', 'Open Scanner')
                    : isAuthenticated
                    ? t('feat.launchSim', 'Launch Simulator')
                    : t('feat.unlockSim', 'Unlock Simulator')}
                </span>
                <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
