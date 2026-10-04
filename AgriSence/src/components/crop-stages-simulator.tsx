import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sprout,
  Droplets,
  Thermometer,
  Calendar,
  Layers,
  Bug,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sprout as Sparkles,
  ShoppingCart,
  Sun,
  Activity,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useTelemetry } from '@/src/context/telemetry-context';
import { useDiagnosis } from '@/src/context/diagnosis-context';
import { useAuth } from '@/src/context/auth-context';
import { saveSimulationTelemetry } from '@/src/lib/simulator-sync';
import { ActiveParcelSelector } from '@/src/components/dashboard/active-parcel-selector';

export interface CropStagesSimulatorProps {
  onClose?: () => void;
  onOpenShop?: (category: 'seeds' | 'crop_protection' | 'fertilizers' | 'machinery') => void;
}

// 1. Crop Taxonomy Systems (10 Core Agronomic Archetypes)
export type CropArchetypeId =
  | 'grain_legumes'
  | 'small_cereals'
  | 'wetland_cereals'
  | 'coarse_c4_cereals'
  | 'fiber_cash'
  | 'subtropical_orchards'
  | 'underground_tubers'
  | 'industrial_biomass'
  | 'annual_oilseeds'
  | 'solanaceous_vegetables';

export interface StageDefinition {
  stageNumber: number;
  code: string;
  name: string;
  durationDays: number;
  kc: number;
  gddThreshold: number;
  waterDemandLitersPerAcreDay: number;
  waterSensitivity: 'Moderate' | 'Critical Peak' | 'High' | 'Low';
  waterSensitivityNote: string;
  scheduledNutrientRecipe: string;
  foliarSplitRecommendation: string;
  keyStagePests: string[];
  recommendedBioControl: string;
}

export interface CropArchetypeConfig {
  id: CropArchetypeId;
  name: string;
  representativeCrops: string;
  baseTempCelsius: number; // Tbase for GDD
  totalLifecycleDays: number;
  stages: StageDefinition[];
}

