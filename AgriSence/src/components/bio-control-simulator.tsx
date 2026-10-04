import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sprout as Sparkles,
  Droplets,
  Thermometer,
  ShieldCheck,
  Scale,
  DollarSign,
  ShoppingCart,
  Clock,
  Layers,
  Leaf,
  Info,
  Bug,
  Filter,
} from 'lucide-react';
import { useTelemetry } from '@/src/context/telemetry-context';
import { useDiagnosis } from '@/src/context/diagnosis-context';
import { useFarms } from '@/src/context/farm-context';
import { saveSimulationTelemetry } from '@/src/lib/simulator-sync';
import { ActiveParcelSelector } from '@/src/components/dashboard/active-parcel-selector';

export interface BioControlSimulatorProps {
  onClose?: () => void;
  onOpenShop?: (category: 'seeds' | 'crop_protection' | 'fertilizers' | 'machinery') => void;
}

// 1. Verified Botanical & Organic Formulations (10 ICAR / SAU Standard Recipes)
export type BioRecipeId =
  | 'nske_5pct'
  | 'dashparni_ark'
  | 'jeevamrit'
  | 'brahmastra'
  | 'agniastra'
  | 'panchagavya'
  | 'nue_10pct'
  | 'sour_buttermilk'
  | 'entomopathogenic_fungi'
  | 'trichoderma_slurry';

export interface IngredientItem {
  name: string;
  amount: number;
  unit: string;
  sourceNote: string;
}

export interface BioRecipeDefinition {
  id: BioRecipeId;
  name: string;
  tagline: string;
  targetSpectrum: string;
  extractionMacerationDays: number;
  activeShelfLifeDays: number;
  shelfLifeDisplay: string;
  finalPh: number;
  activePhytochemicals: string;
  extractionMethod: 'Aqueous Cold Maceration' | 'Anaerobic Microbial Fermentation' | 'Aerobic Probiotic Fermentation' | 'Boiled Decoction Maceration' | 'Microbial Bio-Suspension';
  syntheticReplacementCostPerAcre: number;
  selfPreparedCostPerAcre: number;
  filtrationRequirement: string;
  sprayWindowNote: string;
  baseIngredientsPer100L: { name: string; amount100L: number; unit: string; sourceNote: string }[];
}

