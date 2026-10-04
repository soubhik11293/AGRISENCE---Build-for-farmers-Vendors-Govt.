export interface AgriPlatform {
  id: string;
  name: string;
  category: 'seeds' | 'crop_protection' | 'fertilizers' | 'machinery';
  url: string;
  searchUrlTemplate?: (query: string) => string;
  badge: string;
  description: string;
  deliveryCoverage: string;
  features: string[];
  recommendedFor?: string[];
}

export interface ProductCategory {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  platforms: AgriPlatform[];
}

export const KISAN_SHOP_CATEGORIES: ProductCategory[] = [
  {
    id: 'seeds',
    title: 'Seeds & Planting Stock',
    subtitle: 'High-germination certified hybrid & open-pollinated seed varieties',
    iconName: 'Sprout',
    platforms: [
      {
        id: 'kisanshop-seeds',
        name: 'KisanShop Seeds',
        category: 'seeds',
        url: 'https://www.kisanshop.in/collections/seeds',
        searchUrlTemplate: (q) => `https://www.kisanshop.in/search?q=${encodeURIComponent(q + ' seeds')}`,
        badge: 'Pan-India Delivery',
        description: 'Certified cereal, pulse, oilseed, and vegetable hybrid seed stocks directly from breeders.',
        deliveryCoverage: 'All India Pincodes (3-5 days)',
        features: ['Certified Germination 90%+', 'Direct Breeder Supply', 'Cash on Delivery Available'],
        recommendedFor: ['Soybean', 'Cotton', 'Maize', 'Pigeonpea', 'Vegetables', 'Wheat'],
      },
      {
        id: 'agribegri-seeds',
        name: 'AgriBegri Seeds',
        category: 'seeds',
        url: 'https://agribegri.com/category/seeds.php',
        searchUrlTemplate: (q) => `https://agribegri.com/search.php?search=${encodeURIComponent(q + ' seed')}`,
        badge: 'Trusted Quality',
        description: 'Premium hybrid field crop seeds and high-yielding vegetable cultivars with germination guarantees.',
        deliveryCoverage: 'Pan-India 25,000+ Pincodes',
        features: ['ICAR / State Seed Corp Brands', 'Treated Anti-Fungal Seeds', 'Free Shipping over ₹999'],
        recommendedFor: ['Bt Cotton', 'Hybrid Maize', 'Gram', 'Mustard', 'Vegetable Seeds'],
      },
      {
        id: 'farmkey-seeds',
        name: 'FarmKey Seeds',
        category: 'seeds',
        url: 'https://farmkey.in/collections/seeds',
        searchUrlTemplate: (q) => `https://farmkey.in/search?q=${encodeURIComponent(q)}`,
        badge: 'Best Rates',
        description: 'Quality tested agronomic seed portfolio with high stress tolerance and yield potential.',
        deliveryCoverage: 'Direct to Farm Gate',
        features: ['Lab Tested Purity', 'Bulk Bag Discounts', 'Regional Language Guidance'],
        recommendedFor: ['Paddy', 'Pulses', 'Fodder Seeds', 'Exotic Veggies'],
      },
      {
        id: 'bighaat-seeds',
        name: 'BigHaat Seeds',
        category: 'seeds',
        url: 'https://www.bighaat.com/collections/seeds',
        searchUrlTemplate: (q) => `https://www.bighaat.com/search?q=${encodeURIComponent(q + ' seeds')}`,
        badge: 'Official Agritech Partner',
        description: 'India’s pioneer digital agriculture marketplace with 100% genuine guaranteed seed batches.',
        deliveryCoverage: 'Pan-India Express Rural Logistics',
        features: ['100% Genuine Guarantee', 'Agronomist Advisory Call Support', 'Seasonal Discounts'],
        recommendedFor: ['All Cereals', 'F1 Hybrids', 'Bio-Fortified Seeds', 'Rootstocks'],
      },
      {
        id: 'iffco-seeds',
        name: 'IFFCO Bazar Seeds',
        category: 'seeds',
        url: 'https://www.iffcobazar.in/en/seeds',
        searchUrlTemplate: (q) => `https://www.iffcobazar.in/en/search?q=${encodeURIComponent(q)}`,
        badge: 'Cooperative Standard',
        description: 'Farmer cooperative network delivering certified NSC/HIL/State agency foundation seeds.',
        deliveryCoverage: 'Zero Delivery Charge Across India',
        features: ['Government / Cooperative Pricing', 'Zero Delivery Fee', 'Direct Subsidized Rates'],
        recommendedFor: ['Wheat', 'Paddy', 'Pulses', 'Oilseeds', 'Green Manure (Dhaincha)'],
      },
      {
        id: 'agrostar-store',
        name: 'AgroStar Agri-Store',
        category: 'seeds',
        url: 'https://www.agrostar.in/',
        searchUrlTemplate: (q) => `https://www.agrostar.in/search?q=${encodeURIComponent(q)}`,
        badge: 'Farm Doorstep',
        description: 'Tech-enabled end-to-end seed and farm input procurement with expert agronomy hotline.',
        deliveryCoverage: 'Hyperlocal Warehousing & Fast Rural Delivery',
        features: ['Doctor Crop Advisory', 'Exclusive Seed Brands', 'Easy Return Policy'],
        recommendedFor: ['Bt Cotton', 'Hybrid Chillies', 'Tomatoes', 'Oilseeds'],
      },
    ],
  },
  {
    id: 'crop_protection',
    title: 'Pesticides & Bio-Crop Protection',
    subtitle: 'CIB&RC approved bio-control agents, botanical extracts & ICAR chemical formulations',
    iconName: 'Bug',
    platforms: [
      {
        id: 'agribegri-protection',
        name: 'AgriBegri Crop Protection',
        category: 'crop_protection',
        url: 'https://agribegri.com/category/crop-protection.php',
        searchUrlTemplate: (q) => `https://agribegri.com/search.php?search=${encodeURIComponent(q)}`,
        badge: 'Certified Formulations',
        description: 'Targeted insecticides, fungicides, bactericides, and eco-friendly botanical bio-repellents.',
        deliveryCoverage: 'Pan-India Safe Hazardous Logistics',
        features: ['Batch Quality Certificates', 'Full Dilution Guidelines Included', 'Original Manufacturer Seals'],
        recommendedFor: ['Fall Armyworm', 'Pink Bollworm', 'Whitefly', 'Stem Borer', 'Fungal Blight'],
      },
      {
        id: 'kisanshop-pesticides',
        name: 'KisanShop Crop Care',
        category: 'crop_protection',
        url: 'https://www.kisanshop.in/collections/pesticides',
        searchUrlTemplate: (q) => `https://www.kisanshop.in/search?q=${encodeURIComponent(q)}`,
        badge: 'Fast Dispatch',
        description: 'Bio-pesticides, biologicals (Bt, Beauveria), pheromone traps, and systemic pest control remedies.',
        deliveryCoverage: 'All Pin Codes Across India',
        features: ['Pheromone Traps & Lures', 'Organic Certifications', 'Wholesale Farmer Packs'],
        recommendedFor: ['Emamectin Benzoate', 'Chlorantraniliprole', 'Neem Oil 10000ppm', 'Spinetoram'],
      },
      {
        id: 'bighaat-pesticides',
        name: 'BigHaat Pesticides & Fungicides',
        category: 'crop_protection',
        url: 'https://www.bighaat.com/collections/pesticides',
        searchUrlTemplate: (q) => `https://www.bighaat.com/search?q=${encodeURIComponent(q)}`,
        badge: '100% Genuine CIB&RC',
        description: 'Comprehensive pest management catalog with direct technical support from registered agronomists.',
        deliveryCoverage: 'Pan-India Doorstep Logistics',
        features: ['Leading Brand Portfolio (Syngenta, Bayer, UPL, Tata)', 'Zero-Residue Bio-Packs', 'Instant Tracking'],
        recommendedFor: ['Mancozeb', 'Hexaconazole', 'Azoxystrobin', 'Diafenthiuron', 'Trichoderma'],
      },
      {
        id: 'farmkey-insecticides',
        name: 'FarmKey Insecticides',
        category: 'crop_protection',
        url: 'https://farmkey.in/collections/pesticides',
        searchUrlTemplate: (q) => `https://farmkey.in/search?q=${encodeURIComponent(q)}`,
        badge: 'Direct Factory Pricing',
        description: 'Direct-to-farmer crop protection molecules for sucking, chewing, and boring insect complexes.',
        deliveryCoverage: 'Express Rural Courier',
        features: ['Tested Field Efficacy', 'Dosage Calculator on Packet', 'Secure Packaging'],
        recommendedFor: ['Sucking Pests', 'Caterpillars', 'Mites', 'Nematodes'],
      },
      {
        id: 'bharatagri-mart',
        name: 'BharatAgri Mart (Krushi Dukan)',
        category: 'crop_protection',
        url: 'https://krushidukan.bharatagri.com/',
        searchUrlTemplate: (q) => `https://krushidukan.bharatagri.com/search?q=${encodeURIComponent(q)}`,
        badge: 'Smart Krushi Dukan',
        description: 'AI-guided crop protection combos customized for specific crop stages and weather conditions.',
        deliveryCoverage: 'Delivering to 18,000+ Pin Codes',
        features: ['Stage-wise Spray Kits', 'Cash on Delivery', 'Regional Kisan WhatsApp Support'],
        recommendedFor: ['Combined Tank Mixes', 'Bio-Fungicides', 'Virus Defense Kits'],
      },
      {
        id: 'iffco-chemicals',
        name: 'IFFCO Bio-Fertilizers & Agro-Chemicals',
        category: 'crop_protection',
        url: 'https://www.iffcobazar.in/',
        searchUrlTemplate: (q) => `https://www.iffcobazar.in/en/search?q=${encodeURIComponent(q)}`,
        badge: 'Farmer Trust',
        description: 'National cooperative standard bio-pesticides, Trichoderma viride, and eco-balanced crop protectors.',
        deliveryCoverage: 'Zero Extra Delivery Cost Across India',
        features: ['Eco-Safe Formulations', 'Subsidized Cooperative Pricing', 'Govt Verified Quality'],
        recommendedFor: ['Bio-Protectors', 'Pseudomonas', 'Paecilomyces', 'Seed Treaters'],
      },
    ],
  },
  {
    id: 'fertilizers',
    title: 'Fertilizers & Soil Nutrition',
    subtitle: 'IFFCO Nano-Urea, water-soluble NPKs, micronutrient chelated mixes & organic humic soil conditioners',
    iconName: 'Layers',
    platforms: [
      {
        id: 'iffco-fertilizers',
        name: 'IFFCO Bazar Nano-Urea & WSF',
        category: 'fertilizers',
        url: 'https://www.iffcobazar.in/en/fertilizers',
        searchUrlTemplate: (q) => `https://www.iffcobazar.in/en/search?q=${encodeURIComponent(q + ' fertilizer')}`,
        badge: 'Direct Subsidized',
        description: 'World-pioneering IFFCO Nano Urea & Nano DAP bottles, water-soluble 19:19:19, 0:52:34, and bio-stimulants.',
        deliveryCoverage: 'Free Delivery to All Indian Pin Codes',
        features: ['Direct Govt Subsidized Rates', 'Nano Technology (High Uptake)', 'Free Home Delivery'],
        recommendedFor: ['Nano Urea (500ml)', 'Nano DAP', '19-19-19 WSF', '0-52-34', '13-0-45 Potassium Nitrate'],
      },
      {
        id: 'agribegri-fertilizers',
        name: 'AgriBegri Plant Growth & Nutrients',
        category: 'fertilizers',
        url: 'https://agribegri.com/category/fertilizers.php',
        searchUrlTemplate: (q) => `https://agribegri.com/search.php?search=${encodeURIComponent(q)}`,
        badge: 'Soil Health Specialist',
        description: 'Chelated micronutrient combos (Zinc, Boron, Iron, Magnesium), Humic Acid 98%, and Seaweed extracts.',
        deliveryCoverage: 'Pan-India Delivery',
        features: ['100% Water Soluble Grades', 'Soil pH Buffers & Gypsum', 'Organic Granules'],
        recommendedFor: ['Chelated Zinc EDTA', 'Boron 20%', 'Humic & Fulvic Acid', 'Mycorrhiza Bio-Fertilizer'],
      },
      {
        id: 'bighaat-nutrition',
        name: 'BigHaat Crop Nutrition',
        category: 'fertilizers',
        url: 'https://www.bighaat.com/collections/fertilizers',
        searchUrlTemplate: (q) => `https://www.bighaat.com/search?q=${encodeURIComponent(q + ' fertilizer')}`,
        badge: 'Complete Nutrient Spectrum',
        description: 'Premium fertigation fertilizers, biostimulants, flowering boosters, and amino-acid leaf feeds.',
        deliveryCoverage: 'All India Rural Logistics',
        features: ['Drip Irrigation Ready Grades', 'Foliar Yield Multipliers', 'Soil Conditioners'],
        recommendedFor: ['Calcium Nitrate', 'Magnesium Sulphate', 'Liquid Bio NPK', 'Seaweed Extract'],
      },
      {
        id: 'kisanshop-fertilizers',
        name: 'KisanShop Bio-Stimulants',
        category: 'fertilizers',
        url: 'https://www.kisanshop.in/collections/fertilizers',
        searchUrlTemplate: (q) => `https://www.kisanshop.in/search?q=${encodeURIComponent(q)}`,
        badge: 'Root & Soil Boosters',
        description: 'Advanced organic carbon enhancers, PSB/Azotobacter bio-inoculants, and micronutrient foliar sprays.',
        deliveryCoverage: 'Pan-India 28,000+ Codes',
        features: ['Bio-Organic Certified', 'Root Exudate Stimulators', 'Chlorosis Correctors'],
        recommendedFor: ['Soil Conditioners', 'Humic Flakes', 'Potash Mobilizing Bacteria (KMB)', 'Sulfur 90% WDG'],
      },
      {
        id: 'krishify-dukan',
        name: 'Krishify Agri Dukan',
        category: 'fertilizers',
        url: 'https://krishify.com/',
        searchUrlTemplate: (q) => `https://krishify.com/search?q=${encodeURIComponent(q)}`,
        badge: 'Community Verified',
        description: 'Soil regeneration inputs, vermicompost boosters, and regional balanced fertilizer recommendations.',
        deliveryCoverage: 'Nationwide Delivery',
        features: ['Farmer Reviews & Ratings', 'Local Soil Match', 'Special Seasonal Offers'],
        recommendedFor: ['Organic Soil Feeds', 'Phosphate Solubilizers', 'Zinc Sulphate Monohydrate'],
      },
    ],
  },
  {
    id: 'machinery',
    title: 'Farm Machinery, Sprayers & Hardware Tools',
    subtitle: 'Battery knapsack sprayers, HTP pumps, power weeders, soil testing kits & drip equipment',
    iconName: 'Wrench',
    platforms: [
      {
        id: 'toolsvilla-machinery',
        name: 'ToolsVilla Agriculture Equipments',
        category: 'machinery',
        url: 'https://www.toolsvilla.com/category/agriculture-machinery',
        searchUrlTemplate: (q) => `https://www.toolsvilla.com/search?q=${encodeURIComponent(q)}`,
        badge: 'India’s Heavy Equipment Hub',
        description: 'Power weeders, brush cutters, 2-in-1 battery sprayers, solar insect traps, and post-hole diggers.',
        deliveryCoverage: 'Pan-India Heavy Logistics (Doorstep)',
        features: ['1-Year Manufacturer Warranty', 'Spare Parts Readily Available', 'Video Setup Support'],
        recommendedFor: ['16L/20L Battery Sprayers', 'HTP Power Sprayers', 'Power Weeders', 'Solar Light Traps'],
      },
      {
        id: 'agribegri-machinery',
        name: 'AgriBegri Farm Implements',
        category: 'machinery',
        url: 'https://agribegri.com/category/farm-machinery.php',
        searchUrlTemplate: (q) => `https://agribegri.com/search.php?search=${encodeURIComponent(q)}`,
        badge: 'Farmer Tested Tools',
        description: 'Telescopic spray lances, battery knapsacks, mist blowers, drip fittings, and farm hardware.',
        deliveryCoverage: 'Pan-India Pin Codes',
        features: ['Heavy Duty Brass Nozzles', 'Long Battery Life (12V 12Ah)', 'Free Tool Kit Included'],
        recommendedFor: ['Knapsack Spray Pumps', 'Drip Venturi Injectors', 'Hand Seeders', 'Pruning Shears'],
      },
      {
        id: 'kisanshop-tools',
        name: 'KisanShop Spray Pumps & Dusters',
        category: 'machinery',
        url: 'https://www.kisanshop.in/collections/tools-equipments',
        searchUrlTemplate: (q) => `https://www.kisanshop.in/search?q=${encodeURIComponent(q)}`,
        badge: 'Precision Sprayers',
        description: 'High-pressure sprayers, drone tank accessories, motorized dusters, and digital soil pH probes.',
        deliveryCoverage: 'Across All Indian States',
        features: ['Double Motor High Pressure', 'Digital Battery Indicators', 'Ergonomic Back Padding'],
        recommendedFor: ['High Pressure Sprayers', 'Micro Drip Kits', 'Digital Soil Moisture & pH Meters'],
      },
      {
        id: 'moglix-agri',
        name: 'Moglix Agricultural Tools',
        category: 'machinery',
        url: 'https://www.moglix.com/agriculture-garden-landscaping',
        searchUrlTemplate: (q) => `https://www.moglix.com/search?controller=search&s=${encodeURIComponent(q)}`,
        badge: 'Industrial Grade',
        description: 'Heavy duty agricultural water pumps, diesel generators, chainsaw cutters, and irrigation piping.',
        deliveryCoverage: 'Pan-India Fast Dispatch',
        features: ['GST Invoicing for Farm Subsidies', 'Bulk Fleet Pricing', 'Tier-1 Brand Warranties'],
        recommendedFor: ['Solar Water Pumps', 'Electric Motors', 'Rotary Tillers', 'Tarpaulins & Mulch Films'],
      },
      {
        id: 'industrybuying-farm',
        name: 'IndustryBuying Farm Tools',
        category: 'machinery',
        url: 'https://www.industrybuying.com/agriculture-garden-landscaping-2384/',
        searchUrlTemplate: (q) => `https://www.industrybuying.com/search/?q=${encodeURIComponent(q)}`,
        badge: 'Direct Wholesaler',
        description: 'Commercial farm implements, earth augers, mini foggers, tarpaulins, and crop nets.',
        deliveryCoverage: 'Direct Rural Doorstep Cargo',
        features: ['Wholesale Rates', 'Heavy Implement Financing Options', 'Commercial Invoicing'],
        recommendedFor: ['Earth Augers', 'Mist Blowers', 'Shade Nets 50%/75%', 'Sprinkler Guns'],
      },
    ],
  },
];