export const CROP_ARCHETYPES: Record<CropArchetypeId, CropArchetypeConfig> = {
  grain_legumes: {
    id: 'grain_legumes',
    name: 'Grain Legumes & Pulses',
    representativeCrops: 'Soybean, Chickpea, Pigeonpea, Moong, Urad',
    baseTempCelsius: 10.0,
    totalLifecycleDays: 105,
    stages: [
      {
        stageNumber: 1,
        code: 'VE-V1',
        name: 'Seedling Emergence & Unifoliate Leaves',
        durationDays: 14,
        kc: 0.40,
        gddThreshold: 180,
        waterDemandLitersPerAcreDay: 16000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'Ensure moist seedbed without waterlogging to prevent seed rot.',
        scheduledNutrientRecipe: 'Basal: SSP @ 100 kg/acre + Rhizobium bio-inoculant seed priming',
        foliarSplitRecommendation: 'Zinc EDTA 12% @ 1.5 g/L for root elongation',
        keyStagePests: ['Stem Fly', 'Seedling Blight', 'Cutworms'],
        recommendedBioControl: 'Trichoderma harzianum seed priming @ 5 g/kg seed + Neem Seed Kernel Extract (5% NSKE)',
      },
      {
        stageNumber: 2,
        code: 'V3-V6',
        name: 'Active Vegetative Branching & Nodulation',
        durationDays: 24,
        kc: 0.75,
        gddThreshold: 450,
        waterDemandLitersPerAcreDay: 24000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'Active nodule bacteroids fixing atmospheric nitrogen (+35 kg N/ha).',
        scheduledNutrientRecipe: 'Top-dressing: DAP / 19:19:19 WSF + Sulfur 90% WDG @ 3 kg/acre',
        foliarSplitRecommendation: 'Seaweed Bio-Extract @ 2 ml/L + Micronutrient mix (Fe, Mn, Mo)',
        keyStagePests: ['Girdle Beetle', 'Tobacco Caterpillar (Spodoptera)', 'Whiteflies'],
        recommendedBioControl: 'Dashparni Ark @ 5% + Pheromone traps (Spodolure @ 5 traps/acre)',
      },
      {
        stageNumber: 3,
        code: 'R1-R2',
        name: 'Anthesis, Flower Budding & Open Pollination',
        durationDays: 20,
        kc: 1.15,
        gddThreshold: 780,
        waterDemandLitersPerAcreDay: 38000,
        waterSensitivity: 'Critical Peak',
        waterSensitivityNote: 'Severe water deficit during bloom triggers up to 40% flower abortion and pod drop.',
        scheduledNutrientRecipe: '00:52:34 MKP @ 5 g/L + Solubor Boron 20% @ 1 g/L',
        foliarSplitRecommendation: 'Boron 20% spray for pollen tube germination and ovary fertilization',
        keyStagePests: ['Flower Thrips', 'Helicoverpa Pod Borer (Egg laying)', 'Blister Beetle'],
        recommendedBioControl: 'Brahmastra @ 5% spray + Release Trichogramma chilonis egg parasitoids (50,000/acre)',
      },
      {
        stageNumber: 4,
        code: 'R3-R5',
        name: 'Pod Elongation & Seed Embryo Fill',
        durationDays: 26,
        kc: 1.05,
        gddThreshold: 1100,
        waterDemandLitersPerAcreDay: 32000,
        waterSensitivity: 'High',
        waterSensitivityNote: 'Crucial for seed test weight and oil content synthesis.',
        scheduledNutrientRecipe: '13:00:45 Potassium Nitrate @ 5 g/L for rapid carbohydrate translocation',
        foliarSplitRecommendation: 'Chelated Potassium & Amino Acid Complex @ 2 ml/L',
        keyStagePests: ['Gram Pod Borer (Helicoverpa armigera)', 'Maruca Pod Borer', 'Pod Sucking Bugs'],
        recommendedBioControl: 'Beauveria bassiana @ 5 g/L or Agniastra @ 5% for mature larvae knockdown',
      },
      {
        stageNumber: 5,
        code: 'R7-R8',
        name: 'Pod Senescence, Defoliation & Physiological Desiccation',
        durationDays: 21,
        kc: 0.30,
        gddThreshold: 1350,
        waterDemandLitersPerAcreDay: 8000,
        waterSensitivity: 'Low',
        waterSensitivityNote: 'Stop all irrigations 10 days before harvest to facilitate uniform natural dry-down.',
        scheduledNutrientRecipe: 'No basal/foliar fertilization required (allow natural senescence)',
        foliarSplitRecommendation: 'Natural desiccation monitoring; harvest at 12-14% seed moisture',
        keyStagePests: ['Storage Weevils (Bruchids in mature field pods)', 'Rodents'],
        recommendedBioControl: 'Neem-oil field barrier spray before combine harvesting',
      },
    ],
  },

  small_cereals: {
    id: 'small_cereals',
    name: 'Small Grain Cereals',
    representativeCrops: 'Wheat, Barley, Oats',
    baseTempCelsius: 4.5,
    totalLifecycleDays: 120,
    stages: [
      {
        stageNumber: 1,
        code: 'CRI',
        name: 'Crown Root Initiation (21 Days Post-Sowing)',
        durationDays: 22,
        kc: 0.45,
        gddThreshold: 220,
        waterDemandLitersPerAcreDay: 18000,
        waterSensitivity: 'Critical Peak',
        waterSensitivityNote: 'CRI is the most sensitive stage; skipping 1st irrigation permanently sacrifices 30-40% tillers.',
        scheduledNutrientRecipe: 'Basal: 50% Nitrogen (Urea) + 100% P₂O₅ (DAP/SSP) + 100% K₂O + Zinc Sulfate (21%) @ 10 kg/acre',
        foliarSplitRecommendation: 'Zinc EDTA 12% @ 1.5 g/L for root anchorage and tillering vigor',
        keyStagePests: ['Termites', 'Seedling Blight (Fusarium)', 'Shoot Fly'],
        recommendedBioControl: 'Seed treatment with Trichoderma viride @ 5 g/kg seed + Chlorpyrifos barrier for termites',
      },
      {
        stageNumber: 2,
        code: 'TILLER-JOINT',
        name: 'Active Tillering & Stem Elongation',
        durationDays: 26,
        kc: 0.80,
        gddThreshold: 520,
        waterDemandLitersPerAcreDay: 26000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'Stem nodes jointing upwards; requires steady moisture to maintain secondary tillers.',
        scheduledNutrientRecipe: '1st Top Dressing: 25% Nitrogen (Urea @ 35 kg/acre) + Sulfur 90% WDG @ 3 kg/acre',
        foliarSplitRecommendation: '19:19:19 WSF @ 5 g/L + Humic Acid @ 2 ml/L',
        keyStagePests: ['Wheat Aphids', 'Pink Stem Borer', 'Armyworm'],
        recommendedBioControl: 'Yellow sticky traps (10/acre) + 5% NSKE or Dashparni Ark foliar spray',
      },
      {
        stageNumber: 3,
        code: 'BOOT-HEADING',
        name: 'Booting, Flag Leaf Emergence & Spike Heading',
        durationDays: 24,
        kc: 1.18,
        gddThreshold: 820,
        waterDemandLitersPerAcreDay: 36000,
        waterSensitivity: 'Critical Peak',
        waterSensitivityNote: 'Flag leaf generates 75% of grain filling photosynthates; water deficit leads to blank spikelets.',
        scheduledNutrientRecipe: '2nd Top Dressing: 25% Nitrogen (Urea) or 00:52:34 MKP foliar spray @ 5 g/L',
        foliarSplitRecommendation: '00:52:34 MKP @ 5 g/L + Solubor Boron 20% @ 1 g/L for spikelet fertility',
        keyStagePests: ['Yellow Rust (Puccinia striiformis)', 'Brown Rust', 'Foliar Blight'],
        recommendedBioControl: 'Prophylactic Sour Buttermilk Spray (Khatta Chhachh @ 10% in copper vessel) or Propiconazole 25% EC',
      },
      {
        stageNumber: 4,
        code: 'FLOWER-MILK',
        name: 'Anthesis Pollination & Milky Dough Grain Fill',
        durationDays: 26,
        kc: 1.00,
        gddThreshold: 1120,
        waterDemandLitersPerAcreDay: 30000,
        waterSensitivity: 'High',
        waterSensitivityNote: 'Terminal heat waves (>32°C) cause forced premature grain shriveling.',
        scheduledNutrientRecipe: '13:00:45 Potassium Nitrate @ 5 g/L for cellular starch accumulation',
        foliarSplitRecommendation: 'Potassium Nitrate foliar spray to combat high daytime thermal stress',
        keyStagePests: ['Earhead Bug', 'Karnal Bunt', 'Aphids'],
        recommendedBioControl: 'Neem-Cow Urine Extract (NUE 10%) spray for earhead sucking aphid colonies',
      },
      {
        stageNumber: 5,
        code: 'DOUGH-RIPEN',
        name: 'Hard Dough, Golden Canopy & Desiccation',
        durationDays: 22,
        kc: 0.25,
        gddThreshold: 1400,
        waterDemandLitersPerAcreDay: 6000,
        waterSensitivity: 'Low',
        waterSensitivityNote: 'Dry soil condition required for combine harvesters; prevents lodging and grain shattering.',
        scheduledNutrientRecipe: 'Zero fertilizer; grain moisture falls below 14%',
        foliarSplitRecommendation: 'Field drying check; prepare storage godowns with aluminum phosphide fumigation',
        keyStagePests: ['Field Rodents', 'Grain Smut'],
        recommendedBioControl: 'Mechanical rodent bait stations on field boundaries',
      },
    ],
  },

  wetland_cereals: {
    id: 'wetland_cereals',
    name: 'Wetland Semi-Aquatic Cereals',
    representativeCrops: 'Paddy / Rice (Lowland & Upland Basmati/IR-64)',
    baseTempCelsius: 10.0,
    totalLifecycleDays: 130,
    stages: [
      {
        stageNumber: 1,
        code: 'TRANSPLANT',
        name: 'Nursery Germination & Seedling Recovery',
        durationDays: 20,
        kc: 1.05,
        gddThreshold: 240,
        waterDemandLitersPerAcreDay: 42000,
        waterSensitivity: 'High',
        waterSensitivityNote: 'Maintain 2-3 cm standing water layer to cushion seedlings from transplant shock.',
        scheduledNutrientRecipe: 'Basal: 50% N + 100% P₂O₅ (SSP/DAP) + 50% K₂O + Zinc Sulfate (21%) @ 10 kg/acre',
        foliarSplitRecommendation: 'Root dipping in Pseudomonas fluorescens bio-slurry (10 g/L) before transplanting',
        keyStagePests: ['Paddy Caseworm', 'Green Leafhopper', 'Root Nematodes'],
        recommendedBioControl: 'Neem Cake soil incorporation @ 100 kg/acre to repel subterranean rice nematodes',
      },
      {
        stageNumber: 2,
        code: 'MAX-TILLER',
        name: 'Vegetative Tillering & Root Flit',
        durationDays: 30,
        kc: 1.15,
        gddThreshold: 580,
        waterDemandLitersPerAcreDay: 48000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'Alternate Wetting & Drying (AWD) practiced to strengthen tillers and save 25% water.',
        scheduledNutrientRecipe: '1st Top Dressing: 25% Nitrogen (Neem-Coated Urea @ 35 kg/acre) + Cartap/Bio granules',
        foliarSplitRecommendation: '19:19:19 WSF @ 5 g/L + Silicon Bio-Fertilizer for leaf erectness',
        keyStagePests: ['Yellow Stem Borer (Dead Heart)', 'Hispa', 'Bacterial Leaf Blight (BLB)'],
        recommendedBioControl: 'Release Trichogramma japonicum parasitoids @ 40,000/acre + Pheromone traps for stem borer',
      },
      {
        stageNumber: 3,
        code: 'PANICLE',
        name: 'Panicle Primordia Initiation & Internode Elongation',
        durationDays: 25,
        kc: 1.30,
        gddThreshold: 900,
        waterDemandLitersPerAcreDay: 54000,
        waterSensitivity: 'Critical Peak',
        waterSensitivityNote: 'Severe water deficit during panicle initiation triggers high percentage of chaffy grains.',
        scheduledNutrientRecipe: '2nd Top Dressing: Remaining 25% Nitrogen + 50% MOP (Potash @ 20 kg/acre)',
        foliarSplitRecommendation: '00:52:34 MKP @ 5 g/L + Solubor Boron 20% @ 1 g/L',
        keyStagePests: ['Sheath Blight (Rhizoctonia)', 'Brown Plant Hopper (BPH)', 'Stem Borer'],
        recommendedBioControl: 'Maintain alleyways every 2 meters for BPH sunlight entry + Spray Pseudomonas fluorescens @ 5 g/L',
      },
      {
        stageNumber: 4,
        code: 'HEADING-MILK',
        name: 'Complete Panicle Exsertion, Anthesis & Milky Grains',
        durationDays: 30,
        kc: 1.20,
        gddThreshold: 1240,
        waterDemandLitersPerAcreDay: 44000,
        waterSensitivity: 'High',
        waterSensitivityNote: 'Maintain saturated soil without prolonged deep inundation to avoid lodging.',
        scheduledNutrientRecipe: '13:00:45 Potassium Nitrate foliar spray @ 5 g/L for heavy panicle grain density',
        foliarSplitRecommendation: 'Foliar chelated Potassium + Silicic Acid to harden outer rice husks',
        keyStagePests: ['Paddy Gandhi Bug (Earhead Sucking Bug)', 'Neck Blast', 'False Smut'],
        recommendedBioControl: '5% NSKE spray in evening + Light traps (1 trap/acre) to attract Gandhi bug adults',
      },
      {
        stageNumber: 5,
        code: 'MATURITY',
        name: 'Golden Cereal Ripening & Grain Hardening',
        durationDays: 25,
        kc: 0.65,
        gddThreshold: 1550,
        waterDemandLitersPerAcreDay: 12000,
        waterSensitivity: 'Low',
        waterSensitivityNote: 'Drain field water completely 12-15 days before harvest to firm soil for combine machinery.',
        scheduledNutrientRecipe: 'Zero fertilizer; allow grain golden drying to 18-20% harvest moisture',
        foliarSplitRecommendation: 'Harvest readiness inspection',
        keyStagePests: ['Rats & Field Rodents', 'Grain Discoloration'],
        recommendedBioControl: 'Rodent barrier clearing + Zinc Phosphide / Bromadiolone safety bait stations',
      },
    ],
  },

  coarse_c4_cereals: {
    id: 'coarse_c4_cereals',
    name: 'Coarse C4 Cereals',
    representativeCrops: 'Hybrid Maize, Pearl Millet (Bajra), Sorghum (Jowar)',
    baseTempCelsius: 10.0,
    totalLifecycleDays: 100,
    stages: [
      {
        stageNumber: 1,
        code: 'VE-V3',
        name: 'Emergence & Early Coleoptile Development',
        durationDays: 15,
        kc: 0.40,
        gddThreshold: 200,
        waterDemandLitersPerAcreDay: 15000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'C4 high photosynthetic efficiency; avoid excess surface water pooling around collar.',
        scheduledNutrientRecipe: 'Basal: 40% N + 100% P₂O₅ (DAP @ 50 kg/acre) + 100% K₂O + Zinc Sulfate (21%) @ 10 kg/acre',
        foliarSplitRecommendation: 'Zinc EDTA 12% @ 1.5 g/L to prevent white-bud zinc deficiency in maize',
        keyStagePests: ['Fall Armyworm (FAW - Spodoptera frugiperda)', 'Shoot Fly', 'Cutworms'],
        recommendedBioControl: 'Seed treatment with Cyantraniliprole / Thiamethoxam + Sand-ash whorl application for FAW',
      },
      {
        stageNumber: 2,
        code: 'V6-V12',
        name: 'Rapid Stem Elongation & Knee-High Vigor',
        durationDays: 25,
        kc: 0.85,
        gddThreshold: 550,
        waterDemandLitersPerAcreDay: 28000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'Rapid internode stacking and leaf area expansion; high solar interception.',
        scheduledNutrientRecipe: '1st Top Dressing: 30% Nitrogen (Urea @ 40 kg/acre) + Sulfur 90% WDG @ 3 kg/acre',
        foliarSplitRecommendation: '19:19:19 WSF @ 5 g/L + Seaweed Bio-Extract @ 2 ml/L',
        keyStagePests: ['Fall Armyworm in leaf whorls', 'Stem Borer (Chilo partellus)', 'Downy Mildew'],
        recommendedBioControl: 'Whorl application of Metarhizium rileyi or Beauveria bassiana @ 5 g/L + Neem oil 10,000 ppm',
      },
      {
        stageNumber: 3,
        code: 'VT-R1',
        name: 'Tasseling, Pollen Shed & Silk Emergence',
        durationDays: 18,
        kc: 1.20,
        gddThreshold: 850,
        waterDemandLitersPerAcreDay: 40000,
        waterSensitivity: 'Critical Peak',
        waterSensitivityNote: 'Drought at silking causes silk desiccation and asynchronous pollination (barren cobs).',
        scheduledNutrientRecipe: '2nd Top Dressing: Remaining 30% Nitrogen (Urea) at pre-tasseling stage',
        foliarSplitRecommendation: '00:52:34 MKP @ 5 g/L + Solubor Boron 20% @ 1 g/L for silk pollination viability',
        keyStagePests: ['Corn Earworm (Helicoverpa)', 'FAW Cob Borer', 'Turcicum Leaf Blight'],
        recommendedBioControl: 'Agniastra @ 5% spray or Release Trichogramma pretiosum egg parasitoids',
      },
      {
        stageNumber: 4,
        code: 'R2-R4',
        name: 'Blister, Kernel Milk & Starch Dent',
        durationDays: 24,
        kc: 1.05,
        gddThreshold: 1150,
        waterDemandLitersPerAcreDay: 32000,
        waterSensitivity: 'High',
        waterSensitivityNote: 'Kernel weight determined by continuous starch synthesis in cob endosperm.',
        scheduledNutrientRecipe: '13:00:45 Potassium Nitrate @ 5 g/L for kernel test weight enhancement',
        foliarSplitRecommendation: 'Potassium Nitrate + Micronutrient chelate foliar spray',
        keyStagePests: ['Cob Rot (Fusarium)', 'Earhead Caterpillars', 'Stink Bugs'],
        recommendedBioControl: '5% NSKE spray over cob silk zone',
      },
      {
        stageNumber: 5,
        code: 'R6',
        name: 'Black Abscission Layer & Husk Drying',
        durationDays: 18,
        kc: 0.35,
        gddThreshold: 1400,
        waterDemandLitersPerAcreDay: 8000,
        waterSensitivity: 'Low',
        waterSensitivityNote: 'Black abscission layer forms at kernel base; cob moisture reaches 15%.',
        scheduledNutrientRecipe: 'Zero fertilizer; field drying',
        foliarSplitRecommendation: 'Cob dry-down check',
        keyStagePests: ['Birds (Parrots/Crows)', 'Field Rodents'],
        recommendedBioControl: 'Reflective bird tape ribbons & biological scare acoustics',
      },
    ],
  },

  fiber_cash: {
    id: 'fiber_cash',
    name: 'Fiber & Long-Duration Cash',
    representativeCrops: 'Bt Cotton (Medium & Long Staple), Hybrid Cotton',
    baseTempCelsius: 12.0,
    totalLifecycleDays: 160,
    stages: [
      {
        stageNumber: 1,
        code: 'VE-V4',
        name: 'Emergence & Monopodial Vegetative Growth',
        durationDays: 30,
        kc: 0.45,
        gddThreshold: 350,
        waterDemandLitersPerAcreDay: 18000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'Deep taproot exploration; avoid standing water on heavy vertisols.',
        scheduledNutrientRecipe: 'Basal: 25% N + 100% P₂O₅ (DAP @ 50 kg/acre) + 50% K₂O + MgSO₄ @ 10 kg/acre',
        foliarSplitRecommendation: 'Zinc EDTA 12% @ 1.5 g/L + 19:19:19 WSF @ 3 g/L',
        keyStagePests: ['Thrips', 'Aphids', 'Jassids / Leafhoppers', 'Whitefly'],
        recommendedBioControl: 'Seed treatment with Imidacloprid/Thiamethoxam + Yellow/Blue sticky traps (15/acre) + Dashparni Ark @ 5%',
      },
      {
        stageNumber: 2,
        code: 'SQUARE',
        name: 'Sympodial Branching & Pinhead Square Formation',
        durationDays: 35,
        kc: 0.85,
        gddThreshold: 750,
        waterDemandLitersPerAcreDay: 30000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'Square shedding occurs if vegetative growth overpowers reproductive balance.',
        scheduledNutrientRecipe: '1st Top Dressing: 35% Nitrogen (Urea @ 45 kg/acre) + Micronutrient Grade-II',
        foliarSplitRecommendation: '00:52:34 MKP @ 5 g/L + Planofix (NAA @ 0.25 ml/4.5L) to curb square drop',
        keyStagePests: ['Pink Bollworm (Pectinophora gossypiella)', 'Spotted Bollworm', 'Mirid Bugs'],
        recommendedBioControl: 'Install Pecti-lure pheromone traps (8 traps/acre) + Release Trichogrammatoidea bactrae',
      },
      {
        stageNumber: 3,
        code: 'PEAK-BLOOM',
        name: 'Open White/Pink Flower Bloom & Early Boll Set',
        durationDays: 35,
        kc: 1.25,
        gddThreshold: 1200,
        waterDemandLitersPerAcreDay: 46000,
        waterSensitivity: 'Critical Peak',
        waterSensitivityNote: 'Peak transpiration and nutrient uptake. Water stress causes massive shedding of young bolls.',
        scheduledNutrientRecipe: '2nd Top Dressing: 25% Nitrogen + 50% K₂O (MOP @ 25 kg/acre) + Boron',
        foliarSplitRecommendation: '13:00:45 Potassium Nitrate @ 5 g/L + Magnesium Sulfate (1%) to prevent leaf reddening',
        keyStagePests: ['Pink Bollworm Larvae inside rosette flowers', 'American Bollworm', 'Grey Mildew (Dahiya)'],
        recommendedBioControl: 'Brahmastra @ 5% + Handpick rosette flowers + Trichoderma / Pseudomonas foliar spray',
      },
      {
        stageNumber: 4,
        code: 'BOLL-FILL',
        name: 'Full Boll Enlargement & Lint Fiber Elongation',
        durationDays: 35,
        kc: 1.10,
        gddThreshold: 1650,
        waterDemandLitersPerAcreDay: 36000,
        waterSensitivity: 'High',
        waterSensitivityNote: 'Fiber micronaire, length, and strength synthesized in maturing seed bolls.',
        scheduledNutrientRecipe: 'Remaining 15% Nitrogen + Foliar SOP (00:00:50 @ 5 g/L)',
        foliarSplitRecommendation: 'Potassium Schoenite / SOP @ 5 g/L to supply potassium and sulfur',
        keyStagePests: ['Pink Bollworm internal carpel boring', 'Mealybug colonies', 'Boll Rot'],
        recommendedBioControl: 'Agniastra @ 5% or Beauveria bassiana for mealybug and borer control',
      },
      {
        stageNumber: 5,
        code: 'BURST-PICK',
        name: 'Foliar Senescence, Boll Dehiscence & Fluffing',
        durationDays: 25,
        kc: 0.40,
        gddThreshold: 1950,
        waterDemandLitersPerAcreDay: 10000,
        waterSensitivity: 'Low',
        waterSensitivityNote: 'Dry sunny weather required for clean cotton lint bursting without moisture discoloration.',
        scheduledNutrientRecipe: 'Zero fertilization; prepare for multiple picking rounds',
        foliarSplitRecommendation: 'Clean manual picking in morning hours after dew evaporation',
        keyStagePests: ['Dusky Cotton Bug', 'Red Cotton Bug (Staining lint)'],
        recommendedBioControl: '5% NSKE perimeter spray to prevent seed bugs from staining white lint',
      },
    ],
  },

  subtropical_orchards: {
    id: 'subtropical_orchards',
    name: 'Perennial Subtropical Orchards',
    representativeCrops: 'Custard Apple, Mango, Guava, Pomegranate, Citrus',
    baseTempCelsius: 10.0,
    totalLifecycleDays: 150,
    stages: [
      {
        stageNumber: 1,
        code: 'REST-FLUSH',
        name: 'Post-Harvest Rest & New Vegetative Foliar Flush',
        durationDays: 30,
        kc: 0.55,
        gddThreshold: 300,
        waterDemandLitersPerAcreDay: 20000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'Controlled water withholding (Bahar treatment) followed by rejuvenation irrigation.',
        scheduledNutrientRecipe: 'FYM @ 25 kg/tree + Basal Single Super Phosphate (SSP) + Copper Oxychloride basin drench',
        foliarSplitRecommendation: '19:19:19 WSF @ 4 g/L + Micronutrient complex',
        keyStagePests: ['Leaf Miner', 'Bark Eating Caterpillar', 'Anthracnose'],
        recommendedBioControl: 'Basal Bordeaux paste (1:1:10) trunk application + Trichoderma harzianum soil drench',
      },
      {
        stageNumber: 2,
        code: 'BUD-DIFFER',
        name: 'Terminal Flower Bud Differentiation',
        durationDays: 25,
        kc: 0.70,
        gddThreshold: 600,
        waterDemandLitersPerAcreDay: 25000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'High carbohydrate-to-nitrogen ratio (C:N) drives floral initiation.',
        scheduledNutrientRecipe: '00:52:34 MKP @ 5 g/L + Paclobutrazol / Cultar (if growth retarding required)',
        foliarSplitRecommendation: '00:52:34 MKP @ 5 g/L to accelerate flower bud development',
        keyStagePests: ['Mango Hopper', 'Thrips', 'Powdery Mildew'],
        recommendedBioControl: 'Sour Buttermilk spray (10%) in copper pot for powdery mildew prevention',
      },
      {
        stageNumber: 3,
        code: 'FULL-BLOOM',
        name: 'Anthesis, Nectar Secretion & Fruit Setting',
        durationDays: 25,
        kc: 0.95,
        gddThreshold: 900,
        waterDemandLitersPerAcreDay: 34000,
        waterSensitivity: 'Critical Peak',
        waterSensitivityNote: 'Maintain strictly uniform drip irrigation; sudden flood irrigation triggers massive flower drop.',
        scheduledNutrientRecipe: 'Solubor Boron 20% @ 1 g/L + Calcium Nitrate @ 3 g/L',
        foliarSplitRecommendation: 'Boron 20% + Amino Acid chelate for bee attraction and fruit set retention',
        keyStagePests: ['Flower Midge', 'Thrips', 'Mealybug crawls on pedicel'],
        recommendedBioControl: 'Dashparni Ark @ 5% + Sticky trunk bands to stop crawling mealybugs',
      },
      {
        stageNumber: 4,
        code: 'FRUIT-BULK',
        name: 'Cell Division, Fruit Bulking & Aril/Pulp Swelling',
        durationDays: 45,
        kc: 1.15,
        gddThreshold: 1400,
        waterDemandLitersPerAcreDay: 42000,
        waterSensitivity: 'High',
        waterSensitivityNote: 'Continuous adequate water prevents fruit cracking caused by fluctuating soil moisture.',
        scheduledNutrientRecipe: '13:00:45 Potassium Nitrate @ 5 g/L + Calcium Nitrate fertigation @ 10 kg/acre',
        foliarSplitRecommendation: 'Chelated Calcium + Potassium Nitrate spray to strengthen fruit rind cell walls',
        keyStagePests: ['Fruit Fly (Bactrocera dorsalis)', 'Fruit Borer (Deudorix isocrates)', 'Anthracnose'],
        recommendedBioControl: 'Methyl Eugenol pheromone traps (6 traps/acre) + Fruit bagging with non-woven covers',
      },
      {
        stageNumber: 5,
        code: 'RIPEN-COLOR',
        name: 'Sugar Brix Accumulation, Color Break & Harvest',
        durationDays: 25,
        kc: 0.60,
        gddThreshold: 1750,
        waterDemandLitersPerAcreDay: 18000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'Taper off irrigation 7 days before picking to elevate Total Soluble Solids (TSS Brix).',
        scheduledNutrientRecipe: '00:00:50 SOP (Potassium Sulfate @ 5 g/L) for fruit color and shine',
        foliarSplitRecommendation: 'Final fruit grading and hand-harvest with clean secateurs',
        keyStagePests: ['Post-Harvest Fruit Rot', 'Birds & Fruit Bats'],
        recommendedBioControl: 'Biological orchard netting + Prophylactic Trichoderma fruit wash',
      },
    ],
  },

  underground_tubers: {
    id: 'underground_tubers',
    name: 'Underground Tubers & Bulbs',
    representativeCrops: 'Potato, Red Onion, Garlic',
    baseTempCelsius: 7.0,
    totalLifecycleDays: 100,
    stages: [
      {
        stageNumber: 1,
        code: 'SPROUT',
        name: 'Sprout Emergence & Fibrous Root Network',
        durationDays: 18,
        kc: 0.45,
        gddThreshold: 180,
        waterDemandLitersPerAcreDay: 16000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'Moist loose ridge soil facilitates unhindered sprout emergence.',
        scheduledNutrientRecipe: 'Basal: 50% N + 100% P₂O₅ (SSP @ 150 kg/acre) + 50% K₂O + Zinc Sulfate (21%) @ 10 kg/acre',
        foliarSplitRecommendation: 'Seed tuber / bulb bio-priming with Trichoderma viride @ 10 g/kg',
        keyStagePests: ['Cutworms', 'White Grubs', 'Black Scurf (Rhizoctonia)'],
        recommendedBioControl: 'Beauveria bassiana soil drench @ 2 kg/acre + Neem cake application',
      },
      {
        stageNumber: 2,
        code: 'CANOPY',
        name: 'Main Stem Canopy & Stolons/Basal Leaves',
        durationDays: 22,
        kc: 0.80,
        gddThreshold: 450,
        waterDemandLitersPerAcreDay: 26000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'Earthing up (ridging) required to cover emerging stolons from solar greening.',
        scheduledNutrientRecipe: '1st Top Dressing: 25% Nitrogen (Urea) + Sulfur 90% WDG @ 5 kg/acre (essential for allicin)',
        foliarSplitRecommendation: '19:19:19 WSF @ 5 g/L + Humic Acid @ 2 ml/L',
        keyStagePests: ['Aphids (Potato Virus Vector)', 'Onion Thrips', 'Early Blight'],
        recommendedBioControl: 'Blue sticky traps (20/acre) for thrips + Dashparni Ark @ 5% foliar spray',
      },
      {
        stageNumber: 3,
        code: 'INITIATION',
        name: 'Tuber Hooking / Bulb Swelling Initiation',
        durationDays: 20,
        kc: 1.15,
        gddThreshold: 750,
        waterDemandLitersPerAcreDay: 38000,
        waterSensitivity: 'Critical Peak',
        waterSensitivityNote: 'Night temperature (<18°C) and consistent moisture trigger stolon tip swelling.',
        scheduledNutrientRecipe: '2nd Top Dressing: 25% Nitrogen + 50% K₂O (MOP/SOP @ 30 kg/acre) + Boron',
        foliarSplitRecommendation: '00:52:34 MKP @ 5 g/L + Solubor Boron 20% @ 1 g/L',
        keyStagePests: ['Late Blight (Phytophthora infestans)', 'Purple Blotch (Alternaria porri)', 'Stemylium Blight'],
        recommendedBioControl: 'Prophylactic Mancozeb 75% WP or Sour Buttermilk spray (10%) with copper ions',
      },
      {
        stageNumber: 4,
        code: 'BULKING',
        name: 'Rapid Carbohydrate Translocation & Bulking',
        durationDays: 25,
        kc: 1.05,
        gddThreshold: 1050,
        waterDemandLitersPerAcreDay: 34000,
        waterSensitivity: 'High',
        waterSensitivityNote: 'Potassium demand peaks; tubers double their weight through starch translocation.',
        scheduledNutrientRecipe: '13:00:45 Potassium Nitrate @ 5 g/L + Calcium Nitrate foliar spray',
        foliarSplitRecommendation: 'Potassium Nitrate + Calcium chelate to enhance skin firmness and storage life',
        keyStagePests: ['Tuber Moth (Phthorimaea operculella)', 'Root Knot Nematode', 'Soft Rot (Erwinia)'],
        recommendedBioControl: 'Agniastra @ 5% + Strict earthing-up to prevent tuber moth egg laying on exposed potatoes',
      },
      {
        stageNumber: 5,
        code: 'CURING-FALL',
        name: 'Haulm Senescence / Onion Neck-Fall & Skin Curing',
        durationDays: 15,
        kc: 0.35,
        gddThreshold: 1250,
        waterDemandLitersPerAcreDay: 8000,
        waterSensitivity: 'Low',
        waterSensitivityNote: 'Stop irrigation 10-15 days before digging to harden outer papery skins and prevent post-harvest rot.',
        scheduledNutrientRecipe: 'Zero fertilizer; dehaulming (cutting potato foliage) 10 days before digging',
        foliarSplitRecommendation: 'Field curing in shade for 7-10 days before cold storage placement',
        keyStagePests: ['Storage Dry Rot (Fusarium)', 'Bacterial Soft Rot'],
        recommendedBioControl: 'Trichoderma dust coating in godowns + Curing with optimal dry ventilation',
      },
    ],
  },

  industrial_biomass: {
    id: 'industrial_biomass',
    name: 'Perennial Industrial Biomass',
    representativeCrops: 'Sugarcane (Adsali / Eksali / Ratoon)',
    baseTempCelsius: 12.0,
    totalLifecycleDays: 360,
    stages: [
      {
        stageNumber: 1,
        code: 'GERMINATION',
        name: 'Sett Sprouting & Primary Root Anchorage',
        durationDays: 45,
        kc: 0.50,
        gddThreshold: 450,
        waterDemandLitersPerAcreDay: 22000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'Sett bud emergence requires moist well-aerated furrow soil.',
        scheduledNutrientRecipe: 'Basal: 25% N + 100% P₂O₅ (SSP @ 200 kg/acre) + 25% K₂O + Zinc Sulfate @ 15 kg/acre',
        foliarSplitRecommendation: 'Sett treatment in Carbendazim + Malathion + Acetobacter bio-fertilizer',
        keyStagePests: ['Early Shoot Borer (Chilo infuscatellus)', 'Termites', 'Red Rot'],
        recommendedBioControl: 'Trichogramma chilonis egg cards (5 cards/acre) + Light trash mulching in furrows',
      },
      {
        stageNumber: 2,
        code: 'FORMATIVE',
        name: 'Heavy Tillering & Canopy Architecture',
        durationDays: 75,
        kc: 0.90,
        gddThreshold: 1200,
        waterDemandLitersPerAcreDay: 36000,
        waterSensitivity: 'High',
        waterSensitivityNote: 'Tillering establishes productive millable canes (45,000 canes/acre target).',
        scheduledNutrientRecipe: '1st Top Dressing: 35% Nitrogen (Urea @ 75 kg/acre) + Ferrous Sulfate @ 10 kg/acre',
        foliarSplitRecommendation: '19:19:19 WSF @ 5 g/L + Humic Acid @ 3 ml/L',
        keyStagePests: ['Early Shoot Borer', 'Internode Borer', 'Pyrilla (Leafhopper)'],
        recommendedBioControl: 'Release Epiricania melanoleuca parasitoid for biological Pyrilla control + Dashparni Ark',
      },
      {
        stageNumber: 3,
        code: 'GRAND-GROWTH',
        name: 'Rapid Internode Joint Elongation & Cane Bulking',
        durationDays: 140,
        kc: 1.30,
        gddThreshold: 2600,
        waterDemandLitersPerAcreDay: 58000,
        waterSensitivity: 'Critical Peak',
        waterSensitivityNote: 'Maximum biomass generation; each millimeter of water corresponds to 1 quintal cane yield.',
        scheduledNutrientRecipe: '2nd Top Dressing: Remaining 40% Nitrogen + 50% Potash (MOP @ 50 kg/acre)',
        foliarSplitRecommendation: '00:52:34 MKP @ 5 g/L + Micro-nutrients foliar spray via boom sprayer',
        keyStagePests: ['Top Borer (Scirpophaga excerptalis)', 'Stalk Borer', 'Whitefly / Woolly Aphids'],
        recommendedBioControl: 'Release Dipha aphidivora / Micromus predators for Woolly Aphid + Agniastra spray',
      },
      {
        stageNumber: 4,
        code: 'MATURATION',
        name: 'Sucrose Synthesis & Juice Brix Concentration',
        durationDays: 70,
        kc: 0.85,
        gddThreshold: 3500,
        waterDemandLitersPerAcreDay: 28000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'Cool night temperatures and restricted water trigger sucrose accumulation in cane internodes.',
        scheduledNutrientRecipe: 'Remaining 25% Potash (MOP) to accelerate glucose-to-sucrose polymerization',
        foliarSplitRecommendation: 'Potassium Sulfate (SOP) foliar spray to boost commercial cane sugar (CCS %)',
        keyStagePests: ['Scale Insects', 'Mealybugs under leaf sheaths', 'Smut'],
        recommendedBioControl: 'Detrashing of lower dry leaves (removes scale insects) + 5% NSKE spray',
      },
      {
        stageNumber: 5,
        code: 'HARVEST',
        name: 'Golden Cane Maturity & Cutting',
        durationDays: 30,
        kc: 0.40,
        gddThreshold: 3800,
        waterDemandLitersPerAcreDay: 10000,
        waterSensitivity: 'Low',
        waterSensitivityNote: 'Stop irrigation 15 days before cutting; harvest close to ground level for maximum juice.',
        scheduledNutrientRecipe: 'Zero fertilization; prepare field for ratoon management',
        foliarSplitRecommendation: 'Hand refractometer juice Brix inspection (>18° Brix optimal for mill dispatch)',
        keyStagePests: ['Field Rodents'],
        recommendedBioControl: 'Clean cutting and stubble shaving for vigorous ratoon sprouting',
      },
    ],
  },

  annual_oilseeds: {
    id: 'annual_oilseeds',
    name: 'Annual Oilseeds',
    representativeCrops: 'Mustard, Rapeseed, Groundnut, Sesame',
    baseTempCelsius: 5.0,
    totalLifecycleDays: 110,
    stages: [
      {
        stageNumber: 1,
        code: 'ROSETTE',
        name: 'Rosette Leaves & Taproot Establishment',
        durationDays: 25,
        kc: 0.40,
        gddThreshold: 220,
        waterDemandLitersPerAcreDay: 15000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'Taproot grows deep to exploit subsoil moisture reserves.',
        scheduledNutrientRecipe: 'Basal: 50% N + 100% P₂O₅ (SSP @ 100 kg/acre) + 50% K₂O + Elemental Sulfur 90% WDG @ 5 kg/acre',
        foliarSplitRecommendation: 'Sulfur is the master nutrient for mustard glucosinolate and oil content (+2.5% oil)',
        keyStagePests: ['Mustard Sawfly', 'Painted Bug (Bagrada hilaris)', 'Flea Beetles'],
        recommendedBioControl: 'Neem seed priming + 5% NSKE foliar spray during morning hours',
      },
      {
        stageNumber: 2,
        code: 'BOLTING',
        name: 'Inflorescence Bolting & Secondary Branching',
        durationDays: 20,
        kc: 0.75,
        gddThreshold: 480,
        waterDemandLitersPerAcreDay: 24000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'Primary and secondary floral branches emerge from leaf axils.',
        scheduledNutrientRecipe: 'Top Dressing: Remaining 50% Nitrogen (Urea @ 35 kg/acre) before flowering',
        foliarSplitRecommendation: '19:19:19 WSF @ 5 g/L + Zinc EDTA 12% @ 1.5 g/L',
        keyStagePests: ['Mustard Aphid (Lipaphis erysimi)', 'Leaf Miner', 'White Rust (Albugo candida)'],
        recommendedBioControl: 'Install yellow sticky traps (15/acre) + Spray Verticillium lecanii bio-fungicide @ 5 g/L',
      },
      {
        stageNumber: 3,
        code: 'FLOWERING',
        name: 'Bright Yellow/White Petal Bloom & Bee Foraging',
        durationDays: 25,
        kc: 1.15,
        gddThreshold: 800,
        waterDemandLitersPerAcreDay: 36000,
        waterSensitivity: 'Critical Peak',
        waterSensitivityNote: 'Honeybee cross-pollination boosts seed yield by 25%; avoid synthetic insecticide sprays during bloom.',
        scheduledNutrientRecipe: '00:52:34 MKP @ 5 g/L + Solubor Boron 20% @ 1 g/L',
        foliarSplitRecommendation: 'Boron 20% foliar spray for flower fertilization and pod setting',
        keyStagePests: ['Mustard Aphid heavy inflorescence swarms', 'Alternaria Blight', 'Sclerotinia Stem Rot'],
        recommendedBioControl: 'Safe botanical sprays (Dashparni Ark @ 5%) at dusk to preserve honeybee pollinators',
      },
      {
        stageNumber: 4,
        code: 'POD-SILIQUE',
        name: 'Silique Pod Elongation & Oil Translocation',
        durationDays: 25,
        kc: 0.95,
        gddThreshold: 1120,
        waterDemandLitersPerAcreDay: 28000,
        waterSensitivity: 'High',
        waterSensitivityNote: 'Oil droplets synthesize inside developing embryo cotyledons.',
        scheduledNutrientRecipe: '13:00:45 Potassium Nitrate @ 5 g/L + Water-soluble Sulfur',
        foliarSplitRecommendation: 'Potassium Nitrate + Sulfur foliar spray to prevent premature pod shattering',
        keyStagePests: ['Pod Borer', 'Alternaria Pod Spot', 'Aphids'],
        recommendedBioControl: 'Beauveria bassiana @ 5 g/L or NUE (Neem-Cow Urine Extract 10%)',
      },
      {
        stageNumber: 5,
        code: 'DESICCATE',
        name: 'Pod Browning, Seed Darkening & Harvest Readiness',
        durationDays: 15,
        kc: 0.30,
        gddThreshold: 1300,
        waterDemandLitersPerAcreDay: 6000,
        waterSensitivity: 'Low',
        waterSensitivityNote: 'Harvest when 75% of siliquae turn golden-yellow to avoid pod dehiscence shattering in field.',
        scheduledNutrientRecipe: 'Zero fertilizer; dry morning harvesting',
        foliarSplitRecommendation: 'Field threshing on clean tarpaulins',
        keyStagePests: ['Storage Pests'],
        recommendedBioControl: 'Sun dry harvested seeds to 8-9% moisture for safe godown storage',
      },
    ],
  },

  solanaceous_vegetables: {
    id: 'solanaceous_vegetables',
    name: 'Short-Duration Solanaceous Vegetables',
    representativeCrops: 'Tomato, Chilli, Brinjal, Capsicum',
    baseTempCelsius: 10.0,
    totalLifecycleDays: 120,
    stages: [
      {
        stageNumber: 1,
        code: 'ESTABLISH',
        name: 'Seedling Transplant Root Anchorage',
        durationDays: 18,
        kc: 0.45,
        gddThreshold: 200,
        waterDemandLitersPerAcreDay: 16000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'Mulch film with drip fertigation accelerates fibrous root establishment.',
        scheduledNutrientRecipe: 'Basal: 19:19:19 + Humic Acid root drenching @ 2 g/L + Trichoderma bio-priming',
        foliarSplitRecommendation: '19:19:19 WSF @ 3 g/L + Micronutrient complex',
        keyStagePests: ['Damping Off (Pythium)', 'Cutworms', 'Thrips (Vector for GBNV Virus)'],
        recommendedBioControl: 'Pseudomonas fluorescens seedling root dip + Silver/Black reflective mulch film',
      },
      {
        stageNumber: 2,
        code: 'BRANCH',
        name: 'Bushy Lateral Stem Development & Early Foliage',
        durationDays: 22,
        kc: 0.80,
        gddThreshold: 480,
        waterDemandLitersPerAcreDay: 26000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'Staking with bamboo trellises improves air circulation and stops soil contact diseases.',
        scheduledNutrientRecipe: 'Fertigation: 12:61:00 Mono Ammonium Phosphate (MAP @ 3 kg/acre) + Magnesium Sulfate',
        foliarSplitRecommendation: 'Seaweed Bio-Extract @ 2 ml/L + Zinc EDTA 12% @ 1.5 g/L',
        keyStagePests: ['Whitefly (Vector for Leaf Curl Virus)', 'Thrips', 'Mites', 'Shoot Borer'],
        recommendedBioControl: 'Dashparni Ark @ 5% + Yellow sticky traps (20/acre) + Neem oil 10,000 ppm',
      },
      {
        stageNumber: 3,
        code: 'FLOWER-CLUSTER',
        name: 'Multifold Flower Cluster Anthesis',
        durationDays: 20,
        kc: 1.15,
        gddThreshold: 780,
        waterDemandLitersPerAcreDay: 38000,
        waterSensitivity: 'Critical Peak',
        waterSensitivityNote: 'High temperatures (>35°C) cause flower abscission; maintain steady daily drip pulses.',
        scheduledNutrientRecipe: 'Fertigation: 00:52:34 MKP @ 4 kg/acre + Solubor Boron 20% @ 500 g/acre',
        foliarSplitRecommendation: 'Boron 20% @ 1 g/L + Calcium Nitrate @ 3 g/L to prevent Blossom End Rot (BER)',
        keyStagePests: ['Fruit Borer (Helicoverpa / Spodoptera)', 'Flower Thrips', 'Bacterial Wilt (Ralstonia)'],
        recommendedBioControl: 'Brahmastra @ 5% + Pheromone traps (Helilure @ 8 traps/acre) + Trichoderma soil drench',
      },
      {
        stageNumber: 4,
        code: 'FRUIT-DEV',
        name: 'Continuous Berry Development & Size Enlargement',
        durationDays: 35,
        kc: 1.20,
        gddThreshold: 1250,
        waterDemandLitersPerAcreDay: 42000,
        waterSensitivity: 'High',
        waterSensitivityNote: 'Calcium and Potassium translocated into berries for thick pericarp walls and high firmness.',
        scheduledNutrientRecipe: 'Fertigation: 13:00:45 Potassium Nitrate (4 kg/acre) + Calcium Nitrate (3 kg/acre)',
        foliarSplitRecommendation: 'Chelated Calcium + 13:00:45 foliar spray @ 5 g/L for deep red skin pigmentation',
        keyStagePests: ['Fruit Borer caterpillars', 'Anthracnose Fruit Rot', 'Powdery Mildew', 'Red Spider Mites'],
        recommendedBioControl: 'Agniastra @ 5% or Beauveria bassiana @ 5 g/L + Wettable Sulfur for mite control',
      },
      {
        stageNumber: 5,
        code: 'FLUSH-PICK',
        name: 'Periodic Mature Picking & Extended Fruiting',
        durationDays: 25,
        kc: 0.90,
        gddThreshold: 1600,
        waterDemandLitersPerAcreDay: 28000,
        waterSensitivity: 'Moderate',
        waterSensitivityNote: 'Pick mature fruits every 3-4 days to stimulate secondary flushes on upper lateral shoots.',
        scheduledNutrientRecipe: 'Post-picking fertigation: 19:19:19 WSF (3 kg/acre) to sustain upper canopy flushes',
        foliarSplitRecommendation: 'Amino acid biostimulant @ 2 ml/L after each major picking round',
        keyStagePests: ['Fruit Rot', 'Fruit Flies', 'Leaf Miners'],
        recommendedBioControl: 'Methyl Eugenol fruit fly traps + Sour Buttermilk bio-fungicide spray',
      },
    ],
  },
};