export const BIO_RECIPES: Record<BioRecipeId, BioRecipeDefinition> = {
  nske_5pct: {
    id: 'nske_5pct',
    name: '5% NSKE (Neem Seed Kernel Extract)',
    tagline: 'Aqueous Cold-Water Extraction of Azadirachtin, Salannin & Nimbin',
    targetSpectrum: 'Disrupts insect oviposition, ecdysone molting, and feeding for lepidopteran caterpillars (Armyworms, Bollworms, Borers).',
    extractionMacerationDays: 1,
    activeShelfLifeDays: 3,
    shelfLifeDisplay: '24 to 48 Hours (Fresh Aqueous Extract)',
    finalPh: 6.8,
    activePhytochemicals: 'Azadirachtin A & B (1500 ppm equivalent), Salannin, Meliacarpin, Nimbin',
    extractionMethod: 'Aqueous Cold Maceration',
    syntheticReplacementCostPerAcre: 680,
    selfPreparedCostPerAcre: 85,
    filtrationRequirement: 'Double-layer muslin cloth filtration (prevents nozzle clogging in knapsack sprayers)',
    sprayWindowNote: 'Spray in early morning or late dusk to prevent UV photolysis degradation of Azadirachtin.',
    baseIngredientsPer100L: [
      { name: 'Neem Seed Kernels (Good Quality Dried)', amount100L: 5.0, unit: 'kg', sourceNote: 'Crush into coarse powder; soak overnight' },
      { name: 'Clean Soft Water', amount100L: 100.0, unit: 'Litres', sourceNote: 'Chlorine-free well / rainwater' },
      { name: 'Pure Country Khadi Soap (Soft Soap)', amount100L: 100.0, unit: 'grams', sourceNote: 'Dissolve in warm water before adding' },
    ],
  },

  dashparni_ark: {
    id: 'dashparni_ark',
    name: 'Dashparni Ark (10-Botanical Leaf Extract)',
    tagline: '30-Day Anaerobic Fermentation of 10 Bitter & Pungent Botanical Leaves in Desi Cow Urine',
    targetSpectrum: 'Broad-spectrum systemic control for thrips, red spider mites, whiteflies, aphids, jassids, and early instar borers.',
    extractionMacerationDays: 30,
    activeShelfLifeDays: 180,
    shelfLifeDisplay: '6 Months (Stable Phytochemical Alkaloids)',
    finalPh: 4.8,
    activePhytochemicals: 'Alkaloids, Saponins, Terpenoids, Pongamol, Calotropin, Tannins, Azadirachtin',
    extractionMethod: 'Anaerobic Microbial Fermentation',
    syntheticReplacementCostPerAcre: 920,
    selfPreparedCostPerAcre: 110,
    filtrationRequirement: 'Multi-stage 100-mesh nylon sieve filtration',
    sprayWindowNote: 'Dilute 200 ml extract per 10 Litres water. Best applied at first detection of sucking pests.',
    baseIngredientsPer100L: [
      { name: 'Neem Leaves (Azadirachta indica)', amount100L: 5.0, unit: 'kg', sourceNote: 'Crushed fresh green leaves' },
      { name: 'Karanja / Pongamia Leaves', amount100L: 2.0, unit: 'kg', sourceNote: 'Bitter flavonoids & insect repellent' },
      { name: 'Custard Apple (Sitaphal) Leaves', amount100L: 2.0, unit: 'kg', sourceNote: 'Annonaceous acetogenins' },
      { name: 'Calotropis / Aak (Rui) Leaves', amount100L: 2.0, unit: 'kg', sourceNote: 'Latex alkaloids' },
      { name: 'Castor / Papaya / Guava Leaves', amount100L: 3.0, unit: 'kg', sourceNote: 'Enzyme inhibitors' },
      { name: 'Desi Cow Urine (Gomutra)', amount100L: 10.0, unit: 'Litres', sourceNote: 'Fermentation catalyst & carrier' },
      { name: 'Fresh Desi Cow Dung', amount100L: 2.0, unit: 'kg', sourceNote: 'Microbial inoculant' },
      { name: 'Crushed Hot Green Chilli Paste', amount100L: 0.5, unit: 'kg', sourceNote: 'Capsaicin irritant' },
      { name: 'Crushed Garlic Paste', amount100L: 0.5, unit: 'kg', sourceNote: 'Allicin antifungal/antibacterial' },
    ],
  },

  jeevamrit: {
    id: 'jeevamrit',
    name: 'Jeevamrit (Aerobic Rhizosphere Microbial Probiotic)',
    tagline: '48–72h Aerobic Fermentation delivering 10⁸ CFU/ml Beneficial Bacteria & Fungi',
    targetSpectrum: 'Soil-borne fungal pathogens (Fusarium wilt, Rhizoctonia root rot, Pythium damping-off) & rapid soil microbial activation.',
    extractionMacerationDays: 3,
    activeShelfLifeDays: 3,
    shelfLifeDisplay: '48 to 72 Hours (Peak Live Bacterial CFU Count)',
    finalPh: 4.5,
    activePhytochemicals: 'Aerobic Probiotic Consortia (1.2 x 10⁸ CFU/ml), Actinomycetes, Nitrogen-Fixing Bacteria, Humic/Fulvic Acids',
    extractionMethod: 'Aerobic Probiotic Fermentation',
    syntheticReplacementCostPerAcre: 750,
    selfPreparedCostPerAcre: 60,
    filtrationRequirement: 'Coarse gunny cloth straining for drenching; 120-mesh for drip fertigation',
    sprayWindowNote: 'Stir clockwise for 10 minutes twice daily. Apply in moist soil near root basin.',
    baseIngredientsPer100L: [
      { name: 'Fresh Desi Cow Dung', amount100L: 5.0, unit: 'kg', sourceNote: 'Rich in beneficial rumen bacteria' },
      { name: 'Desi Cow Urine (Gomutra)', amount100L: 5.0, unit: 'Litres', sourceNote: 'Urea & mineral nitrogen source' },
      { name: 'Organic Jaggery (Gur)', amount100L: 1.0, unit: 'kg', sourceNote: 'Fast carbon energy for microbial explosion' },
      { name: 'Pulse Flour (Besan / Gram Flour)', amount100L: 1.0, unit: 'kg', sourceNote: 'Protein source for fungal sporulation' },
      { name: 'Virgin Soil (Forest / Banyan Tree)', amount100L: 0.25, unit: 'kg', sourceNote: 'Inoculum of native beneficial microbes' },
      { name: 'Clean Sweet Water', amount100L: 100.0, unit: 'Litres', sourceNote: 'Non-chlorinated' },
    ],
  },

  brahmastra: {
    id: 'brahmastra',
    name: 'Brahmastra (Boiled Five-Leaf Concoction)',
    tagline: 'Heat Extraction of Leaves with Sticky Latex or Potent Alkaloids Boiled in Cow Urine',
    targetSpectrum: 'Highly effective against internal caterpillar borers (Gram Pod Borer, Fruit Borer, Shoot Borer, Semi-loopers).',
    extractionMacerationDays: 2,
    activeShelfLifeDays: 180,
    shelfLifeDisplay: '6 Months (Heat-Sterilized Alkaloids)',
    finalPh: 5.2,
    activePhytochemicals: 'Concentrated Alkaloids, Tannins, Annonins, Azadirachtin, Phenolic Glucosides',
    extractionMethod: 'Boiled Decoction Maceration',
    syntheticReplacementCostPerAcre: 980,
    selfPreparedCostPerAcre: 130,
    filtrationRequirement: 'Muslin cloth filtration after 48h cooling & settling',
    sprayWindowNote: 'Dilute 250 ml in 10 Litres water. Spray directly on inflorescence and young pods.',
    baseIngredientsPer100L: [
      { name: 'Neem Leaves (Azadirachta indica)', amount100L: 4.0, unit: 'kg', sourceNote: 'Crushed foliage' },
      { name: 'Custard Apple Leaves (Sitaphal)', amount100L: 2.0, unit: 'kg', sourceNote: 'Strong acetogenin borer toxin' },
      { name: 'Karanja / Pongamia Leaves', amount100L: 2.0, unit: 'kg', sourceNote: 'Flavonoid repellent' },
      { name: 'Guava Leaves', amount100L: 2.0, unit: 'kg', sourceNote: 'Tannins & astringent terpenes' },
      { name: 'Pomegranate / Papaya Leaves', amount100L: 2.0, unit: 'kg', sourceNote: 'Latex & proteolytic enzymes' },
      { name: 'Desi Cow Urine (Gomutra)', amount100L: 15.0, unit: 'Litres', sourceNote: 'Boiled until reduced by 50%' },
    ],
  },

  agniastra: {
    id: 'agniastra',
    name: 'Agniastra (Pungent Bio-Extract)',
    tagline: 'Pungent Decoction of Green Chilli, Garlic, Ginger, Tobacco & Neem in Cow Urine',
    targetSpectrum: 'Instant knockdown for severe, hardened caterpillar infestations (Pink Bollworm, FAW, Spodoptera, Stem Borers).',
    extractionMacerationDays: 2,
    activeShelfLifeDays: 90,
    shelfLifeDisplay: '3 Months (High Capsaicin & Allicin Potency)',
    finalPh: 5.0,
    activePhytochemicals: 'Capsaicin, Diallyl Disulfide, Nicotine Alkaloids, Gingerols, Azadirachtin',
    extractionMethod: 'Boiled Decoction Maceration',
    syntheticReplacementCostPerAcre: 1050,
    selfPreparedCostPerAcre: 145,
    filtrationRequirement: 'Double cloth filtration (use gloves and goggles during handling)',
    sprayWindowNote: 'Dilute 200 ml in 10 Litres water. Extremely potent; wear facial safety gear.',
    baseIngredientsPer100L: [
      { name: 'Hot Green Chilli Paste (Very Pungent)', amount100L: 1.0, unit: 'kg', sourceNote: 'High Scoville heat capsaicin' },
      { name: 'Desi Garlic Paste', amount100L: 0.5, unit: 'kg', sourceNote: 'Allicin pungent volatiles' },
      { name: 'Ginger Rhizome Crushed', amount100L: 0.5, unit: 'kg', sourceNote: 'Gingerol insect deterrent' },
      { name: 'Crushed Desi Tobacco Leaves', amount100L: 0.5, unit: 'kg', sourceNote: 'Natural nicotine nerve blocker' },
      { name: 'Neem Leaves Paste', amount100L: 5.0, unit: 'kg', sourceNote: 'Feeding deterrence' },
      { name: 'Desi Cow Urine (Gomutra)', amount100L: 20.0, unit: 'Litres', sourceNote: 'Boil slow for 1-2 hours' },
    ],
  },

  panchagavya: {
    id: 'panchagavya',
    name: 'Panchagavya (Traditional Cow-Derived Biostimulant)',
    tagline: '21-Day Fermentation of 5 Sacred Cow Products + Coconut Water, Sugarcane & Banana',
    targetSpectrum: 'Supplies natural plant hormones (IAA, GA, Cytokinins), induces systemic acquired resistance (SAR) against viruses and blights.',
    extractionMacerationDays: 21,
    activeShelfLifeDays: 180,
    shelfLifeDisplay: '6 Months (Rich Organic Hormonal Suspension)',
    finalPh: 5.4,
    activePhytochemicals: 'Indole Acetic Acid (IAA), Gibberellic Acid (GA3), Lactic Acid Bacteria, Yeast, Plant Nutrition',
    extractionMethod: 'Anaerobic Microbial Fermentation',
    syntheticReplacementCostPerAcre: 850,
    selfPreparedCostPerAcre: 120,
    filtrationRequirement: 'Fine mesh nylon cloth filtration before sprayer tank loading',
    sprayWindowNote: 'Dilute 300 ml in 10 Litres water (3% foliar spray) at vegetative and pre-flowering stages.',
    baseIngredientsPer100L: [
      { name: 'Fresh Desi Cow Dung', amount100L: 5.0, unit: 'kg', sourceNote: 'Mix with 1 kg Desi Ghee for 3 days' },
      { name: 'Desi Cow Ghee', amount100L: 0.5, unit: 'kg', sourceNote: 'Fatty acid breakdown catalyst' },
      { name: 'Desi Cow Urine (Gomutra)', amount100L: 3.0, unit: 'Litres', sourceNote: 'Added on Day 4' },
      { name: 'Fresh Cow Milk', amount100L: 2.0, unit: 'Litres', sourceNote: 'Lactose & amino acids' },
      { name: 'Fresh Cow Curd (Dahi)', amount100L: 2.0, unit: 'Litres', sourceNote: 'Lactic acid bacteria culture' },
      { name: 'Tender Coconut Water', amount100L: 3.0, unit: 'Litres', sourceNote: 'Natural cytokinins & electrolytes' },
      { name: 'Sugarcane Juice / Jaggery Water', amount100L: 3.0, unit: 'Litres', sourceNote: 'Microbial fermentation substrate' },
      { name: 'Ripe Bananas (Mashed)', amount100L: 12.0, unit: 'pieces', sourceNote: 'Potassium & enzyme enrichment' },
    ],
  },

  nue_10pct: {
    id: 'nue_10pct',
    name: 'Neem-Cow Urine Extract (NUE 10%)',
    tagline: '7-Day Ambient Steep of Crushed Fresh Neem Leaves in Fresh Cow Urine',
    targetSpectrum: 'Dual-action preventive against bacterial leaf blight, rice blast, downy mildew, and sucking leafhoppers.',
    extractionMacerationDays: 7,
    activeShelfLifeDays: 60,
    shelfLifeDisplay: '2 Months (Stable Antibacterial Extract)',
    finalPh: 6.2,
    activePhytochemicals: 'Azadirachtin, Benzoic Acid, Phenols, Urea Nitrogen, Bioactive Peptides',
    extractionMethod: 'Aqueous Cold Maceration',
    syntheticReplacementCostPerAcre: 620,
    selfPreparedCostPerAcre: 70,
    filtrationRequirement: 'Coarse straining followed by fine 80-mesh filter',
    sprayWindowNote: 'Dilute 1 Litre in 10 Litres water. Effective preventive foliar booster.',
    baseIngredientsPer100L: [
      { name: 'Fresh Green Neem Leaves (Crushed)', amount100L: 10.0, unit: 'kg', sourceNote: 'Freshly harvested twigs and foliage' },
      { name: 'Fresh Desi Cow Urine (Gomutra)', amount100L: 10.0, unit: 'Litres', sourceNote: 'Natural antiseptic solvent' },
      { name: 'Clean Well Water', amount100L: 80.0, unit: 'Litres', sourceNote: 'Steep for 7 days in shade' },
    ],
  },

  sour_buttermilk: {
    id: 'sour_buttermilk',
    name: 'Sour Buttermilk Spray (Khatta Chhachh / Fermented Whey)',
    tagline: '8–10 Day Fermentation in a Copper Vessel (Tamra Patra) yielding Bio-Active Copper Ions',
    targetSpectrum: 'Powerful natural bio-fungicide against powdery mildew, downy mildew, rust, and leaf spot diseases.',
    extractionMacerationDays: 9,
    activeShelfLifeDays: 14,
    shelfLifeDisplay: '2 Weeks (Active Lactic Acid & Copper Ion Complex)',
    finalPh: 4.2,
    activePhytochemicals: 'Lactic Acid (pH 4.0), Bioactive Copper Ion Chelates, Lactic Streptococci, Bacteriocins',
    extractionMethod: 'Anaerobic Microbial Fermentation',
    syntheticReplacementCostPerAcre: 580,
    selfPreparedCostPerAcre: 45,
    filtrationRequirement: 'Fine cloth filtration to remove milk solids/butter fat residues',
    sprayWindowNote: 'Dilute 500 ml to 1000 ml per 10 Litres water (5-10% dilution). Best sprayed in evening.',
    baseIngredientsPer100L: [
      { name: 'Sour Desi Buttermilk (Chhachh / Matha)', amount100L: 20.0, unit: 'Litres', sourceNote: 'Fermented in copper vessel until greenish-blue' },
      { name: 'Pure Copper Plate / Scrap (Tamra)', amount100L: 1.0, unit: 'kg', sourceNote: 'Immersed inside buttermilk container' },
      { name: 'Clean Soft Water', amount100L: 80.0, unit: 'Litres', sourceNote: 'Dilution carrier' },
    ],
  },

  entomopathogenic_fungi: {
    id: 'entomopathogenic_fungi',
    name: 'Beauveria / Metarhizium Entomopathogenic Bio-Suspension',
    tagline: 'Wettable Fungal Spore Powder (1 × 10⁸ CFU/g) targeting Soil Grubs & Caterpillars',
    targetSpectrum: 'White grubs, sugarcane root grubs, subterranean termites, diamondback moth, semi-loopers, and thrips.',
    extractionMacerationDays: 1,
    activeShelfLifeDays: 7,
    shelfLifeDisplay: '7 Days (Live Spore Viability)',
    finalPh: 6.5,
    activePhytochemicals: 'Beauvericin, Destruxin fungal mycotoxins, Chitinolytic enzymes',
    extractionMethod: 'Microbial Bio-Suspension',
    syntheticReplacementCostPerAcre: 850,
    selfPreparedCostPerAcre: 150,
    filtrationRequirement: '100-mesh filter to prevent spore clump blockage',
    sprayWindowNote: 'Mandatory high relative humidity (>75%) or evening application to ensure fungal cuticle penetration.',
    baseIngredientsPer100L: [
      { name: 'Beauveria bassiana / Metarhizium anisopliae WP', amount100L: 1.0, unit: 'kg', sourceNote: 'Certified 1 x 10⁸ CFU/g wettable powder' },
      { name: 'Organic Jaggery (Gur)', amount100L: 0.5, unit: 'kg', sourceNote: 'Spore activation nutrition' },
      { name: 'Agricultural Non-Ionic Silicon Spreader', amount100L: 30.0, unit: 'ml', sourceNote: 'Reduces surface tension to 28 mN/m' },
      { name: 'Clean Soft Water', amount100L: 100.0, unit: 'Litres', sourceNote: 'Chlorine-free' },
    ],
  },

  trichoderma_slurry: {
    id: 'trichoderma_slurry',
    name: 'Trichoderma harzianum / viride Bio-Fungicide Slurry',
    tagline: 'Antagonistic Mycoparasitic Bio-Agent targeting Soil & Seed-Borne Fungal Pathogens',
    targetSpectrum: 'Fusarium wilt, Rhizoctonia collar rot, Pythium damping off, Phytophthora root rot, Sclerotinia stem rot.',
    extractionMacerationDays: 2,
    activeShelfLifeDays: 7,
    shelfLifeDisplay: '7 Days (Active Mycelial Multiplication)',
    finalPh: 6.6,
    activePhytochemicals: 'Trichodermin, Gliotoxin, Chitinase, Beta-1,3-glucanase enzymes',
    extractionMethod: 'Microbial Bio-Suspension',
    syntheticReplacementCostPerAcre: 790,
    selfPreparedCostPerAcre: 135,
    filtrationRequirement: 'Straining through wire mesh for root drenching or seed coating',
    sprayWindowNote: 'Soil must have adequate moisture. Avoid chemical fungicides 7 days before/after application.',
    baseIngredientsPer100L: [
      { name: 'Trichoderma viride / harzianum 2% WP', amount100L: 1.0, unit: 'kg', sourceNote: 'High CFU certified formulation' },
      { name: 'Well-Decomposed Farmyard Manure (FYM)', amount100L: 10.0, unit: 'kg', sourceNote: 'Enriched carrier substrate' },
      { name: 'Organic Jaggery Solution (2%)', amount100L: 2.0, unit: 'Litres', sourceNote: 'Spore germination booster' },
      { name: 'Clean Sweet Water', amount100L: 100.0, unit: 'Litres', sourceNote: 'Non-chlorinated' },
    ],
  },
};