/**
 * Builds a dynamic Google Maps live intent query searching for Krishi Seva Kendra / Agro-input shops
 * within the user's active GPS / IP / pincode / district location radius.
 */
export function buildNearbyKrishiKendraMapUrl(locationQuery?: string): string {
  const query = locationQuery?.trim() || 'near me';
  return `https://www.google.com/maps/search/Krishi+Seva+Kendra+fertilizer+seed+pesticide+shop+near+${encodeURIComponent(
    query
  )}`;
}

/**
 * Helper to generate direct search links for a specific input keyword across top platforms
 */
export function getSmartProcurementLinks(keyword: string) {
  const cleanKey = keyword.trim();
  return [
    {
      platformName: 'IFFCO Bazar',
      url: `https://www.iffcobazar.in/en/search?q=${encodeURIComponent(cleanKey)}`,
      badge: 'Zero Delivery Fee / Coop',
      category: 'Official Cooperative',
    },
    {
      platformName: 'AgriBegri',
      url: `https://agribegri.com/search.php?search=${encodeURIComponent(cleanKey)}`,
      badge: 'Pan-India 25k Pincodes',
      category: 'Agri Marketplace',
    },
    {
      platformName: 'BigHaat',
      url: `https://www.bighaat.com/search?q=${encodeURIComponent(cleanKey)}`,
      badge: '100% Genuine CIB&RC',
      category: 'Digital Agri Store',
    },
    {
      platformName: 'KisanShop',
      url: `https://www.kisanshop.in/search?q=${encodeURIComponent(cleanKey)}`,
      badge: 'Express Rural Delivery',
      category: 'Farmer Direct Mart',
    },
    {
      platformName: 'ToolsVilla',
      url: `https://www.toolsvilla.com/search?q=${encodeURIComponent(cleanKey)}`,
      badge: 'Heavy Implements & Pumps',
      category: 'Machinery & Tools',
    },
  ];
}

