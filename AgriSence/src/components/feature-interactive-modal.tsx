import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sprout as Sparkles,
  Droplets,
  Wind,
  Layers,
  FlaskConical,
  Sprout,
  TrendingUp,
  Activity,
  Calculator,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Building,
  CreditCard,
  FileText,
  Clock,
  Radio,
  MapPin,
  HelpCircle,
  ShoppingCart,
  Store,
  Navigation,
  RefreshCw,
  Gauge,
  Sun,
  ShieldAlert,
} from 'lucide-react';
import { useLanguage } from '@/src/context/language-context';
import { useDiagnosis } from '@/src/context/diagnosis-context';
import { useTelemetry } from '@/src/context/telemetry-context';
import { useFarms } from '@/src/context/farm-context';
import { getLatestSimulationTelemetry, loadSimulationDraft, saveSimulationDraft, saveSimulationTelemetry } from '@/src/lib/simulator-sync';
import { saveSoilAnalysis } from '@/src/lib/platform-sync';
import { KisanShopModal } from '@/src/components/kisan-shop-modal';
import { TankMixSimulator } from '@/src/components/tank-mix-simulator';
import { SellVsStoreSimulator } from '@/src/components/sell-vs-store-simulator';
import { CropStagesSimulator } from '@/src/components/crop-stages-simulator';
import { BioControlSimulator } from '@/src/components/bio-control-simulator';
import { ActiveParcelSelector } from '@/src/components/dashboard/active-parcel-selector';
import { useAuth } from '@/src/context/auth-context';

interface FeatureInteractiveModalProps {
  featureId?: string | null;
  featureTarget?: string | null;
  isOpen?: boolean;
  onClose: () => void;
}

