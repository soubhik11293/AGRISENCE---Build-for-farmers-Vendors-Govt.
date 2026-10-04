import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Building,
  CreditCard,
  FileText,
  Clock,
  RotateCcw,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sprout as Sparkles,
  MapPin,
  Scale,
  DollarSign,
  ShieldCheck,
  Droplets,
  ExternalLink,
  ChevronRight,
  Info,
  Truck,
  Layers,
  Package,
} from 'lucide-react';
import { useTelemetry } from '@/src/context/telemetry-context';
import { useAuth } from '@/src/context/auth-context';
import { saveSimulationTelemetry } from '@/src/lib/simulator-sync';

export interface SellVsStoreProps {
  onClose?: () => void;
  onOpenMarket?: () => void;
}

// 1. Pan-India Produce Directory (36 Commodities Across 6 Trade Classes)
export interface CommodityDefinition {
  id: string;
  name: string;
  category: 'cereals' | 'pulses' | 'oilseeds' | 'spices' | 'fiber' | 'perishables';
  categoryLabel: string;
  defaultModalPrice: number;
  safeMoistureBaseline: number;
  respirationRateMonthly: number; // % biomass loss per month
  seasonalTaperCurveMultiplier: number; // 5-year modal spread multiplier
}

export const COMMODITY_CATALOG: CommodityDefinition[] = [
  // 1. Cereals & Food Grains (11)
  { id: 'paddy_basmati_1121', name: 'Basmati Paddy (Pusa 1121)', category: 'cereals', categoryLabel: 'Cereals & Food Grains', defaultModalPrice: 3850, safeMoistureBaseline: 12.0, respirationRateMonthly: 0.15, seasonalTaperCurveMultiplier: 1.22 },
  { id: 'paddy_non_basmati_ir64', name: 'Non-Basmati Paddy (IR-64 / Swarna)', category: 'cereals', categoryLabel: 'Cereals & Food Grains', defaultModalPrice: 2280, safeMoistureBaseline: 12.0, respirationRateMonthly: 0.18, seasonalTaperCurveMultiplier: 1.12 },
  { id: 'wheat_sharbati', name: 'Sharbati Wheat', category: 'cereals', categoryLabel: 'Cereals & Food Grains', defaultModalPrice: 3600, safeMoistureBaseline: 12.0, respirationRateMonthly: 0.12, seasonalTaperCurveMultiplier: 1.18 },
  { id: 'wheat_lok1_durum', name: 'Lok-1 Durum Wheat', category: 'cereals', categoryLabel: 'Cereals & Food Grains', defaultModalPrice: 2550, safeMoistureBaseline: 12.0, respirationRateMonthly: 0.14, seasonalTaperCurveMultiplier: 1.14 },
  { id: 'maize_hybrid_yellow', name: 'Hybrid Yellow Starch Maize', category: 'cereals', categoryLabel: 'Cereals & Food Grains', defaultModalPrice: 2150, safeMoistureBaseline: 12.0, respirationRateMonthly: 0.20, seasonalTaperCurveMultiplier: 1.16 },
  { id: 'pearl_millet_bajra', name: 'Pearl Millet (Bajra)', category: 'cereals', categoryLabel: 'Cereals & Food Grains', defaultModalPrice: 2350, safeMoistureBaseline: 12.0, respirationRateMonthly: 0.22, seasonalTaperCurveMultiplier: 1.15 },
  { id: 'sorghum_jowar_maldandi', name: 'Sorghum (Jowar Maldandi)', category: 'cereals', categoryLabel: 'Cereals & Food Grains', defaultModalPrice: 3400, safeMoistureBaseline: 12.0, respirationRateMonthly: 0.16, seasonalTaperCurveMultiplier: 1.19 },
  { id: 'finger_millet_ragi', name: 'Finger Millet (Ragi GPU-28)', category: 'cereals', categoryLabel: 'Cereals & Food Grains', defaultModalPrice: 3800, safeMoistureBaseline: 12.0, respirationRateMonthly: 0.10, seasonalTaperCurveMultiplier: 1.15 },
  { id: 'barley_feed_jau', name: 'Feed Barley (Jau)', category: 'cereals', categoryLabel: 'Cereals & Food Grains', defaultModalPrice: 1980, safeMoistureBaseline: 12.0, respirationRateMonthly: 0.17, seasonalTaperCurveMultiplier: 1.13 },
  { id: 'kodo_millet', name: 'Kodo Millet', category: 'cereals', categoryLabel: 'Cereals & Food Grains', defaultModalPrice: 3500, safeMoistureBaseline: 12.0, respirationRateMonthly: 0.11, seasonalTaperCurveMultiplier: 1.16 },
  { id: 'foxtail_millet_kangni', name: 'Foxtail Millet (Kangni)', category: 'cereals', categoryLabel: 'Cereals & Food Grains', defaultModalPrice: 3650, safeMoistureBaseline: 12.0, respirationRateMonthly: 0.12, seasonalTaperCurveMultiplier: 1.17 },

  // 2. Pulses & Legumes (9)
  { id: 'chana_desi_bengal_gram', name: 'Desi Chana (Bengal Gram)', category: 'pulses', categoryLabel: 'Pulses & Legumes', defaultModalPrice: 5800, safeMoistureBaseline: 10.0, respirationRateMonthly: 0.14, seasonalTaperCurveMultiplier: 1.20 },
  { id: 'chana_kabuli_dollar', name: 'Kabuli Chana (Dollar Bold)', category: 'pulses', categoryLabel: 'Pulses & Legumes', defaultModalPrice: 11200, safeMoistureBaseline: 10.0, respirationRateMonthly: 0.12, seasonalTaperCurveMultiplier: 1.25 },
  { id: 'tur_arhar_red_bold', name: 'Pigeonpea (Tur / Arhar Red Bold)', category: 'pulses', categoryLabel: 'Pulses & Legumes', defaultModalPrice: 9400, safeMoistureBaseline: 10.0, respirationRateMonthly: 0.15, seasonalTaperCurveMultiplier: 1.24 },
  { id: 'moong_green_shining', name: 'Green Gram (Moong Shining)', category: 'pulses', categoryLabel: 'Pulses & Legumes', defaultModalPrice: 7850, safeMoistureBaseline: 10.0, respirationRateMonthly: 0.16, seasonalTaperCurveMultiplier: 1.18 },
  { id: 'urad_black_faq', name: 'Black Gram (Urad FAQ)', category: 'pulses', categoryLabel: 'Pulses & Legumes', defaultModalPrice: 7200, safeMoistureBaseline: 10.0, respirationRateMonthly: 0.15, seasonalTaperCurveMultiplier: 1.19 },
  { id: 'masur_lentil_bold_red', name: 'Lentil (Masur Bold Red)', category: 'pulses', categoryLabel: 'Pulses & Legumes', defaultModalPrice: 6100, safeMoistureBaseline: 10.0, respirationRateMonthly: 0.13, seasonalTaperCurveMultiplier: 1.16 },
  { id: 'moth_bean_matki', name: 'Moth Bean (Matki)', category: 'pulses', categoryLabel: 'Pulses & Legumes', defaultModalPrice: 6800, safeMoistureBaseline: 10.0, respirationRateMonthly: 0.14, seasonalTaperCurveMultiplier: 1.15 },
  { id: 'field_pea_matar', name: 'Field Pea (White / Green Matar)', category: 'pulses', categoryLabel: 'Pulses & Legumes', defaultModalPrice: 4200, safeMoistureBaseline: 10.0, respirationRateMonthly: 0.18, seasonalTaperCurveMultiplier: 1.14 },
  { id: 'rajma_chitra_himalayan', name: 'Rajma (Chitra Himalayan)', category: 'pulses', categoryLabel: 'Pulses & Legumes', defaultModalPrice: 12500, safeMoistureBaseline: 10.0, respirationRateMonthly: 0.11, seasonalTaperCurveMultiplier: 1.22 },

  // 3. Oilseeds & Industrial Feeds (9)
  { id: 'soybean_yellow_js335', name: 'Yellow Soybean (JS-335)', category: 'oilseeds', categoryLabel: 'Oilseeds & Industrial Feeds', defaultModalPrice: 4850, safeMoistureBaseline: 9.0, respirationRateMonthly: 0.20, seasonalTaperCurveMultiplier: 1.19 },
  { id: 'mustard_rapeseed_42oil', name: 'Mustard / Rapeseed (42% Oil Content)', category: 'oilseeds', categoryLabel: 'Oilseeds & Industrial Feeds', defaultModalPrice: 5600, safeMoistureBaseline: 9.0, respirationRateMonthly: 0.16, seasonalTaperCurveMultiplier: 1.21 },
  { id: 'groundnut_pods_gg20', name: 'Groundnut Pods (GG-20 Vijay)', category: 'oilseeds', categoryLabel: 'Oilseeds & Industrial Feeds', defaultModalPrice: 6250, safeMoistureBaseline: 9.0, respirationRateMonthly: 0.22, seasonalTaperCurveMultiplier: 1.18 },
  { id: 'sesame_white_export', name: 'White Sesame (Til Export Grade)', category: 'oilseeds', categoryLabel: 'Oilseeds & Industrial Feeds', defaultModalPrice: 14200, safeMoistureBaseline: 9.0, respirationRateMonthly: 0.12, seasonalTaperCurveMultiplier: 1.24 },
  { id: 'sesame_black', name: 'Black Sesame', category: 'oilseeds', categoryLabel: 'Oilseeds & Industrial Feeds', defaultModalPrice: 13500, safeMoistureBaseline: 9.0, respirationRateMonthly: 0.13, seasonalTaperCurveMultiplier: 1.22 },
  { id: 'sunflower_seed_high_oil', name: 'Sunflower Seed (High-Oil Hybrid)', category: 'oilseeds', categoryLabel: 'Oilseeds & Industrial Feeds', defaultModalPrice: 4950, safeMoistureBaseline: 9.0, respirationRateMonthly: 0.24, seasonalTaperCurveMultiplier: 1.17 },
  { id: 'safflower_kardi', name: 'Safflower (Kardi)', category: 'oilseeds', categoryLabel: 'Oilseeds & Industrial Feeds', defaultModalPrice: 5300, safeMoistureBaseline: 9.0, respirationRateMonthly: 0.18, seasonalTaperCurveMultiplier: 1.16 },
  { id: 'castor_seed_gch7', name: 'Castor Seed (Arandi GCH-7)', category: 'oilseeds', categoryLabel: 'Oilseeds & Industrial Feeds', defaultModalPrice: 5900, safeMoistureBaseline: 9.0, respirationRateMonthly: 0.15, seasonalTaperCurveMultiplier: 1.19 },
  { id: 'linseed_flaxseed_alsi', name: 'Linseed / Flaxseed (Alsi High Omega-3)', category: 'oilseeds', categoryLabel: 'Oilseeds & Industrial Feeds', defaultModalPrice: 6400, safeMoistureBaseline: 9.0, respirationRateMonthly: 0.14, seasonalTaperCurveMultiplier: 1.20 },

  // 4. Spices, Aromatics & Plantation (10)
  { id: 'turmeric_nizamabad_finger', name: 'Nizamabad Turmeric Finger (Curcumin 3.5%+)', category: 'spices', categoryLabel: 'Spices & Aromatics', defaultModalPrice: 13800, safeMoistureBaseline: 10.0, respirationRateMonthly: 0.08, seasonalTaperCurveMultiplier: 1.30 },
  { id: 'turmeric_lakadong_7curcumin', name: 'Lakadong Turmeric (High Curcumin 7.5%+)', category: 'spices', categoryLabel: 'Spices & Aromatics', defaultModalPrice: 22000, safeMoistureBaseline: 10.0, respirationRateMonthly: 0.06, seasonalTaperCurveMultiplier: 1.35 },
  { id: 'cumin_unjha_jeera', name: 'Unjha Machine-Clean Cumin (Jeera)', category: 'spices', categoryLabel: 'Spices & Aromatics', defaultModalPrice: 26500, safeMoistureBaseline: 9.0, respirationRateMonthly: 0.09, seasonalTaperCurveMultiplier: 1.28 },
  { id: 'black_pepper_malabar_mg1', name: 'Malabar Black Pepper (MG-1 Garbled)', category: 'spices', categoryLabel: 'Spices & Aromatics', defaultModalPrice: 62000, safeMoistureBaseline: 11.0, respirationRateMonthly: 0.05, seasonalTaperCurveMultiplier: 1.22 },
  { id: 'chilli_dry_guntur_teja', name: 'Dry Red Chilli (Guntur Teja / Byadgi Stemless)', category: 'spices', categoryLabel: 'Spices & Aromatics', defaultModalPrice: 18500, safeMoistureBaseline: 10.0, respirationRateMonthly: 0.15, seasonalTaperCurveMultiplier: 1.32 },
  { id: 'coriander_seed_badami', name: 'Coriander Seed (Badami Bold)', category: 'spices', categoryLabel: 'Spices & Aromatics', defaultModalPrice: 7800, safeMoistureBaseline: 9.0, respirationRateMonthly: 0.12, seasonalTaperCurveMultiplier: 1.21 },
  { id: 'fennel_seed_saunf_gujarat2', name: 'Fennel Seed (Saunf Gujarat-2)', category: 'spices', categoryLabel: 'Spices & Aromatics', defaultModalPrice: 11500, safeMoistureBaseline: 9.5, respirationRateMonthly: 0.10, seasonalTaperCurveMultiplier: 1.24 },
  { id: 'fenugreek_methi_small', name: 'Fenugreek (Methi Desi Small)', category: 'spices', categoryLabel: 'Spices & Aromatics', defaultModalPrice: 5800, safeMoistureBaseline: 10.0, respirationRateMonthly: 0.11, seasonalTaperCurveMultiplier: 1.18 },
  { id: 'green_cardamom_8mm', name: 'Green Cardamom (8mm Bold)', category: 'spices', categoryLabel: 'Spices & Aromatics', defaultModalPrice: 195000, safeMoistureBaseline: 10.0, respirationRateMonthly: 0.04, seasonalTaperCurveMultiplier: 1.26 },
  { id: 'large_cardamom_badi_elaichi', name: 'Large Cardamom (Badi Elaichi)', category: 'spices', categoryLabel: 'Spices & Aromatics', defaultModalPrice: 125000, safeMoistureBaseline: 10.5, respirationRateMonthly: 0.05, seasonalTaperCurveMultiplier: 1.24 },

  // 5. Fiber & Bulky Commercial (4)
  { id: 'cotton_bt_medium_staple', name: 'Bt Cotton (Medium Staple Kapas)', category: 'fiber', categoryLabel: 'Fiber & Bulky Commercial', defaultModalPrice: 7150, safeMoistureBaseline: 8.5, respirationRateMonthly: 0.12, seasonalTaperCurveMultiplier: 1.16 },
  { id: 'cotton_bt_long_staple_h4', name: 'Bt Cotton (Long Staple H-4)', category: 'fiber', categoryLabel: 'Fiber & Bulky Commercial', defaultModalPrice: 7850, safeMoistureBaseline: 8.5, respirationRateMonthly: 0.11, seasonalTaperCurveMultiplier: 1.18 },
  { id: 'raw_jute_tossa_td5', name: 'Raw Jute (Tossa White TD-5)', category: 'fiber', categoryLabel: 'Fiber & Bulky Commercial', defaultModalPrice: 5200, safeMoistureBaseline: 14.0, respirationRateMonthly: 0.22, seasonalTaperCurveMultiplier: 1.15 },
  { id: 'sugarcane_jaggery_gur', name: 'Sugarcane (Co-0238 Gur / Jaggery Equiv)', category: 'fiber', categoryLabel: 'Fiber & Bulky Commercial', defaultModalPrice: 3800, safeMoistureBaseline: 11.0, respirationRateMonthly: 0.28, seasonalTaperCurveMultiplier: 1.14 },

  // 6. Perishables & Semi-Perishables (Cold Chain / Curing Godowns) (5)
  { id: 'potato_cold_store_jyoti', name: 'Cold-Store Table Potato (Jyoti / Chipsona)', category: 'perishables', categoryLabel: 'Perishables & Semi-Perishables', defaultModalPrice: 1650, safeMoistureBaseline: 18.0, respirationRateMonthly: 0.40, seasonalTaperCurveMultiplier: 1.45 },
  { id: 'onion_rabi_garva_nashik', name: 'Rabi Garva Red Onion (Nashik Export Grade)', category: 'perishables', categoryLabel: 'Perishables & Semi-Perishables', defaultModalPrice: 2450, safeMoistureBaseline: 14.0, respirationRateMonthly: 0.65, seasonalTaperCurveMultiplier: 1.55 },
  { id: 'onion_white_dehydration_mahuva', name: 'White Dehydration Onion (Mahuva)', category: 'perishables', categoryLabel: 'Perishables & Semi-Perishables', defaultModalPrice: 2100, safeMoistureBaseline: 13.5, respirationRateMonthly: 0.55, seasonalTaperCurveMultiplier: 1.48 },
  { id: 'ginger_wet_green_nadia', name: 'Wet Green Ginger (Nadia Bold)', category: 'perishables', categoryLabel: 'Perishables & Semi-Perishables', defaultModalPrice: 4600, safeMoistureBaseline: 20.0, respirationRateMonthly: 0.80, seasonalTaperCurveMultiplier: 1.38 },
  { id: 'garlic_cured_dry_mandsaur', name: 'Cured Dry Garlic (Mandsaur Bold)', category: 'perishables', categoryLabel: 'Perishables & Semi-Perishables', defaultModalPrice: 12800, safeMoistureBaseline: 12.0, respirationRateMonthly: 0.35, seasonalTaperCurveMultiplier: 1.42 },
];