/**
 * Maps diagnosed pest/pathogen to targeted procurement items
 */
export function getPestDiagnosisProcurement(pestName: string, cropName: string = '') {
  const lower = (pestName + ' ' + cropName).toLowerCase();

  if (lower.includes('armyworm') || lower.includes('spodoptera')) {
    return {
      targetPest: 'Fall Armyworm (FAW)',
      recommendedProducts: [
        { name: 'Emamectin Benzoate 5% SG', type: 'Chemical Larvicide', query: 'Emamectin Benzoate 5 SG' },
        { name: 'Chlorantraniliprole 18.5% SC', type: 'Systemic Ovi-Larvicide', query: 'Chlorantraniliprole 18.5 SC' },
        { name: 'Bacillus thuringiensis (Bt) Bio-Spray', type: 'Organic Bio-Agent', query: 'Bacillus thuringiensis Bt bio pesticide' },
        { name: 'FAW Pheromone Traps & Funnel Lures', type: 'Monitoring & Mass Trap', query: 'Fall armyworm pheromone trap lure' },
        { name: '16L Battery Knapsack Sprayer Pump', type: 'Application Equipment', query: '16L battery sprayer pump knapsack' },
      ],
    };
  }

  if (lower.includes('bollworm') || lower.includes('pectinophora') || lower.includes('cotton')) {
    return {
      targetPest: 'Pink Bollworm & Boll Infestations',
      recommendedProducts: [
        { name: 'Gossyplure PB-Rope Mating Disruptors', type: 'Bio-Pheromone Lures', query: 'Gossyplure PB Rope pink bollworm trap' },
        { name: 'Spinetoram 11.7% SC', type: 'Advanced Chemistry', query: 'Spinetoram 11.7 SC' },
        { name: 'Profenofos 50% EC', type: 'Foliar Insecticide', query: 'Profenofos 50 EC' },
        { name: 'Beauveria Bassiana Bio-Pesticide', type: 'Entomopathogenic Fungus', query: 'Beauveria bassiana bio pesticide' },
        { name: 'Brass Multi-Hole Hollow Cone Nozzle', type: 'Sprayer Accessory', query: 'Brass hollow cone spray nozzle agriculture' },
      ],
    };
  }

  if (lower.includes('whitefly') || lower.includes('aphid') || lower.includes('thrip') || lower.includes('sucking')) {
    return {
      targetPest: 'Sucking Pest Complex (Whitefly / Aphids / Thrips)',
      recommendedProducts: [
        { name: 'Yellow & Blue Sticky Traps (Pack of 25)', type: 'Physical Trap Barrier', query: 'Yellow sticky traps agriculture' },
        { name: 'Neem Oil 10,000 PPM (Pure Cold Pressed)', type: 'Botanical Repellent', query: 'Neem oil 10000 ppm agriculture' },
        { name: 'Diafenthiuron 50% WP', type: 'Broad Spectrum Insecticide', query: 'Diafenthiuron 50 WP' },
        { name: 'Pyriproxyfen 10% + Fenpropathrin 15% EC', type: 'Nymph & Adult Control', query: 'Pyriproxyfen Fenpropathrin' },
        { name: 'Silicone Based Spray Spreader & Sticker', type: 'Adjuvant Enhancer', query: 'Silicone sticker spreader agriculture' },
      ],
    };
  }

  // Generic fallback
  return {
    targetPest: pestName || 'Crop Pathogen & Pest',
    recommendedProducts: [
      { name: 'Neem Seed Kernel Extract / Neem 10000 PPM', type: 'Bio-Control', query: 'Neem Oil 10000 PPM' },
      { name: 'Trichoderma Viride Bio-Fungicide', type: 'Soil & Foliar Bio-Shield', query: 'Trichoderma Viride' },
      { name: 'Targeted Insecticide Formulations', type: 'ICAR Approved Inputs', query: pestName ? `${pestName} pesticide` : 'Pesticide' },
      { name: 'High-Pressure 16L Battery Knapsack Sprayer', type: 'Delivery Hardware', query: 'Battery Sprayer 16 Litre' },
    ],
  };
}

