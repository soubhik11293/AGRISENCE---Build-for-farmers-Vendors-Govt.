import React, { useState } from 'react';
import { CloudSun } from 'lucide-react';
import { WeatherModal } from '@/src/components/weather-modal';
import { useTelemetry } from '@/src/context/telemetry-context';
import { useLanguage } from '@/src/context/language-context';

export function WeatherModalTrigger() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const { weatherData } = useTelemetry();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl frosted-glass-sub hover:bg-white dark:hover:bg-slate-800 border border-white/70 dark:border-white/10 text-slate-950 dark:text-white group cursor-pointer backdrop-blur-md shadow-2xs"
        title={t('command.weatherTitle', 'Check field microclimate & agro-spray advisories')}
      >
        <div className="p-1.5 rounded-xl bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-color,#0f9a58)] group-hover:scale-110 transition-transform">
          <CloudSun className="size-5 stroke-[2.2]" />
        </div>
        <div className="text-left text-xs leading-tight">
          <div className="font-black text-sm text-slate-950 dark:text-white flex items-center gap-1">
            {weatherData.temp}°C
            <span className="size-1.5 rounded-full bg-[var(--brand-color,#0f9a58)] animate-pulse" />
          </div>
          <span className="text-slate-650 dark:text-slate-300 text-[11px] font-bold">{t('command.fieldTelemetry', 'Field Telemetry')}</span>
        </div>
      </button>

      <WeatherModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
