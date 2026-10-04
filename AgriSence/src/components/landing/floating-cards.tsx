import React from 'react';
import {
  CloudSun,
  Sprout as Sparkles,
  TrendingUp,
  Droplets,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '@/src/context/language-context';

interface FloatingCardsProps {
  onOpenWeather?: () => void;
  onOpenMarket?: () => void;
  onOpenAiScan?: () => void;
}

export function FloatingCards({
  onOpenWeather,
  onOpenMarket,
  onOpenAiScan,
}: FloatingCardsProps) {
  const { t } = useLanguage();

  const cards = [
    // The requested front-page rhythm is right, left, right.
    {
      id: 'weather',
      onClick: onOpenWeather,
      icon: CloudSun,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      headerLeft: t('float.card1.loc', 'Nagpur, MH'),
      headerSub: 'Vidarbha Micro-Climate',
      badge: 'LIVE',
      badgeClass: 'bg-emerald-500/15 text-[var(--brand-text,#0d7342)] border-emerald-500/30',
      hasDot: true,
      mainValue: '29°C',
      valueSuffix: 'Feels 31°C',
      subText: t('float.card1.hum', '💧 62% humidity') + ' • ' + t('float.card1.wind', '🍃 12 km/h'),
      footerText: '🟢 Spray Window Optimal',
      footerClass: 'bg-emerald-500/10 text-[var(--brand-text,#0d7342)] border-emerald-500/25',
    },

    {
      id: 'advisory',
      onClick: onOpenAiScan,
      icon: Sparkles,
      iconColor: 'text-[var(--brand-color,#0f9a58)]',
      iconBg: 'bg-[var(--brand-subtle,#f0faf4)] border-[var(--brand-border)]',
      headerLeft: t('float.card2.ai', 'AgriSense AI'),
      headerSub: 'Vision v4.2 • 10-Yr Model',
      badge: t('float.card2.tag', 'ADVISORY'),
      badgeClass: 'bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border-[var(--brand-border)]',
      hasDot: false,
      mainValue: '98.4%',
      valueSuffix: 'AI Precision',
      subText: 'Sow soybean Jun 15–25 (+18% Yield)',
      footerText: ' Diagnosis Ready',
      footerClass: 'bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border-[var(--brand-border)]',
    },

    {
      id: 'market',
      onClick: onOpenMarket,
      icon: TrendingUp,
      iconColor: 'text-teal-600 dark:text-teal-400',
      iconBg: 'bg-teal-500/10 border-teal-500/20',
      headerLeft: t('float.card4.mandi', 'Soybean • Nagpur Mandi'),
      headerSub: 'APMC Live • Grade-A',
      badge: '▲ +4.2%',
      badgeClass: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
      hasDot: false,
      mainValue: '₹4,850',
      valueSuffix: '/quintal',
      subText: '+₹180 Spread • High Demand',
      footerText: '📈 Storage Arbitrage Gain',
      footerClass: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25',
    },
  ];

  return (
    <div className="relative w-full py-6 sm:py-10 flex items-center justify-center select-none overflow-visible">
      {/* 
        3 Cards Layout:
        - 1st: 5° to left (-5deg)
        - 2nd: 5° to right (+5deg)
        - 3rd: 5° to left (-5deg)
        - PURE floating effect only: no hover scaling, no hover rotation, no hover lift
        - Dedicated vertical spacing (gap-11 sm:gap-14) ensures zero overlap between tilted corners
      */}
      <div className="relative z-10 w-full max-w-[430px] flex flex-col items-center gap-10 sm:gap-14 py-2">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const rotation = index % 2 === 0 ? '7deg' : '-7deg';

          return (
            <div
              key={card.id}
              className="agrisence-floating-card w-[calc(100%-1rem)] sm:w-[390px]"
              style={{ '--card-rotation': rotation, animationDelay: `${index * 180}ms` } as React.CSSProperties}
            >
              <div
                onClick={card.onClick}
                onKeyDown={(event) => { if ((event.key === 'Enter' || event.key === ' ') && card.onClick) { event.preventDefault(); card.onClick(); } }}
                role="button"
                tabIndex={0}
                className="w-full h-[146px] sm:h-[158px] p-4 sm:p-5 rounded-[25px] frosted-card border border-white/85 dark:border-white/15 cursor-pointer flex flex-col justify-between overflow-hidden shadow-[0_18px_36px_-18px_rgba(15,23,42,0.42)]"
              >
                {/* Top Row: Icon + Title/Sub + Badge */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-200/50 dark:border-white/10 pb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`size-7 sm:size-8 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}
                    >
                      <Icon className={`size-3.5 sm:size-4 ${card.iconColor} stroke-[2.2]`} />
                    </div>
                    <div className="truncate min-w-0">
                      <span className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate block leading-tight">
                        {card.headerLeft}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold truncate block leading-tight">
                        {card.headerSub}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[8.5px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 flex items-center gap-1 shadow-2xs ${card.badgeClass}`}
                  >
                    {card.hasDot && (
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    {card.badge}
                  </span>
                </div>

                {/* Middle Row: Main Telemetry Metric & Sub-metric */}
                <div className="flex items-baseline justify-between gap-2 my-auto">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white font-mono tracking-tight leading-none">
                      {card.mainValue}
                    </span>
                    <span className="text-[10.5px] font-bold text-slate-500">
                      {card.valueSuffix}
                    </span>
                  </div>

                  <span className="text-[10px] sm:text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 truncate text-right max-w-[150px]">
                    {card.subText}
                  </span>
                </div>

                {/* Bottom Row: Action Status Pill */}
                <div
                  className={`p-1.5 px-2.5 rounded-xl border text-[9.5px] sm:text-[10px] font-black flex items-center justify-between shadow-2xs ${card.footerClass}`}
                >
                  <span className="truncate">{card.footerText}</span>
                  <ArrowRight className="size-3 shrink-0 ml-1" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