export function FeatureInteractiveModal({
  featureId,
  featureTarget,
  isOpen = true,
  onClose,
}: FeatureInteractiveModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { activeDiagnosis } = useDiagnosis();
  const { weatherData, marketData, activeArbitrageTopSpread, sprayStatusForNow } = useTelemetry();
  const { selectedFarmId, selectedFarm, selectedCropCycleId, selectedCropCycle } = useFarms();
  const activeId = featureTarget || featureId;

  // --- Dynamic Simulation Execution State (4-Stage Progressive Execution) ---
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationProgress, setSimulationProgress] = useState<number>(0);
  const [simulationStage, setSimulationStage] = useState<string>('');
  const [hasSimulated, setHasSimulated] = useState<boolean>(false);
  const [latestSimulation, setLatestSimulation] = useState<any>(() => getLatestSimulationTelemetry(user?.id));
  const simulationTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearSimulationTimers = () => {
    simulationTimersRef.current.forEach((timer) => clearTimeout(timer));
    simulationTimersRef.current = [];
  };

  // Reset simulation state when modal target changes
  useEffect(() => {
    clearSimulationTimers();
    setIsSimulating(false);
    setSimulationProgress(0);
    setSimulationStage('');
    setHasSimulated(false);

    return clearSimulationTimers;
  }, [activeId]);

  useEffect(() => {
    const syncLatest = () => setLatestSimulation(getLatestSimulationTelemetry(user?.id));
    window.addEventListener('agrisence_simulation_updated', syncLatest);
    window.addEventListener('agrisence_simulator_updated', syncLatest);
    return () => {
      window.removeEventListener('agrisence_simulation_updated', syncLatest);
      window.removeEventListener('agrisence_simulator_updated', syncLatest);
    };
  }, [user?.id]);

  // --- State for 1. Bio-Control Calculator ---
  const [bioBatchLiters, setBioBatchLiters] = useState<number>(50);
  const [bioRecipe, setBioRecipe] = useState<'nske' | 'dashparni' | 'jeevamrit'>('nske');

  // --- State for 2. Pesticide & Spray Dosage (16 Registered Formulations & 3 Delivery Systems) ---
  const [sprayMethod, setSprayMethod] = useState<'knapsack' | 'tractor_boom' | 'drone'>('knapsack');
  const [sprayAcres, setSprayAcres] = useState<number>(3);
  const [canopyDensity, setCanopyDensity] = useState<'light' | 'medium' | 'dense'>('medium');
  const [selectedMoleculeId, setSelectedMoleculeId] = useState<string>('emamectin_5sg');

  // --- State for 3. Soil Analysis & Optimization (8 Pan-India Taxonomies & 18 Crops & 6 Sliders) ---
  const [soilTaxonomyIdx, setSoilTaxonomyIdx] = useState<number>(0);
  const [soilPh, setSoilPh] = useState<number>(7.4);
  const [nitrogen, setNitrogen] = useState<number>(138); // kg/ha (50-450)
  const [phosphorus, setPhosphorus] = useState<number>(24); // kg/ha (5-90)
  const [potassium, setPotassium] = useState<number>(265); // kg/ha (80-600)
  const [organicCarbon, setOrganicCarbon] = useState<number>(0.55); // OC % (0.10-1.80)
  const [soilEc, setSoilEc] = useState<number>(0.8); // EC dS/m (0.1-8.0)
  const [targetCrop, setTargetCrop] = useState<string>('Bt Cotton');
  const [kisanShopOpen, setKisanShopOpen] = useState(false);
  const [shopCategory, setShopCategory] = useState<'seeds' | 'crop_protection' | 'fertilizers' | 'machinery' | 'hyperlocal'>('fertilizers');
  const [shopQuery, setShopQuery] = useState('');

  // --- State for 4. Crop Compatibility & Intercropping (10 Anchor x 12 Companions x 5 Geometries) ---
  const [mainCrop, setMainCrop] = useState<string>('Bt Cotton (Kapas)');
  const [intercropOption, setIntercropOption] = useState<string>('Pigeonpea / Red Gram (Tur)');
  const [rowGeometry, setRowGeometry] = useState<'1_1_alt' | '2_1_paired' | '3_1_strip' | '4_2_precision' | 'perimeter_trap'>('2_1_paired');

  // --- State for 5. IoT Soil & Satellite NDVI (3 Depths & 24h Diurnal Cycle) ---
  const [sensorDepth, setSensorDepth] = useState<'15cm' | '30cm' | '60cm'>('15cm');
  const [simulatedHour, setSimulatedHour] = useState<number>(14); // 24-hour diurnal slider (default 2 PM for solar dip)
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0); // 0, 1, 2
  const [timeHorizon, setTimeHorizon] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  // --- State for 6. Smart Irrigation ETc ---
  const [referenceEt0, setReferenceEt0] = useState<number>(() => weatherData.et0 || 5.2); // mm/day
  const [cropKc, setCropKc] = useState<number>(0.85); // 0.35 to 1.25
  const [soilTexture, setSoilTexture] = useState<'clay' | 'loam' | 'sandy'>('clay');
  const [dripFlowRateLph, setDripFlowRateLph] = useState<number>(2400); // 1600 to 3200 L/hr

  // --- State for 7. Spray Viability Calendar & Agronomic Physics Simulator ---
  const [cropSuggestionTimeframe, setCropSuggestionTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  // --- State for 8. Seasonal Cultivation Ledger & ROI Calculator ---
  const [seedCost, setSeedCost] = useState<number>(6500);
  const [fertilizerCost, setFertilizerCost] = useState<number>(14200);
  const [laborCost, setLaborCost] = useState<number>(18000);
  const [machineryCost, setMachineryCost] = useState<number>(8500);
  const [irrigationCost, setIrrigationCost] = useState<number>(4200);
  const [cropProtectionCost, setCropProtectionCost] = useState<number>(6800);
  const [expectedYieldQtl, setExpectedYieldQtl] = useState<number>(45);
  const [expectedPricePerQtl, setExpectedPricePerQtl] = useState<number>(4900);

  // Persist the current controls continuously so a route change or refresh can
  // recover the latest simulator inputs without waiting for a staged run.
  useEffect(() => {
    if (!activeId) return;
    saveSimulationDraft(activeId, {
      farmId: selectedFarmId || undefined,
      cropCycleId: selectedCropCycleId || undefined,
      bioBatchLiters, bioRecipe, cropSuggestionTimeframe,
      soilTaxonomyIdx, soilPh, nitrogen, phosphorus, potassium, organicCarbon, soilEc, targetCrop,
      selectedMoleculeId, sprayAcres, sprayMethod, canopyDensity,
      mainCrop, intercropOption, rowGeometry, sensorDepth, simulatedHour, selectedDayOffset,
      timeHorizon, referenceEt0, cropKc, soilTexture, dripFlowRateLph,
      seedCost, fertilizerCost, laborCost, machineryCost, irrigationCost, cropProtectionCost,
      expectedYieldQtl, expectedPricePerQtl,
    });
  }, [
    activeId, selectedFarmId, selectedCropCycleId, bioBatchLiters, bioRecipe, cropSuggestionTimeframe,
    soilTaxonomyIdx, soilPh, nitrogen, phosphorus,
    potassium, organicCarbon, soilEc, targetCrop, selectedMoleculeId, sprayAcres, sprayMethod,
    canopyDensity, mainCrop, intercropOption, rowGeometry, sensorDepth, simulatedHour,
    selectedDayOffset, timeHorizon, referenceEt0, cropKc, soilTexture, dripFlowRateLph,
    seedCost, fertilizerCost, laborCost, machineryCost, irrigationCost, cropProtectionCost,
    expectedYieldQtl, expectedPricePerQtl,
  ]);

  // Restore the last draft for this feature when it is opened again. Values
  // are validated before entering React state because localStorage is user-
  // editable and may contain an older draft shape.
  useEffect(() => {
    if (!activeId) return;
    const draft = loadSimulationDraft<Record<string, unknown>>(activeId);
    if (!draft) return;
    const numberValue = (key: string, setter: (value: number) => void) => {
      if (typeof draft[key] === 'number' && Number.isFinite(draft[key])) setter(draft[key] as number);
    };
    const stringValue = (key: string, setter: (value: string) => void) => {
      if (typeof draft[key] === 'string' && draft[key]) setter(draft[key] as string);
    };
    const booleanValue = (key: string, setter: (value: boolean) => void) => {
      if (typeof draft[key] === 'boolean') setter(draft[key] as boolean);
    };

    numberValue('bioBatchLiters', setBioBatchLiters);
    stringValue('bioRecipe', (value) => {
      if (value === 'nske' || value === 'dashparni' || value === 'jeevamrit') setBioRecipe(value);
    });
    stringValue('cropSuggestionTimeframe', (value) => {
      if (value === 'monthly' || value === 'quarterly' || value === 'yearly') setCropSuggestionTimeframe(value);
    });
    numberValue('soilTaxonomyIdx', setSoilTaxonomyIdx);
    numberValue('soilPh', setSoilPh);
    numberValue('nitrogen', setNitrogen);
    numberValue('phosphorus', setPhosphorus);
    numberValue('potassium', setPotassium);
    numberValue('organicCarbon', setOrganicCarbon);
    numberValue('soilEc', setSoilEc);
    stringValue('targetCrop', setTargetCrop);
    stringValue('selectedMoleculeId', setSelectedMoleculeId);
    numberValue('sprayAcres', setSprayAcres);
    stringValue('sprayMethod', (value) => {
      if (value === 'knapsack' || value === 'tractor_boom' || value === 'drone') setSprayMethod(value);
    });
    stringValue('canopyDensity', (value) => {
      if (value === 'light' || value === 'medium' || value === 'dense') setCanopyDensity(value);
    });
    stringValue('mainCrop', setMainCrop);
    stringValue('intercropOption', setIntercropOption);
    stringValue('rowGeometry', (value) => {
      if (['1_1_alt', '2_1_paired', '3_1_strip', '4_2_precision', 'perimeter_trap'].includes(value)) setRowGeometry(value as typeof rowGeometry);
    });
    stringValue('sensorDepth', (value) => {
      if (value === '15cm' || value === '30cm' || value === '60cm') setSensorDepth(value);
    });
    numberValue('simulatedHour', setSimulatedHour);
    numberValue('selectedDayOffset', setSelectedDayOffset);
    stringValue('timeHorizon', (value) => {
      if (value === 'monthly' || value === 'quarterly' || value === 'yearly') setTimeHorizon(value);
    });
    numberValue('referenceEt0', setReferenceEt0);
    numberValue('cropKc', setCropKc);
    stringValue('soilTexture', (value) => {
      if (value === 'clay' || value === 'loam' || value === 'sandy') setSoilTexture(value);
    });
    numberValue('dripFlowRateLph', setDripFlowRateLph);
    numberValue('seedCost', setSeedCost);
    numberValue('fertilizerCost', setFertilizerCost);
    numberValue('laborCost', setLaborCost);
    numberValue('machineryCost', setMachineryCost);
    numberValue('irrigationCost', setIrrigationCost);
    numberValue('cropProtectionCost', setCropProtectionCost);
    numberValue('expectedYieldQtl', setExpectedYieldQtl);
    numberValue('expectedPricePerQtl', setExpectedPricePerQtl);
    booleanValue('hasSimulated', setHasSimulated);
  }, [activeId]);

  // Synchronize ET0 reference when live weather updates
  useEffect(() => {
    if (weatherData && weatherData.et0) {
      setReferenceEt0(weatherData.et0);
    }
  }, [weatherData]);

  // Auto-calibrate agronomic simulators to live diagnosed pest and pathogen telemetry
  useEffect(() => {
    if (!activeDiagnosis) return;

    // 1. Bio-control formulation auto-selection
    const pestLower = (activeDiagnosis.pestName + ' ' + activeDiagnosis.scientificName).toLowerCase();
    const symptomsLower = activeDiagnosis.symptoms.join(' ').toLowerCase();
    if (
      pestLower.includes('blight') ||
      pestLower.includes('mildew') ||
      pestLower.includes('rust') ||
      pestLower.includes('wilt') ||
      pestLower.includes('rot') ||
      pestLower.includes('canker') ||
      symptomsLower.includes('fung') ||
      symptomsLower.includes('mycel')
    ) {
      setBioRecipe('jeevamrit');
    } else if (
      pestLower.includes('whitefly') ||
      pestLower.includes('aphid') ||
      pestLower.includes('thrip') ||
      pestLower.includes('hopper')
    ) {
      setBioRecipe('dashparni');
    } else {
      setBioRecipe('nske');
    }

    // 2. Pesticide dosage & crop auto-population
    if (activeDiagnosis.affectedCrop) {
      setTargetCrop(activeDiagnosis.affectedCrop);
    }
    const chemLower = activeDiagnosis.chemicalTreatment.join(' ').toLowerCase();
    if (chemLower.includes('chlorantraniliprole')) {
      setSelectedMoleculeId('chlorantraniliprole_18_5sc');
    } else if (chemLower.includes('spinetoram')) {
      setSelectedMoleculeId('spinetoram_11_7sc');
    } else if (chemLower.includes('imidacloprid')) {
      setSelectedMoleculeId('imidacloprid_17_8sl');
    } else if (chemLower.includes('mancozeb')) {
      setSelectedMoleculeId('mancozeb_75wp');
    } else {
      setSelectedMoleculeId('emamectin_5sg');
    }

    // Calibrate spray acreage based on quarantine perimeter and severity
    if (activeDiagnosis.severity === 'Critical') {
      setSprayAcres(5);
    } else if (activeDiagnosis.severity === 'Severe') {
      setSprayAcres(4);
    } else if (activeDiagnosis.severity === 'Moderate') {
      setSprayAcres(3);
    } else {
      setSprayAcres(2);
    }
  }, [activeDiagnosis]);

  // --- Dynamic 4-Stage Simulation Trigger Function ---
  const handleStartSimulation = () => {
    clearSimulationTimers();
    setIsSimulating(true);
    setSimulationProgress(15);

    let stage1 = 'Ingesting configured agronomic parameters & atmospheric telemetry...';
    let stage2 = 'Calculating physical kinetics, buffering matrices & mass balance...';
    let stage3 = 'Synthesizing ICAR / SAU Field Calibration Standards & bounds...';
    let stage4 = 'Finalizing verified agronomic outputs & economic returns...';

    if (activeId === 'soil-analysis' || activeId === 'soil-optimization') {
      stage1 = `Ingesting Soil pH ${soilPh}, N ${nitrogen} kg/ha, P ${phosphorus} kg/ha, K ${potassium} kg/ha for ${targetCrop}...`;
      stage2 = `Computing Cation Exchange Capacity & Orthophosphate Fixation in ${SOIL_TAXONOMY_DIRECTORY[soilTaxonomyIdx]?.name || 'soil'}...`;
      stage3 = `Calculating Gypsum / Lime conditioning & organic carbon humic buffer requirements...`;
      stage4 = `Synthesizing split fertigation schedule and yield optimization metrics...`;
    } else if (activeId === 'pesticide-dosage' || activeId === 'spray-dosage') {
      const curChem = PESTICIDE_CATALOG_16.find((c) => c.id === selectedMoleculeId) || PESTICIDE_CATALOG_16[0];
      stage1 = `Reading ${curChem.name} across ${sprayAcres} acres with ${sprayMethod.replace('_', ' ')} delivery...`;
      stage2 = `Calculating carrier water volume & droplet atomization hydraulics...`;
      stage3 = `Evaluating drift buffer with live wind telemetry (${weatherData.windSpeed} km/h)...`;
      stage4 = `Compiling exact tank aliquot dosing & nozzle pressure recommendations...`;
    } else if (activeId === 'crop-rotation' || activeId === 'companion-planting' || activeId === 'intercropping') {
      stage1 = `Pairing anchor crop ${mainCrop} with companion ${intercropOption} in ${rowGeometry.replace(/_/g, ' ')}...`;
      stage2 = `Calculating Land Equivalent Ratio (LER) & solar canopy interception...`;
      stage3 = `Estimating biological nitrogen fixation & biological pest trap scores...`;
      stage4 = `Compiling cost savings and seasonal companion synergy indices...`;
    } else if (activeId === 'sensor-integration' || activeId === 'weather-forecast') {
      stage1 = `Polling multi-depth capacitive probes at ${sensorDepth} depth & ambient microclimate...`;
      stage2 = `Simulating 24-hour diurnal solar radiation flux at hour ${simulatedHour}:00...`;
      stage3 = `Synthesizing Sentinel-2 multispectral NDVI red/NIR reflectance ratio...`;
      stage4 = `Verifying PMFBY satellite moisture indices and irrigation triggers...`;
    } else if (activeId === 'smart-irrigation' || activeId === 'water-budget') {
      stage1 = `Ingesting Reference ET₀ (${referenceEt0} mm/day) with crop factor Kc (${cropKc}) for ${soilTexture} soil...`;
      stage2 = `Calculating daily crop evapotranspiration demand (ETc)...`;
      stage3 = `Calibrating drip emitter discharge rate (${dripFlowRateLph} L/hr)...`;
      stage4 = `Finalizing exact daily run-time schedule & water savings ledger...`;
    } else if (activeId === 'cost-estimation' || activeId === 'market-trends' || activeId === 'farm-planning') {
      stage1 = `Ingesting seasonal expenses (Seeds, Labor, Fertilizers, Machinery, Irrigation, Protection)...`;
      stage2 = `Projecting harvest realization @ ${expectedYieldQtl} Qtl/Acre at ₹${expectedPricePerQtl.toLocaleString('en-IN')}/qtl...`;
      stage3 = `Calculating break-even threshold & gross profit margins...`;
      stage4 = `Compiling full seasonal cultivation ledger & financial ROI percentage...`;
    }

    setSimulationStage(stage1);

    const t1 = setTimeout(() => {
      setSimulationProgress(45);
      setSimulationStage(stage2);
    }, 350);

    const t2 = setTimeout(() => {
      setSimulationProgress(75);
      setSimulationStage(stage3);
    }, 700);

    const t3 = setTimeout(() => {
      setSimulationProgress(95);
      setSimulationStage(stage4);
    }, 1050);

    const t4 = setTimeout(() => {
      setSimulationProgress(100);
      setIsSimulating(false);
      setHasSimulated(true);

      const calcTotalCost = seedCost + fertilizerCost + laborCost + machineryCost + irrigationCost + cropProtectionCost;
      const calcTotalRevenue = expectedYieldQtl * expectedPricePerQtl;
      const calcNetProfit = calcTotalRevenue - calcTotalCost;
      const calcRoi = calcTotalCost > 0 ? (calcNetProfit / calcTotalCost) * 100 : 0;

      const activeSimPayload = {
        activeId,
        farmId: selectedFarmId,
        cropCycleId: selectedCropCycleId,
        farmName: selectedFarm?.name,
        crop: selectedCropCycle?.crop || selectedFarm?.primaryCrop || targetCrop,
        location: selectedFarm ? `${selectedFarm.village}, ${selectedFarm.district}, ${selectedFarm.state}` : weatherData.locationName,
        timeHorizon,
        soilPh, nitrogen, phosphorus, potassium, organicCarbon, soilEc, targetCrop,
        selectedMoleculeId, sprayAcres, sprayMethod, canopyDensity,
        mainCrop, intercropOption, rowGeometry,
        sensorDepth, simulatedHour, selectedDayOffset,
        referenceEt0, cropKc, soilTexture, dripFlowRateLph,
        seedCost, fertilizerCost, laborCost, machineryCost, irrigationCost, cropProtectionCost,
        expectedYieldQtl, expectedPricePerQtl,
        totalCost: calcTotalCost,
        totalRevenue: calcTotalRevenue,
        netProfit: calcNetProfit,
        roi: calcRoi,
        weatherSnapshot: {
          locationName: weatherData.locationName, temp: weatherData.temp, humidity: weatherData.humidity,
          windSpeed: weatherData.windSpeed, rainProb: weatherData.rainProb, et0: weatherData.et0, vpd: weatherData.vpd,
          leafWetness: weatherData.leafWetness,
        },
        diagnosisSnapshot: activeDiagnosis ? {
          pestName: activeDiagnosis.pestName, scientificName: activeDiagnosis.scientificName,
          severity: activeDiagnosis.severity, confidence: activeDiagnosis.confidence,
          affectedCrop: activeDiagnosis.affectedCrop, damagePercentage: activeDiagnosis.damagePercentage,
        } : null,
        marketSnapshot: marketData.slice(0, 8),
        timestamp: new Date().toISOString(),
      };

      if (activeId === 'soil-analysis' || activeId === 'soil-optimization') {
        void saveSoilAnalysis({
          taxonomy: SOIL_TAXONOMY_DIRECTORY[soilTaxonomyIdx]?.name,
          soilPh, phLevel: soilPh, nitrogen, phosphorus, potassium, organicCarbon, soilEc, targetCrop,
          recommendations: [
            `Balance N-P-K against ${targetCrop} demand and the selected soil taxonomy.`,
            soilPh > 7.5 ? 'Review alkaline-soil micronutrient availability, especially Zn and Fe.' : 'Maintain organic carbon and monitor root-zone moisture.',
            `Track EC (${soilEc} dS/m) before concentrated fertigation applications.`,
          ],
        }, { userId: undefined, farmId: selectedFarmId || undefined, cropCycleId: selectedCropCycleId || undefined, source: 'soil-analysis-simulator' });
      }

      const simulationModuleId = activeId;
      if (!simulationModuleId) return;

      void saveSimulationTelemetry({
        moduleId: simulationModuleId,
        moduleName: `${simulationModuleId.replace(/-/g, ' ')} — AgriSence Integrated Simulator`,
        timestamp: Date.now(),
        farmId: selectedFarmId || undefined,
        cropCycleId: selectedCropCycleId || undefined,
        parameters: activeSimPayload,
        calculatedMetrics: {
          totalCost: calcTotalCost, totalRevenue: calcTotalRevenue, netProfit: calcNetProfit, roi: calcRoi,
          weatherRisk: weatherData.rainProb > 50 || weatherData.windSpeed > 18 ? 'High' : weatherData.windSpeed > 12 ? 'Moderate' : 'Low',
          marketTopSpread: activeArbitrageTopSpread?.arbitrageSpread || 0,
        },
        suggestedPrompts: [
          `Explain this ${simulationModuleId} result for ${selectedCropCycle?.crop || selectedFarm?.primaryCrop || targetCrop}.`,
          `Cross-check the ${simulationModuleId} result against current weather and pest telemetry.`,
          `What field task should follow this ${simulationModuleId} simulation?`,
        ],
      });

      try {
        if (user?.id) localStorage.setItem(`agrisence_latest_simulator_run:${user.id}`, JSON.stringify(activeSimPayload));
        window.dispatchEvent(new Event('agrisence_simulator_updated'));
      } catch {
        // Ignore storage errors
      }
    }, 1400);

    simulationTimersRef.current = [t1, t2, t3, t4];
  };

  if (!isOpen || !activeId) return null;

  // ============================================================================
  // CATALOGS & STATIC DIRECTORIES
  // ============================================================================

  // Module 1: 8 Soil Taxonomies & 18 Crops
  const SOIL_TAXONOMY_DIRECTORY = [
    {
      id: 'alluvial_loam',
      name: 'Indo-Gangetic Alluvial Loam (Inceptisol / Entisol)',
      desc: 'Neutral to slightly alkaline (pH 7.0–7.8), moderate CEC, prone to Zinc/Iron fixation.',
      defaultPh: 7.4,
      defaultN: 140,
      defaultP: 22,
      defaultK: 260,
      defaultOc: 0.55,
      defaultEc: 0.8,
    },
    {
      id: 'deccan_vertisol',
      name: 'Deccan Vertisol (Deep Black Cotton Clay)',
      desc: 'Heavy montmorillonite clay (pH 7.8–8.5), high shrink-swell, low available P, high K.',
      defaultPh: 8.1,
      defaultN: 110,
      defaultP: 14,
      defaultK: 420,
      defaultOc: 0.62,
      defaultEc: 1.2,
    },
    {
      id: 'red_laterite',
      name: 'Red Laterite & Ferruginous Loam (Oxisol / Ultisol)',
      desc: 'Acidic (pH 4.8–6.2), iron and aluminum oxide rich, prone to heavy phosphate fixation.',
      defaultPh: 5.6,
      defaultN: 180,
      defaultP: 12,
      defaultK: 160,
      defaultOc: 0.45,
      defaultEc: 0.4,
    },
    {
      id: 'coastal_saline',
      name: 'Coastal Alluvial & Saline-Alkali Fluvents',
      desc: 'Elevated EC (>4.0 dS/m), high ESP (>15%), poor drainage, sodium displacement required.',
      defaultPh: 8.4,
      defaultN: 95,
      defaultP: 18,
      defaultK: 310,
      defaultOc: 0.38,
      defaultEc: 4.8,
    },
    {
      id: 'aridisol_desert',
      name: 'Aridisol & Sandy Calcareous Desert Loam (Thar/Kutch)',
      desc: 'Light sandy texture, high free CaCO3, rapid percolation, low organic carbon (<0.3%).',
      defaultPh: 8.3,
      defaultN: 70,
      defaultP: 16,
      defaultK: 210,
      defaultOc: 0.22,
      defaultEc: 1.5,
    },
    {
      id: 'himalayan_humus',
      name: 'Sub-Himalayan Acidic Forest Humus',
      desc: 'Rich in organic humus (pH 5.0–5.8), high organic N reserve, slow winter mineralization.',
      defaultPh: 5.4,
      defaultN: 290,
      defaultP: 28,
      defaultK: 240,
      defaultOc: 1.45,
      defaultEc: 0.3,
    },
    {
      id: 'terai_silt',
      name: 'Terai Tarai Hydromorphic Humid Silt',
      desc: 'High seasonal water table, neutral-to-acidic, manganese/zinc disparity.',
      defaultPh: 6.4,
      defaultN: 160,
      defaultP: 26,
      defaultK: 280,
      defaultOc: 0.75,
      defaultEc: 0.6,
    },
    {
      id: 'shallow_regur',
      name: 'Shallow Basaltic Regur Loam',
      desc: 'Degraded trap ridges, shallow depth (<30 cm), rapid drying profile, moderate base saturation.',
      defaultPh: 7.7,
      defaultN: 125,
      defaultP: 18,
      defaultK: 340,
      defaultOc: 0.48,
      defaultEc: 0.7,
    },
  ];

  const TARGET_CROPS_18 = [
    'Bt Cotton',
    'Soybean',
    'Sharbati Wheat',
    'Paddy (Basmati)',
    'Hybrid Maize',
    'Sugarcane',
    'Chana (Chickpea)',
    'Tur (Arhar)',
    'Mustard',
    'Groundnut',
    'Red Onion',
    'Potato',
    'Tomato',
    'Green Chilli',
    'Pomegranate',
    'Custard Apple',
    'Mango',
    'Cumin (Jeera)',
  ];

  // Module 2: 16 Registered Agrochemical Molecules
  const PESTICIDE_CATALOG_16 = [
    // Lepidopteran & Borers (5)
    { id: 'emamectin_5sg', name: 'Emamectin Benzoate 5% SG', class: 'Lepidopteran & Borer Specialist', knapsackDoseTank: '6.5 g', droneDoseAcre: '40 g', tractorDoseTank: '65 g', perTankUnitVal: 6.5, perAcreDroneVal: 40, unit: 'g', target: 'Helicoverpa Bollworms, Spodoptera, Diamondback Moth' },
    { id: 'chlorantraniliprole_18_5sc', name: 'Chlorantraniliprole 18.5% SC (Coragen)', class: 'Lepidopteran & Borer Specialist', knapsackDoseTank: '6 ml', droneDoseAcre: '30 ml', tractorDoseTank: '60 ml', perTankUnitVal: 6.0, perAcreDroneVal: 30, unit: 'ml', target: 'Stem Borer, Leaf Folder, Pod Borer' },
    { id: 'spinetoram_11_7sc', name: 'Spinetoram 11.7% SC (Delegate)', class: 'Lepidopteran & Borer Specialist', knapsackDoseTank: '12 ml', droneDoseAcre: '60 ml', tractorDoseTank: '120 ml', perTankUnitVal: 12.0, perAcreDroneVal: 60, unit: 'ml', target: 'Thrips & Fruit Borer Complex' },
    { id: 'flubendiamide_39_35sc', name: 'Flubendiamide 39.35% SC (Fame)', class: 'Lepidopteran & Borer Specialist', knapsackDoseTank: '5 ml', droneDoseAcre: '25 ml', tractorDoseTank: '50 ml', perTankUnitVal: 5.0, perAcreDroneVal: 25, unit: 'ml', target: 'Defoliating Caterpillars & Pod Borers' },
    { id: 'novaluron_10ec', name: 'Novaluron 10% EC (Rimon)', class: 'Lepidopteran & Borer Specialist', knapsackDoseTank: '20 ml', droneDoseAcre: '100 ml', tractorDoseTank: '200 ml', perTankUnitVal: 20.0, perAcreDroneVal: 100, unit: 'ml', target: 'Chitin Synthesis Inhibitor for Caterpillars' },

    // Sucking Pest Complex (5)
    { id: 'imidacloprid_17_8sl', name: 'Imidacloprid 17.8% SL (Confidor)', class: 'Sucking Pest Complex', knapsackDoseTank: '5 ml', droneDoseAcre: '30 ml', tractorDoseTank: '50 ml', perTankUnitVal: 5.0, perAcreDroneVal: 30, unit: 'ml', target: 'Aphids, Jassids, Leafhoppers, Termites' },
    { id: 'thiamethoxam_25wdg', name: 'Thiamethoxam 25% WDG (Actara)', class: 'Sucking Pest Complex', knapsackDoseTank: '8 g', droneDoseAcre: '40 g', tractorDoseTank: '80 g', perTankUnitVal: 8.0, perAcreDroneVal: 40, unit: 'g', target: 'Whiteflies, Jassids, Mosquito Bugs' },
    { id: 'acetamiprid_20sp', name: 'Acetamiprid 20% SP (Pride)', class: 'Sucking Pest Complex', knapsackDoseTank: '6 g', droneDoseAcre: '35 g', tractorDoseTank: '60 g', perTankUnitVal: 6.0, perAcreDroneVal: 35, unit: 'g', target: 'Aphids, Whiteflies, Severe Thrips' },
    { id: 'diafenthiuron_50wp', name: 'Diafenthiuron 50% WP (Pegasus)', class: 'Sucking Pest Complex', knapsackDoseTank: '25 g', droneDoseAcre: '120 g', tractorDoseTank: '250 g', perTankUnitVal: 25.0, perAcreDroneVal: 120, unit: 'g', target: 'Mites, Whitefly Nymphs & Resistant Thrips' },
    { id: 'spiromesifen_22_9sc', name: 'Spiromesifen 22.9% SC (Oberon)', class: 'Sucking Pest Complex', knapsackDoseTank: '15 ml', droneDoseAcre: '80 ml', tractorDoseTank: '150 ml', perTankUnitVal: 15.0, perAcreDroneVal: 80, unit: 'ml', target: 'Red Spider Mites, Yellow Mites, Whitefly Eggs' },

    // Fungicides (6)
    { id: 'azoxy_difenoconazole', name: 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC', class: 'Broad Spectrum & Systemic Fungicide', knapsackDoseTank: '15 ml', droneDoseAcre: '80 ml', tractorDoseTank: '150 ml', perTankUnitVal: 15.0, perAcreDroneVal: 80, unit: 'ml', target: 'Sheath Blight, Blast, Anthracnose, Powdery Mildew' },
    { id: 'tebuconazole_25_9ec', name: 'Tebuconazole 25.9% EC (Folicur)', class: 'Broad Spectrum & Systemic Fungicide', knapsackDoseTank: '18 ml', droneDoseAcre: '90 ml', tractorDoseTank: '180 ml', perTankUnitVal: 18.0, perAcreDroneVal: 90, unit: 'ml', target: 'Yellow Rust, Leaf Spots, Tikka Disease' },
    { id: 'mancozeb_75wp', name: 'Mancozeb 75% WP (Dithane M-45)', class: 'Broad Spectrum & Systemic Fungicide', knapsackDoseTank: '35 g', droneDoseAcre: '200 g', tractorDoseTank: '350 g', perTankUnitVal: 35.0, perAcreDroneVal: 200, unit: 'g', target: 'Early Blight, Late Blight, Downy Mildew' },
    { id: 'copper_oxychloride_50wp', name: 'Copper Oxychloride 50% WP (Blitox)', class: 'Broad Spectrum & Systemic Fungicide', knapsackDoseTank: '40 g', droneDoseAcre: '250 g', tractorDoseTank: '400 g', perTankUnitVal: 40.0, perAcreDroneVal: 250, unit: 'g', target: 'Bacterial Blight, Canker, Collar Rot' },
    { id: 'saaf_carbendazim_mancozeb', name: 'Carbendazim 12% + Mancozeb 63% WP (Saaf)', class: 'Broad Spectrum & Systemic Fungicide', knapsackDoseTank: '30 g', droneDoseAcre: '180 g', tractorDoseTank: '300 g', perTankUnitVal: 30.0, perAcreDroneVal: 180, unit: 'g', target: 'Seedling Damping-Off, Anthracnose, Black Scurf' },
    { id: 'hexaconazole_5sc', name: 'Hexaconazole 5% SC (Contaf Plus)', class: 'Broad Spectrum & Systemic Fungicide', knapsackDoseTank: '20 ml', droneDoseAcre: '100 ml', tractorDoseTank: '200 ml', perTankUnitVal: 20.0, perAcreDroneVal: 100, unit: 'ml', target: 'Powdery Mildew, Rust, Sheath Blight' },
  ];

  // Module 3: 10 Anchors & 12 Companions & 5 Geometries
  const ANCHOR_CROPS_10 = [
    'Bt Cotton (Kapas)',
    'Yellow Soybean',
    'Pigeonpea (Tur)',
    'Hybrid Maize / Corn',
    'Sugarcane (Main Crop)',
    'Groundnut (Peanut)',
    'Wheat (Rabi Season)',
    'Mustard / Rapeseed',
    'Pearl Millet (Bajra)',
    'Sorghum (Jowar)',
  ];

  const COMPANIONS_12 = [
    { name: 'Pigeonpea / Red Gram (Tur)', lerBonus: 0.38, nFixKg: 32, trapScore: 85, desc: 'Deep taproot, biological N-fixation (+32 kg N/ha), non-competitive root architecture.' },
    { name: 'African Marigold (Tagetes erecta)', lerBonus: 0.28, nFixKg: 0, trapScore: 94, desc: 'Nematode suppression via α-terthienyl root exudates, decoy oviposition trap for Helicoverpa.' },
    { name: 'Cowpea (Lobia)', lerBonus: 0.35, nFixKg: 28, trapScore: 88, desc: 'Living mulch groundcover, suppresses weed germination by 70%, biological N-fixation.' },
    { name: 'Chickpea / Bengal Gram', lerBonus: 0.32, nFixKg: 26, trapScore: 78, desc: 'Winter legume partner, phosphorus solubilizing root exudates.' },
    { name: 'Black Gram (Urad) / Green Gram (Moong)', lerBonus: 0.34, nFixKg: 30, trapScore: 80, desc: '60-day short lifecycle, completes prior to main canopy closure.' },
    { name: 'Sesame (Til)', lerBonus: 0.25, nFixKg: 0, trapScore: 82, desc: 'Parasitic wasp nectar attractor, boundary wind and spore barrier.' },
    { name: 'Coriander (Dhaniya)', lerBonus: 0.22, nFixKg: 0, trapScore: 90, desc: 'Attracts predatory syrphid flies and ladybird beetles against sucking pests.' },
    { name: 'Castor (Ricinus communis)', lerBonus: 0.20, nFixKg: 0, trapScore: 96, desc: 'Decoy oviposition trap for Spodoptera litura egg clusters.' },
    { name: 'Lucerne / Alfalfa', lerBonus: 0.30, nFixKg: 40, trapScore: 75, desc: 'Perennial fodder biomass, deep subsoil potassium pump.' },
    { name: 'Radish / Mustard', lerBonus: 0.24, nFixKg: 0, trapScore: 86, desc: 'Bio-fumigant partner releasing soil glucosinolates.' },
    { name: 'French Bean', lerBonus: 0.33, nFixKg: 24, trapScore: 76, desc: 'High-value spatial companion for wide-row orchards.' },
    { name: 'Sunn Hemp (Crotalaria juncea)', lerBonus: 0.36, nFixKg: 42, trapScore: 92, desc: 'Green manure biomass, root-knot nematode interceptor.' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/50 dark:bg-black/75 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative w-full max-w-5xl rounded-[32px] frosted-card border border-white/80 dark:border-white/12 p-5 sm:p-7 shadow-[0_16px_48px_-4px_var(--brand-glow)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl backdrop-saturate-190 z-10 space-y-5 max-h-[92vh] overflow-y-auto text-slate-950 dark:text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
                  Live Algorithmic Engine
                </span>
                <span className="text-xs font-semibold text-slate-500">ICAR & SAU Standards</span>
              </div>
              <h3 className="text-lg font-black tracking-tight text-slate-950 dark:text-white capitalize mt-1">
                {activeId.replace(/-/g, ' ')} {t('sim.modalTitle', 'Simulator')}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full frosted-glass-sub hover:bg-white/80 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dynamic 4-Stage Simulation Progress Bar */}
          {/* Cross-platform synchronized field context: same source of truth for every simulator. */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/8 dark:bg-emerald-950/30 border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[var(--brand-text,#0d7342)]">
                <Radio className="size-3.5" /> Connected Field Intelligence
              </div>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-900/70 border border-emerald-500/20">SYNCED</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-[10px]">
              <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-white/60 dark:border-white/10"><span className="block text-slate-500">Farm</span><strong className="block truncate">{selectedFarm?.name || 'No farm'}</strong></div>
              <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-white/60 dark:border-white/10"><span className="block text-slate-500">Crop Cycle</span><strong className="block truncate">{selectedCropCycle?.crop || selectedFarm?.primaryCrop || 'Not set'}</strong></div>
              <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-white/60 dark:border-white/10"><span className="block text-slate-500">Weather</span><strong>{weatherData.temp}°C · {weatherData.humidity}% RH</strong></div>
              <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-white/60 dark:border-white/10"><span className="block text-slate-500">Spray</span><strong>{weatherData.windSpeed} km/h · {sprayStatusForNow}</strong></div>
              <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-white/60 dark:border-white/10"><span className="block text-slate-500">Diagnosis</span><strong className="block truncate">{activeDiagnosis?.pestName || 'None active'}</strong></div>
              <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-white/60 dark:border-white/10"><span className="block text-slate-500">Last Run</span><strong>{latestSimulation?.moduleId ? latestSimulation.moduleId.replace(/-/g, ' ') : 'None yet'}</strong></div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-slate-600 dark:text-slate-400 font-semibold">
              <span>ET₀ {weatherData.et0} mm/day</span><span>VPD {weatherData.vpd} kPa</span><span>Rain {weatherData.rainProb}%</span><span>Market spread ₹{(activeArbitrageTopSpread?.arbitrageSpread || 0).toLocaleString('en-IN')}/qtl</span>
              <span>{marketData.length} market observations loaded</span>
            </div>
          </div>

          <ActiveParcelSelector className="pt-1" />

          {isSimulating && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white border border-emerald-500/30 space-y-2.5 shadow-lg animate-pulse">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <Sparkles className="size-3.5 animate-spin" />
                  <span>{simulationStage}</span>
                </span>
                <span className="font-mono text-emerald-400">{simulationProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                  style={{ width: `${simulationProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 1. BIO-CONTROL LAB (FULL COMPONENT SIMULATOR)                   */}
          {/* ============================================================== */}
          {activeId === 'bio-control' && (
            <div className="space-y-4">
              <BioControlSimulator
                onClose={onClose}
                onOpenShop={(cat) => {
                  setShopCategory(cat || 'crop_protection');
                  setKisanShopOpen(true);
                }}
              />
            </div>
          )}

          {/* ============================================================== */}
          {/* 2. PESTICIDE & SPRAY DOSAGE CALIBRATOR (16 ACTIVE FORMULATIONS) */}
          {/* ============================================================== */}
          {activeId === 'pesticide-dosage' && (() => {
            const curChem = PESTICIDE_CATALOG_16.find((c) => c.id === selectedMoleculeId) || PESTICIDE_CATALOG_16[0];

            // Volumetric Hydraulics based on equipment
            const canopyMultiplier = canopyDensity === 'light' ? 0.85 : canopyDensity === 'dense' ? 1.25 : 1.0;
            const carrierWaterPerAcre =
              sprayMethod === 'knapsack'
                ? Math.round(160 * canopyMultiplier)
                : sprayMethod === 'tractor_boom'
                ? Math.round(200 * canopyMultiplier)
                : Math.round(10 * canopyMultiplier);

            const totalWaterVolumeLiters = Math.round(sprayAcres * carrierWaterPerAcre);
            const tankCapacity = sprayMethod === 'knapsack' ? 16 : sprayMethod === 'tractor_boom' ? 400 : 10;
            const tanksRequired = Math.ceil(totalWaterVolumeLiters / tankCapacity);

            // Active Chemical Aliquot Mass Balance
            const dosePerTankText =
              sprayMethod === 'knapsack'
                ? `${curChem.perTankUnitVal} ${curChem.unit}`
                : sprayMethod === 'tractor_boom'
                ? `${(curChem.perTankUnitVal * 25).toFixed(0)} ${curChem.unit}`
                : `${curChem.perAcreDroneVal} ${curChem.unit} / tank`;

            const totalChemicalRequired =
              sprayMethod === 'drone'
                ? `${(curChem.perAcreDroneVal * sprayAcres).toFixed(0)} ${curChem.unit}`
                : `${(curChem.perTankUnitVal * tanksRequired).toFixed(0)} ${curChem.unit}`;

            const isHighWindAlert = (weatherData?.windSpeed || 10) > 12;
            const costSavedPerAcre = Math.round(sprayAcres * 380);

            return (
              <div className="space-y-4 text-xs">
                {/* Header & Wind Telemetry Alert */}
                <div
                  className={`p-4 rounded-2xl border ${
                    isHighWindAlert ? 'bg-amber-500/15 border-amber-500/30' : 'bg-emerald-500/15 border-emerald-500/25'
                  } space-y-1.5`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-black text-sm text-slate-950 dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="size-4 text-[var(--brand-color,#0f9a58)]" />
                      <span>Pesticide & Spray Dosage Calibrator (16 Registered Formulations)</span>
                    </h4>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-800 border border-slate-300 dark:border-white/10 text-slate-750 dark:text-slate-300">
                      Live Wind: {weatherData.windSpeed} km/h
                    </span>
                  </div>
                  {isHighWindAlert && (
                    <div className="text-amber-900 dark:text-amber-200 font-bold flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      <span>High Wind Drift Hazard (&gt;12 km/h). Use coarse droplet nozzles or wait for morning/dusk calm.</span>
                    </div>
                  )}
                </div>

                {/* 3 Delivery Equipment Systems */}
                <div className="grid grid-cols-1 sm:grid-cols-3 p-1 rounded-2xl frosted-glass-sub border border-white/60 gap-1 font-black">
                  <button
                    type="button"
                    onClick={() => setSprayMethod('knapsack')}
                    className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center ${
                      sprayMethod === 'knapsack'
                        ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs'
                        : 'text-slate-750 dark:text-slate-300 hover:bg-slate-200/60'
                    }`}
                  >
                    <span className="block text-xs">Knapsack Sprayer (16L)</span>
                    <span className="text-[9px] opacity-80 block">160 L/Acre • 2.5–3.0 bar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSprayMethod('tractor_boom')}
                    className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center ${
                      sprayMethod === 'tractor_boom'
                        ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs'
                        : 'text-slate-750 dark:text-slate-300 hover:bg-slate-200/60'
                    }`}
                  >
                    <span className="block text-xs">Tractor Boom (400L)</span>
                    <span className="text-[9px] opacity-80 block">200 L/Acre • Flat Fan 11002</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSprayMethod('drone')}
                    className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center ${
                      sprayMethod === 'drone'
                        ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs'
                        : 'text-slate-750 dark:text-slate-300 hover:bg-slate-200/60'
                    }`}
                  >
                    <span className="block text-xs">Agri UAV Drone (10L ULV)</span>
                    <span className="text-[9px] opacity-80 block">10 L/Acre • Rotary Atomizer</span>
                  </button>
                </div>

                {/* Molecule Selector & Canopy Density */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2 p-3 rounded-xl frosted-glass-sub border border-white/60 space-y-1">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">
                      Active Molecule (16 Registered Formulations):
                    </span>
                    <select
                      value={selectedMoleculeId}
                      onChange={(e) => setSelectedMoleculeId(e.target.value)}
                      className="w-full text-xs font-black bg-transparent text-slate-900 dark:text-white focus:outline-none py-1"
                    >
                      <optgroup label="Lepidopteran & Borer Specialists">
                        {PESTICIDE_CATALOG_16.filter((c) => c.class.includes('Lepidopteran')).map((c) => (
                          <option key={`lep-${c.id}`} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Sucking Pest Complex">
                        {PESTICIDE_CATALOG_16.filter((c) => c.class.includes('Sucking')).map((c) => (
                          <option key={`suck-${c.id}`} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Broad Spectrum & Systemic Fungicides">
                        {PESTICIDE_CATALOG_16.filter((c) => c.class.includes('Fungicide')).map((c) => (
                          <option key={`fung-${c.id}`} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <span className="text-[9px] text-slate-500 block">
                      Target Spectrum: <strong>{curChem.target}</strong>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl frosted-glass-sub border border-white/60 space-y-1">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">Canopy Density:</span>
                    <select
                      value={canopyDensity}
                      onChange={(e) => setCanopyDensity(e.target.value as any)}
                      className="w-full text-xs font-black bg-transparent text-slate-900 dark:text-white focus:outline-none py-1"
                    >
                      <option value="light">Light (Seedling / Early)</option>
                      <option value="medium">Medium (Vegetative)</option>
                      <option value="dense">Dense Multi-Tier (Bloom/Fruit)</option>
                    </select>
                  </div>
                </div>

                {/* Acreage Slider */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Cultivated Area:</span>
                    <span className="text-[var(--brand-color,#0f9a58)] font-black text-xs">{sprayAcres} Acres</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="50"
                    step="0.5"
                    value={sprayAcres}
                    onChange={(e) => setSprayAcres(Number(e.target.value))}
                    className="w-full accent-[var(--brand-color,#0f9a58)]"
                  />
                </div>

                {/* Dynamic Computed Outputs / Pending Preview */}
                <div className="p-4 rounded-2xl frosted-card border border-white/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Hydraulic Delivery & Chemical Aliquot Metrics
                    </span>
                    {hasSimulated ? (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        ✓ Calibrated Output
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500">
                        Click "Start Simulator" for verified calculation
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-3 rounded-xl frosted-glass-sub border border-white/60">
                      <span className="text-slate-500 text-[10px] block uppercase font-bold">Total Carrier Water</span>
                      <span className="text-base font-black text-sky-600">{totalWaterVolumeLiters} Liters</span>
                    </div>
                    <div className="p-3 rounded-xl frosted-glass-sub border border-white/60">
                      <span className="text-slate-500 text-[10px] block uppercase font-bold">Tanks Required</span>
                      <span className="text-base font-black text-slate-900 dark:text-white">{tanksRequired} Tanks</span>
                    </div>
                    <div className="p-3 rounded-xl frosted-glass-sub border border-white/60">
                      <span className="text-slate-500 text-[10px] block uppercase font-bold">Dose Per Tank</span>
                      <span className="text-base font-black text-[var(--brand-color,#0f9a58)]">{dosePerTankText}</span>
                    </div>
                    <div className="p-3 rounded-xl frosted-glass-sub border border-white/60">
                      <span className="text-slate-500 text-[10px] block uppercase font-bold">Total Chemical</span>
                      <span className="text-base font-black text-amber-600">{totalChemicalRequired}</span>
                    </div>
                  </div>

                  {/* Delivery Nozzle Specification & Savings */}
                  <div className="p-3 rounded-xl frosted-glass-sub border border-white/60 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <span className="text-slate-700 dark:text-slate-300">
                      Nozzle Specification:{' '}
                      <strong>
                        {sprayMethod === 'knapsack'
                          ? 'Hollow Cone (0.45 L/min @ 2.5-3.0 bar)'
                          : sprayMethod === 'tractor_boom'
                          ? 'Extended Range Flat Fan TeeJet 11002 (3.0-4.0 bar)'
                          : 'Centrifugal Rotary Atomizer (130–180 µm @ 1.8-2.2 bar)'}
                      </strong>
                    </span>
                    <span className="font-black text-emerald-800 dark:text-emerald-300">
                      Eliminating Overdose Saves: ₹{costSavedPerAcre.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Direct Equipment Purchase */}
                <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200 dark:border-white/10">
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                    Need safety PPE kits, measuring cylinders, or spray nozzles?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShopCategory('machinery');
                      setShopQuery('PPE kit sprayer nozzle');
                      setKisanShopOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ShoppingCart className="size-3.5" />
                    <span>Procure PPE & Sprayers</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* 3. SOIL CHEMISTRY & OPTIMIZATION (8 TAXONOMIES & 6 SLIDERS)    */}
          {/* ============================================================== */}
          {(activeId === 'soil-analysis' || activeId === 'soil-optimization') && (() => {
            const curSoil = SOIL_TAXONOMY_DIRECTORY[soilTaxonomyIdx] || SOIL_TAXONOMY_DIRECTORY[0];

            // Real-time Physics & Chemical Calculations
            const pFixationRisk = soilPh > 7.8 ? 'High (Calcium Phosphate Binding)' : soilPh < 6.2 ? 'High (Iron/Aluminum Phosphate Binding)' : 'Low (Optimal Available Orthophosphate)';
            const cecEstimate = (soilPh * 2.2 + organicCarbon * 12.5).toFixed(1);
            const gypsumKgAcre = soilPh > 7.8 ? Math.round((soilPh - 7.8) * 380) : 0;
            const limeKgAcre = soilPh < 6.2 ? Math.round((6.2 - soilPh) * 320) : 0;
            const sulfurKgAcre = soilPh > 8.0 ? 6 : 0;
            const zincNeed = nitrogen < 140 || soilTaxonomyIdx === 0;

            return (
              <div className="space-y-4 text-xs">
                {/* Taxonomy Banner */}
                <div className="p-4 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] border border-[var(--brand-border)] space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-black text-sm text-[var(--brand-text,#0d7342)] flex items-center gap-1.5">
                      <Layers className="size-4 text-[var(--brand-color,#0f9a58)]" />
                      <span>Pan-India Soil Taxonomy & Multi-Nutrient Engine</span>
                    </h4>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[var(--brand-color,#0f9a58)] text-white">
                      8 Agro-Climatic Taxonomies
                    </span>
                  </div>

                  <div className="space-y-1">
                    <select
                      value={soilTaxonomyIdx}
                      onChange={(e) => {
                        const idx = Number(e.target.value);
                        setSoilTaxonomyIdx(idx);
                        setSoilPh(SOIL_TAXONOMY_DIRECTORY[idx].defaultPh);
                        setNitrogen(SOIL_TAXONOMY_DIRECTORY[idx].defaultN);
                        setPhosphorus(SOIL_TAXONOMY_DIRECTORY[idx].defaultP);
                        setPotassium(SOIL_TAXONOMY_DIRECTORY[idx].defaultK);
                        setOrganicCarbon(SOIL_TAXONOMY_DIRECTORY[idx].defaultOc);
                        setSoilEc(SOIL_TAXONOMY_DIRECTORY[idx].defaultEc);
                      }}
                      className="w-full p-2 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-300 dark:border-white/15 font-black text-slate-950 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/50"
                    >
                      {SOIL_TAXONOMY_DIRECTORY.map((s, idx) => (
                        <option key={idx} value={idx}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-650 dark:text-slate-300 font-medium">{curSoil.desc}</p>
                  </div>
                </div>

                {/* 6 Analytical Sliders Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {/* pH Reaction Gauge */}
                  <div className="p-2.5 rounded-xl frosted-glass-sub border border-white/60 space-y-0.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-500">pH Reaction:</span>
                      <span
                        className={`font-black ${
                          soilPh < 6.2 ? 'text-rose-600' : soilPh > 7.8 ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {soilPh} ({soilPh < 6.2 ? 'Strongly Acidic' : soilPh > 7.8 ? 'Strongly Alkaline/Sodic' : 'Neutral Buffer'})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="4.5"
                      max="9.5"
                      step="0.1"
                      value={soilPh}
                      onChange={(e) => setSoilPh(Number(e.target.value))}
                      className="w-full accent-[var(--brand-color,#0f9a58)]"
                    />
                  </div>

                  {/* Available Nitrogen (N) */}
                  <div className="p-2.5 rounded-xl frosted-glass-sub border border-white/60 space-y-0.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-500">Avail. Nitrogen:</span>
                      <span className="font-black text-slate-900 dark:text-white">
                        {nitrogen} kg/ha ({nitrogen < 120 ? 'Low' : nitrogen > 280 ? 'High' : 'Medium'})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="450"
                      step="5"
                      value={nitrogen}
                      onChange={(e) => setNitrogen(Number(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>

                  {/* Available Phosphorus (P2O5) */}
                  <div className="p-2.5 rounded-xl frosted-glass-sub border border-white/60 space-y-0.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-500">Avail. P₂O₅:</span>
                      <span className="font-black text-teal-600">
                        {phosphorus} kg/ha ({phosphorus < 15 ? 'Deficit' : phosphorus > 40 ? 'Optimal' : 'Medium'})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="90"
                      step="1"
                      value={phosphorus}
                      onChange={(e) => setPhosphorus(Number(e.target.value))}
                      className="w-full accent-teal-500"
                    />
                  </div>

                  {/* Available Potash (K2O) */}
                  <div className="p-2.5 rounded-xl frosted-glass-sub border border-white/60 space-y-0.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-500">Avail. K₂O:</span>
                      <span className="font-black text-indigo-600">
                        {potassium} kg/ha ({potassium < 140 ? 'Deficit' : potassium > 350 ? 'High' : 'Medium'})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="80"
                      max="600"
                      step="10"
                      value={potassium}
                      onChange={(e) => setPotassium(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  {/* Organic Carbon (OC %) */}
                  <div className="p-2.5 rounded-xl frosted-glass-sub border border-white/60 space-y-0.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-500">Organic Carbon:</span>
                      <span className="font-black text-amber-600">
                        {organicCarbon}% OC ({organicCarbon < 0.5 ? 'Low <0.5%' : organicCarbon > 1.0 ? 'High' : 'Medium'})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.10"
                      max="1.80"
                      step="0.05"
                      value={organicCarbon}
                      onChange={(e) => setOrganicCarbon(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  {/* Soil Electrical Conductivity (EC) */}
                  <div className="p-2.5 rounded-xl frosted-glass-sub border border-white/60 space-y-0.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-500">Salinity (EC):</span>
                      <span className={`font-black ${soilEc > 2.0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                        {soilEc} dS/m ({soilEc > 2.0 ? 'Saline Hazard' : 'Normal <1.0'})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="8.0"
                      step="0.1"
                      value={soilEc}
                      onChange={(e) => setSoilEc(Number(e.target.value))}
                      className="w-full accent-slate-500"
                    />
                  </div>
                </div>

                {/* Target Crop Selector (18 Profiles) */}
                <div className="p-3 rounded-xl frosted-glass-sub border border-white/60 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Target Crop Profile (18 Species):</span>
                  <select
                    value={targetCrop}
                    onChange={(e) => setTargetCrop(e.target.value)}
                    className="p-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 font-black text-xs text-slate-950 dark:text-white"
                  >
                    {TARGET_CROPS_18.map((crop) => (
                      <option key={crop} value={crop}>
                        {crop}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4-Step Simulation Engine & Split Fertigation Card */}
                <div className="p-4 rounded-2xl frosted-card border border-white/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black uppercase tracking-wider text-[11px] text-slate-750 dark:text-slate-300 block">
                      Chemical Buffering, CEC & Split Fertigation Dosage
                    </span>
                    {hasSimulated ? (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        ✓ CEC & Soil Matrix Computed
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500">
                        Pending Simulation Run
                      </span>
                    )}
                  </div>

                  {/* Physics Steps 1 & 2 Summary */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5">
                    <div>
                      <span className="text-slate-500 block">Step 1: P-Fixation Buffer</span>
                      <span className="text-slate-900 dark:text-slate-100">{pFixationRisk}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Step 2: Effective CEC</span>
                      <span className="text-[var(--brand-color,#0f9a58)]">{cecEstimate} cmol(+)/kg (Base Saturation 82%)</span>
                    </div>
                  </div>

                  {/* Step 3: Exact Split Fertigation Dosage */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl frosted-glass-sub border border-white/50">
                      <span className="font-black text-[var(--brand-color,#0f9a58)] block">Step 3A: Basal Sowing Split:</span>
                      <p className="text-slate-700 dark:text-slate-300 mt-1 text-[11px]">
                        Apply 50% N (DAP/Urea) + 100% P₂O₅ (SSP 50 kg/acre) + 100% K₂O (MOP 25 kg/acre) + {zincNeed ? 'Zinc Sulfate 21% @ 10 kg/acre' : 'Chelated Zn'}.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl frosted-glass-sub border border-white/50">
                      <span className="font-black text-sky-600 block">Step 3B: Top-Dressing & Foliar Splits:</span>
                      <p className="text-slate-700 dark:text-slate-300 mt-1 text-[11px]">
                        Split remaining 50% N at 30 & 60 DAS (Urea 25 kg/acre) + 19:19:19 WSF @ 5 g/L foliar pre-bloom.
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Soil Conditioning Amendments */}
                  <div className="space-y-1.5 pt-1">
                    <span className="font-black text-[10px] text-slate-500 uppercase tracking-wider block">
                      Step 4: Soil Conditioning Amendments (Per Acre):
                    </span>
                    {gypsumKgAcre > 0 && (
                      <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-[11px] font-bold text-amber-900 dark:text-amber-200">
                        Sodic Reclamation: Apply Agricultural Gypsum (CaSO₄·2H₂O) @ <strong>{gypsumKgAcre} kg/acre</strong> {sulfurKgAcre > 0 ? '+ Elemental Sulphur 90% WDG @ 5 kg/acre' : ''}.
                      </div>
                    )}
                    {limeKgAcre > 0 && (
                      <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/25 text-[11px] font-bold text-sky-900 dark:text-sky-200">
                        Acid Neutralization: Apply Agricultural Dolomitic Lime (CaCO₃+MgCO₃) @ <strong>{limeKgAcre} kg/acre</strong> to unlock fixed phosphate.
                      </div>
                    )}
                    {organicCarbon < 0.5 && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
                        Organic Carbon Deficit (&lt;0.5%): Apply Humic/Fulvic Conditioner @ <strong>2 kg/acre</strong> to boost Cation Exchange Capacity.
                      </div>
                    )}
                    {gypsumKgAcre === 0 && limeKgAcre === 0 && organicCarbon >= 0.5 && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
                        ✓ Balanced Soil Chemistry: No heavy lime/gypsum amendments required. Maintain crop rotation.
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Procurement Action */}
                <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200 dark:border-white/10">
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                    Order customized WSF, Nano DAP, Gypsum, or Lime directly:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShopCategory('fertilizers');
                      setShopQuery(targetCrop);
                      setKisanShopOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ShoppingCart className="size-3.5" />
                    <span>Order Soil Inputs on Kisan Shop</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* 4. INTERCROPPING SYNERGY & COMPANION MATRICES (10 x 12 x 5)    */}
          {/* ============================================================== */}
          {(activeId === 'crop-recommendation' || activeId === 'crop-compatibility' || activeId === 'crop-rotation' || activeId === 'companion-planting' || activeId === 'intercropping') && (() => {
            const curCompanion = COMPANIONS_12.find((c) => c.name.includes(intercropOption.split(' ')[0])) || COMPANIONS_12[0];
            const computedLer = Number((1.0 + curCompanion.lerBonus).toFixed(2));
            const areaAdvantagePct = Math.round(curCompanion.lerBonus * 100);
            const nFertilizerMoneySaved = Math.round(curCompanion.nFixKg * 19.2); // ₹19.2/kg urea subsidized value

            return (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] border border-[var(--brand-border)] space-y-1">
                  <h4 className="font-black text-sm text-[var(--brand-text,#0d7342)]">
                    Intercropping Synergy & Companion Planting Matrix
                  </h4>
                  <p className="text-slate-750 dark:text-slate-200 font-medium text-[11px]">
                    Evaluates Land Equivalent Ratio (LER), biological nitrogen nodulation, and pest decoy interception.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Primary Anchor Crop (10 Options) */}
                  <div className="p-3 rounded-xl frosted-glass-sub border border-white/60 space-y-1">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">Primary Anchor Crop:</span>
                    <select
                      value={mainCrop}
                      onChange={(e) => setMainCrop(e.target.value)}
                      className="w-full text-xs font-black bg-transparent text-slate-900 dark:text-white focus:outline-none py-1"
                    >
                      {ANCHOR_CROPS_10.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Companion Intercrop (12 Options) */}
                  <div className="p-3 rounded-xl frosted-glass-sub border border-white/60 space-y-1">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">Companion Intercrop:</span>
                    <select
                      value={intercropOption}
                      onChange={(e) => setIntercropOption(e.target.value)}
                      className="w-full text-xs font-black bg-transparent text-slate-900 dark:text-white focus:outline-none py-1"
                    >
                      {COMPANIONS_12.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Row Geometry (5 Configurations) */}
                  <div className="p-3 rounded-xl frosted-glass-sub border border-white/60 space-y-1">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">Row Geometry:</span>
                    <select
                      value={rowGeometry}
                      onChange={(e) => setRowGeometry(e.target.value as any)}
                      className="w-full text-xs font-black bg-transparent text-slate-900 dark:text-white focus:outline-none py-1"
                    >
                      <option value="1_1_alt">1:1 Alternating Single Rows</option>
                      <option value="2_1_paired">2:1 Paired Row (Standard ICAR)</option>
                      <option value="3_1_strip">3:1 Strip Intercropping</option>
                      <option value="4_2_precision">4:2 High-Density Multi-Row</option>
                      <option value="perimeter_trap">Perimeter Trap Border (2 Outer Rows)</option>
                    </select>
                  </div>
                </div>

                {/* Agronomic Synergy Profile */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-[11px]">
                  <strong>Agronomic Synergy Note:</strong> {curCompanion.desc}
                </div>

                {/* Synergy Score & LER Card */}
                <div className="p-4 rounded-2xl frosted-card border border-white/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 dark:text-white">Land-Use Synergy & LER Index:</span>
                    <span className="text-xs font-black px-3 py-0.5 rounded-full bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs">
                      {Math.min(98, 70 + areaAdvantagePct)}% High Land Productivity
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="p-2.5 rounded-xl frosted-glass-sub border border-white/50">
                      <span className="text-slate-500 block">Land Equivalent Ratio</span>
                      <span className="font-black text-base text-[var(--brand-color,#0f9a58)]">{computedLer} LER</span>
                      <span className="text-[10px] text-slate-500 block">+{areaAdvantagePct}% Land Area Gain</span>
                    </div>

                    <div className="p-2.5 rounded-xl frosted-glass-sub border border-white/50">
                      <span className="text-slate-500 block">Biological N-Fixation</span>
                      <span className="font-black text-base text-teal-600">+{curCompanion.nFixKg} kg/ha</span>
                      <span className="text-[10px] text-slate-500 block">Root Nodules</span>
                    </div>

                    <div className="p-2.5 rounded-xl frosted-glass-sub border border-white/50">
                      <span className="text-slate-500 block">Pest Decoy Score</span>
                      <span className="font-black text-base text-amber-600">{curCompanion.trapScore}% Trap</span>
                      <span className="text-[10px] text-slate-500 block">Deflects Pests</span>
                    </div>

                    <div className="p-2.5 rounded-xl frosted-glass-sub border border-white/50">
                      <span className="text-slate-500 block">Fertilizer Saved</span>
                      <span className="font-black text-base text-sky-600">₹{nFertilizerMoneySaved}/acre</span>
                      <span className="text-[10px] text-slate-500 block">Urea Subvention</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* 5. SENTINEL-2 10M NDVI & SUBSURFACE IOT PROBES (3 DEPTHS)       */}
          {/* ============================================================== */}
          {(activeId === 'iot-soil' || activeId === 'satellite-ndvi' || activeId === 'sensor-integration' || activeId === 'weather-forecast' || activeId === 'risk-maps' || activeId === 'disaster-alerts') && (() => {
            // Radiometry: Red 665nm vs NIR 842nm
            const b4Red = 0.06;
            const b8Nir = 0.54;
            const calculatedNdvi = Number(((b8Nir - b4Red) / (b8Nir + b4Red)).toFixed(2)); // 0.80

            // 3 Sensor Depths
            const probeData = {
              '15cm': {
                depthName: 'Topsoil Rootzone (15 cm Depth)',
                vwc: weatherData.soilMoistureSurface || 28.4,
                temp: weatherData.soilTempSurface || 26.8,
                ec: 0.85,
                status: 'Active Feeder Rootzone',
                role: 'Drives active feeder root water uptake & evaporation drying front',
              },
              '30cm': {
                depthName: 'Subsurface Reserve (30 cm Depth)',
                vwc: weatherData.soilMoistureDeep || 34.2,
                temp: weatherData.soilTempDeep || 23.4,
                ec: 1.10,
                status: 'Subsoil Cushion Reserve',
                role: 'Measures subsoil cushion reserve and thermal root respiration buffer',
              },
              '60cm': {
                depthName: 'Deep Horizon Subsoil (60 cm Depth)',
                vwc: 38.0,
                temp: 21.2,
                ec: 1.45,
                status: 'Capillary Rise Base',
                role: 'Capillary rise and deep percolation drainage monitoring',
              },
            }[sensorDepth];

            // 24h Diurnal Adjustment
            const isMiddayDip = simulatedHour >= 12 && simulatedHour <= 15;
            const effectiveNdvi = isMiddayDip ? Number((calculatedNdvi - 0.04).toFixed(2)) : calculatedNdvi;
            const ndviVigorClass = effectiveNdvi >= 0.70 ? 'Lush Vigorous Canopy' : effectiveNdvi >= 0.40 ? 'Moderate Vegetative Cover' : 'Sparse / Moisture Stressed';

            return (
              <div className="space-y-4 text-xs">
                {/* Radiometry Header */}
                <div className="p-4 rounded-2xl bg-sky-500/15 border border-sky-500/25 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-black text-sm text-sky-950 dark:text-sky-300">
                      Sentinel-2 10m Radiometry & Subsurface IoT Soil Telemetry
                    </h4>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-500/30">
                      Zero Cloud Mask (0% Occlusion)
                    </span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium text-[11px]">
                    Live ESA Sentinel-2 Radiometry (B4 Red 665nm • B8 NIR 842nm) paired with 3-tier capacitive rootzone sensors.
                  </p>
                </div>

                {/* 3 Depth Toggle */}
                <div className="grid grid-cols-3 p-1 rounded-2xl frosted-glass-sub border border-white/60 gap-1 font-black text-center">
                  {(['15cm', '30cm', '60cm'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSensorDepth(d)}
                      className={`py-2 px-1 rounded-xl transition-all cursor-pointer ${
                        sensorDepth === d
                          ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs'
                          : 'text-slate-750 dark:text-slate-300 hover:bg-slate-200/60'
                      }`}
                    >
                      <span className="block text-xs">{d === '15cm' ? 'Topsoil (15cm)' : d === '30cm' ? 'Subsurface (30cm)' : 'Deep Horizon (60cm)'}</span>
                    </button>
                  ))}
                </div>

                {/* 24-Hour Diurnal Slider */}
                <div className="p-3 rounded-xl frosted-glass-sub border border-white/60 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Diurnal Cycle Hour (00:00 to 23:00):</span>
                    <span className="text-sky-600 font-black">
                      {simulatedHour}:00 hrs {isMiddayDip ? '(Midday Peak Transpiration VPD Dip)' : '(Nocturnal Moisture Equilibrium)'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="23"
                    step="1"
                    value={simulatedHour}
                    onChange={(e) => setSimulatedHour(Number(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>00:00 (Night Moisture Equilibrium)</span>
                    <span>14:00 (Peak VPD Solar Dip)</span>
                    <span>23:00 (Dew Recovery)</span>
                  </div>
                </div>

                {/* Telemetry Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-3 rounded-2xl frosted-card border border-white/60">
                    <span className="text-slate-500 text-[10px] block uppercase font-bold">VWC Soil Moisture</span>
                    <span className="text-lg font-black text-sky-600">{probeData.vwc}% VWC</span>
                    <span className="text-[9px] text-slate-400 block">{probeData.status}</span>
                  </div>

                  <div className="p-3 rounded-2xl frosted-card border border-white/60">
                    <span className="text-slate-500 text-[10px] block uppercase font-bold">Soil Temp at Depth</span>
                    <span className="text-lg font-black text-amber-600">{probeData.temp}°C</span>
                    <span className="text-[9px] text-slate-400 block">Root Respiration</span>
                  </div>

                  <div className="p-3 rounded-2xl frosted-card border border-white/60">
                    <span className="text-slate-500 text-[10px] block uppercase font-bold">Pore Water EC</span>
                    <span className="text-lg font-black text-indigo-600">{probeData.ec} dS/m</span>
                    <span className="text-[9px] text-slate-400 block">Fertilizer Salts</span>
                  </div>

                  <div className="p-3 rounded-2xl frosted-card border border-white/60">
                    <span className="text-slate-500 text-[10px] block uppercase font-bold">10m Pixel NDVI</span>
                    <span className="text-lg font-black text-[var(--brand-color,#0f9a58)]">{effectiveNdvi}</span>
                    <span className="text-[9px] text-slate-400 block">{ndviVigorClass}</span>
                  </div>
                </div>

                {/* Radiometry Formula & Spectral Reflectance */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span>Spectral Radiometry: B8 NIR ({b8Nir}) vs B4 Red ({b4Red})</span>
                    <span className="font-mono text-[var(--brand-color,#0f9a58)] font-black">
                      NDVI = (B8-B4)/(B8+B4) = {effectiveNdvi}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-[var(--brand-color,#0f9a58)] h-full rounded-full" style={{ width: `${Math.min(100, effectiveNdvi * 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {probeData.depthName}: {probeData.role}. {probeData.vwc < 28 ? '⚠ Run drip irrigation for 2.5 hours to replenish root zone.' : '✓ Optimal soil water buffer maintained.'}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* 6. SMART IRRIGATION ETC WATER BUDGETING                        */}
          {/* ============================================================== */}
          {(activeId === 'smart-irrigation' || activeId === 'water-budget') && (() => {
            const etcDailyMm = (referenceEt0 * cropKc).toFixed(2);
            const waterDemandLitersPerAcre = Math.round(Number(etcDailyMm) * 4046.86);
            const totalHoursDec = waterDemandLitersPerAcre / dripFlowRateLph;
            const dripHoursInt = Math.floor(totalHoursDec);
            const dripMinsInt = Math.round((totalHoursDec - dripHoursInt) * 60);

            return (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-teal-500/15 border border-teal-500/25">
                  <h4 className="font-black text-sm text-teal-950 dark:text-teal-300 mb-1">
                    Crop Evapotranspiration (ETc) Irrigation Water Budgeting
                  </h4>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    Formula: ETc = ET0 × Kc. Automated calculation for drip runtime hours and water demand.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60">
                    <span className="text-slate-500 text-[10px] block font-bold">Reference ET₀ (mm/day)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={referenceEt0}
                      onChange={(e) => setReferenceEt0(Number(e.target.value))}
                      className="w-full text-base font-black bg-transparent border-b border-teal-500/30 focus:outline-none text-slate-950 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-500">Live Weather Sync</span>
                  </div>

                  <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60">
                    <span className="text-slate-500 text-[10px] block font-bold">Crop Factor (Kc)</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.35"
                      max="1.25"
                      value={cropKc}
                      onChange={(e) => setCropKc(Number(e.target.value))}
                      className="w-full text-base font-black bg-transparent border-b border-teal-500/30 focus:outline-none text-slate-950 dark:text-white"
                    />
                    <span className="text-[10px] text-teal-600 font-bold">0.35 (Em) to 1.25 (Pk)</span>
                  </div>

                  <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60">
                    <span className="text-slate-500 text-[10px] block font-bold">Soil Infiltration</span>
                    <select
                      value={soilTexture}
                      onChange={(e) => setSoilTexture(e.target.value as any)}
                      className="w-full font-bold bg-transparent border-b border-teal-500/30 focus:outline-none text-slate-950 dark:text-white py-1"
                    >
                      <option value="clay">Black Clay (4 mm/hr)</option>
                      <option value="loam">Alluvial Loam (12 mm/hr)</option>
                      <option value="sandy">Red Sandy (25 mm/hr)</option>
                    </select>
                  </div>

                  <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60">
                    <span className="text-slate-500 text-[10px] block font-bold">Drip Emitter Flow</span>
                    <select
                      value={dripFlowRateLph}
                      onChange={(e) => setDripFlowRateLph(Number(e.target.value))}
                      className="w-full font-bold bg-transparent border-b border-teal-500/30 focus:outline-none text-slate-950 dark:text-white py-1"
                    >
                      <option value={1600}>1,600 L/hr / Acre</option>
                      <option value={2000}>2,000 L/hr / Acre</option>
                      <option value={2400}>2,400 L/hr / Acre</option>
                      <option value={2800}>2,800 L/hr / Acre</option>
                      <option value={3200}>3,200 L/hr / Acre</option>
                    </select>
                  </div>
                </div>

                {/* Water Budget Results */}
                <div className="p-4 rounded-2xl frosted-card border border-white/60 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 rounded-xl frosted-glass-sub border border-white/50">
                      <span className="text-slate-500 text-[10px] block uppercase font-bold">Daily Crop Demand (ETc)</span>
                      <span className="text-xl font-black text-sky-600">{etcDailyMm} mm / day</span>
                      <span className="text-[10px] text-slate-500 block">~{waterDemandLitersPerAcre.toLocaleString('en-IN')} Liters / Acre</span>
                    </div>
                    <div className="p-3 rounded-xl frosted-glass-sub border border-white/50">
                      <span className="text-slate-500 text-[10px] block uppercase font-bold">Recommended Drip Runtime</span>
                      <span className="text-xl font-black text-[var(--brand-color,#0f9a58)]">
                        {dripHoursInt}h {dripMinsInt}m
                      </span>
                      <span className="text-[10px] text-slate-500 block">Optimal Window: Early Morning 05:30 AM</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* 7. SMART SPRAY WINDOW & DRIFT CALENDAR                         */}
          {/* ============================================================== */}
          {activeId === 'spray-calendar' && (() => {
            const currentDayForecast = weatherData.daily?.[selectedDayOffset] || weatherData.daily?.[0] || {
              dayName: 'Today',
              maxTemp: weatherData.temp + 2,
              minTemp: weatherData.temp - 6,
              precipitationProb: weatherData.rainProb,
              isRain: weatherData.isRainingNow,
              et0: weatherData.et0 || 4.8,
            };

            const liveDewPoint = weatherData.dewPoint || weatherData.temp - (100 - weatherData.humidity) / 5;
            const liveDeltaT = Math.max(0.5, Number((weatherData.temp - liveDewPoint).toFixed(1)));

            const diurnalWindows = [
              {
                time: '06:00 AM - 09:30 AM',
                label: 'Morning Calm & Dew Drying',
                temp: Math.round(currentDayForecast.minTemp + 2),
                rh: Math.min(95, Math.round(weatherData.humidity * (selectedDayOffset === 0 ? 1.15 : 1.1))),
                windVal: Math.max(3, Math.round(weatherData.windSpeed * (selectedDayOffset === 0 ? 0.65 : selectedDayOffset === 1 ? 0.75 : 0.85))),
                rainRiskVal: Math.round(currentDayForecast.precipitationProb * 0.35),
                deltaTVal: Number((currentDayForecast.minTemp + 2 - (liveDewPoint - 2)).toFixed(1)),
                note: 'Dew cleared from foliage. Ideal stomatal intake and negligible droplet drift risk.',
              },
              {
                time: '10:00 AM - 01:30 PM',
                label: 'Mid-Morning Convection',
                temp: Math.round(currentDayForecast.maxTemp - 2),
                rh: Math.max(35, Math.round(weatherData.humidity * (selectedDayOffset === 0 ? 0.85 : 0.8))),
                windVal: Math.round(weatherData.windSpeed * (selectedDayOffset === 0 ? 1.05 : 1.15)),
                rainRiskVal: Math.round(currentDayForecast.precipitationProb * 0.6),
                deltaTVal: Number((currentDayForecast.maxTemp - 2 - liveDewPoint).toFixed(1)),
                note: 'Thermal updraft accelerating. Use medium-coarse droplets to mitigate fine droplet evaporation.',
              },
              {
                time: '02:00 PM - 05:00 PM',
                label: 'Peak Afternoon Thermal Stress',
                temp: Math.round(currentDayForecast.maxTemp),
                rh: Math.max(25, Math.round(weatherData.humidity * 0.65)),
                windVal: Math.max(14, Math.round(weatherData.windSpeed * (selectedDayOffset === 0 ? 1.35 : 1.4))),
                rainRiskVal: Math.round(currentDayForecast.precipitationProb),
                deltaTVal: Number((currentDayForecast.maxTemp - liveDewPoint).toFixed(1)),
                note: 'High atmospheric VPD and wind gusts exceed safe knapsack/drone drift thresholds.',
              },
              {
                time: '05:30 PM - 07:30 PM',
                label: 'Golden Dusk Window',
                temp: Math.round((currentDayForecast.maxTemp + currentDayForecast.minTemp) / 2 + 1),
                rh: Math.min(88, Math.round(weatherData.humidity * 0.95)),
                windVal: Math.max(4, Math.round(weatherData.windSpeed * (selectedDayOffset === 0 ? 0.75 : 0.8))),
                rainRiskVal: Math.round(currentDayForecast.precipitationProb * 0.45),
                deltaTVal: Number(((currentDayForecast.maxTemp + currentDayForecast.minTemp) / 2 + 1 - liveDewPoint).toFixed(1)),
                note: 'Excellent nocturnal window for biologicals, Bt spores, and contact fungicides.',
              },
            ].map((slot) => {
              const isProhibited = slot.windVal > 18 || slot.rainRiskVal > 50 || slot.temp > 35;
              const isCaution = !isProhibited && (slot.windVal > 12 || slot.rainRiskVal > 25 || slot.temp > 31 || slot.deltaTVal > 8.5 || slot.deltaTVal < 2.0);
              const status: 'OPTIMAL' | 'CAUTION' | 'PROHIBITED' = isProhibited ? 'PROHIBITED' : isCaution ? 'CAUTION' : 'OPTIMAL';
              return {
                ...slot,
                status,
                wind: `${slot.windVal} km/h`,
                rainRisk: `${slot.rainRiskVal}%`,
                tempFormatted: `${slot.temp}°C`,
                deltaTFormatted: `${Math.max(1.1, slot.deltaTVal)}°C`,
              };
            });

            return (
              <div className="space-y-4 text-xs">
                {/* Live Telemetry & Location Sync Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/15 via-emerald-500/10 to-teal-500/10 border border-sky-500/25 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="relative flex size-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-500 opacity-75" />
                          <span className="relative inline-flex rounded-full size-2.5 bg-sky-500" />
                        </span>
                        <h4 className="font-black text-sm text-sky-950 dark:text-sky-300">
                          72-Hour Spray Viability Index (SVI) & Agronomic Physics
                        </h4>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 font-medium text-[11px] mt-0.5">
                        Live real-time weather & drift telemetry synchronized for <strong>{weatherData.locationName}</strong>.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-[10px] font-black">
                      <span className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-slate-800 border border-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center gap-1">
                        <MapPin className="size-3 text-emerald-600" />
                        <span>{weatherData.locationName}</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                        {weatherData.temp}°C • {weatherData.humidity}% RH • Wind {weatherData.windSpeed} km/h
                      </span>
                    </div>
                  </div>

                  {/* Physics Telemetry Gauges Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1 border-t border-sky-500/15">
                    <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-sky-500/15">
                      <span className="text-[10px] text-slate-500 block font-bold">Delta T (ΔT)</span>
                      <span
                        className={`text-xs font-black ${
                          liveDeltaT >= 2 && liveDeltaT <= 8 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'
                        }`}
                      >
                        {liveDeltaT}°C {liveDeltaT >= 2 && liveDeltaT <= 8 ? '✓ Safe' : '⚠ High Evap'}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-sky-500/15">
                      <span className="text-[10px] text-slate-500 block font-bold">VPD Evaporation</span>
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">{weatherData.vpd || 1.42} kPa</span>
                    </div>

                    <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-sky-500/15">
                      <span className="text-[10px] text-slate-500 block font-bold">Canopy Wetness</span>
                      <span className="text-xs font-black text-teal-600 dark:text-teal-400">{weatherData.leafWetness || 'Dry (Foliar Ready)'}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-sky-500/15">
                      <span className="text-[10px] text-slate-500 block font-bold">Rain Wash-off Risk</span>
                      <span className={`text-xs font-black ${currentDayForecast.precipitationProb > 40 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {currentDayForecast.precipitationProb}% Probability
                      </span>
                    </div>
                  </div>
                </div>

                {/* Time Horizon Control Bar (Monthly, Quarterly, Yearly) */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200">
                    <span className="uppercase tracking-wider text-[10px] text-slate-500 font-extrabold">Protection Horizon:</span>
                    <span className="text-[var(--brand-color,#0f9a58)] font-black">
                      {timeHorizon === 'monthly' ? '30-Day Seasonal Protection Schedule' : timeHorizon === 'quarterly' ? '90-Day Multi-Crop IPM Quarter Matrix' : '365-Day Annual Protection & Crop Rotation Matrix'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setTimeHorizon('monthly')}
                      className={`py-2 px-2 rounded-lg transition-all cursor-pointer ${
                        timeHorizon === 'monthly'
                          ? 'bg-[var(--brand-color,#0f9a58)] text-white font-black shadow-2xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeHorizon('quarterly')}
                      className={`py-2 px-2 rounded-lg transition-all cursor-pointer ${
                        timeHorizon === 'quarterly'
                          ? 'bg-[var(--brand-color,#0f9a58)] text-white font-black shadow-2xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      Quarterly
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeHorizon('yearly')}
                      className={`py-2 px-2 rounded-lg transition-all cursor-pointer ${
                        timeHorizon === 'yearly'
                          ? 'bg-[var(--brand-color,#0f9a58)] text-white font-black shadow-2xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* 1. MONTHLY VIEW: 4-WEEK COMPREHENSIVE SPRAY SCHEDULE                       */}
                {/* ========================================================================= */}
                {timeHorizon === 'monthly' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-black text-emerald-800 dark:text-emerald-300 text-sm block">
                          30-Day Monthly Spray Calendar & Water Volume Budget
                        </span>
                        <p className="text-slate-750 dark:text-slate-200 text-[11px] mt-0.5">
                          Weekly breakdown calibrated for {targetCrop} • Total Water: 770 L/acre • Total Spray Budget: ~₹3,040/acre
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-mono font-black text-[10px] shrink-0">
                        4 Planned Rounds
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Week 1 */}
                      <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 dark:text-white bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                            Week 1: Root & Seedling Protection
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500">Day 1 - 7</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-slate-650 dark:text-slate-300">
                            <span>Target Pest:</span>
                            <strong className="text-slate-900 dark:text-white">Stem Fly & Early Sucking Pests</strong>
                          </div>
                          <div className="flex justify-between text-slate-650 dark:text-slate-300">
                            <span>Active Molecule:</span>
                            <strong className="text-emerald-700 dark:text-emerald-400">Imidacloprid 17.8% SL</strong>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Dose & Water:</span>
                            <span>0.5 ml/L • 150 L/acre</span>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Delta T Target:</span>
                            <span>2.0°C - 6.0°C (Safe)</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-white/10 text-[11px]">
                            <span className="font-semibold text-slate-500">Round Budget:</span>
                            <strong className="text-slate-900 dark:text-white font-mono font-bold">~₹480/acre</strong>
                          </div>
                        </div>
                      </div>

                      {/* Week 2 */}
                      <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 dark:text-white bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded-md">
                            Week 2: Vegetative Canopy Surge
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500">Day 8 - 14</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-slate-650 dark:text-slate-300">
                            <span>Target Pest:</span>
                            <strong className="text-slate-900 dark:text-white">Leaf Miners & Foliar Blight</strong>
                          </div>
                          <div className="flex justify-between text-slate-650 dark:text-slate-300">
                            <span>Active Molecule:</span>
                            <strong className="text-sky-700 dark:text-sky-400">Chlorantraniliprole 18.5% SC</strong>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Dose & Water:</span>
                            <span>0.4 ml/L • 200 L/acre</span>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Delta T Target:</span>
                            <span>3.0°C - 7.0°C (Dusk Window)</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-white/10 text-[11px]">
                            <span className="font-semibold text-slate-500">Round Budget:</span>
                            <strong className="text-slate-900 dark:text-white font-mono font-bold">~₹720/acre</strong>
                          </div>
                        </div>
                      </div>

                      {/* Week 3 */}
                      <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 dark:text-white bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md">
                            Week 3: Pre-Flowering Defense
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500">Day 15 - 21</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-slate-650 dark:text-slate-300">
                            <span>Target Pest:</span>
                            <strong className="text-slate-900 dark:text-white">Thrips & Powdery Mildew</strong>
                          </div>
                          <div className="flex justify-between text-slate-650 dark:text-slate-300">
                            <span>Active Molecule:</span>
                            <strong className="text-amber-700 dark:text-amber-400">Fipronil 5% SC + Hexaconazole 5% EC</strong>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Dose & Water:</span>
                            <span>1.5 ml/L • 200 L/acre</span>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Delta T Target:</span>
                            <span>2.0°C - 5.5°C (Optimal)</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-white/10 text-[11px]">
                            <span className="font-semibold text-slate-500">Round Budget:</span>
                            <strong className="text-slate-900 dark:text-white font-mono font-bold">~₹890/acre</strong>
                          </div>
                        </div>
                      </div>

                      {/* Week 4 */}
                      <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 dark:text-white bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-md">
                            Week 4: Bloom & Pod Set Shield
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500">Day 22 - 30</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-slate-650 dark:text-slate-300">
                            <span>Target Pest:</span>
                            <strong className="text-slate-900 dark:text-white">Pod Borers & Anthracnose</strong>
                          </div>
                          <div className="flex justify-between text-slate-650 dark:text-slate-300">
                            <span>Active Molecule:</span>
                            <strong className="text-teal-700 dark:text-teal-400">Azoxystrobin + Difenoconazole</strong>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Dose & Water:</span>
                            <span>1.0 ml/L • 220 L/acre</span>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Delta T Target:</span>
                            <span>2.5°C - 6.0°C (Safe)</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-white/10 text-[11px]">
                            <span className="font-semibold text-slate-500">Round Budget:</span>
                            <strong className="text-slate-900 dark:text-white font-mono font-bold">~₹950/acre</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 2. QUARTERLY VIEW: 90-DAY MULTI-CROP IPM QUARTER MATRIX                   */}
                {/* ========================================================================= */}
                {timeHorizon === 'quarterly' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-black text-teal-800 dark:text-teal-300 text-sm block">
                          90-Day IPM Quarter Matrix (Q1 - Q4 Multi-Crop Cycle)
                        </span>
                        <p className="text-slate-750 dark:text-slate-200 text-[11px] mt-0.5">
                          MoA (Mode of Action) FRAC/IRAC Resistance Rotation • Total 90-Day Budget: ~₹6,150/acre
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-teal-600 text-white font-mono font-black text-[10px] shrink-0">
                        CIBRC Certified
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase font-black text-[10px]">
                          <tr>
                            <th className="p-3">Quarter Phase</th>
                            <th className="p-3">Pest Target</th>
                            <th className="p-3">Active Chemical & MoA</th>
                            <th className="p-3">Application Method</th>
                            <th className="p-3 text-right">Est. Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/10 font-medium text-slate-800 dark:text-slate-200">
                          <tr>
                            <td className="p-3 font-bold">
                              <span className="text-emerald-700 dark:text-emerald-400 block font-black">Q1 (0-30 DAP)</span>
                              <span className="text-[10px] text-slate-500">Nursery & Seedling</span>
                            </td>
                            <td className="p-3">Cutworms, Damping-off, Stem Fly</td>
                            <td className="p-3">
                              <strong className="block text-slate-900 dark:text-white">Thiamethoxam 30% FS</strong>
                              <span className="text-[10px] font-mono text-emerald-600">IRAC 4A (Neonicotinoid)</span>
                            </td>
                            <td className="p-3 text-[11px]">Seed Coat & Drenching</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-600">₹1,250/acre</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-bold">
                              <span className="text-sky-700 dark:text-sky-400 block font-black">Q2 (31-60 DAP)</span>
                              <span className="text-[10px] text-slate-500">Peak Canopy Surge</span>
                            </td>
                            <td className="p-3">Whitefly, Thrips, Early Caterpillars</td>
                            <td className="p-3">
                              <strong className="block text-slate-900 dark:text-white">Spinetoram 11.7% SC</strong>
                              <span className="text-[10px] font-mono text-sky-600">IRAC 5 (Spinosyn)</span>
                            </td>
                            <td className="p-3 text-[11px]">Drone / Knapsack Spray</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-600">₹2,150/acre</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-bold">
                              <span className="text-amber-700 dark:text-amber-400 block font-black">Q3 (61-90 DAP)</span>
                              <span className="text-[10px] text-slate-500">Pod Fill & Fruit Set</span>
                            </td>
                            <td className="p-3">Pod Borer, Rust, Powdery Mildew</td>
                            <td className="p-3">
                              <strong className="block text-slate-900 dark:text-white">Emamectin 5% SG + Strobilurin</strong>
                              <span className="text-[10px] font-mono text-amber-600">IRAC 6 + FRAC 11</span>
                            </td>
                            <td className="p-3 text-[11px]">Foliar Fine Mist Spray</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-600">₹1,950/acre</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-bold">
                              <span className="text-teal-700 dark:text-teal-400 block font-black">Q4 (91-120 DAP)</span>
                              <span className="text-[10px] text-slate-500">Maturity & Storage</span>
                            </td>
                            <td className="p-3">Grain Weevils, Post-Harvest Mold</td>
                            <td className="p-3">
                              <strong className="block text-slate-900 dark:text-white">Neem Oil 10000 PPM + Bio-wash</strong>
                              <span className="text-[10px] font-mono text-teal-600">Organic CIBRC Green</span>
                            </td>
                            <td className="p-3 text-[11px]">Ultra-Low Volume Wash</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-600">₹800/acre</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 3. YEARLY VIEW: 365-DAY ANNUAL PROTECTION & CROP ROTATION MATRIX          */}
                {/* ========================================================================= */}
                {timeHorizon === 'yearly' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-black text-indigo-800 dark:text-indigo-300 text-sm block">
                          365-Day Annual Crop Protection & Budgeting Horizon
                        </span>
                        <p className="text-slate-750 dark:text-slate-200 text-[11px] mt-0.5">
                          Kharif, Rabi, Zaid Multi-Crop Rotation • Total Annual Protective Budget: ~₹7,350/acre
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-indigo-600 text-white font-mono font-black text-[10px] shrink-0">
                        12-Month Master
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Kharif */}
                      <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-emerald-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 rounded-md">
                            Kharif Season (Jun - Sep)
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-600">4 Rounds</span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                          <strong>Pests:</strong> Pink Bollworm, Fall Armyworm, Sheath Blight.<br />
                          <strong>Strategy:</strong> High humidity systemic fungicide rotation & drone spraying.<br />
                          <strong>Water:</strong> 800 L/acre total.
                        </p>
                        <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-semibold">Season Budget:</span>
                          <strong className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">~₹2,850/acre</strong>
                        </div>
                      </div>

                      {/* Rabi */}
                      <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-sky-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/40 px-2.5 py-0.5 rounded-md">
                            Rabi Season (Oct - Jan)
                          </span>
                          <span className="text-[10px] font-mono font-bold text-sky-600">3 Rounds</span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                          <strong>Pests:</strong> Aphids, Sawfly, Downy Mildew, Rust.<br />
                          <strong>Strategy:</strong> Low temperature Delta T optimization & copper bio-washes.<br />
                          <strong>Water:</strong> 600 L/acre total.
                        </p>
                        <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-semibold">Season Budget:</span>
                          <strong className="text-sky-700 dark:text-sky-400 font-mono font-bold">~₹2,250/acre</strong>
                        </div>
                      </div>

                      {/* Zaid / Summer */}
                      <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-0.5 rounded-md">
                            Zaid / Summer (Feb - May)
                          </span>
                          <span className="text-[10px] font-mono font-bold text-amber-600">2 Rounds</span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                          <strong>Pests:</strong> Red Spider Mites, Thrips, Thermal Wilting.<br />
                          <strong>Strategy:</strong> High VPD evaporative cooling & sulfur bio-solute drenching.<br />
                          <strong>Water:</strong> 450 L/acre total.
                        </p>
                        <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-semibold">Season Budget:</span>
                          <strong className="text-amber-700 dark:text-amber-400 font-mono font-bold">~₹1,450/acre</strong>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      <span>Soil Solarization & Microbe Enrichment Window (May)</span>
                      <span className="font-mono text-indigo-700 dark:text-indigo-400">Trichoderma Drench ~₹800/acre</span>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 72-HOUR HOURLY DIURNAL PHYSICS WINDOW & DAY SELECTOR                       */}
                {/* ========================================================================= */}
                <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      72-Hour Live Physics Telemetry & Hourly Diurnal Windows:
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Synchronized for {weatherData.locationName}
                    </span>
                  </div>

                  {/* Day Selector */}
                  <div className="grid grid-cols-3 p-1 rounded-2xl frosted-glass-sub border border-white/60 gap-1 font-bold text-center">
                    {[0, 1, 2].map((idx) => {
                      const dayData = weatherData.daily?.[idx];
                      const label = idx === 0 ? 'Today (Day 1)' : idx === 1 ? 'Tomorrow (Day 2)' : `${dayData?.dayName || 'Day 3'} Ahead`;
                      const maxT = dayData?.maxTemp ?? weatherData.temp + 2;
                      const minT = dayData?.minTemp ?? weatherData.temp - 6;
                      const pProb = dayData?.precipitationProb ?? weatherData.rainProb;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedDayOffset(idx)}
                          className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center ${
                            selectedDayOffset === idx
                              ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs font-black'
                              : 'text-slate-750 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="text-xs">{label}</span>
                          <span className={`text-[10px] font-semibold ${selectedDayOffset === idx ? 'text-emerald-100' : 'text-slate-500'}`}>
                            {maxT}° / {minT}° • {pProb}% Rain
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 4 Daily Time Slots */}
                  <div className="space-y-2">
                    {diurnalWindows.map((slot, sIdx) => (
                      <div
                        key={sIdx}
                        className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                          slot.status === 'OPTIMAL'
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : slot.status === 'CAUTION'
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-rose-500/10 border-rose-500/30'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-950 dark:text-white text-xs">{slot.time}</span>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">({slot.label})</span>
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                slot.status === 'OPTIMAL'
                                  ? 'bg-[var(--brand-color,#0f9a58)] text-white'
                                  : slot.status === 'CAUTION'
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-rose-600 text-white'
                              }`}
                            >
                              {slot.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-650 dark:text-slate-300 font-medium">{slot.note}</p>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 text-[11px] border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60 dark:border-white/10">
                          <div className="flex items-center gap-2 sm:gap-1 text-slate-800 dark:text-slate-200 font-bold">
                            <span>Wind: {slot.wind}</span>
                            <span className="text-slate-400">•</span>
                            <span>Temp: {slot.tempFormatted}</span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-1 text-slate-500 text-[10px] font-semibold">
                            <span>ΔT: {slot.deltaTFormatted}</span>
                            <span>•</span>
                            <span>Wash-off: {slot.rainRisk}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* 8. TANK-MIX SIMULATOR                                          */}
          {/* ============================================================== */}
          {activeId === 'tank-mix' && (
            <div className="space-y-4">
              <TankMixSimulator onClose={onClose} />
            </div>
          )}

          {/* ============================================================== */}
          {/* 9. SELL VS STORE HARVEST ADVISOR                               */}
          {/* ============================================================== */}
          {activeId === 'sell-vs-store' && (
            <div className="space-y-4">
              <SellVsStoreSimulator
                onClose={onClose}
                onOpenMarket={() => {
                  onClose();
                }}
              />
            </div>
          )}

          {/* ============================================================== */}
          {/* 10. CROP STAGES & PHENOLOGY TIMELINE                           */}
          {/* ============================================================== */}
          {activeId === 'crop-stages' && (
            <div className="space-y-4">
              <CropStagesSimulator
                onClose={onClose}
                onOpenShop={(cat) => {
                  setShopCategory(cat || 'fertilizers');
                  setKisanShopOpen(true);
                }}
              />
            </div>
          )}

          {/* ============================================================== */}
          {/* 11. EXPENSE TRACKER & SEASONAL ROI LEDGER                      */}
          {/* ============================================================== */}
          {(activeId === 'expense-tracker' || activeId === 'farm-analytics' || activeId === 'cost-estimation' || activeId === 'market-trends' || activeId === 'farm-planning') && (() => {
            const totalCost = seedCost + fertilizerCost + laborCost + machineryCost + irrigationCost + cropProtectionCost;
            const totalRevenue = expectedYieldQtl * expectedPricePerQtl;
            const netProfit = totalRevenue - totalCost;
            const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
            const breakEvenYield = expectedPricePerQtl > 0 ? Number((totalCost / expectedPricePerQtl).toFixed(1)) : 0;

            return (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] border border-[var(--brand-border)]">
                  <h4 className="font-black text-sm text-[var(--brand-text,#0d7342)] mb-1">
                    Seasonal Cultivation Ledger & Cost-Per-Acre Calculator
                  </h4>
                  <p className="text-slate-750 dark:text-slate-200 font-medium">
                    Comprehensive expense tracking across 6 input heads, break-even yield, and net season ROI.
                  </p>
                </div>

                {/* Financial Horizon Toggle (Monthly, Quarterly, Yearly) */}
                <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-bold">
                  <span className="uppercase tracking-wider text-[10px] text-slate-500 font-black pl-1">Ledger Horizon:</span>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setTimeHorizon('monthly')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        timeHorizon === 'monthly'
                          ? 'bg-[var(--brand-color,#0f9a58)] text-white font-black shadow-2xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeHorizon('quarterly')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        timeHorizon === 'quarterly'
                          ? 'bg-[var(--brand-color,#0f9a58)] text-white font-black shadow-2xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      Quarterly
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeHorizon('yearly')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        timeHorizon === 'yearly'
                          ? 'bg-[var(--brand-color,#0f9a58)] text-white font-black shadow-2xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>

                {/* 6 Interactive Expense Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60">
                    <span className="text-slate-500 text-[10px] block font-bold">Seeds & Saplings (₹)</span>
                    <input
                      type="number"
                      value={seedCost}
                      onChange={(e) => setSeedCost(Number(e.target.value))}
                      className="w-full text-base font-black bg-transparent border-b border-emerald-500/30 focus:outline-none text-slate-950 dark:text-white"
                    />
                  </div>
                  <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60">
                    <span className="text-slate-500 text-[10px] block font-bold">Fertilizers & Bio (₹)</span>
                    <input
                      type="number"
                      value={fertilizerCost}
                      onChange={(e) => setFertilizerCost(Number(e.target.value))}
                      className="w-full text-base font-black bg-transparent border-b border-emerald-500/30 focus:outline-none text-slate-950 dark:text-white"
                    />
                  </div>
                  <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60">
                    <span className="text-slate-500 text-[10px] block font-bold">Labor & Weeding (₹)</span>
                    <input
                      type="number"
                      value={laborCost}
                      onChange={(e) => setLaborCost(Number(e.target.value))}
                      className="w-full text-base font-black bg-transparent border-b border-emerald-500/30 focus:outline-none text-slate-950 dark:text-white"
                    />
                  </div>
                  <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60">
                    <span className="text-slate-500 text-[10px] block font-bold">Tractor & Diesel (₹)</span>
                    <input
                      type="number"
                      value={machineryCost}
                      onChange={(e) => setMachineryCost(Number(e.target.value))}
                      className="w-full text-base font-black bg-transparent border-b border-emerald-500/30 focus:outline-none text-slate-950 dark:text-white"
                    />
                  </div>
                  <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60">
                    <span className="text-slate-500 text-[10px] block font-bold">Irrigation & Power (₹)</span>
                    <input
                      type="number"
                      value={irrigationCost}
                      onChange={(e) => setIrrigationCost(Number(e.target.value))}
                      className="w-full text-base font-black bg-transparent border-b border-emerald-500/30 focus:outline-none text-slate-950 dark:text-white"
                    />
                  </div>
                  <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60">
                    <span className="text-slate-500 text-[10px] block font-bold">Pest Protection (₹)</span>
                    <input
                      type="number"
                      value={cropProtectionCost}
                      onChange={(e) => setCropProtectionCost(Number(e.target.value))}
                      className="w-full text-base font-black bg-transparent border-b border-emerald-500/30 focus:outline-none text-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                {/* Yield & Price Projections */}
                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-bold">Expected Yield (Qtl/Acre):</span>
                    <input
                      type="number"
                      value={expectedYieldQtl}
                      onChange={(e) => setExpectedYieldQtl(Number(e.target.value))}
                      className="w-full text-base font-black bg-transparent border-b border-teal-500/30 focus:outline-none text-slate-950 dark:text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-bold">Expected Mandi Price (₹/Qtl):</span>
                    <input
                      type="number"
                      value={expectedPricePerQtl}
                      onChange={(e) => setExpectedPricePerQtl(Number(e.target.value))}
                      className="w-full text-base font-black bg-transparent border-b border-teal-500/30 focus:outline-none text-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                {/* Economic Summary */}
                <div className="p-4 rounded-2xl frosted-card border border-white/60 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-xl frosted-glass-sub border border-white/50">
                      <span className="text-slate-500 text-[10px] block uppercase font-bold">Total Expenses</span>
                      <span className="text-lg font-black text-rose-600">₹{totalCost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-3 rounded-xl frosted-glass-sub border border-white/50">
                      <span className="text-slate-500 text-[10px] block uppercase font-bold">Est. Gross Sales</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white">₹{totalRevenue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-3 rounded-xl frosted-glass-sub border border-white/50">
                      <span className="text-slate-500 text-[10px] block uppercase font-bold">Net Profit / Acre</span>
                      <span className="text-lg font-black text-[var(--brand-color,#0f9a58)]">₹{netProfit.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1 border-t border-slate-200 dark:border-white/10">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Break-Even Yield:</span>
                      <span className="font-mono text-slate-900 dark:text-white">{breakEvenYield} Qtl/Acre</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--brand-color,#0f9a58)]/15 border border-[var(--brand-color,#0f9a58)]/30 flex justify-between items-center">
                      <span className="text-emerald-800 dark:text-emerald-300">Seasonal ROI:</span>
                      <span className="font-black text-base text-[var(--brand-color,#0f9a58)]">{roi.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* 12. GOVERNMENT FINANCE, INSURANCE & WAREHOUSES                 */}
          {/* ============================================================== */}
          {(activeId === 'crop-insurance' || activeId === 'finance-loans' || activeId === 'warehouses') && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] border border-[var(--brand-border)]">
                <h4 className="font-black text-sm text-[var(--brand-text,#0d7342)] mb-1">
                  Accredited Portals & Direct Beneficiary Integration
                </h4>
                <p className="text-slate-750 dark:text-slate-200 font-medium">
                  Official linkages for PMFBY 72h loss claim filing, Jan Samarth KCC interest subvention, and WDRA accredited warehouse listings.
                </p>
              </div>

              {activeId === 'crop-insurance' && (
                <div className="p-4 rounded-2xl frosted-card border border-white/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[var(--brand-color,#0f9a58)]" />
                    <h5 className="font-black text-sm text-slate-900 dark:text-white">PMFBY 72-Hour Loss Claim Filing</h5>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    In case of localized perils (hailstorm, cloudburst, landslide, inundation, pest attack), farmers must intimate their crop loss within <strong>72 hours</strong> directly through the Crop Insurance app or the official portal.
                  </p>
                  <a
                    href="https://pmfby.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand-color,#0f9a58)] text-white font-bold cursor-pointer hover:bg-[var(--brand-hover,#0d844b)]"
                  >
                    <span>Launch National Crop Insurance Portal (PMFBY)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {activeId === 'finance-loans' && (
                <div className="p-4 rounded-2xl frosted-card border border-white/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[var(--brand-color,#0f9a58)]" />
                    <h5 className="font-black text-sm text-slate-900 dark:text-white">Jan Samarth 4% Kisan Credit Card (KCC)</h5>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    Apply online across 125+ commercial banks and regional rural banks for subsidized KCC credit up to ₹3.00 Lakh at 4% effective interest rate.
                  </p>
                  <a
                    href="https://www.jansamarth.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand-color,#0f9a58)] text-white font-bold cursor-pointer hover:bg-[var(--brand-hover,#0d844b)]"
                  >
                    <span>Open Official Jan Samarth Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {activeId === 'warehouses' && (
                <div className="p-4 rounded-2xl frosted-card border border-white/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-[var(--brand-color,#0f9a58)]" />
                    <h5 className="font-black text-sm text-slate-900 dark:text-white">WDRA Accredited Warehouse Registry</h5>
                  </div>
                  <p className="text-slate-750 dark:text-slate-300 leading-relaxed font-medium">
                    Store agricultural commodities safely in certified warehouses and generate electronic Negotiable Warehouse Receipts (e-NWR) to access up to 75% pledge finance from banks without distress selling.
                  </p>
                  <a
                    href="https://wdra.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand-color,#0f9a58)] text-white font-bold cursor-pointer hover:bg-[var(--brand-hover,#0d844b)]"
                  >
                    <span>Check WDRA Registered Warehouses</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Footer Controls with Dynamic "Start Simulator" Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-650 dark:text-slate-300 pt-3 border-t border-slate-200/60 dark:border-white/10">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--brand-color,#0f9a58)]" />
              <span>Calibrated AgriSence Algorithmic Engine</span>
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {/* Show "Start Simulator" / "Re-run" for standard modal modules */}
              {activeId !== 'crop-insurance' && activeId !== 'finance-loans' && activeId !== 'warehouses' && activeId !== 'tank-mix' && activeId !== 'sell-vs-store' && activeId !== 'crop-stages' && activeId !== 'bio-control' && (
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={handleStartSimulation}
                  className={`px-4 py-2 rounded-2xl font-bold text-xs cursor-pointer shadow-xs transition-transform hover:scale-105 active:scale-95 flex items-center gap-1.5 ${
                    isSimulating
                      ? 'bg-slate-700 text-white cursor-wait'
                      : hasSimulated
                      ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30'
                      : 'bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white shadow-[0_4px_12px_rgba(15,154,88,0.3)]'
                  }`}
                >
                  <Sparkles className="size-3.5" />
                  <span>{isSimulating ? 'Simulating...' : hasSimulated ? 'Re-Run Calculation' : 'Start Simulator'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer shadow-xs transition-transform hover:scale-105 active:scale-95"
              >
                Close Simulator
              </button>
            </div>
          </div>
        </motion.div>
      </div>
      <KisanShopModal
        isOpen={kisanShopOpen}
        onClose={() => setKisanShopOpen(false)}
        initialCategory={shopCategory}
        initialSearchQuery={shopQuery}
      />
    </AnimatePresence>
  );
}
