import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FlaskConical,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sprout as Sparkles,
  Droplets,
  Thermometer,
  Wind,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Clock,
  Sun,
  CloudSun,
} from 'lucide-react';
import { useTelemetry } from '@/src/context/telemetry-context';
import { useFarms } from '@/src/context/farm-context';
import { saveSimulationTelemetry } from '@/src/lib/simulator-sync';
import { ActiveParcelSelector } from '@/src/components/dashboard/active-parcel-selector';

export interface ChemicalProductInfo {
  id: string;
  name: string;
  brandExample?: string;
  category: 'Fungicide' | 'Insecticide' | 'Herbicide' | 'Fertilizer' | 'Micronutrient' | 'Biostimulant' | 'Adjuvant';
  formulation: 'WP' | 'WDG' | 'SC' | 'SL' | 'EC' | 'SG' | 'SP' | 'CS' | 'FS';
  formulationFullName: string;
  phProfile: 'Acidic (pH 4.0 - 5.5)' | 'Neutral (pH 6.0 - 7.2)' | 'Alkaline (pH 7.5 - 9.5)';
  phValue: number;
  molecularClass: string;
  waleOrder: number; // 1: W (Water), 2: W (WPs/WDGs/SGs), 3: A (Agitation), 4: L (Liquid flowables SC/SL/FS), 5: E (Emulsifiable EC/CS)
  incompatibilities: string[]; // IDs of incompatible products
  cautionWith: string[]; // IDs of conditional products
  hazardReason?: Record<string, string>;
  scorchSensitivityAtHighTemp?: boolean; // Sensitized when temp > 30°C
}

