import React from 'react';
import { CloudSun, Thermometer, Droplets, Wind, Sprout as Sparkles } from 'lucide-react';

export function WeatherCard({
  temp = 29,
  humidity = 62,
  wind = 12,
  advisory = 'Optimal conditions for foliar bio-spray and foliar nutrient uptake.',
}: {
  temp?: number;
  humidity?: number;
  wind?: number;
  advisory?: string;
}) {
  return (
    <div className="p-5 rounded-[28px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-color,#0f9a58)] flex items-center justify-center border border-[var(--brand-border)]">
            <CloudSun className="size-4" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300">
            Field Microclimate
          </span>
        </div>
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
          Live Open-Meteo
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60">
          <Thermometer className="size-4 mx-auto text-rose-500 mb-1" />
          <span className="text-[10px] text-slate-500 font-bold">Air Temp</span>
          <p className="text-base font-black text-slate-950 dark:text-white mt-0.5">{temp}°C</p>
        </div>

        <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60">
          <Droplets className="size-4 mx-auto text-sky-500 mb-1" />
          <span className="text-[10px] text-slate-500 font-bold">Humidity</span>
          <p className="text-base font-black text-slate-950 dark:text-white mt-0.5">{humidity}%</p>
        </div>

        <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60">
          <Wind className="size-4 mx-auto text-teal-600 mb-1" />
          <span className="text-[10px] text-slate-500 font-bold">Wind Vector</span>
          <p className="text-base font-black text-slate-950 dark:text-white mt-0.5">{wind} km/h</p>
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] border border-[var(--brand-border)] text-xs text-slate-850 dark:text-slate-200 font-bold leading-relaxed shadow-2xs">
        <Sparkles className="size-3.5 text-[var(--brand-color,#0f9a58)] inline mr-1" />
        {advisory}
      </div>
    </div>
  );
}

export default WeatherCard;
