import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  X,
  Sprout as Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useFarms } from '@/src/context/farm-context';
import { useTelemetry } from '@/src/context/telemetry-context';
import { ActiveParcelSelector } from '@/src/components/dashboard/active-parcel-selector';

interface ProfitabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfitabilityModal({ isOpen, onClose }: ProfitabilityModalProps) {
  const [acres, setAcres] = useState<number>(3);
  const [yieldPerAcre, setYieldPerAcre] = useState<number>(18);
  const [marketPrice, setMarketPrice] = useState<number>(0);
  const [inputCostPerAcre, setInputCostPerAcre] = useState<number>(19500);
  const { selectedFarm, selectedCropCycle } = useFarms();
  const { rotatingMarketItem } = useTelemetry();

  useEffect(() => {
    if (rotatingMarketItem?.modalPrice) setMarketPrice(rotatingMarketItem.modalPrice);
  }, [rotatingMarketItem?.id, rotatingMarketItem?.modalPrice]);

  useEffect(() => {
    if (selectedFarm) {
      const farmAcres = Number(selectedFarm.areaAcres || 0);
      if (farmAcres > 0) setAcres(farmAcres);
    }
  }, [selectedFarm?.id]);

  const totalYield = acres * yieldPerAcre;
  const grossRevenue = totalYield * marketPrice;
  const totalInputCost = acres * inputCostPerAcre;
  const netProfit = grossRevenue - totalInputCost;
  const roi = totalInputCost > 0 ? (netProfit / totalInputCost) * 100 : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 dark:bg-black/70 backdrop-blur-md transition-opacity"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative w-full max-w-lg rounded-[32px] frosted-card border border-white/80 dark:border-white/12 p-5 sm:p-6 shadow-2xl z-10 space-y-4 max-h-[92vh] overflow-y-auto text-slate-950 dark:text-slate-100"
          >
            <ActiveParcelSelector compact className="mb-1" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-color,#0f9a58)] flex items-center justify-center border border-[var(--brand-border)] shadow-2xs shrink-0">
                  <Coins className="size-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-950 dark:text-white tracking-tight">
                    Crop Margin & Seasonal Profitability
                  </h3>
                  <p className="text-xs text-slate-650 dark:text-slate-300 font-semibold">
                    Simulate revenue projections and seasonal ROI • {selectedFarm?.name || 'Select a parcel'}{selectedCropCycle ? ` • ${selectedCropCycle.crop}` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full frosted-glass-sub hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Interactive Form Controls */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Cultivated Land (Acres)
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={acres}
                  onChange={(e) => setAcres(Math.max(0.5, Number(e.target.value)))}
                  className="w-full h-10 px-3 text-xs font-bold rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 focus:outline-none focus:border-[var(--brand-color,#0f9a58)] text-slate-950 dark:text-white shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Est. Yield (Qtl / Acre)
                </label>
                <input
                  type="number"
                  min="1"
                  value={yieldPerAcre}
                  onChange={(e) => setYieldPerAcre(Math.max(1, Number(e.target.value)))}
                  className="w-full h-10 px-3 text-xs font-bold rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 focus:outline-none focus:border-[var(--brand-color,#0f9a58)] text-slate-950 dark:text-white shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Expected Modal Price (₹ / Qtl)
                </label>
                <input
                  type="number"
                   min="0"
                  step="50"
                  value={marketPrice}
                  onChange={(e) => setMarketPrice(Math.max(100, Number(e.target.value)))}
                  className="w-full h-10 px-3 text-xs font-bold rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 focus:outline-none focus:border-[var(--brand-color,#0f9a58)] text-slate-950 dark:text-white shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Input Cost / Acre (₹)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={inputCostPerAcre}
                  onChange={(e) => setInputCostPerAcre(Math.max(0, Number(e.target.value)))}
                  className="w-full h-10 px-3 text-xs font-bold rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 focus:outline-none focus:border-[var(--brand-color,#0f9a58)] text-slate-950 dark:text-white shadow-2xs"
                />
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl frosted-glass-sub border border-white/60 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Gross Revenue</span>
                <div className="text-lg font-black text-slate-950 dark:text-white mt-0.5">
                  ₹{grossRevenue.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] font-semibold text-slate-500">{totalYield} Total Quintals</span>
              </div>

              <div className="p-3.5 rounded-2xl frosted-glass-sub border border-white/60 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Total Input Expenses</span>
                <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
                  ₹{totalInputCost.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] font-semibold text-slate-500">Seeds, Fertilizers, Labor</span>
              </div>
            </div>

            {/* Net Profit Banner */}
            <div className="p-4 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] border border-[var(--brand-border)] flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-black text-[var(--brand-text,#0d7342)] uppercase">Net Seasonal Profit</span>
                <div className="text-2xl font-black text-[var(--brand-color,#0f9a58)] mt-0.5">
                  ₹{netProfit.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-black text-[var(--brand-text,#0d7342)] uppercase">Return on Investment</span>
                <div className="text-xl font-black text-slate-950 dark:text-white flex items-center justify-end gap-1">
                  <TrendingUp className="size-4 text-[var(--brand-color,#0f9a58)]" />
                  <span>{roi.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Advisory Note */}
            <div className="flex items-center gap-2 p-3 rounded-2xl frosted-glass-sub border border-white/60 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs">
              <Sparkles className="size-3.5 text-[var(--brand-color,#0f9a58)] shrink-0" />
              <span>Optimizing biological bio-inputs over synthetic chemicals can reduce your input costs by up to 28%.</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