export const CHEMICAL_DATABASE: ChemicalProductInfo[] = [
  // ==========================================
  // 1. FUNGICIDES (BROAD SPECTRUM & SYSTEMIC)
  // ==========================================
  {
    id: 'mancozeb',
    name: 'Mancozeb 75% WP',
    brandExample: 'Indofil M-45 / Dithane M-45',
    category: 'Fungicide',
    formulation: 'WP',
    formulationFullName: 'Wettable Powder (WP)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.8,
    molecularClass: 'Dithiocarbamate',
    waleOrder: 2,
    incompatibilities: ['lime_sulfur', 'bordeaux', 'copper_hydroxide', 'copper_oxychloride'],
    cautionWith: ['boron_solubor', 'chlorpyrifos', 'npk_191919'],
    hazardReason: {
      lime_sulfur: 'Forms insoluble heavy metal precipitates and causes severe foliar phytotoxicity.',
      bordeaux: 'Strong alkaline Bordeaux mixture decomposes dithiocarbamates into inactive metallic salts.',
      copper_hydroxide: 'Free copper ions hydrolyze the protective manganese-zinc complex, neutralizing fungal efficacy.',
      copper_oxychloride: 'Excess free copper under alkaline conditions causes active molecule flocculation.',
      boron_solubor: 'High osmotic concentration can cause flocculation if not dissolved with adequate water carrier volume.',
    },
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'copper_oxychloride',
    name: 'Copper Oxychloride 50% WP',
    brandExample: 'Blitox / Blue Copper',
    category: 'Fungicide',
    formulation: 'WP',
    formulationFullName: 'Wettable Powder (WP)',
    phProfile: 'Alkaline (pH 7.5 - 9.5)',
    phValue: 8.2,
    molecularClass: 'Inorganic Copper',
    waleOrder: 2,
    incompatibilities: ['sulfur_wdg', 'mancozeb', 'chlorpyrifos', 'dimethoate', 'fosetyl_al'],
    cautionWith: ['boron_solubor', 'npk_191919', 'calcium_nitrate', 'zinc_chelate'],
    hazardReason: {
      sulfur_wdg: 'Forms insoluble black copper sulfide (CuS) sludge that clogs knapsack nozzles and burns leaves.',
      mancozeb: 'High alkaline pH causes rapid chemical degradation of dithiocarbamate active molecules.',
      chlorpyrifos: 'Alkaline hydrolysis destroys the organophosphate ester bond within 15 minutes of tank contact.',
      dimethoate: 'Alkaline pH rapidly inactivates systemic organophosphate insecticide molecules.',
      fosetyl_al: 'Severe acidic/alkaline antagonism causing chemical breakdown and leaf burn.',
      npk_191919: 'Phosphate ions react with copper to form insoluble copper phosphate precipitate.',
    },
    scorchSensitivityAtHighTemp: true,
  },
  {
    id: 'copper_hydroxide',
    name: 'Copper Hydroxide 53.8% WDG',
    brandExample: 'Kocide 3000 / Champ',
    category: 'Fungicide',
    formulation: 'WDG',
    formulationFullName: 'Water Dispersible Granule (WDG)',
    phProfile: 'Alkaline (pH 7.5 - 9.5)',
    phValue: 8.6,
    molecularClass: 'Inorganic Copper Salt',
    waleOrder: 2,
    incompatibilities: ['sulfur_wdg', 'mancozeb', 'chlorpyrifos', 'dimethoate', 'fosetyl_al', 'propiconazole'],
    cautionWith: ['boron_solubor', 'npk_191919', 'zinc_chelate'],
    hazardReason: {
      sulfur_wdg: 'Forms insoluble black copper sulfide (CuS) precipitate and induces acute foliar leaf scorch.',
      mancozeb: 'High alkaline pH causes rapid chemical degradation of dithiocarbamate active molecules.',
      chlorpyrifos: 'Alkaline hydrolysis destroys the organophosphate ester bond within 15 minutes of tank contact.',
      fosetyl_al: 'Acidic aluminum tris phosphonate decomposes strongly in alkaline copper solution.',
      propiconazole: 'Copper ions destabilize the triazole emulsion leading to heavy leaf curdling.',
      boron_solubor: 'Copper complexes with borate ions under alkaline pH, reducing foliar boron absorption.',
      npk_191919: 'Phosphate ions react with copper to form insoluble copper phosphate precipitate.',
    },
    scorchSensitivityAtHighTemp: true,
  },
  {
    id: 'sulfur_wdg',
    name: 'Sulfur 80% WDG',
    brandExample: 'Sulfex / Thiovit Jet',
    category: 'Fungicide',
    formulation: 'WDG',
    formulationFullName: 'Water Dispersible Granule (WDG)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.5,
    molecularClass: 'Inorganic Elemental Sulfur',
    waleOrder: 2,
    incompatibilities: ['copper_hydroxide', 'copper_oxychloride', 'chlorpyrifos', 'dimethoate', 'neem_oil', 'profenofos_cypermethrin'],
    cautionWith: ['emamectin', 'lambda_cyhalothrin', 'propiconazole'],
    hazardReason: {
      copper_hydroxide: 'Severe antagonism forming cupric sulfide precipitate and causing immediate foliar leaf scorch.',
      copper_oxychloride: 'Immediate precipitate formation and phytotoxic leaf damage.',
      chlorpyrifos: 'Extreme thermal leaf burn when mixed with emulsified solvents at temperatures exceeding 30°C.',
      neem_oil: 'Oil solvent penetrants dissolve leaf cuticle wax, allowing sulfur vapor to induce acute cell necrosis.',
      profenofos_cypermethrin: 'High solvent concentration causes severe photochemical leaf burning.',
    },
    scorchSensitivityAtHighTemp: true,
  },
  {
    id: 'azoxystrobin',
    name: 'Azoxystrobin 23% SC',
    brandExample: 'Amistar / Mirador',
    category: 'Fungicide',
    formulation: 'SC',
    formulationFullName: 'Suspension Concentrate (SC)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.9,
    molecularClass: 'Strobilurin (QoI)',
    waleOrder: 4,
    incompatibilities: [],
    cautionWith: ['chlorpyrifos', 'profenofos_cypermethrin'],
    hazardReason: {
      chlorpyrifos: 'Requires thorough constant agitation to prevent oily phase separation.',
      profenofos_cypermethrin: 'Avoid high temperature spraying (>32°C) to prevent foliar flecking on tender crops.',
    },
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'tebuconazole',
    name: 'Tebuconazole 25.9% EC',
    brandExample: 'Folicur',
    category: 'Fungicide',
    formulation: 'EC',
    formulationFullName: 'Emulsifiable Concentrate (EC)',
    phProfile: 'Acidic (pH 4.0 - 5.5)',
    phValue: 5.3,
    molecularClass: 'Triazole (DMI)',
    waleOrder: 5,
    incompatibilities: ['copper_hydroxide', 'bordeaux'],
    cautionWith: ['sulfur_wdg', 'calcium_nitrate'],
    hazardReason: {
      copper_hydroxide: 'Alkaline hydrolysis and solvent emulsion breaking.',
      sulfur_wdg: 'High temperature phytotoxicity when combined during peak sunlight.',
    },
    scorchSensitivityAtHighTemp: true,
  },
  {
    id: 'hexaconazole',
    name: 'Hexaconazole 5% SC',
    brandExample: 'Contaf Plus',
    category: 'Fungicide',
    formulation: 'SC',
    formulationFullName: 'Suspension Concentrate (SC)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.6,
    molecularClass: 'Triazole (DMI)',
    waleOrder: 4,
    incompatibilities: [],
    cautionWith: ['boron_solubor'],
    hazardReason: {
      boron_solubor: 'Maintain solution volume >150 L/acre to prevent osmotic crystallization.',
    },
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'carbendazim_mancozeb',
    name: 'Carbendazim 12% + Mancozeb 63% WP',
    brandExample: 'SAFF / Companion',
    category: 'Fungicide',
    formulation: 'WP',
    formulationFullName: 'Wettable Powder (WP)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.7,
    molecularClass: 'Benzimidazole + Dithiocarbamate',
    waleOrder: 2,
    incompatibilities: ['copper_hydroxide', 'copper_oxychloride', 'lime_sulfur'],
    cautionWith: ['chlorpyrifos', 'npk_191919'],
    hazardReason: {
      copper_hydroxide: 'Strong alkaline incompatibility and rapid chemical hydrolysis.',
      copper_oxychloride: 'Insoluble precipitate curdling in spray tank.',
    },
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'metalaxyl_mancozeb',
    name: 'Metalaxyl 8% + Mancozeb 64% WP',
    brandExample: 'Ridomil Gold / Krilaxyl',
    category: 'Fungicide',
    formulation: 'WP',
    formulationFullName: 'Wettable Powder (WP)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.5,
    molecularClass: 'Phenylamide + Dithiocarbamate',
    waleOrder: 2,
    incompatibilities: ['copper_hydroxide', 'copper_oxychloride'],
    cautionWith: ['boron_solubor'],
    hazardReason: {
      copper_hydroxide: 'Hydrolysis of metalaxyl and metal ion antagonism.',
    },
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'propiconazole',
    name: 'Propiconazole 25% EC',
    brandExample: 'Tilt / Radar',
    category: 'Fungicide',
    formulation: 'EC',
    formulationFullName: 'Emulsifiable Concentrate (EC)',
    phProfile: 'Acidic (pH 4.0 - 5.5)',
    phValue: 5.1,
    molecularClass: 'Triazole (DMI)',
    waleOrder: 5,
    incompatibilities: ['copper_hydroxide', 'copper_oxychloride'],
    cautionWith: ['sulfur_wdg'],
    hazardReason: {
      copper_hydroxide: 'Breaks emulsion and destabilizes triazole solvent system.',
      sulfur_wdg: 'High evaporative leaf burn above 30°C.',
    },
    scorchSensitivityAtHighTemp: true,
  },
  {
    id: 'difenoconazole',
    name: 'Difenoconazole 25% EC',
    brandExample: 'Score',
    category: 'Fungicide',
    formulation: 'EC',
    formulationFullName: 'Emulsifiable Concentrate (EC)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.2,
    molecularClass: 'Triazole (DMI)',
    waleOrder: 5,
    incompatibilities: ['copper_hydroxide'],
    cautionWith: ['npk_191919'],
    hazardReason: {
      copper_hydroxide: 'Alkaline degradation of active triazole.',
    },
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'tricyclazole',
    name: 'Tricyclazole 75% WP',
    brandExample: 'Beam / Baan',
    category: 'Fungicide',
    formulation: 'WP',
    formulationFullName: 'Wettable Powder (WP)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.8,
    molecularClass: 'Triazolobenzothiazole',
    waleOrder: 2,
    incompatibilities: [],
    cautionWith: ['chlorpyrifos'],
    hazardReason: {},
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'fosetyl_al',
    name: 'Fosetyl-Al 80% WP',
    brandExample: 'Aliette',
    category: 'Fungicide',
    formulation: 'WP',
    formulationFullName: 'Wettable Powder (WP)',
    phProfile: 'Acidic (pH 4.0 - 5.5)',
    phValue: 4.1,
    molecularClass: 'Phosphonate (Systemic)',
    waleOrder: 2,
    incompatibilities: ['copper_hydroxide', 'copper_oxychloride', 'foliar_nitrogen', 'calcium_nitrate'],
    cautionWith: ['npk_191919'],
    hazardReason: {
      copper_hydroxide: 'Extreme acidity releases lethal quantities of free phytotoxic copper ions causing acute leaf defoliation.',
      copper_oxychloride: 'Severe copper phytotoxicity and leaf burn.',
      calcium_nitrate: 'Insoluble calcium phosphonate precipitation.',
    },
    scorchSensitivityAtHighTemp: true,
  },
  {
    id: 'pyraclostrobin',
    name: 'Pyraclostrobin 20% WG',
    brandExample: 'Headline / Cabrio Top',
    category: 'Fungicide',
    formulation: 'WDG',
    formulationFullName: 'Water Dispersible Granule (WDG)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.8,
    molecularClass: 'Strobilurin (QoI)',
    waleOrder: 2,
    incompatibilities: [],
    cautionWith: ['chlorpyrifos'],
    hazardReason: {},
    scorchSensitivityAtHighTemp: false,
  },

  // ==========================================
  // 2. INSECTICIDES & PEST CONTROL MOLECULES
  // ==========================================
  {
    id: 'imidacloprid',
    name: 'Imidacloprid 17.8% SL',
    brandExample: 'Confidor / Victor',
    category: 'Insecticide',
    formulation: 'SL',
    formulationFullName: 'Soluble Liquid (SL)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 7.0,
    molecularClass: 'Neonicotinoid',
    waleOrder: 4,
    incompatibilities: ['copper_hydroxide'],
    cautionWith: ['copper_oxychloride'],
    hazardReason: {
      copper_hydroxide: 'Mild pH-dependent degradation; apply within 1 hour of mixing.',
      copper_oxychloride: 'Maintain carrier water volume above 150 L/acre.',
    },
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'thiamethoxam',
    name: 'Thiamethoxam 25% WG',
    brandExample: 'Actara / Areva',
    category: 'Insecticide',
    formulation: 'WDG',
    formulationFullName: 'Water Dispersible Granule (WDG)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.9,
    molecularClass: 'Neonicotinoid (2nd Gen)',
    waleOrder: 2,
    incompatibilities: ['copper_hydroxide'],
    cautionWith: ['boron_solubor'],
    hazardReason: {
      copper_hydroxide: 'High alkaline pH accelerates hydrolysis over 2+ hours.',
    },
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'acetamiprid',
    name: 'Acetamiprid 20% SP',
    brandExample: 'Pride / Rekord / Manik',
    category: 'Insecticide',
    formulation: 'SP',
    formulationFullName: 'Soluble Powder (SP)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.8,
    molecularClass: 'Neonicotinoid',
    waleOrder: 2,
    incompatibilities: [],
    cautionWith: ['copper_hydroxide'],
    hazardReason: {},
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'chlorantraniliprole',
    name: 'Chlorantraniliprole 18.5% SC',
    brandExample: 'Coragen / Shenzi',
    category: 'Insecticide',
    formulation: 'SC',
    formulationFullName: 'Suspension Concentrate (SC)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.5,
    molecularClass: 'Anthranilic Diamide',
    waleOrder: 4,
    incompatibilities: [],
    cautionWith: ['boron_solubor', 'npk_191919'],
    hazardReason: {
      boron_solubor: 'High salt concentration can affect suspension viscosity; pre-slurry recommended.',
    },
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'flubendiamide',
    name: 'Flubendiamide 39.35% SC',
    brandExample: 'Fame / Takumi',
    category: 'Insecticide',
    formulation: 'SC',
    formulationFullName: 'Suspension Concentrate (SC)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.7,
    molecularClass: 'Phthalic Acid Diamide',
    waleOrder: 4,
    incompatibilities: [],
    cautionWith: [],
    hazardReason: {},
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'emamectin',
    name: 'Emamectin Benzoate 5% SG',
    brandExample: 'Proclaim / Missile',
    category: 'Insecticide',
    formulation: 'SG',
    formulationFullName: 'Soluble Granule (SG / WDG)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.4,
    molecularClass: 'Avermectin',
    waleOrder: 2,
    incompatibilities: ['copper_hydroxide', 'lime_sulfur'],
    cautionWith: ['sulfur_wdg', 'copper_oxychloride'],
    hazardReason: {
      copper_hydroxide: 'Alkaline hydrolysis rapidly hydrolyzes avermectin lactone ring.',
      lime_sulfur: 'Extreme chemical breakdown and precipitate curdling.',
      sulfur_wdg: 'Spray early morning or late evening under calm temperatures.',
    },
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'chlorpyrifos',
    name: 'Chlorpyrifos 20% EC',
    brandExample: 'Dursban / Classic',
    category: 'Insecticide',
    formulation: 'EC',
    formulationFullName: 'Emulsifiable Concentrate (EC)',
    phProfile: 'Acidic (pH 4.0 - 5.5)',
    phValue: 5.2,
    molecularClass: 'Organophosphate',
    waleOrder: 5,
    incompatibilities: ['copper_hydroxide', 'copper_oxychloride', 'sulfur_wdg', 'bordeaux'],
    cautionWith: ['npk_191919', 'calcium_nitrate'],
    hazardReason: {
      copper_hydroxide: 'Alkaline copper causes immediate organophosphate ester bond splitting.',
      copper_oxychloride: 'Rapid chemical inactivation within 15 minutes of tank contact.',
      sulfur_wdg: 'High temperature leaf scorch due to solvent interaction with elemental sulfur.',
      npk_191919: 'Emulsion may break if water salinity or EC is very high.',
    },
    scorchSensitivityAtHighTemp: true,
  },
  {
    id: 'profenofos_cypermethrin',
    name: 'Profenofos 40% + Cypermethrin 4% EC',
    brandExample: 'Polytrin C / Roket',
    category: 'Insecticide',
    formulation: 'EC',
    formulationFullName: 'Emulsifiable Concentrate (EC)',
    phProfile: 'Acidic (pH 4.0 - 5.5)',
    phValue: 5.0,
    molecularClass: 'Organophosphate + Pyrethroid',
    waleOrder: 5,
    incompatibilities: ['copper_hydroxide', 'copper_oxychloride', 'sulfur_wdg', 'lime_sulfur'],
    cautionWith: ['npk_191919', 'boron_solubor'],
    hazardReason: {
      copper_hydroxide: 'Alkaline degradation of profenofos organophosphate bond.',
      sulfur_wdg: 'Severe thermal photochemical leaf burn.',
    },
    scorchSensitivityAtHighTemp: true,
  },
  {
    id: 'lambda_cyhalothrin',
    name: 'Lambda-Cyhalothrin 5% EC / 4.9% CS',
    brandExample: 'Karate / Matador',
    category: 'Insecticide',
    formulation: 'EC',
    formulationFullName: 'Capsule Suspension / EC',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.3,
    molecularClass: 'Synthetic Pyrethroid',
    waleOrder: 5,
    incompatibilities: ['copper_hydroxide'],
    cautionWith: ['sulfur_wdg'],
    hazardReason: {
      copper_hydroxide: 'Alkaline cleavage of pyrethroid ester bond.',
    },
    scorchSensitivityAtHighTemp: true,
  },
  {
    id: 'fipronil',
    name: 'Fipronil 5% SC',
    brandExample: 'Regent / Jump',
    category: 'Insecticide',
    formulation: 'SC',
    formulationFullName: 'Suspension Concentrate (SC)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.6,
    molecularClass: 'Phenylpyrazole',
    waleOrder: 4,
    incompatibilities: [],
    cautionWith: ['boron_solubor'],
    hazardReason: {},
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'spinosad',
    name: 'Spinosad 45% SC',
    brandExample: 'Tracer / Conserve',
    category: 'Insecticide',
    formulation: 'SC',
    formulationFullName: 'Suspension Concentrate (SC)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.8,
    molecularClass: 'Spinosyn (Naturalyte)',
    waleOrder: 4,
    incompatibilities: ['copper_hydroxide'],
    cautionWith: [],
    hazardReason: {
      copper_hydroxide: 'Copper ions degrade macrolide spinosyn structure.',
    },
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'diafenthiuron',
    name: 'Diafenthiuron 50% WP',
    brandExample: 'Pegasus / Polo',
    category: 'Insecticide',
    formulation: 'WP',
    formulationFullName: 'Wettable Powder (WP)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.7,
    molecularClass: 'Thiourea',
    waleOrder: 2,
    incompatibilities: [],
    cautionWith: ['chlorpyrifos'],
    hazardReason: {},
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'dimethoate',
    name: 'Dimethoate 30% EC',
    brandExample: 'Rogor',
    category: 'Insecticide',
    formulation: 'EC',
    formulationFullName: 'Emulsifiable Concentrate (EC)',
    phProfile: 'Acidic (pH 4.0 - 5.5)',
    phValue: 4.8,
    molecularClass: 'Organophosphate',
    waleOrder: 5,
    incompatibilities: ['copper_hydroxide', 'copper_oxychloride', 'sulfur_wdg', 'lime_sulfur'],
    cautionWith: ['npk_191919'],
    hazardReason: {
      copper_hydroxide: 'Rapid alkaline hydrolysis inactivates dimethoate within minutes.',
      sulfur_wdg: 'High temperature leaf burn on cucurbits and legumes.',
    },
    scorchSensitivityAtHighTemp: true,
  },
  {
    id: 'neem_oil',
    name: 'Neem Oil (Azadirachtin 10,000 ppm EC)',
    brandExample: 'Nimbecidine / Econeem',
    category: 'Biostimulant',
    formulation: 'EC',
    formulationFullName: 'Botanical Emulsion (EC)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.5,
    molecularClass: 'Limonoid Botanical Extract',
    waleOrder: 5,
    incompatibilities: ['sulfur_wdg', 'copper_hydroxide'],
    cautionWith: ['chlorpyrifos'],
    hazardReason: {
      sulfur_wdg: 'Botanical oil dissolves leaf wax; sulfur vapor causes severe necrosis when sun is intense.',
      copper_hydroxide: 'Oil separation and greasy residue.',
    },
    scorchSensitivityAtHighTemp: true,
  },

  // ==========================================
  // 3. HERBICIDES & WEED MANAGEMENT
  // ==========================================
  {
    id: 'glyphosate',
    name: 'Glyphosate 41% SL',
    brandExample: 'RoundUp / Glycel',
    category: 'Herbicide',
    formulation: 'SL',
    formulationFullName: 'Soluble Liquid (SL)',
    phProfile: 'Acidic (pH 4.0 - 5.5)',
    phValue: 4.8,
    molecularClass: 'Organophosphorus (EPSP Inhibitor)',
    waleOrder: 4,
    incompatibilities: ['copper_hydroxide', 'hard_water_calcium', 'lime_sulfur'],
    cautionWith: ['npk_191919'],
    hazardReason: {
      copper_hydroxide: 'Hard cations and copper strongly chelate glyphosate, reducing weed uptake.',
    },
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'pendimethalin',
    name: 'Pendimethalin 30% EC / 38.7% CS',
    brandExample: 'Stomp Extra',
    category: 'Herbicide',
    formulation: 'EC',
    formulationFullName: 'Microencapsulated / EC',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.4,
    molecularClass: 'Dinitroaniline',
    waleOrder: 5,
    incompatibilities: ['copper_hydroxide'],
    cautionWith: ['fertilizers'],
    hazardReason: {},
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'quizalofop',
    name: 'Quizalofop-ethyl 5% EC',
    brandExample: 'Targa Super',
    category: 'Herbicide',
    formulation: 'EC',
    formulationFullName: 'Emulsifiable Concentrate (EC)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.2,
    molecularClass: 'Aryloxyphenoxypropionate (FOP)',
    waleOrder: 5,
    incompatibilities: ['24d_ethyl_ester'],
    cautionWith: ['npk_191919'],
    hazardReason: {
      '24d_ethyl_ester': 'Antagonism reduces post-emergence grass control efficacy.',
    },
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'imazethapyr',
    name: 'Imazethapyr 10% SL',
    brandExample: 'Pursuit / Lagan',
    category: 'Herbicide',
    formulation: 'SL',
    formulationFullName: 'Soluble Liquid (SL)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.5,
    molecularClass: 'Imidazolinone (ALS Inhibitor)',
    waleOrder: 4,
    incompatibilities: [],
    cautionWith: ['organophosphates'],
    hazardReason: {},
    scorchSensitivityAtHighTemp: false,
  },

  // ==========================================
  // 4. WATER SOLUBLE FERTILIZERS (NPK SALTS)
  // ==========================================
  {
    id: 'npk_191919',
    name: '19:19:19 Water Soluble NPK',
    brandExample: 'Mahadhan / IFFCO WSF',
    category: 'Fertilizer',
    formulation: 'SL',
    formulationFullName: '100% Water Soluble Salt',
    phProfile: 'Acidic (pH 4.0 - 5.5)',
    phValue: 5.4,
    molecularClass: 'Balanced Mineral NPK Salt',
    waleOrder: 4,
    incompatibilities: ['copper_hydroxide', 'copper_oxychloride', 'calcium_nitrate'],
    cautionWith: ['chlorpyrifos', 'boron_solubor', 'zinc_chelate'],
    hazardReason: {
      copper_hydroxide: 'Phosphate ions precipitate copper cations out of solution as blue sludge.',
      copper_oxychloride: 'Insoluble precipitate and curdling.',
      calcium_nitrate: 'Phosphate + Calcium forms rock-like insoluble Calcium Phosphate (Ca3(PO4)2) that ruins sprayers.',
      chlorpyrifos: 'High ionic strength can destabilize emulsifier surfactants.',
      boron_solubor: 'Cumulative electrical conductivity (EC) exceeds safe threshold for tender leaves.',
    },
    scorchSensitivityAtHighTemp: true,
  },
  {
    id: 'mkp_005234',
    name: '00:52:34 Mono Potassium Phosphate (MKP)',
    brandExample: 'Mahadhan MKP',
    category: 'Fertilizer',
    formulation: 'SL',
    formulationFullName: 'Water Soluble Phosphate-Potash',
    phProfile: 'Acidic (pH 4.0 - 5.5)',
    phValue: 4.5,
    molecularClass: 'Phosphate Salt (KH2PO4)',
    waleOrder: 4,
    incompatibilities: ['calcium_nitrate', 'copper_hydroxide', 'copper_oxychloride', 'magnesium_sulfate'],
    cautionWith: ['chlorpyrifos'],
    hazardReason: {
      calcium_nitrate: 'Immediate precipitation of insoluble calcium phosphate sludge.',
      copper_hydroxide: 'Precipitates copper and acidifies solution drastically.',
      magnesium_sulfate: 'High concentration may form magnesium phosphate haze.',
    },
    scorchSensitivityAtHighTemp: true,
  },
  {
    id: 'potassium_nitrate_130045',
    name: '13:00:45 Potassium Nitrate (Multi-K)',
    brandExample: 'Haifa Multi-K',
    category: 'Fertilizer',
    formulation: 'SL',
    formulationFullName: 'Water Soluble Nitrate-Potash',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 7.0,
    molecularClass: 'Potassium Nitrate (KNO3)',
    waleOrder: 4,
    incompatibilities: [],
    cautionWith: ['sulfur_wdg', 'chlorpyrifos'],
    hazardReason: {
      sulfur_wdg: 'High ionic salt concentration during hot weather increases foliar osmolarity.',
    },
    scorchSensitivityAtHighTemp: true,
  },
  {
    id: 'calcium_nitrate',
    name: 'Calcium Nitrate (15.5% N + 18.8% Ca)',
    brandExample: 'YaraLiva Calcinit',
    category: 'Fertilizer',
    formulation: 'SL',
    formulationFullName: 'Soluble Calcium Salt',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.2,
    molecularClass: 'Calcium Salt',
    waleOrder: 4,
    incompatibilities: ['npk_191919', 'mkp_005234', 'magnesium_sulfate', 'fosetyl_al'],
    cautionWith: ['boron_solubor', 'chlorpyrifos'],
    hazardReason: {
      npk_191919: 'Calcium binds with phosphates to form insoluble calcium phosphate precipitate.',
      mkp_005234: 'Severe heavy precipitation of dicalcium phosphate.',
      magnesium_sulfate: 'Calcium reacts with sulfate to form gypsum (Calcium Sulfate) scale.',
      fosetyl_al: 'Precipitation of insoluble calcium phosphonate.',
    },
    scorchSensitivityAtHighTemp: true,
  },
  {
    id: 'magnesium_sulfate',
    name: 'Magnesium Sulfate (Epsom Salt 9.6% Mg + 12% S)',
    brandExample: 'Agri Magnesium',
    category: 'Fertilizer',
    formulation: 'SL',
    formulationFullName: 'Water Soluble Epsom Salt',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.8,
    molecularClass: 'Magnesium Sulfate (MgSO4)',
    waleOrder: 4,
    incompatibilities: ['calcium_nitrate', 'mkp_005234'],
    cautionWith: ['npk_191919'],
    hazardReason: {
      calcium_nitrate: 'Precipitates calcium sulfate (gypsum) in spray lines.',
    },
    scorchSensitivityAtHighTemp: false,
  },

  // ==========================================
  // 5. MICRONUTRIENTS, CHELATES & BIOSTIMULANTS
  // ==========================================
  {
    id: 'boron_solubor',
    name: 'Boron 20% (Disodium Octaborate Tetrahydrate)',
    brandExample: 'Solubor / Borax 20%',
    category: 'Micronutrient',
    formulation: 'SL',
    formulationFullName: 'Soluble Powder / Liquid (SL)',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 7.2,
    molecularClass: 'Inorganic Borate Salt',
    waleOrder: 4,
    incompatibilities: ['copper_hydroxide', 'copper_oxychloride'],
    cautionWith: ['mancozeb', 'npk_191919', 'calcium_nitrate'],
    hazardReason: {
      copper_hydroxide: 'Forms insoluble copper metaborate, reducing boron foliar bio-availability.',
      copper_oxychloride: 'Insoluble precipitate and altered pH.',
      mancozeb: 'High osmotic potential requires high water carrier ratio (>150 L/acre).',
      npk_191919: 'High salt load can stress young canopy under high evaporative demand.',
    },
    scorchSensitivityAtHighTemp: true,
  },
  {
    id: 'zinc_chelate',
    name: 'Zinc EDTA 12% Chelate',
    brandExample: 'Librel Zn / Chelamin',
    category: 'Micronutrient',
    formulation: 'SL',
    formulationFullName: 'Chelated Organic Salt',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.5,
    molecularClass: 'Synthetic Chelate (EDTA)',
    waleOrder: 4,
    incompatibilities: ['copper_hydroxide', 'copper_oxychloride'],
    cautionWith: ['npk_191919'],
    hazardReason: {
      copper_hydroxide: 'Copper ions displace zinc from EDTA chelate ring, rendering zinc unchelated.',
      copper_oxychloride: 'Metal ion exchange causing precipitation.',
      npk_191919: 'High orthophosphate concentration can cause partial dissociation.',
    },
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'iron_chelate',
    name: 'Ferrous EDTA 12% Chelate',
    brandExample: 'Librel Fe / Ferrover',
    category: 'Micronutrient',
    formulation: 'SL',
    formulationFullName: 'Chelated Iron',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.4,
    molecularClass: 'Iron Chelate (Fe-EDTA)',
    waleOrder: 4,
    incompatibilities: ['copper_hydroxide'],
    cautionWith: ['npk_191919'],
    hazardReason: {
      copper_hydroxide: 'Alkaline pH hydrolyzes iron chelate into insoluble ferric hydroxide sludge.',
    },
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'humic_acid',
    name: 'Humic Acid 12% + Fulvic Acid 3% SL',
    brandExample: 'Humistar / HumiTop',
    category: 'Biostimulant',
    formulation: 'SL',
    formulationFullName: 'Bio-Organic Liquid',
    phProfile: 'Alkaline (pH 7.5 - 9.5)',
    phValue: 8.5,
    molecularClass: 'Humic Macromolecules',
    waleOrder: 4,
    incompatibilities: ['fosetyl_al', 'acidic_buffer'],
    cautionWith: ['calcium_nitrate', 'copper_hydroxide'],
    hazardReason: {
      fosetyl_al: 'Strong acid causes humic polymers to flocculate into thick tar-like clumps.',
      calcium_nitrate: 'High free calcium causes calcium humate coagulation.',
    },
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'seaweed_extract',
    name: 'Seaweed Extract (Ascophyllum nodosum 20%)',
    brandExample: 'Sagarika / Biozyme / Maxicrop',
    category: 'Biostimulant',
    formulation: 'SL',
    formulationFullName: 'Marine Algal Biostimulant',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.8,
    molecularClass: 'Natural Cytokinins & Betaines',
    waleOrder: 4,
    incompatibilities: [],
    cautionWith: ['copper_hydroxide'],
    hazardReason: {},
    scorchSensitivityAtHighTemp: false,
  },
  {
    id: 'amino_acid_complex',
    name: 'Amino Acid Complex 50% SL',
    brandExample: 'Isabion / Quantis',
    category: 'Biostimulant',
    formulation: 'SL',
    formulationFullName: 'Peptide & Amino Complex',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.2,
    molecularClass: 'Enzymatic Hydrolyzed Protein',
    waleOrder: 4,
    incompatibilities: ['copper_hydroxide', 'copper_oxychloride', 'sulfur_wdg'],
    cautionWith: ['chlorpyrifos'],
    hazardReason: {
      copper_hydroxide: 'Amino acid chelates copper rapidly, inducing intense plant phytotoxicity.',
      copper_oxychloride: 'Severe foliar burning due to rapid copper complex permeation.',
      sulfur_wdg: 'High foliar uptake may overload leaf respiration.',
    },
    scorchSensitivityAtHighTemp: true,
  },
  {
    id: 'silicon_spreader',
    name: 'Organosilicone Super Spreader & Wetting Agent',
    brandExample: 'Wetcit / Apsa-80 / Break-Thru',
    category: 'Adjuvant',
    formulation: 'SL',
    formulationFullName: 'Non-Ionic Organosilicone Surfactant',
    phProfile: 'Neutral (pH 6.0 - 7.2)',
    phValue: 6.8,
    molecularClass: 'Trisiloxane Polyether',
    waleOrder: 4,
    incompatibilities: [],
    cautionWith: ['copper_hydroxide', 'sulfur_wdg'],
    hazardReason: {
      copper_hydroxide: 'Excess stomatal flooding under hot sun can cause necrotic leaf spotting.',
      sulfur_wdg: 'Reduces surface tension to ultra-low levels; spray during cool evening hours.',
    },
    scorchSensitivityAtHighTemp: true,
  },
];