// 2. Storage Infrastructure & Physical Integrity Class (5 Classes)
export type StorageFacilityClass =
  | 'wdra_silo'
  | 'swc_godown'
  | 'ca_cold_chain'
  | 'pacs_village'
  | 'kuccha_farm';

export interface StorageFacilityConfig {
  id: StorageFacilityClass;
  name: string;
  tagline: string;
  monthlyRentPerBag: number; // in ₹/50kg bag/month
  dryDownShrinkageLimitPct: number; // natural dry-down limit
  monthlyRespirationLossPct: number;
  weighmentHandlingAssayFeePerQtl: number;
  pledgeFinanceEligible: boolean;
  eNwrGrade: string;
  features: string[];
}

export const STORAGE_FACILITIES: Record<StorageFacilityClass, StorageFacilityConfig> = {
  wdra_silo: {
    id: 'wdra_silo',
    name: 'WDRA Accredited Scientific Steel Silo / CWC Central Depot',
    tagline: 'Grade-A e-NWR Electronic Pledge Generation • Hermetic Aeration & 100% Weevil Immunity',
    monthlyRentPerBag: 5.5,
    dryDownShrinkageLimitPct: 0.25,
    monthlyRespirationLossPct: 0.08,
    weighmentHandlingAssayFeePerQtl: 14,
    pledgeFinanceEligible: true,
    eNwrGrade: 'Grade-A e-NWR (Instant Bank Pledge in 48h)',
    features: ['Controlled Mechanical Aeration', 'Hermetic Seal', 'Automated Temp Probes', '100% Insect/Rodent Immunity'],
  },
  swc_godown: {
    id: 'swc_godown',
    name: 'State Warehousing Corporation (SWC) Standard Covered Godown',
    tagline: 'Bagged Stack Storage on Dunnage Wooden Crates • Periodic Aluminum Phosphide Fumigation',
    monthlyRentPerBag: 4.8,
    dryDownShrinkageLimitPct: 0.85,
    monthlyRespirationLossPct: 0.18,
    weighmentHandlingAssayFeePerQtl: 16,
    pledgeFinanceEligible: true,
    eNwrGrade: 'Standard e-NWR Bank Pledge',
    features: ['Wooden Dunnage Stacking', 'AlP Fumigation Cycles', 'Standard Bank Pledge', 'Security & Fire Insured'],
  },
  ca_cold_chain: {
    id: 'ca_cold_chain',
    name: 'Controlled Atmosphere (CA) / Refrigerated Cold-Chain Depot',
    tagline: '0°C to 4°C with 90% RH • Ethylene Scrubbing & Inert Gas Atmosphere for High-Value Produce',
    monthlyRentPerBag: 24.0,
    dryDownShrinkageLimitPct: 0.40,
    monthlyRespirationLossPct: 0.05,
    weighmentHandlingAssayFeePerQtl: 28,
    pledgeFinanceEligible: true,
    eNwrGrade: 'Cold-Chain e-NWR Collateral',
    features: ['0°C - 4°C Chamber Control', 'CO₂ & Ethylene Scrubbing', '90% RH Humidification', 'Dehydration Suppression'],
  },
  pacs_village: {
    id: 'pacs_village',
    name: 'Primary Agricultural Credit Society (PACS) Village Godown',
    tagline: 'Local Cooperative Storage • Short Haulage Distance & Basic Community Dunnage',
    monthlyRentPerBag: 3.5,
    dryDownShrinkageLimitPct: 1.20,
    monthlyRespirationLossPct: 0.32,
    weighmentHandlingAssayFeePerQtl: 10,
    pledgeFinanceEligible: true,
    eNwrGrade: 'Cooperative Society Pledge Receipt',
    features: ['Hyperlocal Village Proximity', 'Manual Moisture Assaying', 'Co-op Loan Facility', 'Basic Aeration'],
  },
  kuccha_farm: {
    id: 'kuccha_farm',
    name: 'On-Farm Traditional Kuccha Bunker / Mud Morai',
    tagline: 'Non-Accredited Farm Storage • High Humidity Spoilage & Rodent Loss (Zero Bank Pledge)',
    monthlyRentPerBag: 0.0,
    dryDownShrinkageLimitPct: 3.50,
    monthlyRespirationLossPct: 0.95,
    weighmentHandlingAssayFeePerQtl: 0,
    pledgeFinanceEligible: false,
    eNwrGrade: 'Not Eligible for Bank Pledge Credit',
    features: ['Zero Rent', 'Vulnerable to Weevils & Rodents', 'High Ambient Humidity Absorption', 'Distress Sale Risk'],
  },
};

