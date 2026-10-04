import React, { useState, useTransition, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudSun,
  Search,
  Droplets,
  Wind,
  Gauge,
  Thermometer,
  CloudRain,
  Sun,
  CloudLightning,
  Cloud,
  X,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sprout,
  Compass,
  Navigation,
  Sprout as Sparkles,
  Info,
  MapPin,
} from 'lucide-react';
import { useLanguage } from '@/src/context/language-context';
import { useTelemetry } from '@/src/context/telemetry-context';
import { ActiveParcelSelector } from '@/src/components/dashboard/active-parcel-selector';
import type { DailyForecast, SprayHour } from '@/src/types';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WeatherModal({ isOpen, onClose }: WeatherModalProps) {
  const { t } = useLanguage();
  const {
    weatherData: weather,
    fetchWeather,
    syncDeviceGPS,
    isWeatherLoading,
    weatherError,
    gpsNotice,
    setGpsNotice,
  } = useTelemetry();
  const [activeTab, setActiveTab] = useState<'microclimate' | 'soil' | 'spray' | 'forecast'>('microclimate');
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isGpsSyncing, setIsGpsSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-sync GPS when modal is opened if location is default or not customized yet
  useEffect(() => {
    if (isOpen) {
      if (!weather.locationName || weather.locationName.includes('Pune')) {
        syncDeviceGPS(true);
      }
    }
  }, [isOpen, syncDeviceGPS, weather.locationName]);

  const getWeatherIcon = (code: number, isRain: boolean, className = 'size-5') => {
    if (isRain || code >= 51) return <CloudRain className={`${className} text-sky-500`} />;
    if (code >= 95) return <CloudLightning className={`${className} text-amber-500`} />;
    if (code >= 1 && code <= 3) return <CloudSun className={`${className} text-amber-500`} />;
    if (code === 0) return <Sun className={`${className} text-amber-500`} />;
    return <Cloud className={`${className} text-slate-400`} />;
  };

  const getCompassDirection = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setErrorMsg(null);
    setGpsNotice(null);
    startTransition(async () => {
      try {
        await fetchWeather(query.trim());
      } catch {
        setErrorMsg('Network error fetching live Open-Meteo telemetry. Reverting to cached sensor data.');
      }
    });
  };

  const handleManualGpsSync = async () => {
    setIsGpsSyncing(true);
    setErrorMsg(null);
    try {
      await syncDeviceGPS(false);
    } catch {
      // Handled silently by syncDeviceGPS without blocking red alert
    } finally {
      setIsGpsSyncing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/45 dark:bg-black/75 backdrop-blur-md transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative w-full max-w-3xl rounded-[32px] frosted-card border border-white/85 dark:border-white/14 p-5 sm:p-7 shadow-2xl z-10 space-y-4 max-h-[92vh] overflow-y-auto text-slate-950 dark:text-slate-100"
          >
            <ActiveParcelSelector compact />
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-color,#0f9a58)] flex items-center justify-center border border-[var(--brand-border)] shadow-2xs shrink-0">
                  <CloudSun className="size-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
                    <span>{t('weather.title', 'Farm Weather & Spray Windows')}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
                      {weather.source === 'open-meteo' ? 'Open-Meteo observed' : 'Fallback estimate'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-650 dark:text-slate-300 font-semibold">
                    Subcontinental microclimate, root-zone telemetry & spray viability
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="size-8 rounded-full frosted-glass-sub hover:bg-white/80 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Search Input Bar + Sync Device GPS */}
            <div className="flex flex-col sm:flex-row gap-2">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search village, taluka, district, or APMC mandi..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-2xl frosted-glass-sub border border-white/80 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)] shadow-2xs"
                  />
                  <Search className="size-4 absolute left-3 top-3 text-slate-500 pointer-events-none" />
                </div>
                <button
                  type="submit"
                  disabled={isPending || isWeatherLoading}
                  className="px-4 py-2.5 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {isPending || isWeatherLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  <span>Fetch Radar</span>
                </button>
              </form>

              {/* Sync Device GPS Button */}
              <button
                type="button"
                onClick={handleManualGpsSync}
                disabled={isGpsSyncing || isWeatherLoading}
                className="px-3.5 py-2.5 rounded-2xl frosted-glass-sub hover:bg-white dark:hover:bg-slate-800 border border-white/80 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs shrink-0"
                title="Detect Farm Coordinates via Device GPS"
              >
                {isGpsSyncing ? (
                  <Loader2 className="size-4 animate-spin text-[var(--brand-color,#0f9a58)]" />
                ) : (
                  <Navigation className="size-4 text-[var(--brand-color,#0f9a58)]" />
                )}
                <span>Sync Device GPS</span>
              </button>
            </div>

            {/* Subtle Non-Blocking GPS Banner Notice */}
            {gpsNotice && (
              <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/25 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Info className="size-4 text-amber-600 shrink-0" />
                  <span>{gpsNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGpsNotice(null)}
                  className="text-amber-700 dark:text-amber-400 hover:text-amber-900 text-[11px] font-bold underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Error Message (Only for real network failures) */}
            {(errorMsg || (weatherError && !weatherError.includes('denied'))) && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMsg || weatherError}</span>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex items-center gap-1.5 border-b border-slate-200/60 dark:border-white/10 pb-2 text-xs font-black overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('microclimate')}
                className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'microclimate'
                    ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs'
                    : 'frosted-glass-sub text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <Thermometer className="size-3.5" />
                <span>Atmospheric & Radar</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('soil')}
                className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'soil'
                    ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs'
                    : 'frosted-glass-sub text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <Sprout className="size-3.5" />
                <span>Soil & Evapotranspiration</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('spray')}
                className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'spray'
                    ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs'
                    : 'frosted-glass-sub text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <Wind className="size-3.5" />
                <span>72h Spray Viability</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('forecast')}
                className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'forecast'
                    ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs'
                    : 'frosted-glass-sub text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <Calendar className="size-3.5" />
                <span>7-Day Agricultural Forecast</span>
              </button>
            </div>

            {/* Main Location Header Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] border border-[var(--brand-border)] text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-[var(--brand-color,#0f9a58)] shrink-0" />
                <span className="font-black text-slate-900 dark:text-white text-sm">
                  {weather.locationName}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold">
                <span>Hail Risk: <strong className="text-emerald-600 dark:text-emerald-400">{weather.hailRisk}</strong></span>
                <span>•</span>
                <span>Thunderstorm: <strong className="text-slate-900 dark:text-white">{weather.thunderstormAlert}</strong></span>
              </div>
            </div>

            {/* TAB 1: ATMOSPHERIC & RADAR */}
            {activeTab === 'microclimate' && (
              <div className="space-y-4">
                {/* Hero Reading Card */}
                <div className="p-5 rounded-[26px] frosted-glass-sub border border-white/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="size-16 rounded-2xl bg-white/80 dark:bg-slate-800/80 flex items-center justify-center shadow-2xs">
                      {getWeatherIcon(weather.weatherCode, weather.isRainingNow, 'size-10')}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-950 dark:text-white font-mono">
                          {weather.temp}°C
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          Feels like {weather.apparentTemp}°C
                        </span>
                      </div>
                      <p className="text-xs font-black text-[var(--brand-text,#0d7342)] mt-0.5">
                        {weather.isRainingNow ? 'Active Precipitation Occurring' : 'Dry Canopy & Open Foliage'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/50">
                      <span className="text-slate-500 font-semibold block text-[10px]">Rain Accumulation</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                        {weather.rainAmount} mm
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/50">
                      <span className="text-slate-500 font-semibold block text-[10px]">Precipitation Prob.</span>
                      <span className="text-sm font-black text-sky-600 font-mono">
                        {weather.rainProb}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Microclimate Grid (6 Indicators) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
                      <Droplets className="size-3.5 text-sky-500" />
                      <span>Relative Humidity</span>
                    </div>
                    <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                      {weather.humidity}%
                    </div>
                    <span className="text-[10px] text-slate-500">Dew Point: {weather.dewPoint}°C</span>
                  </div>

                  <div className="p-3.5 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
                      <Wind className="size-3.5 text-teal-500" />
                      <span>Wind Velocity & Vector</span>
                    </div>
                    <div className="text-lg font-black text-slate-900 dark:text-white font-mono flex items-center gap-1">
                      <span>{weather.windSpeed} km/h</span>
                      <span className="text-xs font-bold text-slate-500">({getCompassDirection(weather.windDirection)})</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Gusts up to {weather.windGust} km/h</span>
                  </div>

                  <div className="p-3.5 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
                      <Gauge className="size-3.5 text-indigo-500" />
                      <span>Surface Pressure</span>
                    </div>
                    <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                      {weather.pressure} hPa
                    </div>
                    <span className="text-[10px] text-slate-500">Barometric stability</span>
                  </div>

                  <div className="p-3.5 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
                      <Sun className="size-3.5 text-amber-500" />
                      <span>UV Radiation Index</span>
                    </div>
                    <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                      {weather.uvIndex} UV
                    </div>
                    <span className="text-[10px] text-slate-500">{weather.uvIndex > 7 ? 'High Solar Insolation' : 'Moderate UV Index'}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
                      <Compass className="size-3.5 text-rose-500" />
                      <span>Vapor Pressure Deficit</span>
                    </div>
                    <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                      {weather.vpd} kPa
                    </div>
                    <span className="text-[10px] text-slate-500">Transpiration drive</span>
                  </div>

                  <div className="p-3.5 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
                      <Cloud className="size-3.5 text-slate-500" />
                      <span>Leaf Wetness State</span>
                    </div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                      {weather.leafWetness}
                    </div>
                    <span className="text-[10px] text-slate-500">Foliar infection risk</span>
                  </div>
                </div>

                {/* Agronomic Advisory Strip */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-[var(--brand-border)] text-xs text-slate-800 dark:text-slate-200">
                  <p className="font-black text-[var(--brand-text,#0d7342)] mb-0.5">ICAR-IMD Field Advisory:</p>
                  <p className="font-semibold leading-relaxed">{weather.advisory}</p>
                </div>
              </div>
            )}

            {/* TAB 2: SOIL & EVAPOTRANSPIRATION */}
            {activeTab === 'soil' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl frosted-glass-sub border border-white/80 dark:border-white/10 space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                      Surface Root Zone (0 - 7cm)
                    </span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">Soil Temperature</span>
                      <span className="font-black text-slate-900 dark:text-white font-mono text-base">
                        {weather.soilTempSurface}°C
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">Volumetric Soil Moisture</span>
                      <span className="font-black text-sky-600 font-mono text-base">
                        {weather.soilMoistureSurface}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${Math.min(100, weather.soilMoistureSurface * 2.5)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl frosted-glass-sub border border-white/80 dark:border-white/10 space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                      Deep Taproot Horizon (7 - 28cm)
                    </span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">Soil Temperature</span>
                      <span className="font-black text-slate-900 dark:text-white font-mono text-base">
                        {weather.soilTempDeep}°C
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">Volumetric Soil Moisture</span>
                      <span className="font-black text-teal-600 font-mono text-base">
                        {weather.soilMoistureDeep}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full"
                        style={{ width: `${Math.min(100, weather.soilMoistureDeep * 2.5)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] border border-[var(--brand-border)] flex items-center justify-between">
                  <div>
                    <span className="font-black text-slate-900 dark:text-white text-sm block">
                      Reference Evapotranspiration ($ET_0$)
                    </span>
                    <span className="text-slate-650 dark:text-slate-400">
                      Calculated via FAO-56 Penman-Monteith algorithmic equation
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[var(--brand-text,#0d7342)] font-mono">
                      {weather.et0}
                    </span>
                    <span className="text-[10px] text-slate-500 block">mm / day water loss</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: 72H SPRAY TIMELINE */}
            {activeTab === 'spray' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Hourly Spray Execution Viability Index</span>
                  <span>Wind Speed & Rain Wash-Off Matrix</span>
                </div>

                <div className="space-y-2">
                  {weather.sprayTimeline.map((item, idx) => {
                    const isOptimal = item.status === 'Optimal';
                    const isCaution = item.status === 'Caution';
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                          isOptimal
                            ? 'bg-emerald-500/5 border-emerald-500/25 dark:bg-emerald-500/10'
                            : isCaution
                            ? 'bg-amber-500/5 border-amber-500/25 dark:bg-amber-500/10'
                            : 'bg-rose-500/5 border-rose-500/25 dark:bg-rose-500/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-slate-900 dark:text-white w-14 shrink-0">
                            {item.timeLabel}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                              isOptimal
                                ? 'bg-emerald-500 text-white'
                                : isCaution
                                ? 'bg-amber-500 text-white'
                                : 'bg-rose-500 text-white'
                            }`}
                          >
                            {item.status}
                          </span>
                          <span className="text-[11px] text-slate-650 dark:text-slate-300 font-medium">
                            {item.reason}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] font-mono shrink-0">
                          <span className="text-teal-700 dark:text-teal-400 font-bold">
                            🍃 {item.windSpeed} km/h
                          </span>
                          <span className="text-sky-700 dark:text-sky-400 font-bold">
                            💧 {item.rainProb}% rain
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 font-bold">
                            🌡️ {item.temp}°C
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: 7-DAY FORECAST */}
            {activeTab === 'forecast' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200">
                  <span>Day & Date</span>
                  <div className="flex items-center gap-6">
                    <span>Precipitation Prob.</span>
                    <span>$ET_0$</span>
                    <span>High / Low</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {weather.daily.map((day, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl frosted-glass-sub border border-white/60 dark:border-white/10 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-xl bg-white/70 dark:bg-slate-800/70 flex items-center justify-center">
                          {getWeatherIcon(day.weatherCode, day.isRain, 'size-4')}
                        </div>
                        <div>
                          <span className="font-black text-slate-900 dark:text-white block">
                            {day.dayName}
                          </span>
                          <span className="text-[10px] text-slate-500">{day.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <span className="font-mono font-bold text-sky-600 w-12 text-right">
                          {day.precipitationProb}%
                        </span>
                        <span className="font-mono font-bold text-teal-600 w-16 text-right">
                          {day.et0} mm
                        </span>
                        <span className="font-mono font-black text-slate-900 dark:text-white w-16 text-right">
                          {day.maxTemp}° / {day.minTemp}°
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Notes */}
            <div className="pt-2 border-t border-slate-200/50 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
                Updated via Open-Meteo High-Resolution Ensemble Models
              </span>
              <span>15-min persistent local cache active</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
