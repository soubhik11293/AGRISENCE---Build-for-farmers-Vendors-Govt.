import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bug,
  Sprout,
  Droplets,
  Layers,
  Sprout as Sparkles,
  FlaskConical,
  Upload,
  CheckCircle2,
  ShieldAlert,
  ShoppingCart,
  MapPin,
  Store,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Navbar } from '@/src/components/landing/navbar';
import { ActiveParcelSelector } from '@/src/components/dashboard/active-parcel-selector';
import { Footer } from '@/src/components/landing/footer';
import { PestDiagnosisModal } from '@/src/components/pest-diagnosis-modal';
import { KisanShopModal } from '@/src/components/kisan-shop-modal';
import { SupportDeskModal } from '@/src/components/support-desk-modal';
import { TankMixSimulator } from '@/src/components/tank-mix-simulator';
import { useTelemetry } from '@/src/context/telemetry-context';
import { useDiagnosis } from '@/src/context/diagnosis-context';
import { useLanguage } from '@/src/context/language-context';

export function PestSoilProtectionPage({ onNavigate }: { onNavigate?: (route: string) => void }) {
  const { weatherData } = useTelemetry();
  const { activeDiagnosis } = useDiagnosis();
  const { t } = useLanguage();

  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [shopCategory, setShopCategory] = useState<'seeds' | 'crop_protection' | 'fertilizers' | 'machinery' | 'hyperlocal'>('crop_protection');

  // Soil Balancer Interactive State
  const [soilPh, setSoilPh] = useState<number>(7.2);
  const [nitrogen, setNitrogen] = useState<number>(135);
  const [phosphorus, setPhosphorus] = useState<number>(22);
  const [potassium, setPotassium] = useState<number>(270);
  const [targetCrop, setTargetCrop] = useState<string>('Soybean');

  return (
    <div className="min-h-screen text-slate-950 dark:text-slate-100 flex flex-col selection:bg-emerald-500/20 selection:text-[#008746]">
      <Navbar currentRoute="/pest-soil-protection" onNavigate={onNavigate} />

      <main className="flex-1 max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 pb-20 w-full space-y-8">
        <ActiveParcelSelector compact />
        {/* Header Hero Banner */}
        <div className="p-6 sm:p-10 rounded-[36px] bg-gradient-to-br from-teal-700 via-[var(--brand-color,#0f9a58)] to-emerald-950 text-white shadow-2xl relative overflow-hidden space-y-4">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/25 text-emerald-100 text-xs font-black uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="size-3.5 text-amber-300" />
              <span>{t('page.soil.badge', 'Precision Crop Protection & Soil Balancer')}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {t('cta2.title', 'Transform Your Agricultural Yield with Intelligent Pest & Soil Protection')}
            </h1>

            <p className="text-sm sm:text-base text-emerald-100 font-semibold leading-relaxed">
              {t('page.soil.description', 'Computer vision foliage diagnostics, molecular tank-mix chemical compatibility checking, and hyperlocal soil N-P-K nutrient balancing calibrated to')} <strong translate="no">{weatherData.locationName}</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDiagnosisModalOpen(true)}
                className="px-6 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 text-xs sm:text-sm font-black shadow-lg shadow-black/15 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                <Bug className="size-4 text-[var(--brand-color,#0f9a58)]" />
                <span>{t('page.soil.scan', 'Launch AI Foliage Scanner')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShopCategory('crop_protection');
                  setShopOpen(true);
                }}
                className="px-5 py-3 rounded-2xl bg-emerald-900/60 hover:bg-emerald-900/80 border border-white/20 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ShoppingCart className="size-4 text-amber-300" />
                <span>{t('page.soil.procure', 'Procure ICAR Bio-Pesticides')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 1: FULL END-TO-END TANK-MIX SIMULATOR WORKFLOW */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white flex items-center gap-2">
                <FlaskConical className="size-5 text-[var(--brand-color,#0f9a58)]" />
                <span>{t('page.soil.workflow', 'End-to-End Real-Time Tank-Mix Simulator Workflow')}</span>
              </h2>
              <p className="text-xs text-slate-500">
                Simulate jar-test physical solubility, chemical degradation, and W-A-L-E pouring orders across 2 to 5 simultaneous inputs
              </p>
            </div>
          </div>

          <TankMixSimulator
            onOpenShop={(query) => {
              setShopCategory('crop_protection');
              setShopOpen(true);
            }}
          />
        </div>

        {/* SECTION 2: AI PEST DIAGNOSIS & SOIL BALANCER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          {/* Diagnostic Studio Box */}
          <div
            onClick={() => setDiagnosisModalOpen(true)}
            className="p-8 rounded-[32px] frosted-card border-2 border-dashed border-[var(--brand-color,#0f9a58)]/50 hover:border-[var(--brand-color,#0f9a58)] shadow-lg text-center cursor-pointer transition-all hover:scale-[1.01] space-y-4 flex flex-col justify-center"
          >
            <div className="size-16 rounded-2xl bg-emerald-500/15 border border-[var(--brand-border)] flex items-center justify-center text-[var(--brand-color,#0f9a58)] mx-auto shadow-xs">
              <Upload className="size-8 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">
                Interactive AI Leaf & Pest Diagnostic Studio
              </h3>
              <p className="text-xs text-slate-650 dark:text-slate-300 font-medium mt-1 max-w-md mx-auto">
                Instant neural network detection for Fall Armyworm, Powdery Mildew, Rust, Bollworm, and 120+ pathogens with biological remedies.
              </p>
            </div>
            <button
              type="button"
              className="px-6 py-2.5 rounded-full bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-bold shadow-md cursor-pointer transition-transform hover:scale-105 w-fit mx-auto"
            >
              Upload Leaf Sample for Instant AI Audit
            </button>
          </div>

          {/* Soil N-P-K Balancing Matrix */}
          <div className="p-6 sm:p-8 rounded-[32px] frosted-card border border-white/80 dark:border-white/10 space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60 dark:border-white/10">
              <div className="size-10 rounded-2xl bg-emerald-500/15 text-[var(--brand-color,#0f9a58)] flex items-center justify-center font-black">
                <Layers className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-white">
                  Soil N-P-K Mineral & pH Balancing Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Calculates targeted basal and foliar fertility adjustments
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Soil pH Level:</label>
                <input
                  type="number"
                  step="0.1"
                  value={soilPh}
                  onChange={(e) => setSoilPh(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nitrogen (N kg/ha):</label>
                <input
                  type="number"
                  value={nitrogen}
                  onChange={(e) => setNitrogen(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Phosphorus (P kg/ha):</label>
                <input
                  type="number"
                  value={phosphorus}
                  onChange={(e) => setPhosphorus(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Potassium (K kg/ha):</label>
                <input
                  type="number"
                  value={potassium}
                  onChange={(e) => setPotassium(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-bold"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                Prescription: {soilPh > 7.5 ? 'Apply Gypsum / Elemental Sulfur to reduce alkalinity' : soilPh < 6.0 ? 'Apply Agricultural Lime (CaCO3)' : 'Optimal Root Absorption Range'}
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Balanced split application saves up to 1.5 bags of Urea per acre while maximizing foliar micro-nutrient bioavailability.
              </p>
            </div>
          </div>
        </div>

        {/* Modals */}
        <PestDiagnosisModal isOpen={diagnosisModalOpen} onClose={() => setDiagnosisModalOpen(false)} />
        <KisanShopModal isOpen={shopOpen} onClose={() => setShopOpen(false)} initialCategory={shopCategory} />
        <SupportDeskModal isOpen={supportModalOpen} onClose={() => setSupportModalOpen(false)} />
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
