import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/src/components/landing/navbar';
import { Footer } from '@/src/components/landing/footer';
import { PestDiagnosisModal } from '@/src/components/pest-diagnosis-modal';
import { KisanShopModal } from '@/src/components/kisan-shop-modal';
import {
  Bug,
  Upload,
  CheckCircle2,
  ShieldAlert,
  ShoppingCart,
  MapPin,
  Store,
  Scan,
  Activity,
  Radio,
  Thermometer,
  Droplets,
  Wind,
  FlaskConical,
  Sprout,
  ShieldCheck,
  AlertTriangle,
  Search,
  History,
  ArrowRight,
  Clock,
  Zap,
} from 'lucide-react';
import { useDiagnosis } from '@/src/context/diagnosis-context';
import { useTelemetry } from '@/src/context/telemetry-context';
import { useLanguage } from '@/src/context/language-context';
import type { PestDiagnosisResult } from '@/src/types';

export function ScanPage({ onNavigate }: { onNavigate?: (route: string) => void }) {
  const { activeDiagnosis, diagnosisHistory } = useDiagnosis();
  const { weatherData } = useTelemetry();
  const { t } = useLanguage();

  const [modalOpen, setModalOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [shopCategory, setShopCategory] = useState<'seeds' | 'crop_protection' | 'fertilizers' | 'machinery' | 'hyperlocal'>('crop_protection');
  const [filterCrop, setFilterCrop] = useState<string>('All');

  // Auto-open modal if navigated from Outbreak Radar with open=true query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('open') === 'true') {
        setModalOpen(true);
      }
    }
  }, []);

  const activeLocation = weatherData?.locationName || 'Pune / Baramati Sector';

  // --------------------------------------------------------------------------------
  // REAL-TIME DYNAMIC VECTOR RISK RADAR CALCULATIONS (Powered by Open-Meteo)
  // --------------------------------------------------------------------------------
  const realTimeVectorRisks = useMemo(() => {
    const temp = weatherData?.temp || 29;
    const humidity = weatherData?.humidity || 62;
    const vpd = weatherData?.vpd || 1.42;

    // Daily Growing Degree-Day approximation
    const tMax = weatherData?.daily?.[0]?.maxTemp ?? (temp + 3);
    const tMin = weatherData?.daily?.[0]?.minTemp ?? (temp - 7);
    const tMean = (tMax + tMin) / 2;
    const gddMealybug = Math.max(0, tMean - 8.5);
    const gddAccumulated = Math.round(gddMealybug * 14);

    return [
      {
        pestName: 'Fall Armyworm (Spodoptera frugiperda)',
        affectedCrop: 'Maize / Sorghum',
        riskPct: Math.min(98, Math.round((temp >= 24 && humidity >= 60 ? 75 : 35) + (gddAccumulated / 310 * 20))),
        severity: temp >= 26 && humidity >= 65 ? 'High' : 'Moderate',
        condition: `${temp}°C & ${humidity}% RH favor night moth oviposition`,
      },
      {
        pestName: 'Pink Bollworm (Pectinophora gossypiella)',
        affectedCrop: 'Cotton',
        riskPct: Math.min(96, Math.round((temp >= 25 ? 70 : 40) + (humidity >= 65 ? 20 : 10))),
        severity: temp >= 28 ? 'High' : 'Moderate',
        condition: 'Boll emergence stage with high night thermal retention',
      },
      {
        pestName: 'Citrus & Cotton Mealybug (Planococcus citri)',
        affectedCrop: 'Pomegranate / Cotton',
        riskPct: Math.min(99, Math.round((gddAccumulated / 280) * 85)),
        severity: gddAccumulated >= 280 ? 'Critical' : 'Moderate',
        condition: `${gddAccumulated} GDD accumulated • Nymph eclosion phase`,
      },
      {
        pestName: 'Rice / Millet Blast (Magnaporthe oryzae)',
        affectedCrop: 'Paddy / Millet',
        riskPct: humidity >= 80 ? 92 : 30,
        severity: humidity >= 80 ? 'High' : 'Low',
        condition: humidity >= 80 ? 'Continuous canopy humidity >80% triggers spore blast' : 'Suppressed under dry canopy (<75% RH)',
      },
      {
        pestName: 'Chilli & Cotton Thrips (Scirtothrips dorsalis)',
        affectedCrop: 'Chilli / Cotton',
        riskPct: temp >= 28 && humidity <= 60 ? 88 : 35,
        severity: temp >= 28 && humidity <= 60 ? 'High' : 'Low',
        condition: temp >= 28 && humidity <= 60 ? 'Hot dry atmospheric VPD accelerates nymph feeding' : 'Sub-optimal feeding microclimate',
      },
    ];
  }, [weatherData]);

  // Optimal Spray Window today calculated from real-time VPD & wind
  const optimalSprayWindow = useMemo(() => {
    const wind = weatherData?.windSpeed || 12;
    const temp = weatherData?.temp || 29;
    if (wind > 20) return '05:30 - 08:00 hrs (Early Morning Wind Offset Window)';
    if (temp > 32) return '17:30 - 19:45 hrs (Evening Thermal Radiative Balance Window)';
    return '16:30 - 19:15 hrs (Low Evaporation Spray Horizon)';
  }, [weatherData]);

  return (
    <div className="min-h-screen text-slate-950 dark:text-slate-100 flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar currentRoute="/scan" onNavigate={onNavigate} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-20 w-full space-y-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight">
            {t('page.scan.title', 'AI Pest Identification & Foliage Diagnosis Studio')}
          </h1>
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 font-semibold leading-relaxed">
            {t('page.scan.description', 'Upload field photographs of damaged leaves, stems, or pests to receive instant biological remedies, ICAR-approved chemical dosages, and real-time microclimate risk analysis.')}
          </p>
        </div>

        {/* PROMINENT AI SCAN LAUNCH BOX */}
        <div
          onClick={() => setModalOpen(true)}
          className="p-8 sm:p-12 rounded-[36px] frosted-card border-2 border-dashed border-[var(--brand-color,#0f9a58)] hover:border-[var(--brand-hover,#0d844b)] shadow-2xl text-center cursor-pointer transition-all hover:scale-[1.01] space-y-5 group relative overflow-hidden"
        >
          <div className="size-16 sm:size-20 rounded-3xl bg-emerald-500/15 border border-[var(--brand-border)] flex items-center justify-center text-[var(--brand-color,#0f9a58)] mx-auto shadow-md group-hover:scale-110 transition-transform">
            <Upload className="size-8 sm:size-10 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
              {t('page.scan.upload', 'Click to Launch Interactive Neural Leaf Diagnostic Camera')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-650 dark:text-slate-300 font-medium max-w-xl mx-auto">
              Upload or snap photos of Fall Armyworm, Pink Bollworm, Mealybug, Whitefly, Blast, Powdery Mildew, or 120+ crop diseases
            </p>
          </div>
          <button
            type="button"
            className="px-8 py-3 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs sm:text-sm font-black shadow-lg cursor-pointer transition-transform hover:scale-105 inline-flex items-center gap-2"
          >
            <Scan className="size-4" />
            <span>{t('page.scan.launch', 'Launch Neural Diagnostic Camera')}</span>
          </button>
        </div>

        {/* REAL-TIME ACTIVE DIAGNOSIS DOSSIER (If Available) */}
        {activeDiagnosis && (
          <div className="p-6 sm:p-8 rounded-[36px] frosted-card border border-emerald-500/40 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="size-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                      Active AI Leaf Scan Loaded
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {activeDiagnosis.confidence}% AI Confidence
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white mt-1">
                    {activeDiagnosis.pestName} ({activeDiagnosis.scientificName})
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="px-4 py-2 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black shadow-md cursor-pointer transition-transform hover:scale-102 flex items-center gap-1.5"
                >
                  <Scan className="size-4" />
                  <span>Run New Scan</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-[24px] frosted-glass-sub border border-white/60 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-500 block">Host Crop Target</span>
                <span className="text-base font-black text-slate-950 dark:text-white">{activeDiagnosis.affectedCrop}</span>
              </div>

              <div className="p-4 rounded-[24px] frosted-glass-sub border border-white/60 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-500 block">Foliar Damage Impact</span>
                <span className="text-base font-black text-rose-600 dark:text-rose-400 font-mono">
                  {activeDiagnosis.damagePercentage}% Surface Damage
                </span>
              </div>

              <div className="p-4 rounded-[24px] frosted-glass-sub border border-white/60 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-500 block">Observed Symptoms</span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {activeDiagnosis.symptoms.slice(0, 2).join(' • ')}
                </p>
              </div>
            </div>

            {/* Remedies Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
              <div className="p-4 rounded-[24px] frosted-glass-sub border border-emerald-500/30 space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 block flex items-center gap-1">
                  <Sprout className="size-3.5" /> Bio-Control Dosage
                </span>
                <p className="font-bold text-slate-950 dark:text-white leading-relaxed">
                  {activeDiagnosis.biologicalTreatment[0] || 'Apply 5% NSKE @ 5 ml/L water.'}
                </p>
              </div>

              <div className="p-4 rounded-[24px] frosted-glass-sub border border-rose-500/30 space-y-1">
                <span className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-400 block flex items-center gap-1">
                  <FlaskConical className="size-3.5" /> Emergency Knockdown Chemistry
                </span>
                <p className="font-bold text-slate-950 dark:text-white leading-relaxed">
                  {activeDiagnosis.chemicalTreatment[0] || 'Foliar spray of Emamectin Benzoate 5% SG @ 0.4 g/L.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* REAL-TIME REGIONAL PEST RISK RADAR FEED (Powered by Open-Meteo) */}
        <div className="p-6 sm:p-8 rounded-[36px] frosted-card border border-white/80 dark:border-white/12 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/10 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/15 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] text-xs font-black uppercase tracking-wider">
                  Open-Meteo Real-Time Telemetry
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Regional Crop Vector Risk Radar ({activeLocation})
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                Live Microclimate Vector Risk Matrix
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                Calculated dynamically from live ambient temp ({weatherData?.temp || 29}°C), canopy humidity ({weatherData?.humidity || 62}%), and Vapor Pressure Deficit.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1 shrink-0 text-xs">
              <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 block flex items-center gap-1">
                <Clock className="size-3.5 text-emerald-600" /> Optimal Spray Window Today
              </span>
              <p className="font-mono font-black text-slate-950 dark:text-white">{optimalSprayWindow}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {realTimeVectorRisks.map((v, vIdx) => (
              <div
                key={vIdx}
                className="p-4 rounded-[24px] frosted-glass-sub border border-white/60 dark:border-white/10 space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-950 dark:text-white truncate max-w-[180px]">
                    {v.pestName.split('(')[0]}
                  </span>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full text-white ${
                      v.severity === 'Critical' || v.severity === 'High'
                        ? 'bg-rose-600'
                        : 'bg-amber-600'
                    }`}
                  >
                    {v.riskPct}% Risk
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    <span>Host: {v.affectedCrop}</span>
                    <span>{v.severity} Hazard</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        v.riskPct >= 80 ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${v.riskPct}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  {v.condition}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* KISAN DIRECT AGRI-STORE & HYPERLOCAL KENDRA HUB */}
        <div className="p-6 rounded-[32px] bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-2xl bg-[var(--brand-color,#0f9a58)] text-white flex items-center justify-center shadow-md shrink-0">
              <ShoppingCart className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                Kisan Direct Agri-Store & Input Procurement Hub
              </h3>
              <p className="text-xs text-slate-650 dark:text-slate-300 font-medium">
                Procure certified seeds, ICAR insecticides, bio-agents, and spray pumps from verified pan-India delivery platforms.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShopCategory('hyperlocal');
                setShopOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-xs transition-transform hover:scale-105 cursor-pointer"
            >
              <MapPin className="size-3.5" />
              <span>Nearby Krishi Kendra</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShopCategory('crop_protection');
                setShopOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-transform hover:scale-105 cursor-pointer"
            >
              <Store className="size-3.5" />
              <span>Open Kisan Shop</span>
            </button>
          </div>
        </div>

        {/* FEATURE HIGHLIGHTS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-[28px] frosted-card border border-white/70 dark:border-white/10 space-y-2">
            <div className="size-9 rounded-xl frosted-glass-sub text-[var(--brand-color,#0f9a58)] flex items-center justify-center">
              <Bug className="size-5" />
            </div>
            <h4 className="text-sm font-black text-slate-950 dark:text-white">500,000+ Crop Images</h4>
            <p className="text-xs text-slate-650 dark:text-slate-300 font-medium leading-relaxed">
              Trained on extensive datasets covering subcontinental agro-climatic conditions and pest variations.
            </p>
          </div>

          <div className="p-5 rounded-[28px] frosted-card border border-white/70 dark:border-white/10 space-y-2">
            <div className="size-9 rounded-xl frosted-glass-sub text-[var(--brand-color,#0f9a58)] flex items-center justify-center">
              <CheckCircle2 className="size-5" />
            </div>
            <h4 className="text-sm font-black text-slate-950 dark:text-white">Zero-Residue Bio Formulations</h4>
            <p className="text-xs text-slate-650 dark:text-slate-300 font-medium leading-relaxed">
              Prioritizes botanical extracts, bio-control parasitoids, and soil microbes over harsh chemical inputs.
            </p>
          </div>

          <div className="p-5 rounded-[28px] frosted-card border border-white/70 dark:border-white/10 space-y-2">
            <div className="size-9 rounded-xl frosted-glass-sub text-amber-500 flex items-center justify-center">
              <ShieldAlert className="size-5" />
            </div>
            <h4 className="text-sm font-black text-slate-950 dark:text-white">Quarantine Buffer Alerts</h4>
            <p className="text-xs text-slate-650 dark:text-slate-300 font-medium leading-relaxed">
              Calculates epidemic radius vectors and notifies neighboring farmers to prevent swarm propagation.
            </p>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
      <PestDiagnosisModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <KisanShopModal
        isOpen={shopOpen}
        onClose={() => setShopOpen(false)}
        initialCategory={shopCategory}
      />
    </div>
  );
}
