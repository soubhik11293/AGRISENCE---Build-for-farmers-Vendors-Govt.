import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Search,
  MapPin,
  X,
  Sprout as Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  AlertTriangle,
  RefreshCw,
  Layers,
  BarChart3,
  Scale,
  Calendar,
  Truck,
  Check,
  ChevronRight,
  Info,
  ShoppingCart,
  Eye,
  ClipboardCheck,
} from 'lucide-react';
import {
  ALL_INDIAN_STATES_UTS,
  MARKET_COMMODITY_CATEGORIES,
  MarketTimeRange,
  generateHistoricalPriceData,
  calculateCompareAnalytics,
} from '@/src/lib/data/market';
import { useDiagnosis } from '@/src/context/diagnosis-context';
import { useTelemetry } from '@/src/context/telemetry-context';
import { useAuth } from '@/src/context/auth-context';
import { useFarms } from '@/src/context/farm-context';
import type { MarketPrice } from '@/src/types';
import { ActiveParcelSelector } from '@/src/components/dashboard/active-parcel-selector';
import { KisanShopModal } from '@/src/components/kisan-shop-modal';
import { getRecentSearchSuggestions, recordSearchHistory, syncSearchHistory } from '@/src/lib/search-history';
import { buildSimulationGuidance } from '@/src/lib/simulator-guidance';
import { getAllSimulationHistory } from '@/src/lib/simulator-sync';
import { rankMarketAvoid, rankMarketWatch, type MarketWatchRecommendation } from '@/src/lib/market-watch';
import { getMarketPurchaseHistory, loadCloudMarketPurchaseHistory, recordMarketPurchaseIntent, type MarketPurchaseIntent } from '@/src/lib/market-purchases';