// 3. Holding Time Horizon (8 Options)
export const HOLDING_HORIZONS = [
  { days: 15, label: '15 Days', note: 'Immediate post-harvest glut buffer' },
  { days: 30, label: '30 Days (1 Month)', note: 'Kharif arrival taper' },
  { days: 45, label: '45 Days', note: 'Mid-season price rebound' },
  { days: 60, label: '60 Days (2 Months)', note: 'Mandi arrivals down by 40%' },
  { days: 90, label: '90 Days (3 Months)', note: 'Pre-sowing terminal rally' },
  { days: 120, label: '120 Days (4 Months)', note: 'Seasonal inter-crop deficit' },
  { days: 150, label: '150 Days (5 Months)', note: 'Late storage arbitrage' },
  { days: 180, label: '180 Days (6 Months)', note: 'Off-season peak spread' },
];

// 4. Packaging modes
export type PackagingMode = 'jute_gunny' | 'hdpe_woven' | 'bulk_loose_silo';

export function SellVsStoreSimulator({ onClose, onOpenMarket }: SellVsStoreProps) {
  const { user } = useAuth();
  const { marketData, activeArbitrageTopSpread, weatherData } = useTelemetry();

  // Selected Commodity from 36
  const [selectedCommodityId, setSelectedCommodityId] = useState<string>('soybean_yellow_js335');
  const [tradeCategoryFilter, setTradeCategoryFilter] = useState<string>('all');

  const selectedCommodity = useMemo(() => {
    return (
      COMMODITY_CATALOG.find((c) => c.id === selectedCommodityId) ||
      COMMODITY_CATALOG[0]
    );
  }, [selectedCommodityId]);

  // Volume in Quintals
  const [quantityQtl, setQuantityQtl] = useState<number>(() =>
    Number(user?.acreage) > 0 ? Math.round(Number(user?.acreage) * 15) : 60
  );

  // Spot Price Calibration (Synchronized with live mandi or catalog baseline)
  const [spotPrice, setSpotPrice] = useState<number>(0);

  useEffect(() => {
    // Try to find matching live telemetry spot rate
    const matchedMandi = marketData.find(
      (m) =>
        m.commodity.toLowerCase().includes(selectedCommodity.name.toLowerCase().split(' ')[0]) ||
        selectedCommodity.name.toLowerCase().includes(m.commodity.toLowerCase().split(' ')[0])
    );
    if (matchedMandi && matchedMandi.modalPrice > 0) {
      setSpotPrice(matchedMandi.modalPrice);
    } else {
      setSpotPrice(0);
    }
  }, [selectedCommodity, marketData]);

  // Storage Facility Class (5 Classes)
  const [facilityClass, setFacilityClass] = useState<StorageFacilityClass>('wdra_silo');

  // Holding Horizon (15 - 180 Days)
  const [holdDays, setHoldDays] = useState<number>(60);

  // e-NWR Pledge Credit & Financial Architecture
  const [enablePledgeLoan, setEnablePledgeLoan] = useState<boolean>(true);
  const [pledgeLtvPercent, setPledgeLtvPercent] = useState<number>(75); // 70% to 75%
  const [interestScheme, setInterestScheme] = useState<'prompt_kcc' | 'subsidized_kcc' | 'commercial_bank' | 'moneylender'>('prompt_kcc');

  const annualInterestRate = useMemo(() => {
    switch (interestScheme) {
      case 'prompt_kcc':
        return 4.0; // Effective 4.0% with prompt repayment 3% central subvention
      case 'subsidized_kcc':
        return 7.0; // Subsidized KCC base 7%
      case 'commercial_bank':
        return 10.0; // Standard commercial bank 9.5 - 10.5%
      case 'moneylender':
        return 24.0; // Informal village moneylender 24%
    }
  }, [interestScheme]);

  // Quality, Moisture & Handling Variables
  const [harvestMoisturePercent, setHarvestMoisturePercent] = useState<number>(14.5);
  const [packagingMode, setPackagingMode] = useState<PackagingMode>('jute_gunny');
  const [haulageDistanceKm, setHaulageDistanceKm] = useState<number>(25); // 5km to 150km

  // Forward Price Model
  const [priceModel, setPriceModel] = useState<'seasonal_curve' | 'custom'>('seasonal_curve');
  const [customTargetPrice, setCustomTargetPrice] = useState<number>(() => Math.round(spotPrice * 1.18));

  // Simulation Stepper State
  const [simulationState, setSimulationState] = useState<'standby' | 'running' | 'completed'>('standby');
  const [simulationProgress, setSimulationProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
  }, []);

  // Safe moisture threshold for selected commodity
  const safeMoisture = selectedCommodity.safeMoistureBaseline;
  const isMoistureHigh = harvestMoisturePercent > safeMoisture;

  // Selected Storage Config
  const facility = STORAGE_FACILITIES[facilityClass];

  // Start Simulation Execution Handler
  const startSimulation = () => {
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    setSimulationState('running');
    setSimulationProgress(0);
    setCurrentStep(1);

    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setSimulationProgress(p);

      if (p < 35) {
        setCurrentStep(1); // Phase 1: Physical Shrinkage & Respiration
      } else if (p < 70) {
        setCurrentStep(2); // Phase 2: Cost Accumulation
      } else {
        setCurrentStep(3); // Phase 3: Forward Price Engine
      }

      if (p >= 100) {
        clearInterval(interval);
        simulationIntervalRef.current = null;
        setSimulationState('completed');
      }
    }, 45);
    simulationIntervalRef.current = interval;
  };

  const resetSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setSimulationState('standby');
    setSimulationProgress(0);
    setCurrentStep(1);
  };

  // Step-by-step Physics & Algorithmic Computations
  const results = useMemo(() => {
    // -------------------------------------------------------------
    // PHASE 1: Physical Shrinkage & Respiration Biomass Loss
    // -------------------------------------------------------------
    // Evaporative moisture loss from harvest intake to safe baseline:
    // Loss % = (Intake - Safe) / (100 - Safe) * 100
    const excessMoisture = Math.max(0, harvestMoisturePercent - safeMoisture);
    const evaporativeMoistureLossPct = (excessMoisture / (100 - safeMoisture)) * 100;
    
    // Respiration biomass loss (calibrated per month based on storage integrity):
    const monthsHolding = holdDays / 30;
    const respirationLossPct = Math.min(
      facility.dryDownShrinkageLimitPct * 2,
      facility.monthlyRespirationLossPct * monthsHolding * (selectedCommodity.respirationRateMonthly / 0.15)
    );

    const totalPhysicalLossPct = Math.min(8.0, evaporativeMoistureLossPct + respirationLossPct);
    const netWeightQuintalsAfterStorage = quantityQtl * (1 - totalPhysicalLossPct / 100);
    const physicalLossWeightQtl = quantityQtl - netWeightQuintalsAfterStorage;

    // -------------------------------------------------------------
    // PHASE 2: Cost Accumulation
    // -------------------------------------------------------------
    // 1. Warehouse Rent (1 Quintal = 2 standard 50kg bags)
    const bagsCount = quantityQtl * 2;
    const monthlyRentTotal = bagsCount * facility.monthlyRentPerBag;
    const warehouseTariffTotal = Math.round(monthlyRentTotal * monthsHolding);

    // 2. Handling & In/Out Stacking + Mandatory Assaying/Grading Fee
    const handlingAndAssayTotal = Math.round(quantityQtl * facility.weighmentHandlingAssayFeePerQtl);

    // 3. Packaging Bag Amortization / Bagging Surcharge
    const packagingCostPerBag = packagingMode === 'jute_gunny' ? 3.5 : packagingMode === 'hdpe_woven' ? 2.0 : 0.5;
    const packagingTotal = Math.round(bagsCount * packagingCostPerBag);

    // 4. Logistics Freight Haulage (calibrated at ₹1.40 / qtl / km)
    const freightRatePerQtlKm = 1.40;
    const freightLogisticsTotal = Math.round(quantityQtl * haulageDistanceKm * freightRatePerQtlKm);

    // 5. Transit & Godown Insurance (0.05% of produce value)
    const grossSpotValuation = quantityQtl * spotPrice;
    const insuranceTotal = facilityClass === 'kuccha_farm' ? 0 : Math.round(grossSpotValuation * 0.0005);

    // 6. e-NWR Pledge Loan Interest (Daily compounding simple/annualized)
    const canPledge = facility.pledgeFinanceEligible && enablePledgeLoan;
    const pledgedLoanPrincipal = canPledge ? Math.round(grossSpotValuation * (pledgeLtvPercent / 100)) : 0;
    const loanInterestTotal = canPledge
      ? Math.round((pledgedLoanPrincipal * (annualInterestRate / 100) * holdDays) / 365)
      : 0;

    const totalHoldingAndFinanceCost =
      warehouseTariffTotal +
      handlingAndAssayTotal +
      packagingTotal +
      freightLogisticsTotal +
      insuranceTotal +
      loanInterestTotal;

    // -------------------------------------------------------------
    // PHASE 3: Forward Price Engine & Realization
    // -------------------------------------------------------------
    let forwardPricePerQtl = spotPrice;
    if (priceModel === 'custom') {
      forwardPricePerQtl = customTargetPrice;
    } else {
      // Seasonal arrival trends + 5-year modal spread curve:
      // Produce prices typically gain 3.5% to 7.0% per month as glut arrivals subside
      const baseMonthlySpreadPct = (selectedCommodity.seasonalTaperCurveMultiplier - 1.0) / 4.0; // monthly gain factor
      const timeFactor = Math.pow(monthsHolding, 0.85);
      const projectedSpreadPct = baseMonthlySpreadPct * timeFactor * 100;
      forwardPricePerQtl = Math.round(spotPrice * (1 + projectedSpreadPct / 100));
    }

    const immediateSpotRevenue = grossSpotValuation;
    const futureGrossRevenue = Math.round(netWeightQuintalsAfterStorage * forwardPricePerQtl);
    const futureNetRealizedRevenue = futureGrossRevenue - totalHoldingAndFinanceCost;
    const netArbitrageGain = futureNetRealizedRevenue - immediateSpotRevenue;
    const netGainPercent = (netArbitrageGain / immediateSpotRevenue) * 100;

    // Breakeven Mandi Price on exit day:
    // (Immediate Spot Revenue + Total Costs) / Net Weight Quintals
    const breakevenExitPrice = Math.round(
      (immediateSpotRevenue + totalHoldingAndFinanceCost) / netWeightQuintalsAfterStorage
    );

    // Diagnostic Verdict
    let recommendation: 'RECOMMEND: STORE & HOLD' | 'RECOMMEND: SELL TODAY' | 'NEUTRAL / MARGINAL' = 'NEUTRAL / MARGINAL';
    let recommendationColor = 'text-amber-600 dark:text-amber-400';
    let recommendationBg = 'bg-amber-500/15 border-amber-500/30';
    let recommendationSummary = '';

    if (netGainPercent >= 8.0) {
      recommendation = 'RECOMMEND: STORE & HOLD';
      recommendationColor = 'text-emerald-700 dark:text-emerald-300';
      recommendationBg = 'bg-emerald-500/15 border-emerald-500/30';
      recommendationSummary = `Substantial net arbitrage surplus (+₹${netArbitrageGain.toLocaleString('en-IN')}) after deducting all scientific storage rents, shrinkage, and e-NWR interest.`;
    } else if (netGainPercent <= 0) {
      recommendation = 'RECOMMEND: SELL TODAY';
      recommendationColor = 'text-rose-700 dark:text-rose-300';
      recommendationBg = 'bg-rose-500/15 border-rose-500/30';
      recommendationSummary = `Holding costs and dry-down shrinkage outweigh anticipated price recovery. Immediate spot sale secures superior net realization.`;
    } else {
      recommendation = 'NEUTRAL / MARGINAL';
      recommendationColor = 'text-amber-700 dark:text-amber-300';
      recommendationBg = 'bg-amber-500/15 border-amber-500/30';
      recommendationSummary = `Marginal upside (+${netGainPercent.toFixed(1)}%). Consider storing only if high e-NWR pledge cash liquidity is immediately needed for input purchasing.`;
    }

    return {
      grossSpotValuation,
      netWeightQuintalsAfterStorage,
      physicalLossWeightQtl,
      evaporativeMoistureLossPct,
      respirationLossPct,
      totalPhysicalLossPct,
      warehouseTariffTotal,
      handlingAndAssayTotal,
      packagingTotal,
      freightLogisticsTotal,
      insuranceTotal,
      pledgedLoanPrincipal,
      loanInterestTotal,
      totalHoldingAndFinanceCost,
      forwardPricePerQtl,
      immediateSpotRevenue,
      futureGrossRevenue,
      futureNetRealizedRevenue,
      netArbitrageGain,
      netGainPercent,
      breakevenExitPrice,
      recommendation,
      recommendationColor,
      recommendationBg,
      recommendationSummary,
      canPledge,
    };
  }, [
    selectedCommodity,
    quantityQtl,
    spotPrice,
    harvestMoisturePercent,
    safeMoisture,
    holdDays,
    facility,
    facilityClass,
    packagingMode,
    haulageDistanceKm,
    enablePledgeLoan,
    pledgeLtvPercent,
    annualInterestRate,
    priceModel,
    customTargetPrice,
  ]);

  // Sync simulation findings to global AgriSence telemetry
  useEffect(() => {
    if (simulationState === 'completed') {
      saveSimulationTelemetry({
        moduleId: 'sell-vs-store',
        moduleName: `Sell vs Store (${selectedCommodity.name})`,
        timestamp: Date.now(),
        parameters: {
          commodity: selectedCommodity.name,
          quantityQtl,
          spotPricePerQtl: spotPrice,
          facility: facility.name,
          holdDays,
          enablePledgeLoan,
        },
        calculatedMetrics: {
          immediateSpotRevenue: results.immediateSpotRevenue,
          futureNetRealizedRevenue: results.futureNetRealizedRevenue,
          netArbitrageGain: results.netArbitrageGain,
          netGainPercent: Number(results.netGainPercent.toFixed(1)),
          recommendation: results.recommendation,
          pledgedLoanPrincipal: results.pledgedLoanPrincipal,
        },
        suggestedPrompts: [
          `Should I store ${quantityQtl} Qtl of ${selectedCommodity.name} for ${holdDays} days or sell at ₹${spotPrice}/qtl?`,
          `How does the ${facility.name} warehouse tariff affect my ₹${results.netArbitrageGain.toLocaleString('en-IN')} net gain?`,
          `Explain e-NWR pledge loan at ${pledgeLtvPercent}% LTV for ${selectedCommodity.name}`,
        ],
      });
    }
  }, [simulationState, selectedCommodity, quantityQtl, spotPrice, facility, holdDays, enablePledgeLoan, results, pledgeLtvPercent]);

  // Filtered commodities list
  const filteredCommodities = useMemo(() => {
    if (tradeCategoryFilter === 'all') return COMMODITY_CATALOG;
    return COMMODITY_CATALOG.filter((c) => c.category === tradeCategoryFilter);
  }, [tradeCategoryFilter]);

  return (
    <div className="space-y-4 text-xs">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/25 space-y-1.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="size-4 text-[var(--brand-color,#0f9a58)]" />
              <h4 className="font-black text-sm text-slate-950 dark:text-white">
                "Sell vs. Store" Post-Harvest Physics & e-NWR Arbitrage Simulator
              </h4>
            </div>
            <p className="text-slate-750 dark:text-slate-200 font-medium text-[11px] mt-0.5">
              Accredited WDRA & CWC godown rate models • Evaporative dry-down calculations • Subsidized KCC pledge credit.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
              36 Mandi Commodities
            </span>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="p-4 rounded-2xl frosted-card border border-white/60 dark:border-white/10 space-y-3.5">
        {/* Row 1: 36 Commodity Selector & Filter */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
              <Package className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
              <span>Select Pan-India Produce (36 Commodities / 6 Classes):</span>
            </label>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'cereals', label: 'Cereals (11)' },
                { id: 'pulses', label: 'Pulses (9)' },
                { id: 'oilseeds', label: 'Oilseeds (9)' },
                { id: 'spices', label: 'Spices (10)' },
                { id: 'fiber', label: 'Fiber (4)' },
                { id: 'perishables', label: 'Perishables (5)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTradeCategoryFilter(tab.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    tradeCategoryFilter === tab.id
                      ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs'
                      : 'bg-slate-200/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <select
                value={selectedCommodityId}
                onChange={(e) => setSelectedCommodityId(e.target.value)}
                className="w-full p-2 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-300 dark:border-white/15 font-black text-slate-950 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/50"
              >
                {filteredCommodities.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.categoryLabel})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl frosted-glass-sub border border-white/60 space-y-0.5">
                <span className="text-[10px] text-slate-500 block font-bold">Intake Volume</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={quantityQtl}
                    onChange={(e) => setQuantityQtl(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs font-black bg-transparent border-b border-emerald-500/30 focus:outline-none text-slate-950 dark:text-white"
                  />
                  <span className="text-[10px] font-black text-slate-500">Quintals</span>
                </div>
              </div>

              <div className="p-2 rounded-xl frosted-glass-sub border border-white/60 space-y-0.5">
                <span className="text-[10px] text-slate-500 block font-bold">Current Spot Rate</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">₹</span>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={spotPrice}
                    onChange={(e) => setSpotPrice(Math.max(100, Number(e.target.value)))}
                    className="w-full text-xs font-black bg-transparent border-b border-emerald-500/30 focus:outline-none text-slate-950 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-500">/qtl</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Storage Infrastructure Class (5 Facilities) */}
        <div className="space-y-1.5">
          <label className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
            <Building className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
            <span>Storage Infrastructure & Physical Integrity Class:</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {(Object.keys(STORAGE_FACILITIES) as StorageFacilityClass[]).map((fKey) => {
              const fac = STORAGE_FACILITIES[fKey];
              const isSelected = facilityClass === fKey;
              return (
                <button
                  key={fKey}
                  type="button"
                  onClick={() => setFacilityClass(fKey)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                    isSelected
                      ? 'bg-emerald-500/15 border-[var(--brand-color,#0f9a58)] ring-1 ring-[var(--brand-color,#0f9a58)]'
                      : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 hover:border-emerald-500/50'
                  }`}
                >
                  <div>
                    <span className="text-xs font-black text-slate-950 dark:text-white block">
                      {fac.name.split(' (')[0]}
                    </span>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {fac.tagline}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/60 dark:border-white/10">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      ₹{fac.monthlyRentPerBag}/bag/mo
                    </span>
                    <span className={`font-black ${fac.pledgeFinanceEligible ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                      {fac.pledgeFinanceEligible ? '✓ e-NWR Ready' : '✗ No Loan'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Holding Time Horizon (8 Options) */}
        <div className="space-y-1.5">
          <label className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
            <Clock className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
            <span>Holding Time Horizon:</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {HOLDING_HORIZONS.map((h) => (
              <button
                key={h.days}
                type="button"
                onClick={() => setHoldDays(h.days)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  holdDays === h.days
                    ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs font-black'
                    : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-750 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span className="text-xs font-black block">{h.label}</span>
                <span className={`text-[9px] block mt-0.5 ${holdDays === h.days ? 'text-emerald-100' : 'text-slate-500'}`}>
                  {h.note}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 4: e-NWR Pledge Credit & Financial Architecture */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-[var(--brand-color,#0f9a58)]" />
              <div>
                <span className="font-black text-xs text-slate-950 dark:text-white">
                  e-NWR Electronic Pledge Credit & Financial Architecture
                </span>
                <p className="text-[10px] text-slate-500">
                  Bank disbursal within 48 hours without distress crop dumping.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-black text-xs">
              <input
                type="checkbox"
                checked={enablePledgeLoan && facility.pledgeFinanceEligible}
                disabled={!facility.pledgeFinanceEligible}
                onChange={(e) => setEnablePledgeLoan(e.target.checked)}
                className="size-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className={facility.pledgeFinanceEligible ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
                Toggle Pledge Borrowing
              </span>
            </label>
          </div>

          {enablePledgeLoan && facility.pledgeFinanceEligible && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 block">Interest Rate Architecture</span>
                <select
                  value={interestScheme}
                  onChange={(e) => setInterestScheme(e.target.value as any)}
                  className="w-full text-xs font-black bg-transparent text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="prompt_kcc">Prompt Repayment Incentive (4.0% p.a. with 3% Subvention)</option>
                  <option value="subsidized_kcc">Subsidized Kisan Credit Card (7.0% base p.a.)</option>
                  <option value="commercial_bank">Standard Commercial Bank Commodity Loan (10.0% p.a.)</option>
                  <option value="moneylender">Informal Village Moneylender / Arhatiya Debt (24.0% p.a.)</option>
                </select>
              </div>

              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-500">Loan-to-Value (LTV) Ratio</span>
                  <span className="text-emerald-600 font-black">{pledgeLtvPercent}% LTV</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="75"
                  step="1"
                  value={pledgeLtvPercent}
                  onChange={(e) => setPledgeLtvPercent(Number(e.target.value))}
                  className="w-full accent-[var(--brand-color,#0f9a58)]"
                />
                <span className="text-[9px] text-slate-500 block">
                  Eligible Instant Pledged Advance: <strong>₹{results.pledgedLoanPrincipal.toLocaleString('en-IN')}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Row 5: Quality, Moisture & Handling Variables */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Intake Moisture Slider */}
          <div className="p-3 rounded-xl frosted-glass-sub border border-white/60 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-slate-600 dark:text-slate-300">Intake Moisture:</span>
              <span className={`font-black ${isMoistureHigh ? 'text-amber-600' : 'text-emerald-600'}`}>
                {harvestMoisturePercent}% (Safe: {safeMoisture}%)
              </span>
            </div>
            <input
              type="range"
              min="8.0"
              max="22.0"
              step="0.5"
              value={harvestMoisturePercent}
              onChange={(e) => setHarvestMoisturePercent(Number(e.target.value))}
              className="w-full accent-[var(--brand-color,#0f9a58)]"
            />
            <span className="text-[9px] text-slate-500 block">
              {isMoistureHigh ? `⚠ Dry-down shrinkage: ~${results.evaporativeMoistureLossPct.toFixed(1)}%` : '✓ Optimal storage moisture'}
            </span>
          </div>

          {/* Stacking & Packaging Mode */}
          <div className="p-3 rounded-xl frosted-glass-sub border border-white/60 space-y-1">
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">Stacking & Bag Mode:</span>
            <select
              value={packagingMode}
              onChange={(e) => setPackagingMode(e.target.value as PackagingMode)}
              className="w-full text-xs font-black bg-transparent text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="jute_gunny">50 kg New Jute Gunny Bags (Govt Standard)</option>
              <option value="hdpe_woven">50 kg HDPE / PP Woven Laminated Bags</option>
              <option value="bulk_loose_silo">Bulk Loose Hopper Discharge (Steel Silos)</option>
            </select>
          </div>

          {/* Logistics Haulage Distance */}
          <div className="p-3 rounded-xl frosted-glass-sub border border-white/60 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-slate-600 dark:text-slate-300">Haulage to Mandi:</span>
              <span className="text-sky-600 font-black">{haulageDistanceKm} km</span>
            </div>
            <input
              type="range"
              min="5"
              max="150"
              step="5"
              value={haulageDistanceKm}
              onChange={(e) => setHaulageDistanceKm(Number(e.target.value))}
              className="w-full accent-sky-500"
            />
            <span className="text-[9px] text-slate-500 block">
              Freight @ ₹1.40/qtl/km: <strong>₹{results.freightLogisticsTotal.toLocaleString('en-IN')}</strong>
            </span>
          </div>
        </div>

        {/* Start / Reset Simulation Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
          <div className="text-[11px] text-slate-500 font-semibold">
            Status:{' '}
            <strong className="text-slate-900 dark:text-white capitalize">
              {simulationState === 'running' ? `Computing Step ${currentStep}/3...` : simulationState === 'completed' ? 'Simulation Verified' : 'Ready'}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            {simulationState === 'completed' && (
              <button
                type="button"
                onClick={resetSimulation}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center gap-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={startSimulation}
              disabled={simulationState === 'running'}
              className="px-4 py-2 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] disabled:opacity-50 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Play className="size-3.5" />
              <span>{simulationState === 'running' ? 'Running Physics Engine...' : 'Start Simulator'}</span>
            </button>
          </div>
        </div>

        {/* Simulation Progress Bar */}
        {simulationState === 'running' && (
          <div className="space-y-1.5 pt-1">
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[var(--brand-color,#0f9a58)] h-full transition-all duration-75 ease-out rounded-full"
                style={{ width: `${simulationProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-bold">
              <span>Phase 1: Evaporative Shrinkage</span>
              <span>Phase 2: Cost Accumulation</span>
              <span>Phase 3: 5-Yr Modal Arbitrage</span>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* SIMULATION DIAGNOSTIC VERDICT & DETAILED BREAKDOWN                */}
      {/* ================================================================= */}
      {simulationState === 'standby' && (
        <div className="p-6 rounded-2xl frosted-card border-2 border-dashed border-emerald-500/30 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-emerald-500/15 text-[var(--brand-color,#0f9a58)] mx-auto flex items-center justify-center">
            <Scale className="size-6" />
          </div>
          <div>
            <h5 className="font-black text-sm text-slate-950 dark:text-white">
              Ready to Run Post-Harvest Physics & e-NWR Arbitrage Simulation
            </h5>
            <p className="text-slate-600 dark:text-slate-300 text-xs max-w-lg mx-auto mt-1">
              Produce: <strong>{quantityQtl} Qtl {selectedCommodity.name}</strong> @ <strong>₹{spotPrice.toLocaleString('en-IN')}/qtl</strong> • Storage: <strong>{facility.name}</strong> • Horizon: <strong>{holdDays} Days</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={startSimulation}
            className="px-6 py-2.5 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <Play className="size-4 fill-current" />
            <span>Start Simulator (Compute Arbitrage)</span>
          </button>
        </div>
      )}

      {simulationState === 'running' && (
        <div className="p-6 rounded-2xl frosted-card border border-emerald-500/40 text-center space-y-4 animate-in fade-in duration-200">
          <div className="size-12 rounded-2xl bg-emerald-500/20 text-[var(--brand-color,#0f9a58)] mx-auto flex items-center justify-center">
            <RotateCcw className="size-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h5 className="font-black text-sm text-slate-950 dark:text-white">
              Executing Multi-Stage Post-Harvest Physics Engine...
            </h5>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold max-w-md mx-auto">
              {currentStep === 1 && `Phase 1/3: Ingesting ${quantityQtl} Qtl ${selectedCommodity.name} @ ₹${spotPrice}/qtl. Calculating evaporative dry-down (${harvestMoisturePercent}% vs ${safeMoisture}% safe baseline)...`}
              {currentStep === 2 && `Phase 2/3: Calculating ${facility.name} godown tariffs, ${packagingMode.replace('_', ' ')} stacking, assaying and ${haulageDistanceKm}km haulage...`}
              {currentStep === 3 && `Phase 3/3: Synthesizing ${holdDays}-day seasonal taper forward price rally & e-NWR pledge liquidity...`}
            </p>
          </div>
          <div className="w-full max-w-md mx-auto bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[var(--brand-color,#0f9a58)] h-full transition-all duration-100 ease-out rounded-full"
              style={{ width: `${simulationProgress}%` }}
            />
          </div>
        </div>
      )}

      {simulationState === 'completed' && (
        <div className="space-y-3.5 animate-in fade-in duration-300">
          {/* Main Recommendation Verdict Badge */}
          <div className={`p-4 rounded-2xl border ${results.recommendationBg} space-y-2`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`size-5 ${results.recommendationColor}`} />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Diagnostic Arbitrage Decision
                  </span>
                  <h4 className={`text-base font-black ${results.recommendationColor}`}>
                    {results.recommendation}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2 text-right">
                <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10">
                  <span className="text-[9px] text-slate-500 block font-bold">Net Difference</span>
                  <span className={`text-sm font-black ${results.netArbitrageGain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                    {results.netArbitrageGain >= 0 ? '+' : ''}₹{results.netArbitrageGain.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10">
                  <span className="text-[9px] text-slate-500 block font-bold">Breakeven Exit Price</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    ₹{results.breakevenExitPrice}/qtl
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-750 dark:text-slate-200 font-medium leading-relaxed">
              {results.recommendationSummary}
            </p>
          </div>

          {/* 3 Step Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Step 1: Immediate Spot Sale */}
            <div className="p-3.5 rounded-2xl frosted-card border border-white/60 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-500 block">
                1. Immediate Spot Sale
              </span>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Produce Volume:</span>
                  <span className="font-black text-slate-900 dark:text-white">{quantityQtl} Quintals</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Current Spot Rate:</span>
                  <span className="font-black text-slate-900 dark:text-white">₹{spotPrice}/qtl</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Gross Sale Revenue:</span>
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    ₹{results.immediateSpotRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: Storage & Finance Costs */}
            <div className="p-3.5 rounded-2xl frosted-card border border-white/60 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-500 block">
                2. Storage & Holding Costs
              </span>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Warehouse Rent ({holdDays}d):</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{results.warehouseTariffTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Assay, Handling & Bag:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{(results.handlingAndAssayTotal + results.packagingTotal).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Freight & Insurance:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{(results.freightLogisticsTotal + results.insuranceTotal).toLocaleString('en-IN')}</span>
                </div>
                {results.canPledge && (
                  <div className="flex justify-between text-amber-600">
                    <span>e-NWR Interest ({annualInterestRate}%):</span>
                    <span className="font-bold">₹{results.loanInterestTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="pt-1.5 border-t border-slate-200 dark:border-white/10 flex justify-between text-xs">
                  <span className="font-bold text-rose-600">Total Deductions:</span>
                  <span className="font-black text-rose-600">
                    -₹{results.totalHoldingAndFinanceCost.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: Net Realized Future Revenue */}
            <div className="p-3.5 rounded-2xl frosted-card border border-white/60 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-500 block">
                3. Realized Future Outcome
              </span>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Exit Weight ({results.totalPhysicalLossPct.toFixed(1)}% loss):</span>
                  <span className="font-black text-slate-900 dark:text-white">{results.netWeightQuintalsAfterStorage.toFixed(1)} Qtl</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Forward Mandi Price:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">₹{results.forwardPricePerQtl}/qtl</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Net Realized Value:</span>
                  <span className="font-black text-sm text-[var(--brand-color,#0f9a58)]">
                    ₹{results.futureNetRealizedRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Google Maps Locator Link for WDRA / CWC Warehouses */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/15 via-indigo-500/10 to-transparent border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <MapPin className="size-4" />
              </div>
              <div>
                <h5 className="font-black text-xs text-slate-950 dark:text-white">
                  Locate Verified WDRA / CWC / SWC Registered Warehouses Within 50 km
                </h5>
                <p className="text-[10px] text-slate-650 dark:text-slate-300 font-medium">
                  Find accredited cold storages, steel silos, and SWC godowns for instant e-NWR receipt generation.
                </p>
              </div>
            </div>

            <a
              href={`https://www.google.com/maps/search/WDRA+CWC+SWC+warehouse+near+${encodeURIComponent(weatherData.locationName || 'me')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shrink-0 transition-transform hover:scale-105 active:scale-95 shadow-xs"
            >
              <span>View Warehouses on Google Maps</span>
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