// 2. Physiological & Environmental Customization Controls
export type IrrigationDeliveryMethod = 'drip' | 'surface' | 'sprinkler' | 'rainfed';
export type SoilTextureHorizon = 'vertisol' | 'alluvial' | 'laterite' | 'sandy';

export const IRRIGATION_METHODS: Record<IrrigationDeliveryMethod, { name: string; efficiency: number; note: string }> = {
  drip: { name: 'Drip Fertigation (In-line / Online Emitted)', efficiency: 0.90, note: '90% application efficiency, direct root zone delivery.' },
  surface: { name: 'Surface Gravity / Flood Furrow', efficiency: 0.60, note: '60% efficiency, high deep-percolation and evaporation loss.' },
  sprinkler: { name: 'Micro-Sprinkler / Overhead Boom', efficiency: 0.75, note: '75% efficiency, moderate wind drift and foliar evaporation.' },
  rainfed: { name: 'Rainfed Dryland (Residual Soil Moisture)', efficiency: 0.50, note: 'Relies solely on stored profile moisture & rainfall probability.' },
};

export const SOIL_TEXTURES: Record<SoilTextureHorizon, { name: string; fc: number; wp: number; awc: number; note: string }> = {
  vertisol: { name: 'Deep Heavy Vertisol (Black Cotton Clay)', fc: 38, wp: 20, awc: 18, note: 'High water holding capacity, prone to waterlogging.' },
  alluvial: { name: 'Indo-Gangetic Alluvial Silt Loam', fc: 28, wp: 13, awc: 15, note: 'Balanced moisture retention and optimal root aeration.' },
  laterite: { name: 'Red Laterite Gravelly Loam', fc: 18, wp: 8, awc: 10, note: 'Acidic, high permeability, rapid drainage.' },
  sandy: { name: 'Sandy Coastal Dune / Aridisol (Desert Loam)', fc: 10, wp: 4, awc: 6, note: 'Low water holding capacity, requires frequent light irrigations.' },
};