interface MarketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const COMPARE_PALETTE = [
  { hex: '#059669', name: 'Emerald', bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', lightBg: 'bg-emerald-500/15' },
  { hex: '#2563eb', name: 'Blue', bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600', lightBg: 'bg-blue-500/15' },
  { hex: '#d97706', name: 'Amber', bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-600', lightBg: 'bg-amber-500/15' },
  { hex: '#e11d48', name: 'Rose', bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-600', lightBg: 'bg-rose-500/15' },
  { hex: '#9333ea', name: 'Purple', bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-600', lightBg: 'bg-purple-500/15' },
];

export function MarketModal({ isOpen, onClose }: MarketModalProps) {
  const { activeDiagnosis } = useDiagnosis();
  const { user } = useAuth();
  const { selectedFarmId, selectedCropCycleId } = useFarms();
  const {
    marketData,
    refreshMarketData,
    isMarketLoading,
    lastMarketUpdate,
    isMarketOpen,
    marketStatusText,
  } = useTelemetry();

  // Active View Mode: 'list' (Pan-India Mandi Matrix) | 'finance' (Google Finance Price Chart) | 'compare' (Side-by-side Compare)
  const [viewMode, setViewMode] = useState<'list' | 'finance' | 'compare' | 'buy'>('list');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('All States');
  const [filterCategory, setFilterCategory] = useState('All');
  const [viewArbitrageOnly, setViewArbitrageOnly] = useState(false);

  // Google Finance View State
  const [selectedCropForChart, setSelectedCropForChart] = useState<MarketPrice | null>(null);
  const [chartTimeRange, setChartTimeRange] = useState<MarketTimeRange>('1M');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Compare Engine State (Dynamic 2 to 5 commodities)
  const [compareCount, setCompareCount] = useState<2 | 3 | 4 | 5>(3);
  const [compareMetric, setCompareMetric] = useState<'percent' | 'price'>('percent');
  const [compareList, setCompareList] = useState<MarketPrice[]>([]);
  const [compareTimeRange, setCompareTimeRange] = useState<MarketTimeRange>('1M');
  const [hoveredCompareIndex, setHoveredCompareIndex] = useState<number | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [shopQuery, setShopQuery] = useState('');
  const [searchHistoryVersion, setSearchHistoryVersion] = useState(0);
  const [selectedBuyQuote, setSelectedBuyQuote] = useState<MarketPrice | null>(null);
  const [buyQuantityQtl, setBuyQuantityQtl] = useState(1);
  const [purchaseHistory, setPurchaseHistory] = useState<MarketPurchaseIntent[]>([]);
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setSearchHistoryVersion((version) => version + 1);
    window.addEventListener('agrisence_search_history_updated', refresh);
    return () => window.removeEventListener('agrisence_search_history_updated', refresh);
  }, []);

  useEffect(() => {
    if (isOpen && user?.id) void syncSearchHistory(user.id);
  }, [isOpen, user?.id]);

  useEffect(() => {
    if (!isOpen || search.trim().length < 2) return;
    const timer = window.setTimeout(() => recordSearchHistory(search, 'market', filterCategory), 500);
    return () => window.clearTimeout(timer);
  }, [filterCategory, isOpen, search]);

  const openInputShop = (commodity: string) => {
    recordSearchHistory(commodity, 'market', 'commodity-buy');
    setShopQuery(`${commodity} seed`);
    setShopOpen(true);
  };

  const openMandiBuy = (quote: MarketPrice) => {
    recordSearchHistory(`${quote.commodity} ${quote.market}`, 'market', 'mandi-buy');
    setSelectedBuyQuote(quote);
    setBuyQuantityQtl(1);
    setPurchaseMessage(null);
    setViewMode('buy');
  };

  useEffect(() => {
    if (!isOpen) return;
    const filters = { userId: user?.id, farmId: selectedFarmId || undefined };
    setPurchaseHistory(getMarketPurchaseHistory(filters));
    if (user?.id) {
      void loadCloudMarketPurchaseHistory(user.id, selectedFarmId || undefined).then((cloudHistory) => {
        setPurchaseHistory((localHistory) => {
          const merged = new Map<string, MarketPurchaseIntent>();
          [...localHistory, ...cloudHistory].forEach((entry) => merged.set(entry.id, entry));
          return Array.from(merged.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        });
      });
    }
    const refresh = () => setPurchaseHistory(getMarketPurchaseHistory({ userId: user?.id, farmId: selectedFarmId || undefined }));
    window.addEventListener('agrisence_market_purchase_updated', refresh);
    return () => window.removeEventListener('agrisence_market_purchase_updated', refresh);
  }, [isOpen, selectedFarmId, user?.id]);

  const watchRecommendations = useMemo<MarketWatchRecommendation[]>(() => rankMarketWatch(marketData, 8), [marketData]);
  const avoidRecommendations = useMemo<MarketWatchRecommendation[]>(() => rankMarketAvoid(marketData, 6), [marketData]);

  const saveBuyIntent = async () => {
    if (!selectedBuyQuote) return;
    const entry = await recordMarketPurchaseIntent({
      quote: selectedBuyQuote,
      quantityQtl: buyQuantityQtl,
      userId: user?.id,
      farmId: selectedFarmId || undefined,
      cropCycleId: selectedCropCycleId || undefined,
    });
    setPurchaseHistory((history) => [entry, ...history.filter((item) => item.id !== entry.id)]);
    setPurchaseMessage(`Buy plan saved for ${entry.quantityQtl} qtl of ${entry.commodity}.`);
  };

  // Sync compareList with target compareCount
  const handleSelectCount = (count: 2 | 3 | 4 | 5) => {
    setCompareCount(count);
    let updated = [...compareList];
    if (updated.length < count) {
      for (const item of marketData) {
        if (!updated.some((c) => c.id === item.id)) {
          updated.push(item);
          if (updated.length === count) break;
        }
      }
    } else if (updated.length > count) {
      updated = updated.slice(0, count);
    }
    setCompareList(updated);
  };

  const handleSlotCommodityChange = (slotIndex: number, newId: string) => {
    const found = marketData.find((m) => m.id === newId);
    if (!found) return;
    const next = [...compareList];
    next[slotIndex] = found;
    setCompareList(next);
  };

  // Auto-seed compareList when opening compare view or if empty
  useEffect(() => {
    if (viewMode === 'compare' && compareList.length < 2 && marketData.length >= 2) {
      setCompareList(marketData.slice(0, compareCount));
    }
  }, [viewMode, marketData, compareCount, compareList.length]);

  // Default active chart crop if none selected
  const activeChartCrop = useMemo(() => {
    if (selectedCropForChart) return selectedCropForChart;
    return marketData[0] || null;
  }, [selectedCropForChart, marketData]);

  // Compute Historical Time Series for Google Finance Chart
  const historicalData = useMemo(() => {
    if (!activeChartCrop) return null;
    return generateHistoricalPriceData(activeChartCrop, chartTimeRange);
  }, [activeChartCrop, chartTimeRange]);

  // Filtered crops list
  const filteredCrops = useMemo(() => {
    return marketData.filter((item) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.commodity.toLowerCase().includes(q) ||
        item.market.toLowerCase().includes(q) ||
        item.variety.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q) ||
        item.state.toLowerCase().includes(q);
      const matchesState = filterState === 'All States' || item.state.toLowerCase() === filterState.toLowerCase();
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      const matchesArbitrage = !viewArbitrageOnly || (item.arbitrageSpread && item.arbitrageSpread > 0);
      return matchesSearch && matchesState && matchesCategory && matchesArbitrage;
    });
  }, [marketData, search, filterState, filterCategory, viewArbitrageOnly]);

  // Toggle commodity into Compare list (Max 5)
  const toggleCompare = (crop: MarketPrice) => {
    if (compareList.some((c) => c.id === crop.id)) {
      if (compareList.length > 2) {
        const next = compareList.filter((c) => c.id !== crop.id);
        setCompareList(next);
        setCompareCount(Math.max(2, next.length) as 2 | 3 | 4 | 5);
      }
    } else {
      if (compareList.length >= 5) {
        // Replace the oldest
        setCompareList([...compareList.slice(1), crop]);
      } else {
        const next = [...compareList, crop];
        setCompareList(next);
        setCompareCount(Math.min(5, Math.max(2, next.length)) as 2 | 3 | 4 | 5);
      }
    }
  };

  // Compare Analytics
  const compareAnalytics = useMemo(() => {
    if (compareList.length < 2) return null;
    return calculateCompareAnalytics(compareList);
  }, [compareList]);

  const procurementSuggestions = useMemo(() => {
    const unique = new Map<string, { query: string; reason: string }>();
    getAllSimulationHistory(user?.id).slice(0, 20).forEach((record) => {
      const guidance = record.result || buildSimulationGuidance(record);
      guidance.procurementNeeds.forEach((need) => unique.set(need.query.toLowerCase(), { query: need.query, reason: need.reason }));
    });
    getRecentSearchSuggestions(8 + searchHistoryVersion).forEach((query) => {
      if (!unique.has(query.toLowerCase())) unique.set(query.toLowerCase(), { query, reason: 'Based on your recent market and shop searches.' });
    });
    compareList.forEach((item) => {
      const query = `${item.commodity} seed`;
      if (!unique.has(query.toLowerCase())) unique.set(query.toLowerCase(), { query, reason: `Source inputs related to compared ${item.commodity} prices.` });
    });
    return Array.from(unique.values()).slice(0, 8);
  }, [compareList, searchHistoryVersion]);

  const recentSearchSuggestions = useMemo(
    () => getRecentSearchSuggestions(8 + searchHistoryVersion).slice(0, 6),
    [searchHistoryVersion]
  );

  // Multi-Commodity Historical Time Series for Compare Engine
  const multiCompareSeries = useMemo(() => {
    if (compareList.length < 2) return null;
    return compareList.map((crop, index) => {
      const history = generateHistoricalPriceData(crop, compareTimeRange);
      const color = COMPARE_PALETTE[index % COMPARE_PALETTE.length];
      return {
        crop,
        history,
        color,
      };
    });
  }, [compareList, compareTimeRange]);

  // Compute Multi-Commodity SVG Curve Overlays (Percentage or Modal Price)
  const compareChartData = useMemo(() => {
    if (!multiCompareSeries || multiCompareSeries.length === 0) return null;
    const width = 640;
    const height = 190;
    const paddingY = 20;

    // Calculate common scale
    let minVal = 0;
    let maxVal = 0;

    if (compareMetric === 'percent') {
      const allPcts = multiCompareSeries.flatMap((s) => {
        const base = s.history.points[0]?.modalPrice || 1;
        return s.history.points.map((p) => ((p.modalPrice - base) / base) * 100);
      });
      minVal = Math.min(...allPcts, 0);
      maxVal = Math.max(...allPcts, 0);
    } else {
      const allPrices = multiCompareSeries.flatMap((s) => s.history.points.map((p) => p.modalPrice));
      minVal = Math.min(...allPrices);
      maxVal = Math.max(...allPrices);
    }

    const rangeVal = maxVal - minVal || 1;

    const curves = multiCompareSeries.map((s) => {
      const pts = s.history.points;
      const base = pts[0]?.modalPrice || 1;

      const coords = pts.map((p, idx) => {
        const pct = ((p.modalPrice - base) / base) * 100;
        const currentVal = compareMetric === 'percent' ? pct : p.modalPrice;
        const x = (idx / (pts.length - 1 || 1)) * width;
        const y = height - paddingY - ((currentVal - minVal) / rangeVal) * (height - paddingY * 2);
        return {
          x,
          y,
          price: p.modalPrice,
          pct: Number(pct.toFixed(2)),
          date: p.date,
          raw: p,
        };
      });

      let pathStr = `M ${coords[0].x} ${coords[0].y}`;
      for (let i = 1; i < coords.length; i++) {
        const prev = coords[i - 1];
        const curr = coords[i];
        const midX = (prev.x + curr.x) / 2;
        pathStr += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
      }

      return {
        crop: s.crop,
        color: s.color,
        history: s.history,
        path: pathStr,
        coords,
      };
    });

    return { width, height, curves, minVal, maxVal, metric: compareMetric };
  }, [multiCompareSeries, compareMetric]);

  // Hovered Point or Latest Point for chart display
  const activePoint = useMemo(() => {
    if (!historicalData || historicalData.points.length === 0) return null;
    if (hoveredPointIndex !== null && historicalData.points[hoveredPointIndex]) {
      return historicalData.points[hoveredPointIndex];
    }
    return historicalData.points[historicalData.points.length - 1];
  }, [historicalData, hoveredPointIndex]);

  // Chart SVG Coordinates computation
  const chartSvgPath = useMemo(() => {
    if (!historicalData || historicalData.points.length === 0) return { path: '', area: '', points: [] };
    const pts = historicalData.points;
    const width = 600;
    const height = 180;
    const paddingY = 20;

    const prices = pts.map((p) => p.modalPrice);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const rangeP = maxP - minP || 1;

    const coords = pts.map((p, idx) => {
      const x = (idx / (pts.length - 1 || 1)) * width;
      const y = height - paddingY - ((p.modalPrice - minP) / rangeP) * (height - paddingY * 2);
      return { x, y, price: p.modalPrice, date: p.date, raw: p };
    });

    // Build SVG Path string
    let pathStr = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      // Bezier curve approximation
      const prev = coords[i - 1];
      const curr = coords[i];
      const midX = (prev.x + curr.x) / 2;
      pathStr += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const areaStr = `${pathStr} L ${width} ${height} L 0 ${height} Z`;

    return { path: pathStr, area: areaStr, coords, width, height };
  }, [historicalData]);

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
            className="fixed inset-0 bg-slate-950/45 dark:bg-black/75 backdrop-blur-md transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative w-full max-w-4xl rounded-[32px] frosted-card border border-white/85 dark:border-white/14 p-5 sm:p-7 shadow-2xl z-10 space-y-4 max-h-[92vh] overflow-y-auto text-slate-950 dark:text-slate-100"
          >
            {/* Header */}
            <ActiveParcelSelector compact className="mb-2" />

          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-color,#0f9a58)] flex items-center justify-center border border-[var(--brand-border)] shadow-2xs shrink-0">
                  <TrendingUp className="size-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
                      Pan-India Mandi & Financial Terminal
                    </h3>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                        isMarketOpen
                          ? 'bg-emerald-500/15 text-[#00A859] border border-emerald-500/25'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25'
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          isMarketOpen ? 'bg-[#00A859] animate-pulse' : 'bg-amber-500'
                        }`}
                      />
                      <span>{isMarketOpen ? 'Market Open (IST)' : marketStatusText}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-650 dark:text-slate-300 font-semibold">
                    Live mandi quote discovery, observed price history, buy planning & inter-mandi arbitrage
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => refreshMarketData()}
                  disabled={isMarketLoading}
                  className="p-2.5 rounded-2xl frosted-glass-sub text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-white/70 dark:border-white/10 transition-colors cursor-pointer shadow-2xs"
                  title="Refresh Live APMC Rates"
                >
                  <RefreshCw className={`size-4 text-[var(--brand-color,#0f9a58)] ${isMarketLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="size-8 rounded-full frosted-glass-sub hover:bg-white/80 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Platform Navigation Tabs: Live APMC Rates | Interactive Price History | Compare Engine | Buy/Mandi */}
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 text-xs font-black">
              <div className="flex items-center gap-1 flex-1">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <Layers className="size-3.5" />
                  <span>Pan-India APMC Matrix</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('finance')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'finance'
                      ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <BarChart3 className="size-3.5" />
                  <span>Trace Chart</span>
                  {activeChartCrop && (
                    <span className="hidden sm:inline font-mono opacity-80">({activeChartCrop.commodity})</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('buy')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'buy'
                      ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <ShoppingCart className="size-3.5" />
                  <span>Buy / Mandi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('compare')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer relative ${
                    viewMode === 'compare'
                      ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <Scale className="size-3.5" />
                  <span>Compare Mandis</span>
                  {compareList.length > 0 && (
                    <span className="size-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                      {compareList.length}
                    </span>
                  )}
                </button>
              </div>

              {compareList.length > 0 && viewMode !== 'compare' && (
                <button
                  type="button"
                  onClick={() => setViewMode('compare')}
                  className="text-[11px] font-bold text-[var(--brand-text,#0d7342)] bg-emerald-500/10 px-2.5 py-1 rounded-xl hover:bg-emerald-500/20 cursor-pointer"
                >
                  Compare ({compareList.length}/5) →
                </button>
              )}
            </div>

            {/* ========================================================================= */}
            {/* VIEW 1: GOOGLE FINANCE-STYLE INTERACTIVE PRICE HISTORY                    */}
            {/* ========================================================================= */}
            {viewMode === 'finance' && activeChartCrop && historicalData && (
              <div className="space-y-4">
                {/* Active Commodity Header Card */}
                <div className="p-4 sm:p-5 rounded-2xl frosted-glass-sub border border-white/80 dark:border-white/10 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xl font-black text-slate-950 dark:text-white">
                          {activeChartCrop.commodity}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
                          {activeChartCrop.variety}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {activeChartCrop.market} • {activeChartCrop.state}
                        </span>
                      </div>

                      {/* Financial Hero Price & Range Performance */}
                      <div className="flex items-baseline gap-3 mt-1.5 flex-wrap">
                        <span className="text-3xl font-black text-slate-950 dark:text-white font-mono tracking-tight">
                          ₹{(activePoint?.modalPrice || activeChartCrop.modalPrice).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">/quintal</span>

                        <div
                          className={`inline-flex items-center text-xs font-black px-2.5 py-0.5 rounded-full ${
                            historicalData.percentChange >= 0
                              ? 'bg-emerald-500/15 text-[#00A859]'
                              : 'bg-rose-500/15 text-rose-600'
                          }`}
                        >
                          {historicalData.percentChange >= 0 ? (
                            <ArrowUpRight className="size-3.5 mr-0.5" />
                          ) : (
                            <ArrowDownRight className="size-3.5 mr-0.5" />
                          )}
                          <span>
                            {historicalData.percentChange >= 0 ? '+' : ''}
                            ₹{Math.abs(historicalData.priceChange).toLocaleString('en-IN')} ({historicalData.percentChange >= 0 ? '+' : ''}
                            {historicalData.percentChange}%)
                          </span>
                          <span className="text-[10px] font-medium opacity-75 ml-1">
                            {chartTimeRange === '1W'
                              ? 'this week'
                              : chartTimeRange === '1M'
                              ? 'past month'
                              : chartTimeRange === '3M'
                              ? 'past 3M'
                              : chartTimeRange === '1Y'
                              ? 'past year'
                              : 'all-time'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Time Range Selector Tabs (1W, 1M, 3M, 1Y, All) */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 self-start sm:self-auto text-xs font-bold">
                      {(['1W', '1M', '3M', '1Y', 'All'] as MarketTimeRange[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setChartTimeRange(r);
                            setHoveredPointIndex(null);
                          }}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            chartTimeRange === r
                              ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs font-black'
                              : 'text-slate-650 dark:text-slate-300 hover:text-slate-900'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interactive SVG Chart Canvas */}
                  <div
                    className="relative w-full h-[180px] select-none cursor-crosshair group pt-2"
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  >
                    <svg
                      viewBox={`0 0 ${chartSvgPath.width || 600} ${chartSvgPath.height || 180}`}
                      className="w-full h-full overflow-visible"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="financeAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0f9a58" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="#0f9a58" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      <line x1="0" y1="30" x2="600" y2="30" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                      <line x1="0" y1="90" x2="600" y2="90" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                      <line x1="0" y1="150" x2="600" y2="150" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />

                      {/* Area Fill */}
                      {chartSvgPath.area && (
                        <path d={chartSvgPath.area} fill="url(#financeAreaGradient)" />
                      )}

                      {/* Price Curve */}
                      {chartSvgPath.path && (
                        <path
                          d={chartSvgPath.path}
                          fill="none"
                          stroke="#0f9a58"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Interactive Hover Point & Vertical Crosshair */}
                      {hoveredPointIndex !== null && chartSvgPath.coords?.[hoveredPointIndex] && (
                        <>
                          <line
                            x1={chartSvgPath.coords[hoveredPointIndex].x}
                            y1="0"
                            x2={chartSvgPath.coords[hoveredPointIndex].x}
                            y2="180"
                            stroke="#0f9a58"
                            strokeWidth="1.5"
                            strokeDasharray="2 2"
                            strokeOpacity="0.75"
                          />
                          <circle
                            cx={chartSvgPath.coords[hoveredPointIndex].x}
                            cy={chartSvgPath.coords[hoveredPointIndex].y}
                            r="5"
                            fill="#0f9a58"
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                        </>
                      )}
                    </svg>

                    {/* Invisible Hover Hitboxes across all data points */}
                    <div className="absolute inset-0 flex">
                      {historicalData.points.map((_, idx) => (
                        <div
                          key={idx}
                          onMouseEnter={() => setHoveredPointIndex(idx)}
                          className="flex-1 h-full cursor-crosshair"
                        />
                      ))}
                    </div>

                    {/* Floating Crosshair Pill */}
                    {activePoint && (
                      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-[10px] font-mono shadow-md backdrop-blur-md flex items-center gap-2 pointer-events-none">
                        <span>{activePoint.date}:</span>
                        <strong className="text-emerald-400">₹{activePoint.modalPrice.toLocaleString('en-IN')}/qtl</strong>
                        <span className="text-slate-400">({activePoint.arrivalVolume} qtl arrivals)</span>
                      </div>
                    )}
                  </div>

                  {/* Range Statistics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-white/10 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Range High</span>
                      <p className="font-mono font-black text-slate-950 dark:text-white">
                        ₹{historicalData.highPrice.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Range Low</span>
                      <p className="font-mono font-black text-slate-950 dark:text-white">
                        ₹{historicalData.lowPrice.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Daily Price Spread</span>
                      <p className="font-mono font-black text-[var(--brand-text,#0d7342)]">
                        ±₹{Math.round(activeChartCrop.modalPrice * 0.055)}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Avg Arrival Volume</span>
                      <p className="font-mono font-black text-slate-950 dark:text-white">
                        {historicalData.avgVolume.toLocaleString('en-IN')} qtl/day
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Commodity Selector Ribbon */}
                <div>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2 block">
                    Inspect Another Agricultural Commodity:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {marketData.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedCropForChart(item);
                          setHoveredPointIndex(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          activeChartCrop.id === item.id
                            ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs'
                            : 'frosted-glass-sub text-slate-800 dark:text-slate-200 border border-white/60 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{item.commodity}</span>
                        <span className="ml-1.5 font-mono text-[11px] opacity-80">₹{item.modalPrice}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
             )}

             {/* ========================================================================= */}
             {/* VIEW 2: MANDI BUY PLAN & LIVE MARKET WATCH                              */}
             {/* ========================================================================= */}
             {viewMode === 'buy' && (
               <div className="space-y-4">
                 <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                     <div className="flex items-center gap-2 text-sm font-black text-emerald-900 dark:text-emerald-200">
                       <ShoppingCart className="size-4" /> Commodity Buy & Mandi Watch
                     </div>
                     <span className="text-[10px] font-bold text-slate-500">Operational buying model • not a guaranteed return</span>
                   </div>
                   <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                     Rankings use observed modal price position, cross-mandi spread, recent observed movement, and arrival liquidity from the live feed.
                   </p>
                 </div>

                 {selectedBuyQuote && (
                   <div className="p-4 rounded-2xl frosted-card border border-emerald-500/30 space-y-3">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected mandi quote</p>
                         <h3 className="text-base font-black text-slate-950 dark:text-white">{selectedBuyQuote.commodity} • {selectedBuyQuote.variety}</h3>
                         <p className="text-xs font-semibold text-slate-500"><MapPin className="size-3 inline mr-1" />{selectedBuyQuote.market}, {selectedBuyQuote.district}, {selectedBuyQuote.state}</p>
                       </div>
                       <div className="text-right"><span className="text-xl font-black font-mono">₹{selectedBuyQuote.modalPrice.toLocaleString('en-IN')}</span><span className="text-[10px] text-slate-500 block">/{selectedBuyQuote.unit || 'qtl'}</span></div>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                       <label className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-600 dark:text-slate-300">
                         Quantity to buy (qtl)
                         <input type="number" min="0.01" step="0.01" value={buyQuantityQtl} onChange={(event) => setBuyQuantityQtl(Number(event.target.value))} className="w-full mt-1 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm font-black text-slate-950 dark:text-white" />
                       </label>
                       <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10"><span className="text-[10px] font-black uppercase text-slate-500 block">Estimated value</span><strong className="text-lg font-black text-emerald-700 dark:text-emerald-300">₹{Math.round(Math.max(0.01, buyQuantityQtl || 0) * selectedBuyQuote.modalPrice).toLocaleString('en-IN')}</strong><span className="text-[10px] text-slate-500 block">before transport, tax, and quality deductions</span></div>
                       <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10"><span className="text-[10px] font-black uppercase text-slate-500 block">Source</span><strong className="text-xs font-black text-slate-900 dark:text-white">{selectedBuyQuote.source || 'Live mandi feed'}</strong><span className="text-[10px] text-slate-500 block">Observed {selectedBuyQuote.observedAt ? new Date(selectedBuyQuote.observedAt).toLocaleString('en-IN') : 'time unavailable'}</span></div>
                     </div>
                     <div className="flex flex-wrap items-center gap-2">
                       <button type="button" onClick={() => void saveBuyIntent()} className="px-3 py-2 rounded-xl bg-[var(--brand-color,#0f9a58)] text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"><ClipboardCheck className="size-3.5" /> Save buy plan</button>
                       <a href={`https://enam.gov.in/`} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-black cursor-pointer">Open e-NAM trader portal ↗</a>
                       <a href={`https://www.google.com/maps/search/${encodeURIComponent(`${selectedBuyQuote.market} ${selectedBuyQuote.district} ${selectedBuyQuote.state}`)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-black cursor-pointer">Find mandi ↗</a>
                     </div>
                     {purchaseMessage && <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{purchaseMessage}</p>}
                   </div>
                 )}

                 <div className="space-y-2">
                   <div className="flex items-center justify-between"><h3 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2"><Eye className="size-4 text-[var(--brand-color,#0f9a58)]" /> Best live buy/watch options</h3><span className="text-[10px] text-slate-500">{watchRecommendations.length} ranked quotes</span></div>
                   {watchRecommendations.length > 0 ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                     {watchRecommendations.map((recommendation) => (
                       <div key={recommendation.quote.id} className="p-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 space-y-2">
                         <div className="flex items-start justify-between gap-2"><div><span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">{recommendation.label}</span><h4 className="text-sm font-black text-slate-950 dark:text-white">{recommendation.quote.commodity}</h4><p className="text-[10px] text-slate-500">{recommendation.quote.market} • ₹{recommendation.quote.modalPrice.toLocaleString('en-IN')}/qtl</p></div><span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-black">{recommendation.score}/100</span></div>
                         <ul className="space-y-0.5 pl-4">{recommendation.reasons.map((reason) => <li key={reason} className="text-[10px] text-slate-600 dark:text-slate-300 list-disc">{reason}</li>)}</ul>
                         <button type="button" onClick={() => openMandiBuy(recommendation.quote)} className="w-full py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-black cursor-pointer hover:bg-emerald-500/20">Select this mandi quote</button>
                       </div>
                     ))}
                   </div> : <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 text-center"><AlertTriangle className="size-5 mx-auto text-amber-500 mb-2" /><p className="text-sm font-black text-slate-700 dark:text-slate-300">No live mandi quotes available.</p><p className="text-xs text-slate-500 mt-1">Configure DATA_GOV_IN_API_KEY or MANDI_FEED_URL on the server, then refresh.</p></div>}
                 </div>

                 {avoidRecommendations.length > 0 && (
                   <div className="space-y-2 p-4 rounded-2xl bg-rose-500/8 border border-rose-500/20">
                     <div className="flex items-center justify-between"><h3 className="text-sm font-black text-rose-900 dark:text-rose-200 flex items-center gap-2"><AlertTriangle className="size-4" /> Avoid / wait suggestions</h3><span className="text-[10px] text-slate-500">Low observed buy score</span></div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                       {avoidRecommendations.map((recommendation) => <div key={recommendation.quote.id} className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-rose-500/15 flex items-center justify-between gap-2"><div className="min-w-0"><p className="text-xs font-black truncate">{recommendation.quote.commodity} • {recommendation.quote.market}</p><p className="text-[10px] text-slate-500 truncate">₹{recommendation.quote.modalPrice.toLocaleString('en-IN')}/qtl • score {recommendation.score}/100</p></div><span className="text-[10px] font-black text-rose-600 dark:text-rose-300 shrink-0">Avoid / wait</span></div>)}
                     </div>
                   </div>
                 )}

                 <div className="space-y-2"><h3 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2"><ClipboardCheck className="size-4 text-slate-500" /> Buy history ({purchaseHistory.length})</h3>{purchaseHistory.length > 0 ? <div className="space-y-1.5 max-h-48 overflow-y-auto">{purchaseHistory.slice(0, 12).map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/55 border border-slate-200/70 dark:border-white/10"><div className="min-w-0"><p className="text-xs font-black truncate">{entry.quantityQtl} qtl {entry.commodity}</p><p className="text-[10px] text-slate-500 truncate">{entry.market}, {entry.state} • {new Date(entry.createdAt).toLocaleString('en-IN')}</p></div><span className="text-xs font-black text-emerald-700 dark:text-emerald-300">₹{entry.estimatedTotal.toLocaleString('en-IN')}</span></div>)}</div> : <p className="text-xs text-slate-500 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/55">Your saved mandi buy plans will appear here.</p>}</div>
               </div>
             )}

             {/* ========================================================================= */}
             {/* VIEW 2: MULTI-COMMODITY & MANDI COMPARE ENGINE                            */}
            {/* ========================================================================= */}
            {viewMode === 'compare' && (
              <div className="space-y-4">
                {/* Header Information Banner */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-[var(--brand-border)] text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[var(--brand-text,#0d7342)] text-sm">
                        Dynamic 2 to 5 Multi-Commodity Google Finance Comparison Suite
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[var(--brand-color,#0f9a58)] text-white">
                        {compareList.length} Active Curves
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-650 dark:text-slate-300 mt-0.5">
                      Simultaneous multi-asset price trajectory overlay, normalized percentage growth curves, and inter-mandi trade arbitrage analytics.
                    </p>
                  </div>
                  {compareList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSelectCount(2)}
                      className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                    >
                      Reset to 2
                    </button>
                  )}
                </div>

                {/* ===================================================================== */}
                {/* STEPPER WORKFLOW: STEP 1 (SELECT COUNT) & STEP 2 (SELECT ASSETS)      */}
                {/* ===================================================================== */}
                <div className="p-4 rounded-2xl frosted-card border border-white/80 dark:border-white/10 space-y-4 shadow-sm">
                  {/* Step 1: Select Count Chips */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <span className="size-5 rounded-full bg-[var(--brand-color,#0f9a58)] text-white text-[11px] font-mono font-black flex items-center justify-center">
                          1
                        </span>
                        <span>Step 1: Select Comparison Asset Count</span>
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        Choose 2 to 5 commodities or APMC mandis
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {([2, 3, 4, 5] as const).map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => handleSelectCount(cnt)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                            compareCount === cnt
                              ? 'bg-[var(--brand-color,#0f9a58)] border-[var(--brand-color,#0f9a58)] text-white shadow-sm ring-2 ring-[var(--brand-color,#0f9a58)]/30 scale-[1.02]'
                              : 'frosted-glass-sub border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
                          }`}
                        >
                          [{cnt} Commodities]
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Select Assets Dynamic Dropdowns */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <span className="size-5 rounded-full bg-[var(--brand-color,#0f9a58)] text-white text-[11px] font-mono font-black flex items-center justify-center">
                          2
                        </span>
                        <span>Step 2: Configure & Swap Selected Produce ({compareCount} Slots)</span>
                      </span>
                      <span className="text-[11px] font-bold text-[var(--brand-text,#0d7342)]">
                        All Indian APMC produce searchable
                      </span>
                    </div>

                    <div className={`grid grid-cols-1 sm:grid-cols-2 ${compareCount >= 3 ? 'lg:grid-cols-3' : ''} ${compareCount >= 4 ? 'xl:grid-cols-4' : ''} gap-2.5`}>
                      {Array.from({ length: compareCount }).map((_, slotIdx) => {
                        const currentCrop = compareList[slotIdx] || marketData[slotIdx] || marketData[0];
                        const color = COMPARE_PALETTE[slotIdx % COMPARE_PALETTE.length];
                        return (
                          <div
                            key={slotIdx}
                            className="p-3 rounded-2xl frosted-glass-sub border border-slate-200/70 dark:border-white/10 space-y-2 relative shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="size-2.5 rounded-full shrink-0 shadow-xs"
                                  style={{ backgroundColor: color.hex }}
                                />
                                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                  Asset Slot #{slotIdx + 1}
                                </span>
                              </div>
                              <span
                                className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md text-white"
                                style={{ backgroundColor: color.hex }}
                              >
                                {color.name}
                              </span>
                            </div>

                            <select
                              value={currentCrop.id}
                              onChange={(e) => handleSlotCommodityChange(slotIdx, e.target.value)}
                              aria-label={`Select Agricultural Commodity for Slot ${slotIdx + 1}`}
                              className="w-full h-9 px-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-color,#0f9a58)] cursor-pointer truncate"
                            >
                              {marketData.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.commodity} ({m.variety}) - {m.market}, {m.state} [₹{m.modalPrice}/qtl]
                                </option>
                              ))}
                            </select>

                            <div className="flex items-center justify-between text-[11px] pt-0.5">
                              <span className="text-slate-500 truncate max-w-[130px]">
                                {currentCrop.market}
                              </span>
                              <strong className="font-mono font-black text-[var(--brand-text,#0d7342)]">
                                ₹{currentCrop.modalPrice.toLocaleString('en-IN')}/qtl
                              </strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ===================================================================== */}
                {/* MULTI-ASSET INTERACTIVE GOOGLE FINANCE PRICE & PERCENTAGE VISUALIZER  */}
                {/* ===================================================================== */}
                {compareList.length >= 2 && compareChartData && (
                  <div className="p-4 sm:p-5 rounded-2xl frosted-card border border-white/80 dark:border-white/10 space-y-3.5 shadow-sm">
                    {/* Top Control Bar: Title, Metric Toggle & Range Selector */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/60 dark:border-white/10">
                      <div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="size-4 text-[var(--brand-color,#0f9a58)]" />
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            Trace Chart Multi-Asset Trajectory Overlay
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[var(--brand-color,#0f9a58)]/15 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
                            Synchronized Dual-Axis
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">
                          {hoveredCompareIndex !== null && compareChartData.curves[0]?.coords[hoveredCompareIndex]
                            ? `Cursor Date: ${compareChartData.curves[0].coords[hoveredCompareIndex].date}`
                            : `Time Window: Past ${compareTimeRange === '1W' ? '7 Days' : compareTimeRange === '1M' ? '30 Days' : compareTimeRange === '3M' ? '90 Days' : compareTimeRange === '1Y' ? '365 Days' : '2 Years'} • Scale: ${compareMetric === 'percent' ? 'Relative Growth (%)' : 'Absolute Modal Price (₹/qtl)'}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Metric Mode Toggle (Percentage vs Absolute Price) */}
                        <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setCompareMetric('percent')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              compareMetric === 'percent'
                                ? 'bg-[var(--brand-color,#0f9a58)] text-white font-black shadow-2xs'
                                : 'text-slate-650 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                            }`}
                          >
                            % Relative Growth
                          </button>
                          <button
                            type="button"
                            onClick={() => setCompareMetric('price')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              compareMetric === 'price'
                                ? 'bg-[var(--brand-color,#0f9a58)] text-white font-black shadow-2xs'
                                : 'text-slate-650 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                            }`}
                          >
                            ₹ Modal Price
                          </button>
                        </div>

                        {/* Time Range Selector */}
                        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-[11px] font-bold">
                          {(['1W', '1M', '3M', '1Y', 'All'] as MarketTimeRange[]).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                setCompareTimeRange(r);
                                setHoveredCompareIndex(null);
                              }}
                              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                                compareTimeRange === r
                                  ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs font-black'
                                  : 'text-slate-650 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Color-Coded Legend Chips with Live Modal Rate, % Growth & Quick Remove */}
                    <div className="flex flex-wrap items-center gap-2">
                      {compareChartData.curves.map((curve, idx) => {
                        const pt =
                          hoveredCompareIndex !== null && curve.coords[hoveredCompareIndex]
                            ? curve.coords[hoveredCompareIndex]
                            : curve.coords[curve.coords.length - 1];
                        const displayPrice = pt?.price || curve.crop.modalPrice;
                        const displayPct = pt?.pct ?? curve.history.percentChange;
                        return (
                          <div
                            key={`curve-chip-${curve.crop.id}-${idx}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl frosted-glass-sub border border-white/60 dark:border-white/10 text-xs font-bold shadow-2xs"
                          >
                            <span
                              className="size-2.5 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: curve.color.hex }}
                            />
                            <span className="font-black text-slate-900 dark:text-white truncate max-w-[130px]">
                              {curve.crop.commodity}
                            </span>
                            <span className="font-mono text-slate-700 dark:text-slate-200 font-black">
                              ₹{displayPrice.toLocaleString('en-IN')}
                            </span>
                            <span
                              className={`text-[11px] font-black ${
                                displayPct >= 0
                                  ? 'text-[var(--brand-text,#0d7342)]'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {displayPct >= 0 ? `+${displayPct}%` : `${displayPct}%`}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleCompare(curve.crop)}
                              className="text-slate-400 hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                              title="Remove from comparison"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Interactive SVG Chart Overlay */}
                    <div className="relative w-full rounded-2xl bg-white/50 dark:bg-slate-900/50 p-2 border border-slate-200/60 dark:border-white/10">
                      <svg
                        viewBox={`0 0 ${compareChartData.width} ${compareChartData.height}`}
                        className="w-full h-48 sm:h-56 overflow-visible select-none"
                      >
                        <defs>
                          {compareChartData.curves.map((c, idx) => (
                            <linearGradient
                              key={`grad-${c.crop.id}-${idx}`}
                              id={`grad-${c.crop.id}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor={c.color.hex} stopOpacity="0.2" />
                              <stop offset="100%" stopColor={c.color.hex} stopOpacity="0.0" />
                            </linearGradient>
                          ))}
                        </defs>

                        {/* Horizontal reference grid lines */}
                        <line
                          x1="0"
                          y1="35"
                          x2={compareChartData.width}
                          y2="35"
                          stroke="currentColor"
                          className="text-slate-200 dark:text-slate-800"
                          strokeDasharray="4 4"
                        />
                        <line
                          x1="0"
                          y1="95"
                          x2={compareChartData.width}
                          y2="95"
                          stroke="currentColor"
                          className="text-slate-200 dark:text-slate-800"
                          strokeDasharray="4 4"
                        />
                        <line
                          x1="0"
                          y1="155"
                          x2={compareChartData.width}
                          y2="155"
                          stroke="currentColor"
                          className="text-slate-200 dark:text-slate-800"
                          strokeDasharray="4 4"
                        />

                        {/* Multi-Commodity Bezier Curves */}
                        {compareChartData.curves.map((curve, idx) => (
                          <path
                            key={`path-${curve.crop.id}-${idx}`}
                            d={curve.path}
                            fill="none"
                            stroke={curve.color.hex}
                            strokeWidth="2.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="transition-all duration-300"
                          />
                        ))}

                        {/* Synchronized Vertical Crosshair Guide */}
                        {hoveredCompareIndex !== null &&
                          compareChartData.curves[0]?.coords[hoveredCompareIndex] && (
                            <g>
                              <line
                                x1={compareChartData.curves[0].coords[hoveredCompareIndex].x}
                                y1={10}
                                x2={compareChartData.curves[0].coords[hoveredCompareIndex].x}
                                y2={compareChartData.height - 10}
                                stroke="#94a3b8"
                                strokeDasharray="3 3"
                                strokeWidth="1.5"
                              />

                              {/* Highlight dots on each curve */}
                              {compareChartData.curves.map((curve, idx) => {
                                const pt = curve.coords[hoveredCompareIndex];
                                if (!pt) return null;
                                return (
                                  <circle
                                    key={`dot-${curve.crop.id}-${idx}`}
                                    cx={pt.x}
                                    cy={pt.y}
                                    r="5.5"
                                    fill={curve.color.hex}
                                    stroke="#ffffff"
                                    strokeWidth="2.5"
                                    className="drop-shadow-xs"
                                  />
                                );
                              })}
                            </g>
                          )}

                        {/* Transparent mouse tracking overlay */}
                        <rect
                          x="0"
                          y="0"
                          width={compareChartData.width}
                          height={compareChartData.height}
                          fill="transparent"
                          className="cursor-crosshair"
                          onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const mouseX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                            const totalPts = compareChartData.curves[0]?.coords.length || 1;
                            const idx = Math.min(
                              totalPts - 1,
                              Math.max(0, Math.round(mouseX * (totalPts - 1)))
                            );
                            setHoveredCompareIndex(idx);
                          }}
                          onMouseLeave={() => setHoveredCompareIndex(null)}
                        />
                      </svg>

                      {/* X-Axis Date Reference Labels */}
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-1 pt-1 border-t border-slate-200/50 dark:border-white/5">
                        <span>{compareChartData.curves[0]?.history.points[0]?.date || 'Start'}</span>
                        <span>
                          {compareChartData.curves[0]?.history.points[
                            Math.floor((compareChartData.curves[0]?.history.points.length || 1) / 2)
                          ]?.date || 'Mid'}
                        </span>
                        <span className="text-[var(--brand-color,#0f9a58)] font-black">
                          {compareChartData.curves[0]?.history.points[
                            (compareChartData.curves[0]?.history.points.length || 1) - 1
                          ]?.date || 'Today'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===================================================================== */}
                {/* DYNAMIC ARBITRAGE, SPREAD & DISPARITY MATRIX                          */}
                {/* ===================================================================== */}
                {compareAnalytics && (
                  <div className="p-4 rounded-2xl frosted-glass-sub border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-sm text-[var(--brand-text,#0d7342)]">
                        <Sparkles className="size-4 text-[var(--brand-color,#0f9a58)]" />
                        <span>Dynamic Multi-Commodity Arbitrage & Disparity Matrix</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">
                        {compareAnalytics.comparable ? `Same commodity comparison • ${compareAnalytics.comparableCount} comparable mandi quotes` : 'Select the same commodity, variety, grade, and reporting date for arbitrage'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                      {/* Card 1: Highest Quote Mandi */}
                      <div className="p-3 rounded-xl bg-white/85 dark:bg-slate-800/85 border border-slate-200 dark:border-white/10 space-y-1">
                        <span className="text-[10px] font-black text-emerald-600 uppercase block tracking-wider">
                          Peak Mandi Quote
                        </span>
                        <strong className="text-base font-black font-mono text-slate-900 dark:text-white block">
                          ₹{compareAnalytics.maxPrice.toLocaleString('en-IN')}/qtl
                        </strong>
                        <p className="text-[11px] font-semibold text-slate-650 dark:text-slate-300 truncate">
                          {compareAnalytics.highestCrop.commodity}
                        </p>
                        <span className="text-[10px] text-slate-500 truncate block">
                          {compareAnalytics.highestCrop.market}
                        </span>
                      </div>

                      {/* Card 2: Lowest Quote Mandi */}
                      <div className="p-3 rounded-xl bg-white/85 dark:bg-slate-800/85 border border-slate-200 dark:border-white/10 space-y-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase block tracking-wider">
                          Base Mandi Quote
                        </span>
                        <strong className="text-base font-black font-mono text-slate-900 dark:text-white block">
                          ₹{compareAnalytics.minPrice.toLocaleString('en-IN')}/qtl
                        </strong>
                        <p className="text-[11px] font-semibold text-slate-650 dark:text-slate-300 truncate">
                          {compareAnalytics.lowestCrop.commodity}
                        </p>
                        <span className="text-[10px] text-slate-500 truncate block">
                          {compareAnalytics.lowestCrop.market}
                        </span>
                      </div>

                      {/* Card 3: Gross Price Disparity */}
                      <div className="p-3 rounded-xl bg-white/85 dark:bg-slate-800/85 border border-slate-200 dark:border-white/10 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
                          Gross Price Disparity
                        </span>
                        <strong className="text-base font-black font-mono text-slate-900 dark:text-white block">
                          ₹{compareAnalytics.spreadDisparity.toLocaleString('en-IN')}/qtl
                        </strong>
                        <p className="text-[10px] text-slate-500">
                          Spread across compared produce assets
                        </p>
                      </div>

                      {/* Card 4: Transit Haulage Deduction */}
                      <div className="p-3 rounded-xl bg-white/85 dark:bg-slate-800/85 border border-slate-200 dark:border-white/10 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
                          Transit Haulage Deduction
                        </span>
                        <strong className="text-base font-black font-mono text-amber-600 block">
                          -₹{compareAnalytics.estimatedTransitCost.toLocaleString('en-IN')}/qtl
                        </strong>
                        <p className="text-[10px] text-slate-500">
                          Approx 180km inter-hub logistics cost
                        </p>
                      </div>

                      {/* Card 5: Net Arbitrage Yield */}
                      <div className="p-3 rounded-xl bg-white/85 dark:bg-slate-800/85 border border-emerald-500/40 space-y-1">
                        <span className="text-[10px] font-black text-[var(--brand-text,#0d7342)] uppercase block tracking-wider">
                          Net Arbitrage Yield
                        </span>
                        <strong className="text-base font-black font-mono text-[var(--brand-color,#0f9a58)] block">
                          +₹{compareAnalytics.netArbitragePotential.toLocaleString('en-IN')}/qtl
                        </strong>
                        <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                          Route: {compareAnalytics.bestReturnMandi}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {procurementSuggestions.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-black text-amber-900 dark:text-amber-200">
                      <ShoppingCart className="size-4" /> Buy suggestions from this comparison and your search history
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {procurementSuggestions.map((suggestion) => (
                        <button key={suggestion.query} type="button" onClick={() => openInputShop(suggestion.query)} className="px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-amber-500/25 text-left cursor-pointer hover:border-amber-500/60">
                          <span className="block text-[11px] font-black text-slate-900 dark:text-white">{suggestion.query}</span>
                          <span className="block text-[9px] text-slate-500 max-w-48 truncate">{suggestion.reason}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compare Cards Row (Dynamic 2 to 5 Cards Grid) */}
                {compareList.length > 0 && (
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 ${
                      compareList.length === 3
                        ? 'lg:grid-cols-3'
                        : compareList.length === 4
                        ? 'lg:grid-cols-4'
                        : compareList.length >= 5
                        ? 'lg:grid-cols-3 xl:grid-cols-5'
                        : 'lg:grid-cols-2'
                    } gap-3`}
                  >
                    {compareList.map((crop, idx) => {
                      const color = COMPARE_PALETTE[idx % COMPARE_PALETTE.length];
                      return (
                        <div
                          key={`compare-${crop.id}-${idx}`}
                          className="p-4 rounded-2xl frosted-glass-sub border border-white/80 dark:border-white/10 space-y-3 relative shadow-xs overflow-hidden"
                        >
                          {/* Color bar matching the Google Finance chart curve */}
                          <div
                            className="absolute top-0 left-0 right-0 h-1.5"
                            style={{ backgroundColor: color.hex }}
                          />

                          <button
                            type="button"
                            onClick={() => toggleCompare(crop)}
                            className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Remove from comparison"
                          >
                            <X className="size-4" />
                          </button>

                          <div className="pt-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="size-2 rounded-full shrink-0"
                                style={{ backgroundColor: color.hex }}
                              />
                              <span className="text-sm font-black text-slate-950 dark:text-white truncate">
                                {crop.commodity}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                              {crop.variety} • {crop.category}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">APMC Mandi:</span>
                              <strong className="text-slate-900 dark:text-white truncate max-w-[130px]">
                                {crop.market}
                              </strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">State / Region:</span>
                              <span className="font-semibold">{crop.state}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Day Range:</span>
                              <span className="font-mono">₹{crop.minPrice} - ₹{crop.maxPrice}</span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-white/10">
                              <span className="font-bold text-slate-700 dark:text-slate-300">Modal Price:</span>
                              <strong className="text-base font-black font-mono text-[var(--brand-color,#0f9a58)]">
                                ₹{crop.modalPrice.toLocaleString('en-IN')}/qtl
                              </strong>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCropForChart(crop);
                                setViewMode('finance');
                              }}
                              className="py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>Price History</span>
                              <ChevronRight className="size-3" />
                            </button>
                            <button type="button" onClick={() => openMandiBuy(crop)} className="py-1.5 rounded-xl bg-emerald-500/10 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1 cursor-pointer">
                              <ShoppingCart className="size-3" /> Buy
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW 3: PAN-INDIA APMC MATRIX & COMMODITIES TABLE                         */}
            {/* ========================================================================= */}
            {viewMode === 'list' && (
              <div className="space-y-3.5">
                {/* Search and Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="relative sm:col-span-1">
                    <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search crop, variety, mandi, state..."
                      className="w-full h-10 pl-9 pr-3 text-xs sm:text-sm font-semibold rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 focus:outline-none focus:border-[var(--brand-color,#0f9a58)] text-slate-950 dark:text-white placeholder:text-slate-400 transition-all shadow-2xs"
                    />
                  </div>

                  {/* All 28 States & 8 UTs Filter */}
                  <div className="sm:col-span-1">
                    <select
                      value={filterState}
                      onChange={(e) => setFilterState(e.target.value)}
                      aria-label="Filter by Indian State or Union Territory"
                      className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 text-xs font-bold text-slate-950 dark:text-white focus:outline-none focus:border-[var(--brand-color,#0f9a58)] shadow-2xs truncate cursor-pointer"
                    >
                      {ALL_INDIAN_STATES_UTS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Commodity Categories Filter */}
                  <div className="sm:col-span-1">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      aria-label="Filter by Agricultural Commodity Category"
                      className="w-full h-10 px-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 text-xs font-bold text-slate-950 dark:text-white focus:outline-none focus:border-[var(--brand-color,#0f9a58)] shadow-2xs truncate cursor-pointer"
                    >
                      {MARKET_COMMODITY_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c === 'All' ? 'All Commodity Categories' : c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filter helper pills & count */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
                        <span>Showing {filteredCrops.length} observed mandi quotes{marketData[0]?.source ? ` • ${marketData[0].source}` : ''}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewArbitrageOnly(!viewArbitrageOnly)}
                      className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
                        viewArbitrageOnly
                          ? 'bg-[var(--brand-color,#0f9a58)] text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {viewArbitrageOnly ? '● Positive Arbitrage Only' : 'Show All Spreads'}
                    </button>
                  </div>
                </div>

                {recentSearchSuggestions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 px-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Recent searches:</span>
                    {recentSearchSuggestions.map((suggestion) => (
                      <button key={suggestion} type="button" onClick={() => setSearch(suggestion)} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-[var(--brand-text,#0d7342)] text-[10px] font-bold border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20">
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {/* Crops List */}
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {filteredCrops.length > 0 ? (
                    filteredCrops.map((item, idx) => {
                      const change = item.changePercent ?? 0;
                      const isCompared = compareList.some((c) => c.id === item.id);
                      return (
                        <div
                          key={`crop-item-${item.id}-${idx}`}
                          className="p-3.5 sm:p-4 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-[var(--brand-color,#0f9a58)]/40 transition-all"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-slate-950 dark:text-white">
                                {item.commodity}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
                                {item.variety}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {item.category}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-650 dark:text-slate-300 mt-1 flex-wrap">
                              <span className="flex items-center gap-1">
                                <MapPin className="size-3 text-[var(--brand-color,#0f9a58)]" />
                                <span>{item.market} ({item.state})</span>
                              </span>
                              <span>•</span>
                              <span>Range: ₹{item.minPrice.toLocaleString('en-IN')} - ₹{item.maxPrice.toLocaleString('en-IN')}</span>
                              {item.arrivalVolume && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-slate-500">Arrivals: {item.arrivalVolume}</span>
                                </>
                              )}
                            </div>

                            {item.highestMandi && (
                              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-black text-[var(--brand-text,#0d7342)] bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-[var(--brand-border)]">
                                <Sparkles className="size-3 text-[var(--brand-color,#0f9a58)]" />
                                <span className="truncate">Highest Mandi: {item.highestMandi} (₹{item.highestMandiPrice?.toLocaleString('en-IN')}/qtl)</span>
                                <span className="ml-auto font-black text-[var(--brand-color,#0f9a58)] shrink-0">
                                  +₹{item.arbitrageSpread} spread
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                            <div className="text-right">
                              <div className="text-lg font-black text-slate-950 dark:text-white font-mono">
                                ₹{item.modalPrice.toLocaleString('en-IN')}{' '}
                                <span className="text-[10px] font-normal text-slate-500">/qtl</span>
                              </div>
                              <span
                                className={`inline-flex items-center text-xs font-bold ${
                                   change >= 0 ? 'text-[var(--brand-text,#0d7342)]' : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                 {change >= 0 ? (
                                  <ArrowUpRight className="size-3 mr-0.5" />
                                ) : (
                                  <ArrowDownRight className="size-3 mr-0.5" />
                                )}
                                 {change >= 0 ? `+${change}%` : `${change}%`}
                              </span>
                            </div>

                            {/* Action Buttons: View Chart & Toggle Compare */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCropForChart(item);
                                  setViewMode('finance');
                                }}
                                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors flex items-center gap-1 cursor-pointer"
                                title="View Trace Chart Price History"
                              >
                                <BarChart3 className="size-3" />
                                <span>Chart</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleCompare(item)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  isCompared
                                    ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs'
                                    : 'frosted-glass-sub text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-white'
                                }`}
                                title="Add to Multi-Commodity Compare"
                              >
                                <Scale className="size-3" />
                                <span>{isCompared ? 'Compared' : 'Compare'}</span>
                              </button>
                              <button type="button" onClick={() => openMandiBuy(item)} className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors flex items-center gap-1 cursor-pointer" title="Create a mandi buy plan">
                                <ShoppingCart className="size-3" />
                                <span>Buy</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-xs font-semibold text-slate-500 rounded-2xl frosted-glass-sub border border-dashed border-slate-300 dark:border-white/10">
                      No mandis found matching &ldquo;{search || filterState}&rdquo;. Try another commodity or select &ldquo;All States&rdquo;.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer Summary */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] border border-[var(--brand-border)] text-xs font-semibold text-slate-800 dark:text-slate-200">
              <div className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-[var(--brand-color,#0f9a58)] shrink-0" />
                <span>{marketData.length > 0 ? `Rates are sourced from ${marketData[0]?.source || 'the live mandi feed'}; each quote carries its observation time.` : 'No live mandi rates are currently available; configure the server feed before using a buy decision.'}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 shrink-0">
                {lastMarketUpdate}
              </span>
            </div>
          </motion.div>
        </div>
      )}
      <KisanShopModal isOpen={shopOpen} onClose={() => setShopOpen(false)} initialCategory="seeds" initialSearchQuery={shopQuery} />
    </AnimatePresence>
  );
}
