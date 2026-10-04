import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  ShieldCheck,
  MapPin,
  Calendar,
  Layers,
  ArrowUpRight,
  Coins,
  Scale,
  Truck,
  Sprout as Sparkles,
  ShoppingCart,
  Headphones,
  CheckCircle2,
  Building,
  CreditCard,
  FileText,
  Clock,
} from 'lucide-react';
import { Navbar } from '@/src/components/landing/navbar';
import { ActiveParcelSelector } from '@/src/components/dashboard/active-parcel-selector';
import { Footer } from '@/src/components/landing/footer';
import { MarketModal } from '@/src/components/market-modal';
import { KisanShopModal } from '@/src/components/kisan-shop-modal';
import { SupportDeskModal } from '@/src/components/support-desk-modal';
import { useTelemetry } from '@/src/context/telemetry-context';
import { useAuth } from '@/src/context/auth-context';
import { useLanguage } from '@/src/context/language-context';

export function HarvestProtectionPage({ onNavigate }: { onNavigate?: (route: string) => void }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { marketData, activeArbitrageTopSpread, isMarketOpen, marketStatusText, weatherData } = useTelemetry();

  const [marketModalOpen, setMarketModalOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [shopCategory, setShopCategory] = useState<'seeds' | 'crop_protection' | 'fertilizers' | 'machinery' | 'hyperlocal'>('machinery');

  // Arbitrage & Storage Simulator state
  const [selectedCrop, setSelectedCrop] = useState<string>('Soybean (Yellow)');
  const [quantityQtl, setQuantityQtl] = useState<number>(65);
  const [holdDays, setHoldDays] = useState<30 | 60 | 90>(60);
  const [spotPrice, setSpotPrice] = useState<number>(() => activeArbitrageTopSpread?.modalPrice || 0);
  const [futureGainPercent, setFutureGainPercent] = useState<number>(18);
  const [warehousingCostPerQtlMonth, setWarehousingCostPerQtlMonth] = useState<number>(35);

  const commodityOptions = useMemo(() => {
    const unique = new Map<string, string>([[selectedCrop, selectedCrop]]);
    marketData.forEach((item) => unique.set(item.commodity, item.commodity));
    return Array.from(unique.values());
  }, [marketData, selectedCrop]);

  useEffect(() => {
    const selectedMarket = marketData.find((item) =>
      item.commodity.toLowerCase().includes(selectedCrop.toLowerCase().split(' ')[0])
    );
    setSpotPrice(selectedMarket?.modalPrice || activeArbitrageTopSpread?.modalPrice || 0);
  }, [activeArbitrageTopSpread, marketData, selectedCrop]);

  const projectedGain = Math.round(spotPrice * (1 + futureGainPercent / 100));
  const totalStorageCost = Math.round((holdDays / 30) * warehousingCostPerQtlMonth * quantityQtl);
  const grossArbitrageProfit = Math.round((projectedGain - spotPrice) * quantityQtl);
  const netArbitrageProfit = grossArbitrageProfit - totalStorageCost;

  return (
    <div className="min-h-screen text-slate-950 dark:text-slate-100 flex flex-col selection:bg-emerald-500/20 selection:text-[#008746]">
      <Navbar currentRoute="/harvest-protection" onNavigate={onNavigate} />

      <main className="flex-1 max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 pb-20 w-full space-y-8">
        <ActiveParcelSelector compact />
        {/* Header Hero Banner */}
        <div className="p-6 sm:p-10 rounded-[36px] bg-gradient-to-br from-emerald-600 via-[#008746] to-teal-900 text-white shadow-2xl relative overflow-hidden space-y-4">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/25 text-emerald-100 text-xs font-black uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="size-3.5 text-amber-300" />
              <span>{t('page.harvest.badge', 'National APMC & Warehouse Arbitrage Suite')}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {t('cta1.title', 'Protect Your Harvest, Maximize Your Mandi Profits')}
            </h1>

            <p className="text-sm sm:text-base text-emerald-100 font-semibold leading-relaxed">
              {t('page.harvest.description', 'Real-time multi-mandi arbitrage analytics, electronic warehouse receipts (e-NWR) storage simulations, and logistics optimization for Indian growers.')}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMarketModalOpen(true)}
                className="px-6 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 text-xs sm:text-sm font-black shadow-lg shadow-black/15 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                <TrendingUp className="size-4 text-[var(--brand-color,#0f9a58)]" />
                <span>{t('page.harvest.market', 'Launch Full Pan-India APMC Matrix')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShopCategory('machinery');
                  setShopOpen(true);
                }}
                className="px-5 py-3 rounded-2xl bg-emerald-900/60 hover:bg-emerald-900/80 border border-white/20 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ShoppingCart className="size-4 text-amber-300" />
                <span>{t('page.harvest.storage', 'Storage & Hermetic Liners')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live APMC Real-Time Top Spreads Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Live Mandi Arbitrage Finder */}
          <div className="lg:col-span-2 p-6 rounded-[32px] frosted-card border border-white/80 dark:border-white/10 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-2xl bg-emerald-500/15 text-[var(--brand-color,#0f9a58)] flex items-center justify-center font-black">
                  <TrendingUp className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-950 dark:text-white">
                    Pan-India Market Dataset & Arbitrage Spreads
                  </h3>
                  <p className="text-xs text-slate-500">
                    Highest profit differentials between local and terminal mandis today
                  </p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isMarketOpen ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
              }`}>
                {isMarketOpen ? 'Live Market Trading' : marketStatusText}
              </span>
            </div>

            <div className="space-y-3">
              {marketData.map((item, idx) => (
                <div
                  key={`hp-mkt-${item.id}-${idx}`}
                  className="p-4 rounded-2xl frosted-glass-sub border border-slate-200/70 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[var(--brand-color,#0f9a58)]/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-950 dark:text-white">
                        {item.commodity}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.variety}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="size-3 text-emerald-600 shrink-0" />
                      <span>{item.market}, {item.district} ({item.state})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/40 dark:border-white/5">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-400 block font-semibold">Spot Modal Rate</span>
                      <span className="text-base font-black text-slate-950 dark:text-white font-mono">
                         ₹{(item.modalPrice || 0).toLocaleString('en-IN')} <span className="text-[11px] font-medium text-slate-500">/qtl</span>
                      </span>
                    </div>

                    {item.arbitrageSpread && (
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-right">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">Max Spread</span>
                        <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 font-mono">
                          +₹{item.arbitrageSpread}/qtl
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Col: Sell vs Store ROI Simulator */}
          <div className="p-6 rounded-[32px] frosted-card border border-white/80 dark:border-white/10 space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/60 dark:border-white/10">
              <div className="size-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                <Coins className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-white">
                  Sell Now vs. Store (e-NWR) Simulator
                </h3>
                <p className="text-xs text-slate-500">
                  Calculate net profit gain after storage and finance costs
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Commodity:
                </label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-bold"
                >
                  {commodityOptions.length > 0 ? commodityOptions.map((commodity) => (
                    <option key={commodity} value={commodity}>{commodity}</option>
                  )) : <option value={selectedCrop}>{selectedCrop}</option>}
                </select>
                <span className="text-[10px] text-slate-500 block mt-1">Live modal rate: ₹{spotPrice.toLocaleString('en-IN')} / qtl</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Harvest Volume (Quintals):
                </label>
                <input
                  type="number"
                  value={quantityQtl}
                  onChange={(e) => setQuantityQtl(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Expected price recovery (%):
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={futureGainPercent}
                    onChange={(e) => setFutureGainPercent(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-bold"
                  />
                </label>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Storage cost (₹/qtl/month):
                  <input
                    type="number"
                    min="0"
                    value={warehousingCostPerQtlMonth}
                    onChange={(e) => setWarehousingCostPerQtlMonth(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-bold"
                  />
                </label>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Holding Period:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 90].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setHoldDays(d as any)}
                      className={`py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                        holdDays === d
                          ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-xs'
                          : 'frosted-glass-sub text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>

              {/* Economic Calculation Output Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Spot Realization:</span>
                  <span className="font-mono font-bold">₹{(spotPrice * quantityQtl).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Warehouse Storage Cost:</span>
                  <span className="font-mono text-rose-600 font-bold">-₹{totalStorageCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20">
                  <span className="font-black text-slate-900 dark:text-white">Net Added Arbitrage Gain:</span>
                  <span className="font-black text-lg text-emerald-700 dark:text-emerald-400 font-mono">
                    +₹{netArbitrageProfit.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <MarketModal isOpen={marketModalOpen} onClose={() => setMarketModalOpen(false)} />
        <KisanShopModal isOpen={shopOpen} onClose={() => setShopOpen(false)} initialCategory={shopCategory} />
        <SupportDeskModal isOpen={supportModalOpen} onClose={() => setSupportModalOpen(false)} />
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