export function TankMixSimulator({
  onOpenShop,
  onClose,
}: {
  onOpenShop?: (query: string) => void;
  onClose?: () => void;
}) {
  const { weatherData } = useTelemetry();
  const { selectedFarmId, selectedCropCycleId, selectedFarm, selectedCropCycle } = useFarms();

  // Phase 1: Input & Configuration Phase
  const [tankSizing, setTankSizing] = useState<2 | 3 | 4 | 5>(2);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([
    'mancozeb',
    'imidacloprid',
    'boron_solubor',
    'chlorpyrifos',
    'npk_191919',
  ]);

  // Phase 2 & 3: Simulation State & Progress
  const [simulationState, setSimulationState] = useState<'standby' | 'running' | 'completed'>('standby');
  const [simulationProgress, setSimulationProgress] = useState<number>(0);
  const [currentSimStep, setCurrentSimStep] = useState<number>(1);
  const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => () => {
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
  }, []);

  // Active products based on tankSizing
  const activeProducts = useMemo(() => {
    return selectedProductIds.slice(0, tankSizing).map((id, index) => {
      const found = CHEMICAL_DATABASE.find((c) => c.id === id);
      return found || CHEMICAL_DATABASE[index % CHEMICAL_DATABASE.length];
    });
  }, [selectedProductIds, tankSizing]);

  const handleProductChange = (slotIndex: number, newId: string) => {
    const next = [...selectedProductIds];
    next[slotIndex] = newId;
    setSelectedProductIds(next);
    if (simulationState === 'completed') {
      setSimulationState('standby');
      setSimulationProgress(0);
    }
  };

  // Run Real-Time 4-Stage Jar Test Simulation
  const startSimulation = () => {
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    setSimulationState('running');
    setSimulationProgress(0);
    setCurrentSimStep(1);

    const stepInterval = 400; // ms per mini step

    let currentP = 0;
    const interval = setInterval(() => {
      currentP += 5;
      setSimulationProgress(currentP);

      if (currentP < 25) {
        setCurrentSimStep(1);
      } else if (currentP < 50) {
        setCurrentSimStep(2);
      } else if (currentP < 75) {
        setCurrentSimStep(3);
      } else {
        setCurrentSimStep(4);
      }

      if (currentP >= 100) {
        clearInterval(interval);
        simulationIntervalRef.current = null;
        setSimulationState('completed');
      }
    }, stepInterval / 4);
    simulationIntervalRef.current = interval;
  };

  const resetSimulator = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setSimulationState('standby');
    setSimulationProgress(0);
    setCurrentSimStep(1);
  };

  React.useEffect(() => {
    if (simulationState !== 'completed') return;
    void saveSimulationTelemetry({
      moduleId: 'tank-mix',
      moduleName: 'Agronomic Physics & Economic Tank-Mix Simulator',
      timestamp: Date.now(),
      farmId: selectedFarmId || undefined,
      cropCycleId: selectedCropCycleId || undefined,
      parameters: {
        tankSizing,
        selectedProductIds: activeProducts.map((product) => product.id),
        farmName: selectedFarm?.name,
        crop: selectedCropCycle?.crop || selectedFarm?.primaryCrop,
      },
      calculatedMetrics: {
        overallStatus: diagnostics.overallStatus,
        phytotoxicityRisk: diagnostics.phytotoxicityRisk,
        solutionStability: diagnostics.solutionStability,
        estimatedLossPerAcre: diagnostics.estLossPerAcre,
        plantSafetyStatus: diagnostics.plantSafetyStatus,
        deltaTApprox: diagnostics.deltaTApprox,
        weatherActionAdvice: diagnostics.weatherActionAdvice,
        waleOrder: diagnostics.sortedWale.map((product) => product.name),
        incompatiblePairs: diagnostics.pairs.filter((pair) => pair.status === 'Incompatible').map((pair) => `${pair.prodA.name} + ${pair.prodB.name}`),
      },
      suggestedPrompts: [
        'Explain the safest W-A-L-E mixing order for this tank.',
        'Cross-check this tank mix against current spray weather.',
        'Create the field task that should follow this jar-test result.',
      ],
    });
  }, [simulationState]);

  // Phase 4 Diagnostics: Pairwise Cross-checks, Real-Time Weather Plant Foliar Safety & Metrics
  const diagnostics = useMemo(() => {
    const pairs: {
      prodA: ChemicalProductInfo;
      prodB: ChemicalProductInfo;
      status: 'Incompatible' | 'Caution' | 'Safe';
      reason: string;
    }[] = [];

    let hasIncompatible = false;
    let hasCaution = false;

    for (let i = 0; i < activeProducts.length; i++) {
      for (let j = i + 1; j < activeProducts.length; j++) {
        const a = activeProducts[i];
        const b = activeProducts[j];

        if (a.incompatibilities.includes(b.id) || b.incompatibilities.includes(a.id)) {
          hasIncompatible = true;
          const reason =
            a.hazardReason?.[b.id] ||
            b.hazardReason?.[a.id] ||
            'Chemical antagonism or insoluble precipitate formation detected between active formulations.';
          pairs.push({ prodA: a, prodB: b, status: 'Incompatible', reason });
        } else if (a.cautionWith.includes(b.id) || b.cautionWith.includes(a.id)) {
          hasCaution = true;
          const reason =
            a.hazardReason?.[b.id] ||
            b.hazardReason?.[a.id] ||
            'Requires pre-slurrying in separate container and continuous mechanical agitation.';
          pairs.push({ prodA: a, prodB: b, status: 'Caution', reason });
        } else {
          pairs.push({
            prodA: a,
            prodB: b,
            status: 'Safe',
            reason: 'Compatible physical suspension and stable molecular pH balance.',
          });
        }
      }
    }

    const overallStatus: 'Safe Mix' | 'Conditional Mix' | 'Prohibited Mix' = hasIncompatible
      ? 'Prohibited Mix'
      : hasCaution
      ? 'Conditional Mix'
      : 'Safe Mix';

    // Real-Time Weather Analysis for Plant Foliar Safety
    const currentTemp = weatherData.temp || 28;
    const currentHumidity = weatherData.humidity || 65;
    const currentWind = weatherData.windSpeed || 8;

    // Approximate Delta T (°C) from Temp & RH (Ideal: 2°C to 8°C)
    const deltaTApprox = Number(Math.max(1, ((100 - currentHumidity) / 5) * (currentTemp / 30)).toFixed(1));

    const hasHeatSensitiveChem = activeProducts.some((p) => p.scorchSensitivityAtHighTemp || p.formulation === 'EC');
    const hasSulfurOrOil = activeProducts.some((p) => p.id === 'sulfur_wdg' || p.id === 'neem_oil');
    const hasFertilizerSalts = activeProducts.filter((p) => p.category === 'Fertilizer' || p.category === 'Micronutrient').length >= 2;

    let plantSafetyStatus: 'SAFE_FOR_PLANTS' | 'CAUTION_WEATHER_ALERT' | 'CRITICAL_BURN_HAZARD' = 'SAFE_FOR_PLANTS';
    let plantSafetyTitle = '100% Safe For Crop Foliage';
    let plantSafetyDescription = `Live telemetry at ${weatherData.locationName} (${currentTemp}°C, ${currentHumidity}% RH, Wind ${currentWind} km/h, ΔT ${deltaTApprox}°C) confirms optimal foliar assimilation. Zero burn risk on tender leaf tissue.`;
    let weatherActionAdvice = 'Optimal foliar spray window open. Proceed with standard boom/knapsack application.';

    if (hasIncompatible) {
      plantSafetyStatus = 'CRITICAL_BURN_HAZARD';
      plantSafetyTitle = 'CRITICAL: Severe Plant Foliar Scorch & Necrosis Hazard';
      plantSafetyDescription = `Incompatible chemical reaction produces insoluble curdling or caustic ions. Applying this mix will cause acute foliar leaf burn, stunting, and clogged spray nozzles.`;
      weatherActionAdvice = 'DO NOT SPRAY TOGETHER: Separate into two distinct applications at minimum 24-48 hour intervals.';
    } else if (currentTemp >= 32 && (hasHeatSensitiveChem || hasSulfurOrOil)) {
      plantSafetyStatus = 'CRITICAL_BURN_HAZARD';
      plantSafetyTitle = 'HIGH WEATHER-INDUCED PHYTOTOXICITY HAZARD';
      plantSafetyDescription = `High ambient temperature (${currentTemp}°C > 30°C) with active EC solvents or elemental sulfur will dissolve the foliar cuticle wax layer, resulting in severe leaf scorch and sun scald.`;
      weatherActionAdvice = 'POSTPONE SPRAY: Spray strictly during cool evening hours (05:00 PM – 07:00 PM) when ambient temperature drops below 28°C.';
    } else if (deltaTApprox > 8 || (currentTemp > 30 && currentHumidity < 45)) {
      plantSafetyStatus = 'CAUTION_WEATHER_ALERT';
      plantSafetyTitle = 'ELEVATED EVAPORATION & SALT SCORCH RISK';
      plantSafetyDescription = `High atmospheric evaporative demand (ΔT ${deltaTApprox}°C > 8°C) causes spray droplets to dry too quickly, leaving concentrated salt deposits that burn leaf tips.`;
      weatherActionAdvice = 'Increase water carrier volume to 200 Litres/acre. Avoid mid-day sun; spray early morning or late dusk.';
    } else if (currentWind > 14) {
      plantSafetyStatus = 'CAUTION_WEATHER_ALERT';
      plantSafetyTitle = 'HIGH WIND DRIFT & NON-TARGET BURN RISK';
      plantSafetyDescription = `Wind velocity (${currentWind} km/h > 12 km/h) causes physical spray drift and uneven foliar deposition.`;
      weatherActionAdvice = 'Use anti-drift nozzles or delay until wind speed settles below 10 km/h.';
    } else if (hasCaution || hasFertilizerSalts) {
      plantSafetyStatus = 'CAUTION_WEATHER_ALERT';
      plantSafetyTitle = 'CONDITIONAL PLANT COMPATIBILITY';
      plantSafetyDescription = `Multiple chemical formulations/salts present. Safe for mature crop canopy if dissolved thoroughly with high water volume.`;
      weatherActionAdvice = 'Pre-dissolve each product in a bucket of water before adding to tank. Maintain continuous mechanical agitation.';
    }

    // Physics & Economic Metrics Calculation
    const estLossPerAcre = hasIncompatible ? 3450 : hasCaution ? 850 : 0;
    const phytotoxicityRisk = hasIncompatible
      ? 'HIGH (Leaf Scorch & Curdling Hazard)'
      : plantSafetyStatus === 'CRITICAL_BURN_HAZARD'
      ? 'HIGH (Thermal Evaporative Scorch)'
      : hasCaution || plantSafetyStatus === 'CAUTION_WEATHER_ALERT'
      ? 'MODERATE (Timing & Dosage Sensitive)'
      : 'LOW (Safe Foliar Absorption)';

    const solutionStability = hasIncompatible ? 'PRECIPITATED / INACTIVATED' : hasCaution ? 'CONDITIONAL HOMOGENEITY' : 'HOMOGENEOUS SUSPENSION';

    // Sorted W-A-L-E Pouring Order
    const sortedWale = [...activeProducts].sort((a, b) => a.waleOrder - b.waleOrder);

    return {
      overallStatus,
      pairs,
      estLossPerAcre,
      phytotoxicityRisk,
      solutionStability,
      sortedWale,
      plantSafetyStatus,
      plantSafetyTitle,
      plantSafetyDescription,
      weatherActionAdvice,
      deltaTApprox,
    };
  }, [activeProducts, weatherData]);

  return (
    <div className="p-5 sm:p-7 rounded-[32px] frosted-card border border-white/80 dark:border-white/10 shadow-2xl space-y-6 text-slate-950 dark:text-slate-100">
      <ActiveParcelSelector compact />
      {/* 1. INPUT & CONFIGURATION PHASE */}
      <div className="space-y-4">
        {/* Top Controls Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              <FlaskConical className="size-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                Agronomic Physics & Economic Tank-Mix Simulator
              </h3>
              <p className="text-xs text-slate-650 dark:text-slate-300 font-medium">
                Full-market chemical catalog, real-time weather phytotoxicity analysis & W-A-L-E sequence
              </p>
            </div>
          </div>

          {/* Dynamic Tank Sizing Dropdown (2 to 5 inputs) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300">Tank Sizing:</span>
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-black">
              {([2, 3, 4, 5] as const).map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    setTankSizing(count);
                    if (simulationState === 'completed') setSimulationState('standby');
                  }}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    tankSizing === count
                      ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-xs'
                      : 'text-slate-650 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  {count} Inputs
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Telemetry Sync Strip */}
        <div className="px-4 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200 font-bold">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-sky-500" />
            </span>
            <span>Live Field Telemetry Synced ({weatherData.locationName})</span>
          </div>
          <div className="flex items-center gap-3 text-slate-650 dark:text-slate-300 text-[11px] font-semibold">
            <span className="flex items-center gap-1">
              <Thermometer className="size-3 text-amber-500" />
              <span>Temp: {weatherData.temp}°C</span>
            </span>
            <span className="flex items-center gap-1">
              <Droplets className="size-3 text-sky-500" />
              <span>RH: {weatherData.humidity}%</span>
            </span>
            <span className="flex items-center gap-1">
              <Wind className="size-3 text-teal-500" />
              <span>Wind: {weatherData.windSpeed} km/h</span>
            </span>
            <span className="flex items-center gap-1">
              <Sun className="size-3 text-amber-500" />
              <span>ΔT Evap: {diagnostics.deltaTApprox}°C</span>
            </span>
          </div>
        </div>

        {/* Dynamic Product Slots (Product A through Product E) */}
        <div className={`grid gap-3.5 w-full ${
          tankSizing === 2 
            ? 'grid-cols-1 sm:grid-cols-2' 
            : tankSizing === 3 
            ? 'grid-cols-1 sm:grid-cols-3' 
            : tankSizing === 4 
            ? 'grid-cols-1 sm:grid-cols-2' 
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {Array.from({ length: tankSizing }).map((_, slotIdx) => {
            const letter = ['A', 'B', 'C', 'D', 'E'][slotIdx];
            const currentProd = activeProducts[slotIdx];

            return (
              <div
                key={slotIdx}
                className="p-3.5 rounded-2xl frosted-glass-sub border border-slate-200/80 dark:border-white/10 space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-5 rounded-full bg-[var(--brand-color,#0f9a58)] text-white text-[10px] font-mono font-black flex items-center justify-center">
                      {letter}
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      Product {letter}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {currentProd.category}
                  </span>
                </div>

                {/* Product Select from Market Chemical Database */}
                <select
                  value={currentProd.id}
                  onChange={(e) => handleProductChange(slotIdx, e.target.value)}
                  aria-label={`Select Chemical Formulation for Slot ${letter}`}
                  className="w-full h-9 px-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-color,#0f9a58)] cursor-pointer truncate"
                >
                  <optgroup label="Fungicides">
                    {CHEMICAL_DATABASE.filter((c) => c.category === 'Fungicide').map((c) => (
                      <option key={`fung-${c.id}`} value={c.id}>
                        {c.name} {c.brandExample ? `(${c.brandExample})` : ''} [{c.formulation}]
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Insecticides">
                    {CHEMICAL_DATABASE.filter((c) => c.category === 'Insecticide').map((c) => (
                      <option key={`ins-${c.id}`} value={c.id}>
                        {c.name} {c.brandExample ? `(${c.brandExample})` : ''} [{c.formulation}]
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Herbicides">
                    {CHEMICAL_DATABASE.filter((c) => c.category === 'Herbicide').map((c) => (
                      <option key={`herb-${c.id}`} value={c.id}>
                        {c.name} {c.brandExample ? `(${c.brandExample})` : ''} [{c.formulation}]
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Water Soluble Fertilizers (WSF)">
                    {CHEMICAL_DATABASE.filter((c) => c.category === 'Fertilizer').map((c) => (
                      <option key={`fert-${c.id}`} value={c.id}>
                        {c.name} [{c.formulation}]
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Micronutrients & Chelates">
                    {CHEMICAL_DATABASE.filter((c) => c.category === 'Micronutrient').map((c) => (
                      <option key={`micro-${c.id}`} value={c.id}>
                        {c.name} [{c.formulation}]
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Biostimulants & Adjuvants">
                    {CHEMICAL_DATABASE.filter((c) => c.category === 'Biostimulant' || c.category === 'Adjuvant').map((c) => (
                      <option key={`bio-${c.id}`} value={c.id}>
                        {c.name} [{c.formulation}]
                      </option>
                    ))}
                  </optgroup>
                </select>

                {/* Formulation Mapping Details */}
                <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 space-y-1 text-[10px]">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-400">Physical Type:</span>
                    <span className="text-slate-800 dark:text-slate-200">{currentProd.formulationFullName}</span>
                  </div>
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-400">pH Profile:</span>
                    <span className="text-[var(--brand-text,#0d7342)] font-mono">
                      {currentProd.phProfile} (pH {currentProd.phValue})
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-400">Molecular Class:</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[130px]" title={currentProd.molecularClass}>
                      {currentProd.molecularClass}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-bold pt-0.5 border-t border-slate-100 dark:border-white/5">
                    <span className="text-slate-400">W-A-L-E Order:</span>
                    <span className="px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 font-mono font-black">
                      Step {currentProd.waleOrder}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. PRE-SIMULATION & REAL-TIME EXECUTION STATE */}
      <div className="p-5 rounded-[28px] bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                {tankSizing} Simultaneous Inputs Selected
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Combinatorial cross-checks: {((tankSizing * (tankSizing - 1)) / 2)} pairwise pairs
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-white mt-1">
              {simulationState === 'standby'
                ? 'Ready to Execute Molecular & Physical Compatibility Test'
                : simulationState === 'running'
                ? `Running Step ${currentSimStep}/4 Chemical Kinetics Analysis...`
                : 'Jar-Test Complete • 100% Stability Evaluated'}
            </h4>
          </div>

          <div className="flex items-center gap-2.5">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl frosted-glass-sub text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-white/15"
              >
                <span>Close Simulator</span>
              </button>
            )}

            {simulationState === 'completed' && (
              <button
                type="button"
                onClick={resetSimulator}
                className="px-4 py-2.5 rounded-xl frosted-glass-sub text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={startSimulation}
              disabled={simulationState === 'running'}
              className="px-6 py-2.5 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Play className="size-3.5 fill-current" />
              <span>{simulationState === 'running' ? 'Simulating Reaction...' : 'Start Simulator'}</span>
            </button>
          </div>
        </div>

        {/* 3. REAL-TIME EXECUTION PHASE (4 SIMULATED JAR-TEST STAGES) */}
        {simulationState === 'running' && (
          <div className="space-y-3 pt-3 border-t border-white/10">
            {/* Progress Bar */}
            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 rounded-full"
                style={{ width: `${simulationProgress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>

            {/* Stage Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs pt-1">
              <div className={`p-2.5 rounded-xl border transition-all ${
                currentSimStep === 1 ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold' : 'bg-white/5 border-white/5 text-slate-400'
              }`}>
                <span className="text-[10px] block font-mono">Stage 1 (0% - 25%)</span>
                <span>Water Base & Agitation</span>
              </div>
              <div className={`p-2.5 rounded-xl border transition-all ${
                currentSimStep === 2 ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold' : 'bg-white/5 border-white/5 text-slate-400'
              }`}>
                <span className="text-[10px] block font-mono">Stage 2 (25% - 50%)</span>
                <span>Dissolution & WP Hydration</span>
              </div>
              <div className={`p-2.5 rounded-xl border transition-all ${
                currentSimStep === 3 ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold' : 'bg-white/5 border-white/5 text-slate-400'
              }`}>
                <span className="text-[10px] block font-mono">Stage 3 (50% - 75%)</span>
                <span>Emulsification SC/SL/EC</span>
              </div>
              <div className={`p-2.5 rounded-xl border transition-all ${
                currentSimStep === 4 ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold' : 'bg-white/5 border-white/5 text-slate-400'
              }`}>
                <span className="text-[10px] block font-mono">Stage 4 (75% - 100%)</span>
                <span>Pairwise Kinetics & pH</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. DIAGNOSTIC & OUTPUT PHASE (POST-SIMULATION ONLY) */}
      {simulationState === 'completed' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* REAL-TIME WEATHER & PLANT FOLIAR SAFETY ADVISORY (USER REQUESTED FEATURE) */}
          <div className={`p-5 sm:p-6 rounded-[28px] border-2 shadow-xl ${
            diagnostics.plantSafetyStatus === 'SAFE_FOR_PLANTS'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-100'
              : diagnostics.plantSafetyStatus === 'CAUTION_WEATHER_ALERT'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-100'
              : 'bg-rose-500/10 border-rose-500/40 text-rose-950 dark:text-rose-100'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className={`size-14 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 ${
                  diagnostics.plantSafetyStatus === 'SAFE_FOR_PLANTS'
                    ? 'bg-emerald-600'
                    : diagnostics.plantSafetyStatus === 'CAUTION_WEATHER_ALERT'
                    ? 'bg-amber-600'
                    : 'bg-rose-600'
                }`}>
                  {diagnostics.plantSafetyStatus === 'SAFE_FOR_PLANTS' ? (
                    <ShieldCheck className="size-8" />
                  ) : diagnostics.plantSafetyStatus === 'CAUTION_WEATHER_ALERT' ? (
                    <AlertTriangle className="size-8" />
                  ) : (
                    <Flame className="size-8" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      diagnostics.plantSafetyStatus === 'SAFE_FOR_PLANTS'
                        ? 'bg-emerald-600 text-white'
                        : diagnostics.plantSafetyStatus === 'CAUTION_WEATHER_ALERT'
                        ? 'bg-amber-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}>
                      {diagnostics.plantSafetyStatus === 'SAFE_FOR_PLANTS'
                        ? 'SAFE FOR PLANT FOLIAGE'
                        : diagnostics.plantSafetyStatus === 'CAUTION_WEATHER_ALERT'
                        ? 'WEATHER SENSITIVE • TIME RESTRICTED'
                        : 'PROHIBITED • HIGH LEAF SCORCH'}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Clock className="size-3 text-amber-500" />
                      <span>Live Microclimate Analysis ({weatherData.locationName})</span>
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    {diagnostics.plantSafetyTitle}
                  </h3>

                  <p className="text-xs font-semibold leading-relaxed max-w-3xl opacity-90">
                    {diagnostics.plantSafetyDescription}
                  </p>
                </div>
              </div>

              {/* Dynamic Action Guidance Box */}
              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-xs space-y-1 shrink-0 lg:max-w-xs shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Agronomic Advisory
                </span>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-snug">
                  {diagnostics.weatherActionAdvice}
                </p>
              </div>
            </div>
          </div>

          {/* Categorized Safety Status Banner */}
          <div className={`p-6 rounded-[28px] border-2 shadow-lg ${
            diagnostics.overallStatus === 'Safe Mix'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-100'
              : diagnostics.overallStatus === 'Conditional Mix'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-100'
              : 'bg-rose-500/10 border-rose-500/40 text-rose-950 dark:text-rose-100'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className={`size-14 rounded-2xl flex items-center justify-center text-white shadow-md ${
                  diagnostics.overallStatus === 'Safe Mix'
                    ? 'bg-emerald-600'
                    : diagnostics.overallStatus === 'Conditional Mix'
                    ? 'bg-amber-600'
                    : 'bg-rose-600'
                }`}>
                  {diagnostics.overallStatus === 'Safe Mix' ? (
                    <CheckCircle2 className="size-8" />
                  ) : diagnostics.overallStatus === 'Conditional Mix' ? (
                    <AlertTriangle className="size-8" />
                  ) : (
                    <XCircle className="size-8" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider">
                      Diagnosis: {diagnostics.overallStatus}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900 border">
                      {activeProducts.length} Combinatorial Intersections
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black mt-0.5">
                    {diagnostics.overallStatus === 'Safe Mix'
                      ? 'Stable Homogeneous Suspension • Zero Antagonism'
                      : diagnostics.overallStatus === 'Conditional Mix'
                      ? 'Conditional Mix • Pre-Slurrying & Agitation Mandatory'
                      : 'Prohibited Tank-Mix • High Risk of Precipitation & Scorch'}
                  </h3>
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-[10px] text-slate-500 block font-bold">Financial Loss Averted</span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  +₹{diagnostics.estLossPerAcre.toLocaleString('en-IN')} / Acre
                </span>
              </div>
            </div>

            {/* Physics & Economic Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-slate-200/60 dark:border-white/10 text-xs">
              <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-white/10">
                <span className="text-[10px] text-slate-400 block font-bold">Solution Stability</span>
                <span className="font-black text-slate-900 dark:text-white block mt-0.5">
                  {diagnostics.solutionStability}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-white/10">
                <span className="text-[10px] text-slate-400 block font-bold">Phytotoxicity Hazard</span>
                <span className="font-black text-slate-900 dark:text-white block mt-0.5">
                  {diagnostics.phytotoxicityRisk}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-white/10">
                <span className="text-[10px] text-slate-400 block font-bold">Recommended Action</span>
                <span className="font-black text-slate-900 dark:text-white block mt-0.5">
                  {diagnostics.overallStatus === 'Safe Mix'
                    ? 'Proceed with standard W-A-L-E sequence'
                    : diagnostics.overallStatus === 'Conditional Mix'
                    ? 'Conduct 5-min jar test & maintain continuous bypass agitation'
                    : 'Split into two separate tank applications (24h interval)'}
                </span>
              </div>
            </div>
          </div>

          {/* Granular Pairwise Hazard Breakdown */}
          <div className="p-5 rounded-[28px] frosted-card border border-white/80 dark:border-white/10 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="size-4 text-[var(--brand-color,#0f9a58)]" />
              <span>Pairwise Cross-Check Intersections ({diagnostics.pairs.length} Pairs)</span>
            </h4>

            <div className="space-y-2.5">
              {diagnostics.pairs.map((pair, pIdx) => (
                <div
                  key={pIdx}
                  className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    pair.status === 'Incompatible'
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : pair.status === 'Caution'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-emerald-500/5 border-emerald-500/20'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap font-bold">
                      <span className="text-slate-950 dark:text-white">{pair.prodA.name}</span>
                      <span className="text-slate-400 font-mono">+</span>
                      <span className="text-slate-950 dark:text-white">{pair.prodB.name}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full ${
                        pair.status === 'Incompatible'
                          ? 'bg-rose-600 text-white'
                          : pair.status === 'Caution'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {pair.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-650 dark:text-slate-300 leading-relaxed font-medium">
                      {pair.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-Step Addition Sequence (W-A-L-E Protocol) */}
          <div className="p-5 rounded-[28px] frosted-card border border-white/80 dark:border-white/10 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-2">
                  <Droplets className="size-4 text-sky-500" />
                  <span>Physical Tank Pouring Sequence (Official W-A-L-E Protocol)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Strict sequential loading prevents formulation curdling and nozzle clogging
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-1">
                <span className="text-[10px] font-black uppercase text-sky-700 dark:text-sky-300 block font-mono">
                  Step 1: W (Water)
                </span>
                <span className="font-bold text-slate-950 dark:text-white block">Fill Carrier Water</span>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">
                  Fill tank to 50% – 70% with clean pH 6.5 water.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 space-y-1">
                <span className="text-[10px] font-black uppercase text-teal-700 dark:text-teal-300 block font-mono">
                  Step 2: A (Agitation)
                </span>
                <span className="font-bold text-slate-950 dark:text-white block">Start Agitator</span>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">
                  Engage continuous bypass or mechanical stirring.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 block font-mono">
                  Step 3: L (Liquid / Powder)
                </span>
                <span className="font-bold text-slate-950 dark:text-white block">Add WPs, WDGs & SGs</span>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">
                  Add dry flowables ({diagnostics.sortedWale.filter((p: ChemicalProductInfo) => p.waleOrder === 2).map((p: ChemicalProductInfo) => p.name.split(' ')[0]).join(', ') || 'powders'}) & hydrate 3-5 min.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 block font-mono">
                  Step 4: E (Emulsions)
                </span>
                <span className="font-bold text-slate-950 dark:text-white block">Add SCs, SLs & ECs</span>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">
                  Add liquid flowables & emulsifiable concentrates last.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
