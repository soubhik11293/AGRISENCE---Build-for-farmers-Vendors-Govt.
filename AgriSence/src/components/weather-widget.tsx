import React from 'react';
import { CloudSun, Droplets, Wind, Sprout as Sparkles } from 'lucide-react';
import { useTelemetry } from '@/src/context/telemetry-context';

interface WeatherWidgetProps {
  onOpenWeather: () => void;
}

export function WeatherWidget({ onOpenWeather }: WeatherWidgetProps) {
  const { weatherData } = useTelemetry();

  const quickWeather = {
    temp: weatherData.temp,
    humidity: weatherData.humidity,
    windSpeed: weatherData.windSpeed,
    windDirection: weatherData.windDirection,
    locationName: weatherData.locationName?.split(',')[0] || 'Pune',
  };

  const getCompassDirection = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  return (
    <div className="fixed top-24 left-4 sm:left-6 z-30 pointer-events-auto">
      <button
        type="button"
        onClick={onOpenWeather}
        aria-label="Open Hyperlocal Microclimate Intelligence Modal"
        className="group flex items-center gap-2.5 px-3.5 py-2 rounded-[22px] frosted-glass border border-white/80 dark:border-white/15 shadow-[0_8px_25px_-4px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
      >
        {/* Live Pulse Dot */}
        <span className="relative flex size-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-color,#0f9a58)] opacity-75" />
          <span className="relative inline-flex rounded-full size-2.5 bg-[var(--brand-color,#0f9a58)]" />
        </span>

        {/* Weather Icon & Temp */}
        <div className="flex items-center gap-1.5 shrink-0">
          <CloudSun className="size-4 text-amber-500 stroke-[2.2]" />
          <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
            {quickWeather.temp}°C
          </span>
        </div>

        <span className="hidden sm:inline text-slate-300 dark:text-white/20">•</span>

        {/* Location & Microclimate */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-200">
          <span className="text-slate-900 dark:text-white font-black truncate max-w-[70px]">
            {quickWeather.locationName}
          </span>
          <div className="flex items-center gap-0.5 text-sky-600 dark:text-sky-400">
            <Droplets className="size-3" />
            <span>{quickWeather.humidity}%</span>
          </div>
          <div className="flex items-center gap-0.5 text-teal-600 dark:text-teal-400">
            <Wind className="size-3" />
            <span>
              {quickWeather.windSpeed}k/h {getCompassDirection(quickWeather.windDirection)}
            </span>
          </div>
        </div>

        {/* Hover Pill Cue */}
        <div className="hidden md:flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] group-hover:bg-[var(--brand-color,#0f9a58)] group-hover:text-white transition-colors">
          <Sparkles className="size-2.5" />
          <span>Radar</span>
        </div>
      </button>
    </div>
  );
}
