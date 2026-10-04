import React, { useEffect, useState, useRef } from 'react';
import { Bug, Target, ShieldCheck, TrendingDown } from 'lucide-react';
import { useLanguage } from '@/src/context/language-context';

interface StatItem {
  icon: React.ComponentType<{ className?: string }>;
  targetValue: number;
  decimals: number;
  prefix?: string;
  suffix: string;
  labelKey: string;
  defaultLabel: string;
  subKey: string;
  defaultSub: string;
}

const STATS_CONFIG: StatItem[] = [
  {
    icon: Bug,
    targetValue: 98.4,
    decimals: 1,
    suffix: '%',
    labelKey: 'stats.s1.label',
    defaultLabel: 'Pest Detection Accuracy',
    subKey: 'stats.s1.sub',
    defaultSub: 'Based on your verified field records',
  },
  {
    icon: Target,
    targetValue: 120,
    decimals: 0,
    suffix: '+',
    labelKey: 'stats.s2.label',
    defaultLabel: 'Targeted Pest Species',
    subKey: 'stats.s2.sub',
    defaultSub: 'Endemic Indian crop pathologies',
  },
  {
    icon: ShieldCheck,
    targetValue: 45000,
    decimals: 0,
    suffix: '+',
    labelKey: 'stats.s3.label',
    defaultLabel: 'Acres Protected',
    subKey: 'stats.s3.sub',
    defaultSub: 'Across 14 Agro-Climatic Zones',
  },
  {
    icon: TrendingDown,
    targetValue: 35,
    decimals: 0,
    suffix: '%',
    labelKey: 'stats.s4.label',
    defaultLabel: 'Pesticide Cost Reduction',
    subKey: 'stats.s4.sub',
    defaultSub: 'Via precision bio-wash dosage',
  },
];

function CountUpCard({ item }: { item: StatItem }) {
  const [currentVal, setCurrentVal] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;

    let startTime: number | null = null;
    const duration = 1800; // ms

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic formula for natural deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const val = easeOut * item.targetValue;
      setCurrentVal(val);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrentVal(item.targetValue);
      }
    };

    requestAnimationFrame(animate);
  }, [hasAnimated, item.targetValue]);

  const Icon = item.icon;

  const formattedNumber =
    item.decimals > 0
      ? currentVal.toFixed(item.decimals)
      : Math.floor(currentVal).toLocaleString('en-IN');

  return (
    <div
      ref={cardRef}
      className="p-5 sm:p-6 rounded-[28px] frosted-card border border-white/80 dark:border-white/12 shadow-[0_8px_24px_-4px_var(--brand-glow)] dark:shadow-none space-y-2 text-center sm:text-left transition-all hover:scale-[1.02]"
    >
      <div className="size-10 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-color,#0f9a58)] flex items-center justify-center border border-[var(--brand-border)] mx-auto sm:mx-0 shadow-2xs">
        <Icon className="size-5 stroke-[2.2]" />
      </div>
      <div className="pt-1">
        <div className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight font-mono">
          {formattedNumber}
          <span className="text-[var(--brand-color,#0f9a58)]">{item.suffix}</span>
        </div>
        <div className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">
          {t(item.labelKey, item.defaultLabel)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
          {t(item.subKey, item.defaultSub)}
        </div>
      </div>
    </div>
  );
}

export function Stats() {
  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {STATS_CONFIG.map((item, idx) => (
          <CountUpCard key={idx} item={item} />
        ))}
      </div>
    </section>
  );
}