/**
 * Maps Soil recommendations to direct procurement items
 */
export function getSoilOptimizationProcurement(soilTaxonomy: string, phLevel: number, npkDeficit: { n: boolean; p: boolean; k: boolean }) {
  const products: { name: string; type: string; query: string; purpose: string }[] = [];

  // Nano Urea / N
  if (npkDeficit.n || phLevel > 7.5) {
    products.push({
      name: 'IFFCO Nano Urea (500ml Liquid Bottle)',
      type: 'Subsidized Bio-Available N',
      query: 'IFFCO Nano Urea liquid',
      purpose: 'Fast foliar absorption, replaces 1 bag granular urea with zero soil leaching.',
    });
  }

  // Phosphate
  if (npkDeficit.p) {
    products.push({
      name: 'IFFCO Nano DAP / Single Super Phosphate (SSP)',
      type: 'Root & Energy Nutrition',
      query: 'IFFCO Nano DAP water soluble',
      purpose: 'Stimulates prolific root branching, nodulation, and flowering energy.',
    });
    products.push({
      name: 'Phosphate Solubilizing Bacteria (PSB Bio-Fertilizer)',
      type: 'Microbial Soil Inoculant',
      query: 'PSB Phosphate Solubilizing Bacteria',
      purpose: 'Unlocks fixed insoluble soil phosphates in high pH soils.',
    });
  }

  // Potassium
  if (npkDeficit.k) {
    products.push({
      name: 'Potassium Nitrate (13:0:45) / Potash Mobilizing Bio-Pack',
      type: 'Fruit & Grain Filling',
      query: 'Potassium Nitrate 13 0 45 water soluble',
      purpose: 'Improves grain weight, drought resilience, and disease resistance.',
    });
  }

  // pH Conditioners
  if (phLevel > 7.8) {
    products.push({
      name: 'Agricultural Gypsum & Elemental Sulfur 90% WDG',
      type: 'Alkaline Soil Amendment',
      query: 'Agricultural Gypsum Sulfur 90 WDG',
      purpose: 'Displaces exchangeable sodium, loosens hard clay pans, and lowers soil pH.',
    });
  } else if (phLevel < 6.0) {
    products.push({
      name: 'Agricultural Dolomitic Limestone Powder',
      type: 'Acidic Soil Neutralizer',
      query: 'Agricultural Lime Dolomite powder',
      purpose: 'Neutralizes excess soil acidity and infuses vital Calcium-Magnesium ions.',
    });
  }

  // Universal Soil Health
  products.push({
    name: 'Humic Acid 98% Flakes & Seaweed Bio-Stimulant',
    type: 'Organic Carbon Multiplier',
    query: 'Humic acid 98 seaweed extract agriculture',
    purpose: 'Enhances CEC (Cation Exchange Capacity) and stimulates beneficial soil microbes.',
  });

  products.push({
    name: 'Digital 4-in-1 Soil pH, Moisture & Sunlight Meter Probe',
    type: 'Field Testing Tool',
    query: 'Digital soil ph moisture meter probe agriculture',
    purpose: 'Instant handheld parcel diagnostics for direct real-time farm tracking.',
  });

  return products;
}