// 2. Batch Processing & Formulation Variables
export type ApplicationRoute = 'foliar_mist' | 'soil_drench' | 'drip_fertigation' | 'seed_priming';
export type WettingAgentType = 'khadi_soap' | 'soapnut_reetha' | 'silicon_spreader' | 'none';
export type CarrierWaterQuality = 'sweet_rainwater' | 'hard_alkaline';

export const APPLICATION_ROUTES: Record<ApplicationRoute, { name: string; note: string; dilutionRatio: string }> = {
  foliar_mist: { name: 'Ultra-Fine Foliar Mist (16L Knapsack / Hollow Cone)', note: 'High canopy coverage; requires lower surface tension (<35 mN/m).', dilutionRatio: '5% to 10% in water' },
  soil_drench: { name: 'Soil Drench / Basal Basin Ring Application', note: 'Direct root zone delivery targeting nematodes and collar rots.', dilutionRatio: '15% to 20% in water' },
  drip_fertigation: { name: 'Drip Irrigation Fertigation (Venturi Injection)', note: 'Requires multi-stage 120-mesh cloth filtration to protect drip emitters.', dilutionRatio: '100% through sand/screen filter' },
  seed_priming: { name: 'Pre-Sowing Seed / Rhizome Bio-Priming', note: 'Concentrated slurry coating for high initial germination vigor.', dilutionRatio: 'Undiluted concentrate slurry' },
};