export function CropStagesSimulator({ onClose, onOpenShop }: CropStagesSimulatorProps) {
  const { user } = useAuth();
  const { weatherData } = useTelemetry();
  const { activeDiagnosis } = useDiagnosis();

  // 1. Crop Archetype Selection (10 Systems)
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<CropArchetypeId>('grain_legumes');

  // Sowing Date Picker (driving automated thermal GDD accumulation)
  const [sowingDate, setSowingDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 45); // default 45 days ago
    return d.toISOString().slice(0, 10);
  });

  // Irrigation & Soil Controls
  const [irrigationMethod, setIrrigationMethod] = useState<IrrigationDeliveryMethod>('drip');
  const [soilTexture, setSoilTexture] = useState<SoilTextureHorizon>('vertisol');
  const [madDepletionThreshold, setMadDepletionThreshold] = useState<number>(35); // 20% to 50% Available Soil Moisture
  const [activeStageIdx, setActiveStageIdx] = useState<number>(2); // 0 to 4

  // Simulation Execution State
  const [simState, setSimState] = useState<'standby' | 'running' | 'completed'>('standby');
  const [simProgress, setSimProgress] = useState<number>(0);
  const [currentSimPhase, setCurrentSimPhase] = useState<number>(1);
  const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => () => {
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
  }, []);

  const archetype = CROP_ARCHETYPES[selectedArchetypeId];
  const activeStage = archetype.stages[activeStageIdx] || archetype.stages[0];
  const irrigationConfig = IRRIGATION_METHODS[irrigationMethod];
  const soilConfig = SOIL_TEXTURES[soilTexture];

  // Calculate Days After Sowing (DAS)
  const daysAfterSowing = useMemo(() => {
    const start = new Date(sowingDate).getTime();
    const today = new Date().getTime();
    const diffDays = Math.max(1, Math.round((today - start) / (1000 * 60 * 60 * 24)));
    return Math.min(archetype.totalLifecycleDays, diffDays);
  }, [sowingDate, archetype]);

  // Automated GDD Calculation: GDD = sum(max((Tmax + Tmin)/2 - Tbase, 0))
  const gddAccumulated = useMemo(() => {
    const avgTmax = weatherData.temp + 4;
    const avgTmin = Math.max(8, weatherData.temp - 6);
    const dailyAvgTemp = (avgTmax + avgTmin) / 2;
    const dailyGdd = Math.max(0, dailyAvgTemp - archetype.baseTempCelsius);
    return Math.round(dailyGdd * daysAfterSowing);
  }, [weatherData, archetype, daysAfterSowing]);

  // Determine Current Stage based on DAS & GDD
  const computedCurrentStageIdx = useMemo(() => {
    let accumulatedDays = 0;
    for (let i = 0; i < archetype.stages.length; i++) {
      accumulatedDays += archetype.stages[i].durationDays;
      if (daysAfterSowing <= accumulatedDays) {
        return i;
      }
    }
    return archetype.stages.length - 1;
  }, [archetype, daysAfterSowing]);

  // Auto-sync active tab when archetype changes
  React.useEffect(() => {
    setActiveStageIdx(computedCurrentStageIdx);
  }, [computedCurrentStageIdx, selectedArchetypeId]);

  // Start Simulation Execution Handler
  const startSimulation = () => {
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    setSimState('running');
    setSimProgress(0);
    setCurrentSimPhase(1);

    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setSimProgress(p);

      if (p < 25) {
        setCurrentSimPhase(1); // Biomass & Transpiration (ETc = ET0 * Kc)
      } else if (p < 50) {
        setCurrentSimPhase(2); // Moisture Stress Penalty & Stomatal Conductance
      } else if (p < 75) {
        setCurrentSimPhase(3); // Vascular Nutrient Demand & Boron/Potassium Splits
      } else {
        setCurrentSimPhase(4); // Pathogen Vulnerability Window
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
    setCurrentSimPhase(1);
  };

  // Step-by-Step Simulation Physics & Evapotranspiration Calculations
  const simulationPhysics = useMemo(() => {
    // Phase 1: Crop Evapotranspiration (ETc = ET0 * Kc)
    const et0 = weatherData.et0 || 5.2; // mm/day reference
    const kc = activeStage.kc;
    const dailyEtcMm = Number((et0 * kc).toFixed(2));
    
    // Water demand in Liters per Acre per Day: 1 mm over 1 acre = 4046.86 Liters
    const grossCropWaterDemandLiters = Math.round(dailyEtcMm * 4046.86);
    // Adjusted for irrigation application efficiency
    const fieldDeliveryWaterDemandLiters = Math.round(grossCropWaterDemandLiters / irrigationConfig.efficiency);

    // Drip system discharge runtime hours (assuming standard 2,500 L/hour system flow for 1 acre)
    const dripRuntimeHours = Number((fieldDeliveryWaterDemandLiters / 2500).toFixed(1));

    // Phase 2: Moisture Stress Penalty & Stomatal Conductance
    // If MAD depletion exceeds threshold, flag yield penalty
    const isWaterStressCritical = activeStage.waterSensitivity === 'Critical Peak';
    const flowerSheddingRiskPct = isWaterStressCritical ? 38 : activeStage.waterSensitivity === 'High' ? 22 : 8;

    // Phase 3: GDD Status (Early vs Delayed)
    const targetGddForStage = activeStage.gddThreshold;
    const gddStatus =
      gddAccumulated >= targetGddForStage
        ? 'Advanced / Early Phenology'
        : gddAccumulated >= targetGddForStage * 0.85
        ? 'Optimal On-Schedule Growth'
        : 'Delayed by Cold Waves';

    return {
      et0,
      kc,
      dailyEtcMm,
      fieldDeliveryWaterDemandLiters,
      dripRuntimeHours,
      flowerSheddingRiskPct,
      gddStatus,
      isWaterStressCritical,
    };
  }, [weatherData, activeStage, irrigationConfig, gddAccumulated]);

  // Sync crop phenology simulation findings to global AgriSence telemetry
  React.useEffect(() => {
    if (simState === 'completed') {
      saveSimulationTelemetry({
        moduleId: 'crop-stages',
        moduleName: `Crop Phenology (${archetype.name} - Stage ${activeStage.stageNumber})`,
        timestamp: Date.now(),
        parameters: {
          cropArchetype: archetype.name,
          representativeCrops: archetype.representativeCrops,
          stageName: activeStage.name,
          daysAfterSowing,
          sowingDate,
          irrigationMethod: irrigationConfig.name,
        },
        calculatedMetrics: {
          gddAccumulated,
          dailyCropEtcMm: simulationPhysics.dailyEtcMm,
          fieldDeliveryWaterDemandLiters: simulationPhysics.fieldDeliveryWaterDemandLiters,
          dripRuntimeHours: simulationPhysics.dripRuntimeHours,
          gddStatus: simulationPhysics.gddStatus,
          scheduledNutrientRecipe: activeStage.scheduledNutrientRecipe,
        },
        suggestedPrompts: [
          `What are the critical nutrient applications for ${archetype.name} at Stage ${activeStage.stageNumber} (${activeStage.name})?`,
          `How much daily water does ${archetype.name} need at ${simulationPhysics.dailyEtcMm} mm ETc?`,
          `What bio-control is recommended for ${activeStage.keyStagePests.slice(0, 2).join(' and ')}?`,
        ],
      });
    }
  }, [simState, archetype, activeStage, daysAfterSowing, sowingDate, irrigationConfig, gddAccumulated, simulationPhysics]);

  return (
    <div className="space-y-4 text-xs">
      <ActiveParcelSelector compact />
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/25 space-y-1.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sprout className="size-4 text-[var(--brand-color,#0f9a58)]" />
              <h4 className="font-black text-sm text-slate-950 dark:text-white">
                "Crop Stages" Phenology, Thermal GDD & Evapotranspiration Simulator
              </h4>
            </div>
            <p className="text-slate-750 dark:text-slate-200 font-medium text-[11px] mt-0.5">
              10 Indian Crop Archetypes • Growing Degree Day (GDD) tracking • ETc irrigation budgeting.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
              Live GDD: {gddAccumulated} °C-d
            </span>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="p-4 rounded-2xl frosted-card border border-white/60 dark:border-white/10 space-y-3.5">
        {/* Row 1: Crop Archetype Selector (10 Archetypes) */}
        <div className="space-y-1.5">
          <label className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
            <Layers className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
            <span>Select Crop Archetype (10 Core Agronomic Systems):</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={selectedArchetypeId}
              onChange={(e) => setSelectedArchetypeId(e.target.value as CropArchetypeId)}
              className="w-full p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-300 dark:border-white/15 font-black text-slate-950 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/50"
            >
              {(Object.keys(CROP_ARCHETYPES) as CropArchetypeId[]).map((cKey) => {
                const item = CROP_ARCHETYPES[cKey];
                return (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.representativeCrops})
                  </option>
                );
              })}
            </select>

            <div className="p-2 rounded-xl frosted-glass-sub border border-white/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block font-bold">Base Temperature (Tbase)</span>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {archetype.baseTempCelsius}°C
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block font-bold">Total Lifecycle</span>
                <span className="text-xs font-black text-[var(--brand-color,#0f9a58)]">
                  {archetype.totalLifecycleDays} Days
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Sowing Date & Irrigation Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Sowing Date Picker */}
          <div className="p-3 rounded-xl frosted-glass-sub border border-white/60 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-slate-600 dark:text-slate-300">Sowing Date:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-black">{daysAfterSowing} DAS</span>
            </div>
            <input
              type="date"
              value={sowingDate}
              onChange={(e) => setSowingDate(e.target.value)}
              className="w-full text-xs font-black bg-transparent border-b border-emerald-500/30 focus:outline-none text-slate-950 dark:text-white py-0.5"
            />
          </div>

          {/* Irrigation Delivery Method */}
          <div className="p-3 rounded-xl frosted-glass-sub border border-white/60 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-slate-600 dark:text-slate-300">Irrigation Method:</span>
              <span className="text-sky-600 font-black">{Math.round(irrigationConfig.efficiency * 100)}% Eff</span>
            </div>
            <select
              value={irrigationMethod}
              onChange={(e) => setIrrigationMethod(e.target.value as IrrigationDeliveryMethod)}
              className="w-full text-xs font-black bg-transparent text-slate-900 dark:text-white focus:outline-none py-0.5"
            >
              {(Object.keys(IRRIGATION_METHODS) as IrrigationDeliveryMethod[]).map((k) => (
                <option key={k} value={k}>
                  {IRRIGATION_METHODS[k].name}
                </option>
              ))}
            </select>
          </div>

          {/* Soil Texture Horizon */}
          <div className="p-3 rounded-xl frosted-glass-sub border border-white/60 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-slate-600 dark:text-slate-300">Soil Horizon:</span>
              <span className="text-amber-600 font-black">AWC: {soilConfig.awc}%</span>
            </div>
            <select
              value={soilTexture}
              onChange={(e) => setSoilTexture(e.target.value as SoilTextureHorizon)}
              className="w-full text-xs font-black bg-transparent text-slate-900 dark:text-white focus:outline-none py-0.5"
            >
              {(Object.keys(SOIL_TEXTURES) as SoilTextureHorizon[]).map((sKey) => (
                <option key={sKey} value={sKey}>
                  {SOIL_TEXTURES[sKey].name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: Management Allowed Depletion (MAD) Slider */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-1.5">
          <div className="flex justify-between items-center text-[11px] font-bold">
            <span className="text-slate-700 dark:text-slate-300">
              Management Allowed Depletion (MAD Threshold):
            </span>
            <span className="text-sky-600 font-black">{madDepletionThreshold}% Available Soil Moisture</span>
          </div>
          <input
            type="range"
            min="20"
            max="50"
            step="5"
            value={madDepletionThreshold}
            onChange={(e) => setMadDepletionThreshold(Number(e.target.value))}
            className="w-full accent-sky-500"
          />
          <div className="flex justify-between text-[9px] text-slate-500">
            <span>20% (Frequent Drip Pulses)</span>
            <span>35% (Optimal Field Balance)</span>
            <span>50% (Deep Furrow Cycle)</span>
          </div>
        </div>

        {/* Start / Reset Simulation Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
          <div className="text-[11px] text-slate-500 font-semibold">
            Status:{' '}
            <strong className="text-slate-900 dark:text-white capitalize">
              {simState === 'running' ? `Phase ${currentSimPhase}/4 Processing...` : simState === 'completed' ? 'Phenology Validated' : 'Ready'}
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
              <span>{simState === 'running' ? 'Simulating Agronomic Physics...' : 'Start Simulator'}</span>
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
              <span>Phase 1: Transpiration (ETc)</span>
              <span>Phase 2: Stress Penalty</span>
              <span>Phase 3: Nutrient Demand</span>
              <span>Phase 4: Pathogen Vulnerability</span>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* ACTIONABLE 5-STEP VISUAL STAGE INDICATOR & DETAILED REPORT        */}
      {/* ================================================================= */}
      <div className="space-y-3">
        {/* 5-Step Visual Stepper Strip */}
        <div className="grid grid-cols-5 gap-1.5">
          {archetype.stages.map((stg, idx) => {
            const isCurrentInField = idx === computedCurrentStageIdx;
            const isSelectedTab = idx === activeStageIdx;
            return (
              <button
                key={stg.stageNumber}
                type="button"
                onClick={() => setActiveStageIdx(idx)}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between space-y-1 ${
                  isSelectedTab
                    ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs font-black'
                    : isCurrentInField
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-750 dark:text-slate-300'
                }`}
              >
                <span className="text-[10px] font-black uppercase block">
                  Stage {stg.stageNumber}
                </span>
                <span className={`text-[11px] font-black ${isSelectedTab ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  {stg.code}
                </span>
                <span className={`text-[9px] ${isSelectedTab ? 'text-emerald-100' : 'text-slate-500'}`}>
                  {stg.durationDays}d
                </span>
                {isCurrentInField && (
                  <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950">
                    Live Field
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Stage Comprehensive Biological Profile */}
        <div className="p-4 rounded-2xl frosted-card border border-white/60 dark:border-white/10 space-y-3.5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[var(--brand-color,#0f9a58)] text-white">
                  Stage {activeStage.stageNumber}: {activeStage.code}
                </span>
                <h4 className="text-sm font-black text-slate-950 dark:text-white">
                  {activeStage.name}
                </h4>
              </div>
              <p className="text-[11px] text-slate-650 dark:text-slate-300 font-medium mt-0.5">
                Biological duration: <strong>{activeStage.durationDays} Days</strong> • Crop Factor Kc: <strong>{activeStage.kc}</strong> • Thermal GDD Target: <strong>{activeStage.gddThreshold} °C-d</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl ${
                activeStage.waterSensitivity === 'Critical Peak'
                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
              }`}>
                {activeStage.waterSensitivity} Water Sensitivity
              </span>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-xl frosted-glass-sub border border-white/60">
              <span className="text-[10px] text-slate-500 block font-bold">Daily ETc Demand</span>
              <span className="text-sm font-black text-sky-600">{simulationPhysics.dailyEtcMm} mm/day</span>
              <span className="text-[9px] text-slate-400 block">Solar + Canopy</span>
            </div>

            <div className="p-2.5 rounded-xl frosted-glass-sub border border-white/60">
              <span className="text-[10px] text-slate-500 block font-bold">Daily Water / Acre</span>
              <span className="text-sm font-black text-[var(--brand-color,#0f9a58)]">
                {simulationPhysics.fieldDeliveryWaterDemandLiters.toLocaleString('en-IN')} Liters
              </span>
              <span className="text-[9px] text-slate-400 block">{simulationPhysics.dripRuntimeHours}h Drip Runtime</span>
            </div>

            <div className="p-2.5 rounded-xl frosted-glass-sub border border-white/60">
              <span className="text-[10px] text-slate-500 block font-bold">Flower/Pod Shedding Risk</span>
              <span className={`text-sm font-black ${simulationPhysics.isWaterStressCritical ? 'text-rose-600' : 'text-emerald-600'}`}>
                {simulationPhysics.flowerSheddingRiskPct}% Risk
              </span>
              <span className="text-[9px] text-slate-400 block">Under Drought</span>
            </div>

            <div className="p-2.5 rounded-xl frosted-glass-sub border border-white/60">
              <span className="text-[10px] text-slate-500 block font-bold">Thermal Time Status</span>
              <span className="text-xs font-black text-amber-600">{simulationPhysics.gddStatus}</span>
              <span className="text-[9px] text-slate-400 block">{gddAccumulated} / {activeStage.gddThreshold} GDD</span>
            </div>
          </div>

          {/* Scheduled Nutrient Recipes & Bio Control */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Nutrition Recipe */}
            <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
                <span className="font-black text-xs text-[var(--brand-text,#0d7342)]">
                  Scheduled Nutrient Recipe & Split Fertigation
                </span>
              </div>
              <p className="text-[11px] text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                <strong>Basal/Fertigation:</strong> {activeStage.scheduledNutrientRecipe}
              </p>
              <p className="text-[11px] text-teal-700 dark:text-teal-300 font-semibold">
                <strong>Foliar Recommendation:</strong> {activeStage.foliarSplitRecommendation}
              </p>
            </div>

            {/* Pathogen Vulnerability & Bio-Control */}
            <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Bug className="size-3.5 text-amber-600" />
                <span className="font-black text-xs text-amber-900 dark:text-amber-300">
                  Prevalent Stage Pests & Bio-Control Directive
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {activeStage.keyStagePests.map((pest, pIdx) => (
                  <span
                    key={pIdx}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-850 dark:text-slate-200 border border-amber-500/20"
                  >
                    {pest}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-slate-700 dark:text-slate-300 font-medium pt-0.5">
                🛡 <strong>Bio-Action:</strong> {activeStage.recommendedBioControl}
              </p>
            </div>
          </div>

          {/* Quick Procurement Action */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200/60 dark:border-white/10">
            <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              Need specialized Stage {activeStage.stageNumber} water-soluble fertilizers or bio-agents?
            </span>
            <button
              type="button"
              onClick={() => onOpenShop && onOpenShop('fertilizers')}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ShoppingCart className="size-3.5" />
              <span>Procure Stage Inputs on Kisan Shop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
