import React, { useState } from 'react';
import {
  CloudSun,
  Activity,
  Droplets,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Shield,
  Layers,
  Sprout as Sparkles,
  Wind,
  Compass,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '@/src/context/language-context';
import { useDiagnosis } from '@/src/context/diagnosis-context';
import { useTelemetry } from '@/src/context/telemetry-context';

export function PlatformShowcase({ onNavigate }: { onNavigate?: (route: string) => void }) {
  const [activeTab, setActiveTab] = useState<'weather' | 'satellite' | 'soil' | 'market'>('weather');
  const { t } = useLanguage();
  const { activeDiagnosis } = useDiagnosis();
  const { marketData, weatherData } = useTelemetry();

  // Tab 1: Weather interactive state
  const [weatherHour, setWeatherHour] = useState<number>(9);
  const [isRadarPlaying, setIsRadarPlaying] = useState<boolean>(true);

  // Tab 2: Satellite interactive state
  const [spectralBand, setSpectralBand] = useState<'rgb' | 'nir' | 'ndvi'>('ndvi');
  const [ndviThreshold, setNdviThreshold] = useState<number>(0.82);

  // Tab 3: Soil probe interactive state
  const [probeDepth, setProbeDepth] = useState<'15cm' | '30cm'>('15cm');
  const [nitrogenLevel, setNitrogenLevel] = useState<number>(240);
  const [phosphorusLevel, setPhosphorusLevel] = useState<number>(48);
  const [potassiumLevel, setPotassiumLevel] = useState<number>(185);

  // Tab 4: Market interactive state
  const [selectedCrop, setSelectedCrop] = useState<'soybean' | 'wheat' | 'cotton' | 'mustard'>('soybean');
  const [holdingDays, setHoldingDays] = useState<number>(60);

  // Helper to fetch live APMC spot and spread from telemetry context
  const getLiveCropMetrics = (name: string) => {
    const item = marketData.find((m) => m.commodity.toLowerCase().includes(name.toLowerCase()));
    if (!item) return { spot: 0, projectedGain: 0 };
    return {
      spot: item.modalPrice,
      projectedGain: item.arbitrageSpread || 0,
    };
  };

  // Crop market data synchronized with live APMC telemetry
  const CROP_PRICES: Record<string, { spot: number; projectedGain: number; storageRatePerDay: number }> = {
    soybean: { ...getLiveCropMetrics('Soybean'), storageRatePerDay: 2.2 },
    wheat: { ...getLiveCropMetrics('Wheat'), storageRatePerDay: 1.5 },
    cotton: { ...getLiveCropMetrics('Cotton'), storageRatePerDay: 3.1 },
    mustard: { ...getLiveCropMetrics('Mustard'), storageRatePerDay: 2.4 },
  };

  const currentCrop = CROP_PRICES[selectedCrop];
  const storageCost = Math.round(currentCrop.storageRatePerDay * holdingDays);
  const projectedGross = currentCrop.spot + Math.round((currentCrop.projectedGain * holdingDays) / 60);
  const netArbitrage = projectedGross - currentCrop.spot - storageCost;

  // Weather hour profiles
  const HOURLY_WEATHER: Record<number, { wind: number; dir: string; hum: number; sprayOk: boolean }> = {
    6: { wind: 6, dir: 'SE', hum: 78, sprayOk: true },
    9: { wind: 8, dir: 'SE', hum: 62, sprayOk: true },
    12: { wind: 16, dir: 'E', hum: 42, sprayOk: false },
    15: { wind: 14, dir: 'NE', hum: 40, sprayOk: false },
    18: { wind: 7, dir: 'N', hum: 58, sprayOk: true },
  };

  const currentHourData = HOURLY_WEATHER[weatherHour] || HOURLY_WEATHER[9];

  return (
    <section id="mandi-market" className="py-20 px-4 sm:px-6 lg:px-8 w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto space-y-10">
      {/* Header matching 9.png */}
      <div className="text-center max-w-3xl mx-auto space-y-3.5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] text-xs font-black uppercase tracking-wider shadow-2xs">
          <Activity className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
          <span>{t('showcase.tag', 'Precision Field Telemetry')}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-tight">
          {t('showcase.mainTitle', 'End-to-End Farm Intelligence')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-650 dark:text-slate-300 font-medium leading-relaxed">
          {t(
            'showcase.mainDesc',
            'Switch seamlessly between real-time weather alerts, satellite analytics, soil diagnostics, and mandi trade execution.'
          )}
        </p>
      </div>

      {/* Showcase Interactive Tab Container - Styled exactly matching 9.png */}
      <div className="rounded-[32px] frosted-card border border-white/85 dark:border-white/14 p-6 sm:p-9 shadow-2xl space-y-8">
        {/* 4 Pill Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 p-1.5 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 gap-1.5 text-xs font-black">
          {[
            { id: 'weather', labelKey: 'showcase.tabWeather', defaultLabel: 'Hyperlocal Weather', icon: CloudSun },
            { id: 'satellite', labelKey: 'showcase.tabSatellite', defaultLabel: 'NDVI Satellite Scan', icon: Activity },
            { id: 'soil', labelKey: 'showcase.tabSoil', defaultLabel: 'Soil Intelligence', icon: Droplets },
            { id: 'market', labelKey: 'showcase.tabMarket', defaultLabel: 'Market Intelligence', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 px-3 rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-sm font-black scale-[1.02]'
                    : 'text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{t(tab.labelKey, tab.defaultLabel)}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display with Live Working Interactive Components */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* TAB 1: Hyperlocal Weather */}
          {activeTab === 'weather' && (
            <>
              <div className="lg:col-span-6 space-y-5">
                <span className="text-[11px] font-black uppercase tracking-wider text-[var(--brand-text,#0d7342)] block">
                  {t('showcase.weather.tag', 'PRECISION AGRONOMY')}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white leading-tight">
                  {t('showcase.weather.title', 'AI-Powered Microclimate Forecasting')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-750 dark:text-slate-300 leading-relaxed font-medium">
                  {t(
                    'showcase.weather.desc',
                    'Pinpoint block-level weather forecasts calibrated with satellite telemetry and IoT sensor arrays. Get hyper-accurate spray windows and frost warnings up to 72 hours ahead.'
                  )}
                </p>

                <ul className="space-y-2.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-[var(--brand-color,#0f9a58)] shrink-0" />
                    <span>{t('showcase.weather.chk1', 'Hourly farm-level humidity, wind vector, and dew point tracking')}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-[var(--brand-color,#0f9a58)] shrink-0" />
                    <span>{t('showcase.weather.chk2', 'Dynamic spray advisory to eliminate pesticide drift and chemical runoff')}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-[var(--brand-color,#0f9a58)] shrink-0" />
                    <span>{t('showcase.weather.chk3', 'Automated frost and heatwave surge alerts directly to your phone')}</span>
                  </li>
                </ul>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => (onNavigate ? onNavigate('/dashboard') : null)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span>{t('showcase.weather.btn', 'Explore in Dashboard →')}</span>
                  </button>
                </div>
              </div>

              {/* Working Interactive Component: Live Weather & Spray Simulation */}
              <div className="lg:col-span-6 p-6 sm:p-7 rounded-[28px] frosted-glass-sub border border-white/80 dark:border-white/12 shadow-lg space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    LIVE TELEMETRY FEED
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-[var(--brand-text,#0d7342)] text-[10px] font-black border border-[var(--brand-border)]">
                    <span className="size-1.5 rounded-full bg-[var(--brand-color,#0f9a58)] animate-pulse" />
                    ● Active
                  </span>
                </div>

                {/* Interactive Hourly Timeline Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <span>Select Forecast Timeline:</span>
                    <span className="text-[var(--brand-color,#0f9a58)] font-black font-mono">{weatherHour}:00 HRS</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[6, 9, 12, 15, 18].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setWeatherHour(h)}
                        className={`py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          weatherHour === h
                            ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs'
                            : 'frosted-card text-slate-700 dark:text-slate-300 hover:bg-white/80'
                        }`}
                      >
                        {h}:00
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Dynamic Status Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-2xl frosted-card space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 font-bold block text-[11px]">Wind Vector</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white font-mono">
                        {currentHourData.wind}
                      </span>
                      <span className="text-xs text-slate-600 font-bold">km/h {currentHourData.dir}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl frosted-card space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 font-bold block text-[11px]">Relative Humidity</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 font-mono">
                        {currentHourData.hum}%
                      </span>
                      <span className="text-xs text-slate-600 font-bold">Dew 21°C</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Spray Viability Advisory */}
                <div
                  className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between transition-colors ${
                    currentHourData.sprayOk
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-[var(--brand-text,#0d7342)]'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Wind className="size-4 shrink-0" />
                    <span>
                      {currentHourData.sprayOk
                        ? '🟢 Optimal Spray Window — Zero Drift Risk (<12 km/h)'
                        : '🔴 Spray Suspended — High Wind Drift (>14 km/h)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRadarPlaying(!isRadarPlaying)}
                    className="text-[10px] uppercase font-black underline cursor-pointer"
                  >
                    {isRadarPlaying ? 'Radar Active' : 'Pause'}
                  </button>
                </div>

                {/* Metric Specs */}
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                  <div className="p-2 rounded-xl bg-white/40 dark:bg-black/20">
                    <span className="text-slate-400 block text-[10px]">Forecast Accuracy</span>
                    <span className="font-black text-slate-900 dark:text-white font-mono">98.4%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/40 dark:bg-black/20">
                    <span className="text-slate-400 block text-[10px]">Update Frequency</span>
                    <span className="font-black text-slate-900 dark:text-white">Every 15 min</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/40 dark:bg-black/20">
                    <span className="text-slate-400 block text-[10px]">Telemetry Range</span>
                    <span className="font-black text-slate-900 dark:text-white font-mono">10m Res</span>
                  </div>
                </div>

                <div className="text-[10px] text-center font-bold text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-white/10">
                  🛡️ Calibrated with Regional Agro-Climatic Data
                </div>
              </div>
            </>
          )}

          {/* TAB 2: NDVI Satellite Scan */}
          {activeTab === 'satellite' && (
            <>
              <div className="lg:col-span-6 space-y-5">
                <span className="text-[11px] font-black uppercase tracking-wider text-[var(--brand-text,#0d7342)] block">
                  {t('showcase.satellite.tag', 'ORBITAL REMOTE SENSING LAYER')}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white leading-tight">
                  {t('showcase.satellite.title', 'ESA Sentinel-2 Multispectral Surface Reflectance')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-750 dark:text-slate-300 leading-relaxed font-medium">
                  {t(
                    'showcase.satellite.desc',
                    'We ingest Band 4 (Red 665nm) and Band 8 (NIR 842nm) imagery every 5 days to compute NDVI and SAVI at 10-meter pixel resolution, pinpointing nitrogen deficiency corridors.'
                  )}
                </p>

                <ul className="space-y-2.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-[var(--brand-color,#0f9a58)] shrink-0" />
                    <span>{t('showcase.satellite.chk1', 'Chlorophyll absorption detection across 84 micro-quadrants')}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-[var(--brand-color,#0f9a58)] shrink-0" />
                    <span>{t('showcase.satellite.chk2', 'Atmospheric aerosol correction and automated cloud-masking')}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-[var(--brand-color,#0f9a58)] shrink-0" />
                    <span>{t('showcase.satellite.chk3', 'Zero physical hardware required — 100% remote satellite geofencing')}</span>
                  </li>
                </ul>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => (onNavigate ? onNavigate('/scan') : null)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span>{t('showcase.satellite.btn', 'Launch AI Scan →')}</span>
                  </button>
                </div>
              </div>

              {/* Working Interactive Component: Spectral Band & NDVI Slider */}
              <div className="lg:col-span-6 p-6 sm:p-7 rounded-[28px] frosted-glass-sub border border-white/80 dark:border-white/12 shadow-lg space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    SENTINEL-2 MULTISPECTRAL RASTER
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-[var(--brand-text,#0d7342)] text-[10px] font-black border border-[var(--brand-border)]">
                    ● Orbit 142 Active
                  </span>
                </div>

                {/* Band Selector */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                    Select Multispectral Layer:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'rgb', label: 'True Color (RGB)' },
                      { id: 'nir', label: 'Near-Infrared (NIR)' },
                      { id: 'ndvi', label: 'NDVI Biomass Index' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSpectralBand(b.id as any)}
                        className={`py-2 px-2 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                          spectralBand === b.id
                            ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs'
                            : 'frosted-card text-slate-700 dark:text-slate-300 hover:bg-white/80'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Biomass Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <span>Chlorophyll Sensitivity Threshold:</span>
                    <span className="font-mono text-[var(--brand-color,#0f9a58)] font-black">{ndviThreshold.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.30"
                    max="0.95"
                    step="0.01"
                    value={ndviThreshold}
                    onChange={(e) => setNdviThreshold(parseFloat(e.target.value))}
                    className="w-full accent-[var(--brand-color,#0f9a58)] cursor-pointer"
                  />
                </div>

                {/* Satellite Metrics Output */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-2xl frosted-card space-y-1 text-center">
                    <span className="text-slate-500 dark:text-slate-400 font-bold block text-[11px]">Canopy Vigor</span>
                    <span className="text-3xl sm:text-4xl font-black text-[var(--brand-color,#0f9a58)] font-mono block">
                      {ndviThreshold.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-black block">
                      {ndviThreshold > 0.7 ? 'Healthy Dense Foliage' : 'Moderate Biomass Density'}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl frosted-card space-y-1 text-center">
                    <span className="text-slate-500 dark:text-slate-400 font-bold block text-[11px]">Canopy Water Index</span>
                    <span className="text-3xl sm:text-4xl font-black text-sky-600 dark:text-sky-400 font-mono block">
                      0.71
                    </span>
                    <span className="text-[10px] text-sky-600 font-black block">No Moisture Stress</span>
                  </div>
                </div>

                <div className="text-[10px] text-center font-bold text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-white/10">
                  🛰️ ESA Copernicus Sentinel-2 Orbiting Telemetry (10m Resolution)
                </div>
              </div>
            </>
          )}

          {/* TAB 3: Soil Intelligence */}
          {activeTab === 'soil' && (
            <>
              <div className="lg:col-span-6 space-y-5">
                <span className="text-[11px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-400 block">
                  {t('showcase.soil.tag', 'SUBSURFACE TELEMETRY LAYER')}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white leading-tight">
                  {t('showcase.soil.title', 'Dielectric Moisture & N-P-K Chemistry Profiling')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-750 dark:text-slate-300 leading-relaxed font-medium">
                  {t(
                    'showcase.soil.desc',
                    'Continuous dielectric permittivity probes placed at 15cm and 30cm root depths transmit Volumetric Water Content (VWC) and Bulk EC to trigger automated drip fertigation.'
                  )}
                </p>

                <ul className="space-y-2.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-sky-600 shrink-0" />
                    <span>{t('showcase.soil.chk1', 'Real-time rootzone water replenishment triggers')}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-sky-600 shrink-0" />
                    <span>{t('showcase.soil.chk2', 'Salinity (EC) monitoring prevents toxic fertilizer salt accumulation')}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-sky-600 shrink-0" />
                    <span>{t('showcase.soil.chk3', 'Hydraulic gradient sensing alerts before feeder root wilting')}</span>
                  </li>
                </ul>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => (onNavigate ? onNavigate('/dashboard') : null)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span>{t('showcase.soil.btn', 'Explore in Dashboard →')}</span>
                  </button>
                </div>
              </div>

              {/* Working Interactive Component: Subsurface Probe Depth & N-P-K */}
              <div className="lg:col-span-6 p-6 sm:p-7 rounded-[28px] frosted-glass-sub border border-white/80 dark:border-white/12 shadow-lg space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    SUBSURFACE CAPACITIVE PROBE
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setProbeDepth('15cm')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer ${
                        probeDepth === '15cm'
                          ? 'bg-sky-600 text-white'
                          : 'frosted-card text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      15cm Topsoil
                    </button>
                    <button
                      type="button"
                      onClick={() => setProbeDepth('30cm')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer ${
                        probeDepth === '30cm'
                          ? 'bg-sky-600 text-white'
                          : 'frosted-card text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      30cm Rootzone
                    </button>
                  </div>
                </div>

                {/* Interactive N-P-K Sliders */}
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                      <span>Available Nitrogen (N)</span>
                      <span className="font-mono text-emerald-600 font-black">{nitrogenLevel} kg/ha</span>
                    </div>
                    <input
                      type="range"
                      min="120"
                      max="350"
                      value={nitrogenLevel}
                      onChange={(e) => setNitrogenLevel(parseInt(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                      <span>Phosphorus (P₂O₅)</span>
                      <span className="font-mono text-amber-600 font-black">{phosphorusLevel} kg/ha</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="90"
                      value={phosphorusLevel}
                      onChange={(e) => setPhosphorusLevel(parseInt(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                      <span>Potassium (K₂O)</span>
                      <span className="font-mono text-sky-600 font-black">{potassiumLevel} kg/ha</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="280"
                      value={potassiumLevel}
                      onChange={(e) => setPotassiumLevel(parseInt(e.target.value))}
                      className="w-full accent-sky-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Soil Diagnostic Output */}
                <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-xs font-bold text-sky-900 dark:text-sky-200">
                  💡 Soil pH: 6.5 (Neutral). Recommended: Apply 15 kg/acre Urea before next scheduled drip cycle.
                </div>

                <div className="text-[10px] text-center font-bold text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-white/10">
                  🧪 Calibrated for Soil Health Card Standards (ICAR / NBSS&LUP)
                </div>
              </div>
            </>
          )}

          {/* TAB 4: Market Intelligence */}
          {activeTab === 'market' && (
            <>
              <div className="lg:col-span-6 space-y-5">
                <span className="text-[11px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 block">
                  {t('showcase.market.tag', 'ECONOMIC ARBITRAGE ENGINE')}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white leading-tight">
                  {t('showcase.market.title', 'APMC Live Modal Rates & Forward Storage Optimization')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-750 dark:text-slate-300 leading-relaxed font-medium">
                  {t(
                    'showcase.market.desc',
                    'Review observed mandi quotes, freight assumptions, and warehouse costs before making a sale decision.'
                  )}
                </p>

                <ul className="space-y-2.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-teal-600 shrink-0" />
                    <span>{t('showcase.market.chk1', 'Automated diesel haulage deduction calculator')}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-teal-600 shrink-0" />
                    <span>{t('showcase.market.chk2', 'WDRA warehouse storage vs spot sale arbitrage advisor')}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-teal-600 shrink-0" />
                    <span>{t('showcase.market.chk3', 'Pledge loan interest subvention comparison (7% p.a.)')}</span>
                  </li>
                </ul>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.querySelector('#mandi-market');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span>{t('showcase.market.btn', 'Compare Mandi Rates →')}</span>
                  </button>
                </div>
              </div>

              {/* Working Interactive Component: APMC Arbitrage Calculator */}
              <div className="lg:col-span-6 p-6 sm:p-7 rounded-[28px] frosted-glass-sub border border-white/80 dark:border-white/12 shadow-lg space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    WDRA ARBITRAGE CALCULATOR
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 text-[10px] font-black border border-teal-500/30">
                    Live APMC Data
                  </span>
                </div>

                {/* Agronomic Hedge Advisory Banner */}
                {activeDiagnosis && activeDiagnosis.damagePercentage > 20 && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
                    <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-amber-900 dark:text-amber-200">
                          Agronomic Hedge Advisory
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.2 rounded-full bg-amber-600 text-white">
                          {activeDiagnosis.damagePercentage}% Leaf Damage
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                        Active diagnosis: <strong>{activeDiagnosis.pestName}</strong> on {activeDiagnosis.affectedCrop}. Advised: Grade post-harvest lots immediately or execute WDRA electronic warehouse receipt (eNWR) forward storage to mitigate distress-sale price docking.
                      </p>
                    </div>
                  </div>
                )}

                {/* Crop Selection Buttons */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">Select Commodity:</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['soybean', 'wheat', 'cotton', 'mustard'] as const).map((crop) => (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => setSelectedCrop(crop)}
                        className={`py-2 px-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                          selectedCrop === crop
                            ? 'bg-teal-600 text-white shadow-2xs'
                            : 'frosted-card text-slate-700 dark:text-slate-300 hover:bg-white/80'
                        }`}
                      >
                        {crop}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Holding Days Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <span>Holding In WDRA Certified Warehouse:</span>
                    <span className="font-mono text-teal-600 font-black">{holdingDays} Days</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="90"
                    step="15"
                    value={holdingDays}
                    onChange={(e) => setHoldingDays(parseInt(e.target.value))}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                </div>

                {/* Dynamic Arbitrage Math Card */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-2xl frosted-card space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 font-bold block text-[11px]">Today's Spot Mandi</span>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono block">
                      ₹{currentCrop.spot}
                    </span>
                    <span className="text-[10px] text-slate-500">Per Quintal</span>
                  </div>

                  <div className="p-4 rounded-2xl frosted-card space-y-1 bg-teal-500/10 border-teal-500/30">
                    <span className="text-teal-700 dark:text-teal-300 font-bold block text-[11px]">Net Arbitrage Gain</span>
                    <span className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400 font-mono block">
                      +₹{netArbitrage}
                    </span>
                    <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300">
                      +₹{(netArbitrage * 100).toLocaleString('en-IN')} on 100 Qtl
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-center font-bold text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-white/10">
                  📊 Market Dataset & WDRA Warehousing Linkage
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
