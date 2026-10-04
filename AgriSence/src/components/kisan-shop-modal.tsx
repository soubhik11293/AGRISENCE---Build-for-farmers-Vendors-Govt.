import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  X,
  Search,
  ExternalLink,
  MapPin,
  Sprout,
  Bug,
  Layers,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Sprout as Sparkles,
  Store,
  Navigation,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  KISAN_SHOP_CATEGORIES,
  buildNearbyKrishiKendraMapUrl,
  getSmartProcurementLinks,
  type AgriPlatform,
  type ProductCategory,
} from '@/src/lib/data/kisan-shop';
import { useTelemetry } from '@/src/context/telemetry-context';
import { useAuth } from '@/src/context/auth-context';
import { getRecentSearchSuggestions, recordSearchHistory, syncSearchHistory } from '@/src/lib/search-history';

interface KisanShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: 'seeds' | 'crop_protection' | 'fertilizers' | 'machinery' | 'hyperlocal';
  initialSearchQuery?: string;
}

export function KisanShopModal({
  isOpen,
  onClose,
  initialCategory = 'seeds',
  initialSearchQuery = '',
}: KisanShopModalProps) {
  const [activeTab, setActiveTab] = useState<'seeds' | 'crop_protection' | 'fertilizers' | 'machinery' | 'hyperlocal'>(
    initialCategory
  );
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [searchHistoryVersion, setSearchHistoryVersion] = useState(0);
  const { weatherData } = useTelemetry();
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialCategory);
    setSearchQuery(initialSearchQuery);
    if (user?.id) void syncSearchHistory(user.id);
  }, [initialCategory, initialSearchQuery, isOpen, user?.id]);

  useEffect(() => {
    const refresh = () => setSearchHistoryVersion((version) => version + 1);
    window.addEventListener('agrisence_search_history_updated', refresh);
    return () => window.removeEventListener('agrisence_search_history_updated', refresh);
  }, []);

  useEffect(() => {
    if (!isOpen || searchQuery.trim().length < 2) return;
    const timer = window.setTimeout(() => recordSearchHistory(searchQuery, 'shop', activeTab), 500);
    return () => window.clearTimeout(timer);
  }, [activeTab, isOpen, searchQuery]);

  // Location string inference for Hyperlocal query
  const userLocationStr = useMemo(() => {
    if (user?.district && user?.state) {
      return `${user.district}, ${user.state} ${user.pincode ? `(${user.pincode})` : ''}`;
    }
    if (weatherData?.locationName) {
      return weatherData.locationName;
    }
    return 'Maharashtra, India';
  }, [user, weatherData]);

  // Current category data
  const currentCategoryData = useMemo(() => {
    return KISAN_SHOP_CATEGORIES.find((c) => c.id === activeTab);
  }, [activeTab]);

  // Filtered platforms
  const filteredPlatforms = useMemo(() => {
    if (activeTab === 'hyperlocal') return [];
    if (!currentCategoryData) return [];
    if (!searchQuery.trim()) return currentCategoryData.platforms;

    const q = searchQuery.toLowerCase();
    const matchingPlatforms = currentCategoryData.platforms.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.features.some((f) => f.toLowerCase().includes(q)) ||
        (p.recommendedFor && p.recommendedFor.some((r) => r.toLowerCase().includes(q)))
    );
    // Commodity names from the market feed will not always exist in the
    // platform metadata. Keep every buying portal visible so its search URL
    // can still query the exact farmer input.
    return matchingPlatforms.length > 0 ? matchingPlatforms : currentCategoryData.platforms;
  }, [activeTab, currentCategoryData, searchQuery]);

  const nearbyKendraUrl = useMemo(() => {
    return buildNearbyKrishiKendraMapUrl(userLocationStr);
  }, [userLocationStr]);

  const recentSearchSuggestions = useMemo(
    () => getRecentSearchSuggestions(6 + searchHistoryVersion).slice(0, 6),
    [searchHistoryVersion]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-[var(--brand-color,#0f9a58)] text-white flex items-center justify-center shadow-md">
                <ShoppingCart className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">
                    Kisan Direct Agri-Store & Procurement Hub
                  </h3>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
                    Pan-India Portals
                  </span>
                </div>
                <p className="text-xs text-slate-650 dark:text-slate-300 font-medium">
                  Verified delivery platforms for seeds, ICAR crop protection, fertilizers, & farm implements
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="size-9 rounded-full frosted-glass-sub hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Quick Category Navigation Pills */}
          <div className="px-6 pt-3 pb-2 border-b border-slate-100 dark:border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
            <button
              type="button"
              onClick={() => setActiveTab('seeds')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'seeds'
                  ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-xs'
                  : 'text-slate-650 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <Sprout className="size-3.5" />
              <span>Seeds & Planting Stock</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('crop_protection')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'crop_protection'
                  ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-xs'
                  : 'text-slate-650 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <Bug className="size-3.5" />
              <span>Pesticides & Crop Protection</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('fertilizers')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'fertilizers'
                  ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-xs'
                  : 'text-slate-650 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="size-3.5" />
              <span>Fertilizers & Soil Nutrition</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('machinery')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'machinery'
                  ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-xs'
                  : 'text-slate-650 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <Wrench className="size-3.5" />
              <span>Sprayers & Machinery</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hyperlocal')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'hyperlocal'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <MapPin className="size-3.5 text-amber-500" />
              <span>Nearby Krishi Kendra (Within 50km)</span>
            </button>
          </div>

          {/* Search & Location Bar */}
          <div className="px-6 py-3 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
            {activeTab !== 'hyperlocal' ? (
              <div className="relative w-full sm:w-80">
                <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter brands, chemicals, tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[var(--brand-color,#0f9a58)]"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Navigation className="size-3.5 text-amber-500 shrink-0" />
                <span>
                  Active Geolocation: <strong className="text-slate-950 dark:text-white">{userLocationStr}</strong>
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 shrink-0 ml-auto">
              <ShieldCheck className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
              <span>100% Genuine Direct Manufacturer Links</span>
            </div>
          </div>

          {/* Main Scrollable Content */}
           <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab !== 'hyperlocal' && recentSearchSuggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Recent searches:</span>
                {recentSearchSuggestions.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => setSearchQuery(suggestion)} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-[var(--brand-text,#0d7342)] text-[10px] font-bold border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20">
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {/* HYPERLOCAL VIEW */}
            {activeTab === 'hyperlocal' ? (
              <div className="space-y-6">
                <div className="p-6 rounded-[28px] bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider">
                        <Store className="size-3" />
                        <span>Hyperlocal Radius Search Engine</span>
                      </div>
                      <h4 className="text-xl font-black text-slate-950 dark:text-white">
                        Find Certified Krishi Seva Kendra & Agri-Shops Near You
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium max-w-xl leading-relaxed">
                        Instantly open Google Maps radar searching all authorized retail outlets, PACS cooperatives, IFFCO Kendras, and seed-fertilizer stores within a 50 km perimeter around <strong>{userLocationStr}</strong>.
                      </p>
                    </div>

                    <a
                      href={nearbyKendraUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md flex items-center gap-2 transition-transform hover:scale-105 shrink-0"
                    >
                      <Navigation className="size-4" />
                      <span>Open Live Maps Radar</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-amber-500/20 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">Verified Retail</span>
                      <p className="text-xs font-black text-slate-950 dark:text-white">Govt Subsidized Fertilizers</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">Neem-coated Urea, DAP, MOP at fixed POS price.</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-amber-500/20 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">Instant Handover</span>
                      <p className="text-xs font-black text-slate-950 dark:text-white">Emergency Pest Outbreak Sprays</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">Zero shipping wait time during peak infestation cycles.</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-amber-500/20 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">Agronomist Advise</span>
                      <p className="text-xs font-black text-slate-950 dark:text-white">Local Block Level Officers</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">Direct consultation with licensed agricultural graduates.</p>
                    </div>
                  </div>
                </div>

                {/* Popular Search Intent Presets */}
                <div className="space-y-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Quick Intent Shortcuts for {userLocationStr.split(',')[0]}
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        title: 'IFFCO Farmer Service Center',
                        query: `IFFCO Bazar farmer service center near ${userLocationStr}`,
                      },
                      {
                        title: 'Certified Seed Distributors & Mahabeej Centers',
                        query: `Mahabeej certified seed shop near ${userLocationStr}`,
                      },
                      {
                        title: 'Pesticide & Bio-Fungicide Retailers',
                        query: `pesticide bio fungicide shop near ${userLocationStr}`,
                      },
                      {
                        title: 'Tractor Spares & Knapsack Spray Pump Service',
                        query: `agricultural spray pump shop repair near ${userLocationStr}`,
                      },
                    ].map((item, idx) => (
                      <a
                        key={idx}
                        href={`https://www.google.com/maps/search/${encodeURIComponent(item.query)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/10 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all flex items-center justify-between gap-2 group"
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin className="size-4 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.title}</span>
                        </div>
                        <ExternalLink className="size-3.5 text-slate-400 group-hover:text-amber-500" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* PLATFORMS GRID VIEW */
              <div className="space-y-6">
                {/* Category Subtitle */}
                {currentCategoryData && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-base font-black text-slate-950 dark:text-white">
                        {currentCategoryData.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {currentCategoryData.subtitle}
                      </p>
                    </div>

                    <span className="text-[11px] font-bold text-slate-500">
                      Showing {filteredPlatforms.length} authorized platforms
                    </span>
                  </div>
                )}

                {/* Platforms Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPlatforms.map((platform) => {
                    const finalTargetUrl =
                      searchQuery.trim() && platform.searchUrlTemplate
                        ? platform.searchUrlTemplate(searchQuery.trim())
                        : platform.url;

                    return (
                      <div
                        key={platform.id}
                        className="p-5 rounded-[28px] bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/10 hover:border-[var(--brand-color,#0f9a58)]/40 hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] text-[10px] font-black uppercase tracking-wider border border-[var(--brand-border)]">
                                <Truck className="size-3" />
                                <span>{platform.badge}</span>
                              </div>
                              <h5 className="text-base font-black text-slate-950 dark:text-white mt-1.5">
                                {platform.name}
                              </h5>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-700 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 shrink-0">
                              {platform.deliveryCoverage}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                            {platform.description}
                          </p>

                          {/* Feature Badges */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {platform.features.map((feat, fIdx) => (
                              <span
                                key={fIdx}
                                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700/80 text-slate-750 dark:text-slate-300 text-[10px] font-bold border border-slate-200/80 dark:border-white/5"
                              >
                                ✓ {feat}
                              </span>
                            ))}
                          </div>

                          {/* Recommended Portfolio Tags */}
                          {platform.recommendedFor && platform.recommendedFor.length > 0 && (
                            <div className="pt-1">
                              <span className="text-[10px] font-bold text-slate-400 block mb-1">
                                Top Available Portfolio:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {platform.recommendedFor.map((item, rIdx) => (
                                  <button
                                    key={rIdx}
                                    type="button"
                                    onClick={() => {
                                      if (platform.searchUrlTemplate) {
                                        window.open(platform.searchUrlTemplate(item), '_blank');
                                      } else {
                                        window.open(platform.url, '_blank');
                                      }
                                    }}
                                    className="px-2 py-0.5 rounded-lg bg-[var(--brand-color,#0f9a58)]/10 hover:bg-[var(--brand-color,#0f9a58)]/20 text-[var(--brand-text,#0d7342)] dark:text-emerald-400 text-[10px] font-bold cursor-pointer transition-colors"
                                  >
                                    {item} ↗
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-2">
                          <a
                            href={finalTargetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-4 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black shadow-xs flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
                          >
                            <span>
                              {searchQuery.trim() ? `Search "${searchQuery}" on ${platform.name}` : `Open ${platform.name}`}
                            </span>
                            <ExternalLink className="size-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Assistance */}
          <div className="px-6 py-3 border-t border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-semibold text-slate-500 shrink-0">
            <div className="flex items-center gap-2">
              <Store className="size-4 text-[var(--brand-color,#0f9a58)]" />
              <span>Need help finding a specific input? Check with your local Krishi Seva Kendra.</span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('hyperlocal')}
              className="text-[var(--brand-text,#0d7342)] dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Locate Kendra on Map</span>
              <ArrowRight className="size-3" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
