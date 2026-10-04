import type { FeatureItem } from '@/src/types';

export const siteConfig = {
  name: 'AgriSence',
  title: 'AgriSence - Smart Agriculture & Pest Intelligence Platform',
  description:
    'AI-powered precision agriculture platform for pest diagnosis, early outbreak warnings, hyperlocal weather, satellite NDVI, and APMC mandi price discovery.',
  navItems: [
    { label: 'Platform Features', href: '#features' },
    { label: 'Outbreak Radar', href: '/outbreak-warning' },
    { label: 'AI Pest Scan', href: '/scan' },
    { label: 'Mandi Arbitrage', href: '#mandi-market' },
    { label: 'Govt Schemes', href: '/schemes' },
    { label: 'Command Center', href: '/dashboard' },
  ],
};

export const featuresData: FeatureItem[] = [
  // Free Tools (Direct Access without Auth)
  {
    id: 'f-1',
    title: 'AI Pest & Disease Detection',
    tagline: '1.4s Computer Vision Inference',
    category: 'Diagnostics',
    description:
      'Instantly identify 120+ insect pests, fungal blights, and leaf pathogens from foliage photos with botanical bio-remedies.',
    badge: 'Free Access',
    isFree: true,
    iconName: 'Bug',
    target: 'pest-diagnosis',
  },
  {
    id: 'f-2',
    title: 'Outbreak Warning Radar',
    tagline: '25km Doppler & Spore Vectoring',
    category: 'Epidemiology',
    description:
      'Predictive thermal degree-day and leaf wetness modeling alerting surrounding farm clusters 48 hours prior to spore vectoring.',
    badge: 'Free Access',
    isFree: true,
    iconName: 'ShieldAlert',
    target: 'outbreak-warning',
  },

  // Protected Agronomic Simulators (Gated by Auth)
  {
    id: 'f-3',
    title: 'Smart Spray Window & Drift Calendar',
    tagline: '72-hr Spray Viability Index',
    category: 'Application Tech',
    description:
      'Hourly microclimate spray viability score analyzing wind drift (<12 km/h), dew point, and rain wash-off hazards before foliar spray.',
    badge: 'New Simulator',
    isFree: false,
    iconName: 'Wind',
    target: 'spray-calendar',
  },
  {
    id: 'f-4',
    title: 'Tank-Mix Compatibility Checker',
    tagline: 'Chemical Interaction Engine',
    category: 'Chemical Safety',
    description:
      'Test two-way pesticide, fungicide, and micronutrient tank mixes to prevent flocculation, leaf scorching, or chemical neutralization.',
    badge: 'New Simulator',
    isFree: false,
    iconName: 'FlaskConical',
    target: 'tank-mix',
  },
  {
    id: 'f-5',
    title: 'Sell vs. Store Harvest Advisor',
    tagline: 'WDRA Warehousing Arbitrage',
    category: 'Market Strategy',
    description:
      'Calculates storage cost, interest subvention, and shrinkage vs forward APMC mandi price gains to optimize 30/60/90 day warehouse holding.',
    badge: 'New Simulator',
    isFree: false,
    iconName: 'TrendingUp',
    target: 'sell-vs-store',
  },
  {
    id: 'f-6',
    title: 'Crop Phenology & Growth Stage Tracker',
    tagline: '5-Stage Agronomic Stepper',
    category: 'Crop Physiology',
    description:
      'Interactive growth timeline from emergence to physiological maturity detailing water demand curves and critical nutritional milestones.',
    badge: 'New Simulator',
    isFree: false,
    iconName: 'Sprout',
    target: 'crop-stages',
  },
  {
    id: 'f-7',
    title: 'Zero-Residue Bio-Formulations',
    tagline: '100% Organic Botanical Extracts',
    category: 'Organic Farming',
    description:
      'Batch liter calculators and standardized recipes for 5% NSKE, Dashparni Ark, Jeevamrit, and entomopathogenic fungi.',
    isFree: false,
    iconName: 'Sparkles',
    target: 'bio-control',
  },
  {
    id: 'f-8',
    title: 'Precision Pesticide & Tank Dosage',
    tagline: 'Knapsack vs Drone Calibration',
    category: 'Application Tech',
    description:
      'Calculate exact active ingredient per knapsack (16L) or agricultural drone (10L/acre) with hollow-cone pressure specifications.',
    isFree: false,
    iconName: 'Droplets',
    target: 'pesticide-dosage',
  },
  {
    id: 'f-9',
    title: 'Soil Chemistry & N-P-K Profiler',
    tagline: 'Soil Health Card Calibration',
    category: 'Soil Science',
    description:
      'Interactive N-P-K nutrient sliders and pH gauges calculating split basal and foliar top-dressing fertilizer rates.',
    isFree: false,
    iconName: 'Layers',
    target: 'soil-analysis',
  },
  {
    id: 'f-10',
    title: 'Precision Fertigation & Soil Optimization',
    tagline: 'Targeted Nutrient Balancing',
    category: 'Soil Science',
    description:
      'Algorithmic correction for alkaline and saline soils, micronutrient chelates, and organic carbon enrichment recipes.',
    isFree: false,
    iconName: 'Compass',
    target: 'soil-optimization',
  },
  {
    id: 'f-11',
    title: 'AI Crop & Cultivar Matcher',
    tagline: 'Soil-to-Yield Predictive Match',
    category: 'Crop Selection',
    description:
      'High-confidence cultivar recommendations matching your local agro-climatic zone, water depth, and soil profile.',
    isFree: false,
    iconName: 'CheckCircle2',
    target: 'crop-recommendation',
  },
  {
    id: 'f-12',
    title: 'Intercropping & Companion Synergy',
    tagline: 'Ecological Companion Matrices',
    category: 'Crop Selection',
    description:
      'Calculate symbiotic companion planting scores for Cotton + Pigeonpea, Soybean + Maize, and nitrogen-fixing cover crops.',
    isFree: false,
    iconName: 'Share2',
    target: 'crop-compatibility',
  },
  {
    id: 'f-13',
    title: 'Subsurface IoT Soil Moisture Probes',
    tagline: '15cm & 30cm Depth Telemetry',
    category: 'IoT Telemetry',
    description:
      'Multi-depth capacitive probe telemetry monitoring volumetric water content (VWC), electrical conductivity (EC), and root respiration.',
    isFree: false,
    iconName: 'Activity',
    target: 'iot-soil',
  },
  {
    id: 'f-14',
    title: 'Sentinel-2 10m NDVI Satellite Vigor',
    tagline: 'Multispectral Space Telemetry',
    category: 'Remote Sensing',
    description:
      'High-resolution ESA Sentinel-2 multispectral surface reflectance measuring chlorophyll absorption and canopy biomass density.',
    isFree: false,
    iconName: 'Satellite',
    target: 'satellite-ndvi',
  },
  {
    id: 'f-15',
    title: 'ETc Smart Irrigation Controller',
    tagline: 'Evapotranspiration Budgeting',
    category: 'Water Management',
    description:
      'Daily crop water demand calculator based on solar radiation and soil infiltration rate with automated drip runtime timers.',
    isFree: false,
    iconName: 'Gauge',
    target: 'smart-irrigation',
  },
  {
    id: 'f-16',
    title: 'Farm Expense & Cost-Per-Acre Ledger',
    tagline: 'Input Expense & Labor Accounting',
    category: 'Financial Management',
    description:
      'Seasonal cultivation balance sheet tracking seeds, fertigation, weeding, machinery rent, and net profit margins.',
    isFree: false,
    iconName: 'Coins',
    target: 'expense-tracker',
  },
  {
    id: 'f-17',
    title: 'Seasonal Yield Margins & Crop ROI',
    tagline: 'Quintal Yield Arbitrage',
    category: 'Financial Management',
    description:
      'Interactive crop economics calculator computing revenue projections, break-even yields, and seasonal return on investment.',
    isFree: false,
    iconName: 'Calculator',
    target: 'farm-analytics',
  },
  {
    id: 'f-18',
    title: 'PMFBY 72h Loss Claim Assistant',
    tagline: 'Crop Insurance Dossier Generator',
    category: 'Insurance & Relief',
    description:
      'Direct protocol for filing 72-hour localized hailstorm and pest damage intimations with geo-tagged photographic evidence.',
    isFree: false,
    iconName: 'FileText',
    target: 'crop-insurance',
  },
  {
    id: 'f-19',
    title: 'Jan Samarth KCC 4% Credit Calculator',
    tagline: 'Subsidized Institutional Credit',
    category: 'Credit & Finance',
    description:
      'Calculate interest subvention benefits for Kisan Credit Card crop loans up to ₹3.00 Lakh with direct Jan Samarth linkage.',
    isFree: false,
    iconName: 'CreditCard',
    target: 'finance-loans',
  },
  {
    id: 'f-20',
    title: 'WDRA Accredited Cold Storage & Warehouses',
    tagline: 'e-NWR Pledge Finance enabled',
    category: 'Post-Harvest Logistics',
    description:
      'Locate certified cold storage and electronic negotiable warehouse receipt (e-NWR) facilities to prevent distress selling.',
    isFree: false,
    iconName: 'Building',
    target: 'warehouses',
  },
  {
    id: 'f-21',
    title: 'Real-Time Extreme Weather Alarms',
    tagline: 'IMD Doppler Radar Warnings',
    category: 'Weather Telemetry',
    description:
      'Hyperlocal alerts for unseasonal rainfall, hailstorms, frost, and high-velocity wind squalls to safeguard standing crops.',
    isFree: false,
    iconName: 'CloudLightning',
    target: 'disaster-alerts',
  },
  {
    id: 'f-22',
    title: 'Microclimate Pest Hazard Risk Maps',
    tagline: 'Regional Threat Corridors',
    category: 'Epidemiology',
    description:
      'Heatmap visualization of regional pest pressure across neighboring talukas to establish early preventive buffer perimeters.',
    isFree: false,
    iconName: 'Map',
    target: 'risk-maps',
  },
];