export const WETTING_AGENTS: Record<WettingAgentType, { name: string; surfaceTensionMnm: number; doseText: string; note: string }> = {
  khadi_soap: { name: 'Pure Country Khadi Soap (Soft Soap)', surfaceTensionMnm: 32, doseText: '1.0 g / Litre', note: 'Reduces surface tension to 32 mN/m; excellent for waxy leaf cuticles.' },
  soapnut_reetha: { name: 'Reetha / Soapnut (Sapindus mukorossi) Liquid Saponin', surfaceTensionMnm: 34, doseText: '2.0 ml / Litre', note: 'Zero-chemical 100% organic certified natural surfactant.' },
  silicon_spreader: { name: 'Agricultural Non-Ionic Silicon Spreader', surfaceTensionMnm: 24, doseText: '0.3 ml / Litre', note: 'Ultra-spreading super-wetter; exceptional rain-fast adherence.' },
  none: { name: 'No Wetting Agent / Plain Water Control', surfaceTensionMnm: 72, doseText: '0.0 g / Litre', note: 'High surface tension (72 mN/m); prone to droplet bounce and roll-off.' },
};

export function BioControlSimulator({ onClose, onOpenShop }: BioControlSimulatorProps) {
  const { weatherData } = useTelemetry();
  const { activeDiagnosis } = useDiagnosis();
  const { selectedFarmId, selectedCropCycleId, selectedFarm, selectedCropCycle } = useFarms();

  // 1. Recipe Selection (10 ICAR Standard Formulations)
  const defaultRecipeId: BioRecipeId = useMemo(() => {
    if (!activeDiagnosis) return 'nske_5pct';
    const p = (activeDiagnosis.pestName + ' ' + activeDiagnosis.scientificName).toLowerCase();
    if (p.includes('blight') || p.includes('rot') || p.includes('wilt')) return 'trichoderma_slurry';
    if (p.includes('mildew') || p.includes('rust')) return 'sour_buttermilk';
    if (p.includes('aphid') || p.includes('whitefly') || p.includes('thrip')) return 'dashparni_ark';
    if (p.includes('bollworm') || p.includes('borer')) return 'brahmastra';
    if (p.includes('grub') || p.includes('caterpillar')) return 'entomopathogenic_fungi';
    return 'nske_5pct';
  }, [activeDiagnosis]);

  const [selectedRecipeId, setSelectedRecipeId] = useState<BioRecipeId>(defaultRecipeId);
  const [batchVolumeLiters, setBatchVolumeLiters] = useState<number>(100); // 10 L to 500 L
  const [applicationRoute, setApplicationRoute] = useState<ApplicationRoute>('foliar_mist');
  const [wettingAgent, setWettingAgent] = useState<WettingAgentType>('khadi_soap');
  const [carrierWater, setCarrierWater] = useState<CarrierWaterQuality>('sweet_rainwater');

  // Simulation execution state
  const [simState, setSimState] = useState<'standby' | 'running' | 'completed'>('standby');
  const [simProgress, setSimProgress] = useState<number>(0);
  const [currentPhase, setCurrentPhase] = useState<number>(1);
  const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => () => {
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
  }, []);

  const recipe = BIO_RECIPES[selectedRecipeId];
  const routeConfig = APPLICATION_ROUTES[applicationRoute];
  const surfactantConfig = WETTING_AGENTS[wettingAgent];

  // Scaled Ingredients based on Batch Volume
  const scaledIngredients = useMemo(() => {
    const scaleMultiplier = batchVolumeLiters / 100;
    return recipe.baseIngredientsPer100L.map((ing) => ({
      name: ing.name,
      amount: Number((ing.amount100L * scaleMultiplier).toFixed(2)),
      unit: ing.unit,
      sourceNote: ing.sourceNote,
    }));
  }, [recipe, batchVolumeLiters]);

  // Scaled Wetting Agent Requirement
  const scaledSurfactantAmount = useMemo(() => {
    if (wettingAgent === 'none') return 'None Required';
    if (wettingAgent === 'khadi_soap') {
      return `${(batchVolumeLiters * 1.0).toFixed(0)} grams`;
    }
    if (wettingAgent === 'soapnut_reetha') {
      return `${(batchVolumeLiters * 2.0).toFixed(0)} ml`;
    }
    return `${(batchVolumeLiters * 0.3).toFixed(1)} ml`;
  }, [wettingAgent, batchVolumeLiters]);

  // Start Simulation Execution Handler
  const startSimulation = () => {
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    setSimState('running');
    setSimProgress(0);
    setCurrentPhase(1);

    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setSimProgress(p);

      if (p < 25) {
        setCurrentPhase(1); // Phase 1: Phytochemical Leaching & Dissolution
      } else if (p < 50) {
        setCurrentPhase(2); // Phase 2: Microbial Growth Dynamics & CFU Peak
      } else if (p < 75) {
        setCurrentPhase(3); // Phase 3: Surface Tension & Cuticular Adhesion
      } else {
        setCurrentPhase(4); // Phase 4: Economic Benefit Analysis
      }

      if (p >= 100) {
        clearInterval(interval);
        simulationIntervalRef.current = null;
        setSimState('completed');
      }
    }, 40);
    simulationIntervalRef.current = interval;
  };

  const resetSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setSimState('standby');
    setSimProgress(0);
    setCurrentPhase(1);
  };

  React.useEffect(() => {
    if (simState !== 'completed') return;
    void saveSimulationTelemetry({
      moduleId: 'bio-control',
      moduleName: 'Bio-Control Phytochemical Extraction & Bio-Assay Simulator',
      timestamp: Date.now(),
      farmId: selectedFarmId || undefined,
      cropCycleId: selectedCropCycleId || undefined,
      parameters: {
        recipeId: selectedRecipeId,
        recipeName: recipe.name,
        batchVolumeLiters,
        applicationRoute,
        wettingAgent,
        carrierWater,
        farmName: selectedFarm?.name,
        crop: selectedCropCycle?.crop || selectedFarm?.primaryCrop,
        activeDiagnosis: activeDiagnosis?.pestName || null,
      },
      calculatedMetrics: {
        acresCovered: simulationResults.acresCovered,
        totalOrganicCost: simulationResults.totalOrganicCost,
        totalSyntheticCost: simulationResults.totalSyntheticCost,
        totalMoneySaved: simulationResults.totalMoneySaved,
        savingsPercent: simulationResults.savingsPercent,
        effectiveExtractionHours: simulationResults.effectiveExtractionHours,
        cfuPeakWindow: simulationResults.cfuPeakWindow,
        adhesionQuality: simulationResults.adhesionQuality,
      },
      suggestedPrompts: [
        `How should I apply ${recipe.name} to the selected crop?`,
        'Cross-check this bio-control plan against current weather and diagnosis.',
        'Create the preparation and application tasks from this result.',
      ],
    });
  }, [simState]);

  // Step-by-Step Simulation Physics & Bio-Assay Calculations
  const simulationResults = useMemo(() => {
    // Phase 1: Phytochemical Leaching Efficiency based on ambient temp
    const temp = weatherData.temp || 28;
    const leachingRateMultiplier = temp > 32 ? 1.25 : temp < 20 ? 0.75 : 1.0;
    const effectiveExtractionHours = Math.round(recipe.extractionMacerationDays * 24 / leachingRateMultiplier);

    // Phase 2: Microbial Peak CFU Viability Window
    const cfuPeakWindow = recipe.shelfLifeDisplay;

    // Phase 3: Surface Tension & Cuticular Adhesion
    const leafSurfaceTension = surfactantConfig.surfaceTensionMnm;
    const adhesionQuality =
      leafSurfaceTension <= 30
        ? 'Super-Spreading (Zero Droplet Bounce)'
        : leafSurfaceTension <= 35
        ? 'Excellent Cuticular Wetting (Optimal)'
        : 'Poor Spreading (High Droplet Roll-Off)';

    // Phase 4: Economics & Savings per acre
    // 100 Liters spray covers ~1 Acre of dense crop canopy
    const acresCovered = Number((batchVolumeLiters / 100).toFixed(1));
    const totalOrganicCost = Math.round(recipe.selfPreparedCostPerAcre * acresCovered);
    const totalSyntheticCost = Math.round(recipe.syntheticReplacementCostPerAcre * acresCovered);
    const totalMoneySaved = totalSyntheticCost - totalOrganicCost;
    const savingsPercent = Math.round((totalMoneySaved / totalSyntheticCost) * 100);

    return {
      temp,
      effectiveExtractionHours,
      cfuPeakWindow,
      leafSurfaceTension,
      adhesionQuality,
      acresCovered,
      totalOrganicCost,
      totalSyntheticCost,
      totalMoneySaved,
      savingsPercent,
    };
  }, [weatherData, recipe, surfactantConfig, batchVolumeLiters]);

  return (
    <div className="space-y-4 text-xs">
      <ActiveParcelSelector compact />
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/25 space-y-1.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="size-4 text-[var(--brand-color,#0f9a58)]" />
              <h4 className="font-black text-sm text-slate-950 dark:text-white">
                "Bio-Control" Phytochemical Extraction, Fermentation & Bio-Assay Simulator
              </h4>
            </div>
            <p className="text-slate-750 dark:text-slate-200 font-medium text-[11px] mt-0.5">
              10 Verified ICAR / SAU Standard Organic Recipes • Dynamic batch scaling • Net farm input savings.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
              10 ICAR Recipes
            </span>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="p-4 rounded-2xl frosted-card border border-white/60 dark:border-white/10 space-y-3.5">
        {/* Row 1: Recipe Selector (10 Recipes) */}
        <div className="space-y-1.5">
          <label className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
            <Leaf className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
            <span>Select Botanical / Bio-Control Recipe (10 Standard Formulations):</span>
          </label>
          <select
            value={selectedRecipeId}
            onChange={(e) => setSelectedRecipeId(e.target.value as BioRecipeId)}
            className="w-full p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-300 dark:border-white/15 font-black text-slate-950 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/50"
          >
            {(Object.keys(BIO_RECIPES) as BioRecipeId[]).map((rKey) => {
              const item = BIO_RECIPES[rKey];
              return (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.tagline.split(' • ')[0]}
                </option>
              );
            })}
          </select>
        </div>

        {/* Row 2: Batch Volume Slider & Preparation Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Volume Slider (10L to 500L) */}
          <div className="p-3 rounded-xl frosted-glass-sub border border-white/60 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-slate-600 dark:text-slate-300">Target Batch Volume:</span>
              <span className="text-[var(--brand-color,#0f9a58)] font-black text-xs">
                {batchVolumeLiters} Liters (~{simulationResults.acresCovered} Acres)
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={batchVolumeLiters}
              onChange={(e) => setBatchVolumeLiters(Number(e.target.value))}
              className="w-full accent-[var(--brand-color,#0f9a58)]"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>10 L (Backpack Test)</span>
              <span>100 L (1 Acre Standard)</span>
              <span>500 L (Commercial Orchard)</span>
            </div>
          </div>

          {/* Delivery & Application Route */}
          <div className="p-3 rounded-xl frosted-glass-sub border border-white/60 space-y-1">
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">
              Application Route & Equipment:
            </span>
            <select
              value={applicationRoute}
              onChange={(e) => setApplicationRoute(e.target.value as ApplicationRoute)}
              className="w-full text-xs font-black bg-transparent text-slate-900 dark:text-white focus:outline-none py-1"
            >
              {(Object.keys(APPLICATION_ROUTES) as ApplicationRoute[]).map((rt) => (
                <option key={rt} value={rt}>
                  {APPLICATION_ROUTES[rt].name}
                </option>
              ))}
            </select>
            <span className="text-[9px] text-slate-500 block">
              Target Dilution: <strong>{routeConfig.dilutionRatio}</strong>
            </span>
          </div>
        </div>

        {/* Row 3: Wetting Agent & Carrier Water Profile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Natural Surfactant / Wetting Agent */}
          <div className="p-3 rounded-xl frosted-glass-sub border border-white/60 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-slate-600 dark:text-slate-300">Natural Wetting Agent:</span>
              <span className="text-teal-600 font-black">{surfactantConfig.surfaceTensionMnm} mN/m</span>
            </div>
            <select
              value={wettingAgent}
              onChange={(e) => setWettingAgent(e.target.value as WettingAgentType)}
              className="w-full text-xs font-black bg-transparent text-slate-900 dark:text-white focus:outline-none py-1"
            >
              {(Object.keys(WETTING_AGENTS) as WettingAgentType[]).map((wKey) => (
                <option key={wKey} value={wKey}>
                  {WETTING_AGENTS[wKey].name} ({WETTING_AGENTS[wKey].doseText})
                </option>
              ))}
            </select>
            <span className="text-[9px] text-slate-500 block">
              Required for batch: <strong>{scaledSurfactantAmount}</strong>
            </span>
          </div>

          {/* Carrier Water Profile */}
          <div className="p-3 rounded-xl frosted-glass-sub border border-white/60 space-y-1">
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">
              Carrier Water Quality Profile:
            </span>
            <select
              value={carrierWater}
              onChange={(e) => setCarrierWater(e.target.value as CarrierWaterQuality)}
              className="w-full text-xs font-black bg-transparent text-slate-900 dark:text-white focus:outline-none py-1"
            >
              <option value="sweet_rainwater">Rainwater / Fresh Sweet Borewell (pH 6.5–7.2, Low Salts)</option>
              <option value="hard_alkaline">Hard Alkaline Well Water (pH 8.2+, requires citric acid/whey buffer)</option>
            </select>
            <span className="text-[9px] text-slate-500 block">
              {carrierWater === 'hard_alkaline' ? '⚠ Add 200 ml sour buttermilk to buffer alkaline water' : '✓ Optimal water condition for extraction'}
            </span>
          </div>
        </div>

        {/* Start / Reset Simulation Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
          <div className="text-[11px] text-slate-500 font-semibold">
            Status:{' '}
            <strong className="text-slate-900 dark:text-white capitalize">
              {simState === 'running' ? `Phase ${currentPhase}/4 Simulating...` : simState === 'completed' ? 'Phytochemical Assay Complete' : 'Ready'}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            {simState === 'completed' && (
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
              disabled={simState === 'running'}
              className="px-4 py-2 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] disabled:opacity-50 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Play className="size-3.5" />
              <span>{simState === 'running' ? 'Extracting Alkaloids...' : 'Start Simulator'}</span>
            </button>
          </div>
        </div>

        {/* Simulation Progress Bar */}
        {simState === 'running' && (
          <div className="space-y-1.5 pt-1">
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[var(--brand-color,#0f9a58)] h-full transition-all duration-75 ease-out rounded-full"
                style={{ width: `${simProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-bold">
              <span>Phase 1: Phytochemical Dissolution</span>
              <span>Phase 2: Microbial CFU Peak</span>
              <span>Phase 3: Surface Tension</span>
              <span>Phase 4: Economic Benefit</span>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* ACTIONABLE OUTPUT: RECIPE, POTENCY, FILTRATION & DIRECT STORE     */}
      {/* ================================================================= */}
      <div className="space-y-3">
        {/* Economic Advantage Highlight Strip */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-[var(--brand-color,#0f9a58)] text-white flex items-center justify-center shrink-0 shadow-xs">
              <DollarSign className="size-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--brand-color,#0f9a58)] block">
                Net Input Cost Advantage ({simulationResults.acresCovered} Acres)
              </span>
              <h4 className="text-sm font-black text-slate-950 dark:text-white">
                Save ₹{simulationResults.totalMoneySaved.toLocaleString('en-IN')} ({simulationResults.savingsPercent}% Reduction vs Synthetic Sprays)
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10">
              <span className="text-[9px] text-slate-500 block font-bold">Organic Batch Cost</span>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                ₹{simulationResults.totalOrganicCost.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10">
              <span className="text-[9px] text-slate-500 block font-bold">Synthetic Equivalent</span>
              <span className="text-xs font-black text-rose-600">
                ₹{simulationResults.totalSyntheticCost.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Raw Material Recipe Card (Scaled to batch size) */}
        <div className="p-4 rounded-2xl frosted-card border border-white/60 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
            <div>
              <h5 className="font-black text-xs sm:text-sm text-slate-950 dark:text-white flex items-center gap-1.5">
                <Scale className="size-4 text-[var(--brand-color,#0f9a58)]" />
                <span>Itemized Raw Material Recipe (Scaled for {batchVolumeLiters} Liters)</span>
              </h5>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Target Spectrum: <strong>{recipe.targetSpectrum}</strong>
              </p>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
              pH: {recipe.finalPh}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {scaledIngredients.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 flex items-center justify-between"
              >
                <div>
                  <span className="font-black text-xs text-slate-950 dark:text-white block">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-500 block">{item.sourceNote}</span>
                </div>
                <span className="text-xs font-black text-[var(--brand-color,#0f9a58)] font-mono shrink-0 ml-2">
                  {item.amount} {item.unit}
                </span>
              </div>
            ))}
          </div>

          {/* Potency & Shelf Life Indicator */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded-xl frosted-glass-sub border border-white/60">
              <span className="text-[10px] text-slate-500 block font-bold">Extraction Time</span>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {recipe.extractionMacerationDays} Days ({recipe.extractionMethod})
              </span>
            </div>
            <div className="p-2.5 rounded-xl frosted-glass-sub border border-white/60">
              <span className="text-[10px] text-slate-500 block font-bold">Active Potency Shelf-Life</span>
              <span className="text-xs font-black text-amber-600">{recipe.shelfLifeDisplay}</span>
            </div>
            <div className="p-2.5 rounded-xl frosted-glass-sub border border-white/60">
              <span className="text-[10px] text-slate-500 block font-bold">Droplet Adhesion</span>
              <span className="text-xs font-black text-teal-600">{simulationResults.adhesionQuality}</span>
            </div>
          </div>

          {/* Filtration & Spray Protocol */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-black text-xs">
              <Filter className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
              <span>Filtration & Application Safety Protocol:</span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
              <strong>Filtration:</strong> {recipe.filtrationRequirement}.
            </p>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
              <strong>Spraying Timing:</strong> {recipe.sprayWindowNote}.
            </p>
          </div>

          {/* Direct Store Links */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200 dark:border-white/10">
            <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              Need certified raw ingredients, organic neem seeds, straining cloths, or sprayers?
            </span>
            <button
              type="button"
              onClick={() => onOpenShop && onOpenShop('crop_protection')}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ShoppingCart className="size-3.5" />
              <span>Order Bio Ingredients on Kisan Shop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
