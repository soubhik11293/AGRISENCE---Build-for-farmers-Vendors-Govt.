import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/src/components/landing/navbar';
import { Footer } from '@/src/components/landing/footer';
import { OutbreakWarningModal } from '@/src/components/outbreak-warning-modal';
import { PestDiagnosisModal } from '@/src/components/pest-diagnosis-modal';
import { KisanShopModal } from '@/src/components/kisan-shop-modal';
import { BioControlSimulator } from '@/src/components/bio-control-simulator';
import { TankMixSimulator } from '@/src/components/tank-mix-simulator';
import {
  ShieldAlert,
  Radio,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  Search,
  RefreshCw,
  Bug,
  Compass,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  Layers,
  Sprout as Sparkles,
  Sliders,
  Navigation,
  Volume2,
  VolumeX,
  Share2,
  Copy,
  Check,
  Calculator,
  Eye,
  Info,
  ChevronRight,
  Crosshair,
  Maximize2,
  Clock,
  Sprout,
  Locate,
  ArrowUpRight,
  Scan,
  FlaskConical,
  X,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  FileText,
  Target,
  Wrench,
  HelpCircle,
} from 'lucide-react';
import { ActiveParcelSelector } from '@/src/components/dashboard/active-parcel-selector';
import { saveOutbreakEvaluation } from '@/src/lib/platform-sync';
import { useTelemetry } from '@/src/context/telemetry-context';
import { useDiagnosis } from '@/src/context/diagnosis-context';
import { useLanguage } from '@/src/context/language-context';

interface HotspotParcel {
  id: string;
  name: string;
  distanceKm: number;
  bearingDeg: number;
  crop: string;
  threatLevel: 'Critical' | 'Severe' | 'Moderate' | 'Low';
  primaryPest: string;
  vectorCount: number;
  soilMoisture: number;
  ownerContact: string;
  actionTaken: boolean;
}

interface PestVectorViability {
  name: string;
  scientificName: string;
  isViable: boolean;
  reason: string;
  idealTempRange: string;
  idealHumidityRange: string;
}

export function OutbreakPage({ onNavigate }: { onNavigate?: (route: string) => void }) {
  const { t } = useLanguage();
  const { activeDiagnosis } = useDiagnosis();
  const { weatherData, fetchWeather, isWeatherLoading, refreshWeather, syncDeviceGPS } = useTelemetry();

  // Modals management
  const [modalOpen, setModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isBioSimOpen, setIsBioSimOpen] = useState(false);
  const [isTankMixOpen, setIsTankMixOpen] = useState(false);

  // Search & Geocoding state
  const [searchLocation, setSearchLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Radar Scope View Controls
  const [radarLayer, setRadarLayer] = useState<'vectors' | 'gdd' | 'spores' | 'satellite'>('vectors');
  const [selectedParcelId, setSelectedParcelId] = useState<string>('p1');
  const [isRadarScanning, setIsRadarScanning] = useState<boolean>(true);
  const [sweepAngle, setSweepAngle] = useState<number>(0);

  // Audio Speech Synthesis & WhatsApp Advisory
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copiedAdvisory, setCopiedAdvisory] = useState<boolean>(false);

  // Field acreage & crop state for ICAR calculator & economic loss
  const [fieldAcres, setFieldAcres] = useState<number>(2.5);

  // Simulation execution loop state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(100);
  const [simStage, setSimStage] = useState('Epidemiological Synthesis Complete');

  // Interactive Microclimate Override Sliders for what-if radar testing
  const [tempOverride, setTempOverride] = useState<number>(weatherData.temp || 29);
  const [rhOverride, setRhOverride] = useState<number>(weatherData.humidity || 62);
  const [windOverride, setWindOverride] = useState<number>(weatherData.windSpeed || 12);

  // Sync slider overrides with live Open-Meteo telemetry
  useEffect(() => {
    setTempOverride(weatherData.temp || 29);
    setRhOverride(weatherData.humidity || 62);
    setWindOverride(weatherData.windSpeed || 12);
  }, [weatherData.temp, weatherData.humidity, weatherData.windSpeed]);

  // Continuous Radar Sweep Beam Animation Loop
  useEffect(() => {
    if (!isRadarScanning) return;
    const interval = setInterval(() => {
      setSweepAngle((prev) => (prev + 3) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isRadarScanning]);

  const activeLocation = weatherData.locationName || 'Pune / Baramati Sector';

  // --------------------------------------------------------------------------------
  // 1. DEEP INTEGRATION WITH AI PEST SCANNER & MICROCLIMATE PHYSICS
  // --------------------------------------------------------------------------------
  const evalData = useMemo(() => {
    const temp = tempOverride;
    const humidity = rhOverride;
    const windSpeed = windOverride;
    const windDirection = weatherData.windDirection || 140;

    // Thermal Time & Growing Degree-Days (GDD)
    const tempMax = weatherData.daily?.[0]?.maxTemp ?? (temp + 3);
    const tempMin = weatherData.daily?.[0]?.minTemp ?? (temp - 7);
    const tMean = (tempMax + tempMin) / 2;

    const gddMealybug = Math.max(0, tMean - 8.5);
    const gddThrips = Math.max(0, tMean - 10.0);
    const gddAphids = Math.max(0, tMean - 10.0);

    // 14-day cumulative GDD projection
    const gddAccumulated = Math.round(gddMealybug * 14);

    // Threat Severity Tier Calculation
    let hazardLevel: 'Low' | 'Moderate' | 'Severe' | 'Critical' = 'Low';
    if (activeDiagnosis?.severity === 'Critical' || (temp >= 28 && humidity >= 75) || gddAccumulated >= 310) {
      hazardLevel = 'Critical';
    } else if (activeDiagnosis?.severity === 'Severe' || temp >= 24 || (humidity >= 70 && temp >= 20)) {
      hazardLevel = 'Severe';
    } else if (activeDiagnosis?.severity === 'Moderate' || (temp >= 18 && humidity < 65)) {
      hazardLevel = 'Moderate';
    } else {
      hazardLevel = 'Low';
    }

    // Dynamic Aerodynamic Quarantine Buffer Radius
    const quarantineRadiusMeters = Math.max(30, Math.round(50 + (windSpeed * 4.2)));

    // Downwind Trajectory Azimuth & Quadrant
    const downwindDegrees = Math.round((windDirection + 180) % 360);
    let downwindHeading = 'N';
    if (downwindDegrees >= 337.5 || downwindDegrees < 22.5) downwindHeading = 'N (North)';
    else if (downwindDegrees >= 22.5 && downwindDegrees < 67.5) downwindHeading = 'NE (North-East)';
    else if (downwindDegrees >= 67.5 && downwindDegrees < 112.5) downwindHeading = 'E (East)';
    else if (downwindDegrees >= 112.5 && downwindDegrees < 157.5) downwindHeading = 'SE (South-East)';
    else if (downwindDegrees >= 157.5 && downwindDegrees < 202.5) downwindHeading = 'S (South)';
    else if (downwindDegrees >= 202.5 && downwindDegrees < 247.5) downwindHeading = 'SW (South-West)';
    else if (downwindDegrees >= 247.5 && downwindDegrees < 292.5) downwindHeading = 'W (West)';
    else if (downwindDegrees >= 292.5 && downwindDegrees < 337.5) downwindHeading = 'NW (North-West)';

    // Host crop, pest name, and symptoms derivation
    let affectedCrop = activeDiagnosis?.affectedCrop || 'Unknown crop';
    let primaryThreat = 'Microclimate Equilibrium • Low Vector Dispersal';
    let scientificName = activeDiagnosis?.scientificName || 'Unconfirmed weather risk';
    let damagePercentage = activeDiagnosis?.damagePercentage || 0;
    let confidenceScore = activeDiagnosis?.confidence || 0;
    let symptomsList = activeDiagnosis?.symptoms || [
      'No field symptoms have been confirmed. Inspect representative plants before acting.',
    ];

    if (activeDiagnosis) {
      primaryThreat = `AI Foliar Confirmed: ${activeDiagnosis.pestName}`;
      scientificName = activeDiagnosis.scientificName || 'Planococcus citri Complex';
    } else {
      if (hazardLevel === 'Critical') {
        primaryThreat = 'Critical Outbreak Risk: Rapid Thermal Eclosion & Fungal Spore Explosion';
         scientificName = 'Weather risk only — no confirmed organism';
      } else if (hazardLevel === 'Severe') {
        primaryThreat = 'Severe Vector Threat: High Crawler Mobility & Canopy Spore Germination';
         scientificName = 'Weather risk only — no confirmed organism';
      } else if (hazardLevel === 'Moderate') {
        primaryThreat = 'Moderate Hazard: Sucking Pest Vector Multiplication Active';
         scientificName = 'Weather risk only — no confirmed organism';
      }
    }

    // Comprehensive Remediation Pathways (Biological, Chemical, Cultural)
    let biologicalTreatmentList: string[] = activeDiagnosis?.biologicalTreatment?.length
      ? activeDiagnosis.biologicalTreatment
      : [
          'Scout the affected crop and confirm the pest before choosing a treatment.',
          'Use only biological products registered for the crop and follow their label directions.',
          'Record the affected area and consult a local extension officer if symptoms spread.',
        ];

    let chemicalTreatmentList: string[] = activeDiagnosis?.chemicalTreatment?.length
      ? activeDiagnosis.chemicalTreatment
      : [
          'No chemical treatment is recommended from weather risk alone.',
          'Confirm pest, crop, formulation registration, label rate, pre-harvest interval, and protective equipment before spraying.',
          'Do not mix products or apply a pesticide without a crop-specific label and local agronomist confirmation.',
        ];

    let preventiveMeasuresList: string[] = activeDiagnosis?.preventiveMeasures?.length
      ? activeDiagnosis.preventiveMeasures
      : [
          'Prune and burn heavily infested terminal shoots and fallen fruit debris.',
          'Apply 5-inch yellow sticky grease barrier bands around main tree trunks.',
          'Install 8-10 pheromone delta traps per acre along leeward bunds for adult moth monitoring.',
        ];

    const bioDosageText = biologicalTreatmentList[0] || 'Confirm a registered biological option with a local extension officer.';
    const chemicalProtocolText = chemicalTreatmentList[0] || 'Confirm the crop-specific label before any chemical application.';

    // Economic Crop Loss & Monetary Value Calculations
    let cropValuePerAcreINR = 65000; // Default baseline crop value/acre
    if (affectedCrop.toLowerCase().includes('pomegranate') || affectedCrop.toLowerCase().includes('grape')) {
      cropValuePerAcreINR = 140000;
    } else if (affectedCrop.toLowerCase().includes('cotton')) {
      cropValuePerAcreINR = 72000;
    } else if (affectedCrop.toLowerCase().includes('soybean') || affectedCrop.toLowerCase().includes('pulse')) {
      cropValuePerAcreINR = 52000;
    } else if (affectedCrop.toLowerCase().includes('rice') || affectedCrop.toLowerCase().includes('paddy')) {
      cropValuePerAcreINR = 48000;
    }

    const estimatedLossINR = Math.round((cropValuePerAcreINR * (damagePercentage / 100)) * fieldAcres);
    const treatmentCostINR = Math.round(2200 * fieldAcres);
    const savingsFromRemedyINR = Math.max(0, Math.round((estimatedLossINR * 0.85) - treatmentCostINR));

    return {
      hazardLevel,
      primaryThreat,
      scientificName,
      affectedCrop,
      damagePercentage,
      confidenceScore,
      symptomsList,
      quarantineRadiusMeters,
      downwindHeading,
      downwindDegrees,
      bioDosage: bioDosageText,
      chemicalProtocol: chemicalProtocolText,
      biologicalTreatmentList,
      chemicalTreatmentList,
      preventiveMeasuresList,
      temperature: temp,
      humidity,
      windSpeed,
      windDirection,
      gddMealybug,
      gddThrips,
      gddAphids,
      gddAccumulated,
      cropValuePerAcreINR,
      estimatedLossINR,
      savingsFromRemedyINR,
      treatmentCostINR,
      scannedFromAI: Boolean(activeDiagnosis),
    };
  }, [tempOverride, rhOverride, windOverride, weatherData, activeDiagnosis, fieldAcres]);

  const {
    hazardLevel,
    primaryThreat,
    scientificName,
    affectedCrop,
    damagePercentage,
    confidenceScore,
    symptomsList,
    quarantineRadiusMeters,
    downwindHeading,
    downwindDegrees,
    bioDosage,
    chemicalProtocol,
    biologicalTreatmentList,
    chemicalTreatmentList,
    preventiveMeasuresList,
    gddMealybug,
    gddThrips,
    gddAphids,
    gddAccumulated,
    estimatedLossINR,
    savingsFromRemedyINR,
    treatmentCostINR,
    scannedFromAI,
  } = evalData;

  // Vector Viability Filtering Engine
  const pestVectorViabilities: PestVectorViability[] = useMemo(() => {
    return [
      {
        name: 'Mealybug (Planococcus citri)',
        scientificName: 'Planococcus citri',
        isViable: tempOverride >= 20 && tempOverride <= 36,
        reason: tempOverride >= 20 && tempOverride <= 36 ? 'Thermal accumulation favors nymph eclosion' : 'Temperature outside 20–36°C reproductive range',
        idealTempRange: '22 - 34 °C',
        idealHumidityRange: '50 - 85 %',
      },
      {
        name: 'Rice / Millet Blast (Magnaporthe oryzae)',
        scientificName: 'Magnaporthe oryzae',
        isViable: rhOverride >= 75,
        reason: rhOverride >= 75 ? 'Canopy moisture >75% RH permits spore germination' : 'Inhibited due to low humidity (<75% RH)',
        idealTempRange: '20 - 28 °C',
        idealHumidityRange: '75 - 100 %',
      },
      {
        name: 'Chilli & Cotton Thrips (Scirtothrips dorsalis)',
        scientificName: 'Scirtothrips dorsalis',
        isViable: tempOverride >= 26 && rhOverride <= 65,
        reason: tempOverride >= 26 && rhOverride <= 65 ? 'Hot and dry conditions accelerate nymph feeding' : 'Suppressed under high canopy moisture',
        idealTempRange: '28 - 38 °C',
        idealHumidityRange: '30 - 60 %',
      },
      {
        name: 'Fall Armyworm (Spodoptera frugiperda)',
        scientificName: 'Spodoptera frugiperda',
        isViable: tempOverride >= 24 && rhOverride >= 60,
        reason: tempOverride >= 24 && rhOverride >= 60 ? 'Warm humid nights trigger egg hatching' : 'Sub-optimal temperature/humidity',
        idealTempRange: '25 - 32 °C',
        idealHumidityRange: '60 - 90 %',
      },
      {
        name: 'Powdery Mildew (Erysiphe)',
        scientificName: 'Erysiphe cichoracearum',
        isViable: rhOverride >= 70,
        reason: rhOverride >= 70 ? 'High relative humidity triggers conidiation' : 'Dry canopy suppresses fungal sporulation',
        idealTempRange: '18 - 28 °C',
        idealHumidityRange: '70 - 95 %',
      },
    ];
  }, [tempOverride, rhOverride]);

  // Hotspot Parcels on Radar Map
  const hotspotParcels: HotspotParcel[] = useMemo(() => {
    const isHigh = hazardLevel === 'Critical' || hazardLevel === 'Severe';
    return [
      {
        id: 'p1',
        name: `${activeLocation} - Central Whorl Plot`,
        distanceKm: 0.2,
        bearingDeg: 45,
        crop: affectedCrop,
        threatLevel: hazardLevel,
        primaryPest: primaryThreat.split(':')[1]?.trim() || 'Mealybug',
        vectorCount: isHigh ? 340 : 42,
        soilMoisture: weatherData.soilMoisture || 28,
        ownerContact: '+91 98230 ****',
        actionTaken: false,
      },
      {
        id: 'p2',
        name: 'North-East Orchard Block (Pomegranate)',
        distanceKm: 1.1,
        bearingDeg: downwindDegrees,
        crop: 'Pomegranate / Guava',
        threatLevel: isHigh ? 'Critical' : 'Moderate',
        primaryPest: 'Mealybug Nymphs & Thrips',
        vectorCount: isHigh ? 510 : 88,
        soilMoisture: 32,
        ownerContact: '+91 94221 ****',
        actionTaken: false,
      },
      {
        id: 'p3',
        name: 'East Riverbed Basin (Cotton & Soybean)',
        distanceKm: 2.4,
        bearingDeg: (downwindDegrees + 30) % 360,
        crop: 'Cotton / Soybean',
        threatLevel: isHigh ? 'Severe' : 'Low',
        primaryPest: 'Fall Armyworm / Blast Spores',
        vectorCount: isHigh ? 290 : 18,
        soilMoisture: 38,
        ownerContact: '+91 99702 ****',
        actionTaken: true,
      },
      {
        id: 'p4',
        name: 'South Ridge Hillside (Grapevine)',
        distanceKm: 3.2,
        bearingDeg: (downwindDegrees + 180) % 360,
        crop: 'Table Grapes / Sugarcane',
        threatLevel: 'Moderate',
        primaryPest: 'Powdery Mildew / Mites',
        vectorCount: 115,
        soilMoisture: 24,
        ownerContact: '+91 98501 ****',
        actionTaken: false,
      },
      {
        id: 'p5',
        name: 'West Canal Border (Maize & Millet)',
        distanceKm: 4.1,
        bearingDeg: (downwindDegrees + 240) % 360,
        crop: 'Pearl Millet / Maize',
        threatLevel: 'Low',
        primaryPest: 'Stem Borer / Aphids',
        vectorCount: 22,
        soilMoisture: 30,
        ownerContact: '+91 91583 ****',
        actionTaken: true,
      },
    ];
  }, [activeLocation, affectedCrop, hazardLevel, primaryThreat, weatherData.soilMoisture, downwindDegrees]);

  const selectedParcel = hotspotParcels.find((p) => p.id === selectedParcelId) || hotspotParcels[0];

  // --------------------------------------------------------------------------------
  // LOCALSTORAGE PERSISTENCE & MULTI-EVENT SYNCHRONIZATION
  // --------------------------------------------------------------------------------
  const persistOutbreakEvaluation = useCallback(() => {
    try {
      const payload = {
        locationName: activeLocation,
        hazardLevel: evalData.hazardLevel,
        primaryThreat: evalData.primaryThreat,
        scientificName: evalData.scientificName,
        affectedCrop: evalData.affectedCrop,
        damagePercentage: evalData.damagePercentage,
        quarantineRadiusMeters: evalData.quarantineRadiusMeters,
        downwindHeading: evalData.downwindHeading,
        bioDosage: evalData.bioDosage,
        chemicalProtocol: evalData.chemicalProtocol,
        biologicalTreatment: evalData.biologicalTreatmentList,
        chemicalTreatment: evalData.chemicalTreatmentList,
        preventiveMeasures: evalData.preventiveMeasuresList,
        temperature: evalData.temperature,
        humidity: evalData.humidity,
        windSpeed: evalData.windSpeed,
        gddAccumulated: evalData.gddAccumulated,
        estimatedLossINR: evalData.estimatedLossINR,
        savingsFromRemedyINR: evalData.savingsFromRemedyINR,
        scannedFromAI: evalData.scannedFromAI,
        evaluatedAt: new Date().toISOString(),
      };
      void saveOutbreakEvaluation(payload, { source: 'outbreak-radar' });
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('agrisence_simulator_updated'));
    } catch {
      // ignore
    }
  }, [activeLocation, evalData]);

  useEffect(() => {
    persistOutbreakEvaluation();
  }, [persistOutbreakEvaluation]);

  // 4-Phase Simulation Loop Execution
  const handleRunRadarSimulation = async () => {
    setIsSimulating(true);
    setSimProgress(0);
    setSimStage('Phase 1: Resolving geospatial coordinates & Open-Meteo microclimate layers...');

    setTimeout(() => {
      setSimProgress(25);
      setSimStage('Phase 2: Computing Degree-Day incubation & vector aerodynamic drift...');
    }, 400);

    setTimeout(() => {
      setSimProgress(50);
      setSimStage('Phase 3: Calibrating ICAR biological predator ratios & buffer geometry...');
    }, 800);

    setTimeout(() => {
      setSimProgress(75);
      setSimStage('Phase 4: Finalizing quarantine perimeter and synthesis...');
    }, 1200);

    setTimeout(async () => {
      await refreshWeather();
      setSimProgress(100);
      setSimStage('Epidemiological Synthesis Complete');
      setIsSimulating(false);
      persistOutbreakEvaluation();
    }, 1600);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLocation.trim()) return;
    setIsSearching(true);
    try {
      await fetchWeather(searchLocation.trim());
      setSearchLocation('');
      handleRunRadarSimulation();
    } finally {
      setIsSearching(false);
    }
  };

  // WhatsApp Community Advisory Clipboard Copy
  const handleCopyWhatsAppAdvisory = () => {
    const advisoryText = `🚨 *AGRISENSE HYPERLOCAL OUTBREAK ADVISORY* 🚨\n📍 *Location:* ${activeLocation}\n⚡ *Hazard Tier:* ${hazardLevel.toUpperCase()}\n🦠 *Threat:* ${primaryThreat}\n🔬 *Taxa:* ${scientificName}\n🍃 *Crop:* ${affectedCrop} (${damagePercentage}% Foliar Impact)\n📐 *Quarantine Cordon:* ${quarantineRadiusMeters} meters\n💨 *Downwind Drift Corridor:* ${downwindHeading}\n💰 *Revenue at Risk:* ₹${estimatedLossINR.toLocaleString('en-IN')}\n\n🌿 *Bio-Control Protocol:* ${bioDosage}\n🧪 *Chemical Knockdown:* ${chemicalProtocol}\n\n_Generated live via AgriSense Microclimate Radar Network_`;
    navigator.clipboard.writeText(advisoryText);
    setCopiedAdvisory(true);
    setTimeout(() => setCopiedAdvisory(false), 2500);
  };

  // Text-To-Speech (TTS) Speech Broadcast
  const handleSpeechBroadcast = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = `AgriSense Epidemiological Radar Advisory for ${activeLocation}. Hazard Level: ${hazardLevel}. Active threat: ${primaryThreat} affecting ${affectedCrop}. Establish a quarantine cordon of ${quarantineRadiusMeters} meters towards the ${downwindHeading} downwind corridor. Biological remedy: ${bioDosage}. Chemical protocol: ${chemicalProtocol}. Potential savings from remedy: Rupees ${savingsFromRemedyINR.toLocaleString('en-IN')}.`;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen text-slate-950 dark:text-slate-100 flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar currentRoute="/outbreak-warning" onNavigate={onNavigate} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-20 w-full space-y-8">
        <ActiveParcelSelector compact />
        {/* Header Banner */}
        <div className="text-center max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-2xs">
            <Radio className="size-3.5 animate-pulse text-rose-600" />
            <span>Epidemiological Defense Radar Active • {activeLocation}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight">
            Hyperlocal Pest & Pathogen Outbreak Radar
          </h1>
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 font-semibold leading-relaxed">
            Real-time physics-driven epidemiological defense system integrated with AI Foliar Diagnostics, Growing Degree-Day (GDD) eclosion thresholds, and aerodynamic vector drift corridors.
          </p>
        </div>

        {/* ================================================================================= */}
        {/* SECTION 1: AI PEST SCANNER INTEGRATION & ACTIVE DIAGNOSIS BANNER */}
        {/* ================================================================================= */}
        <div className="p-6 rounded-[32px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`size-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
                  scannedFromAI
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                }`}
              >
                <Scan className="size-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      scannedFromAI
                        ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {scannedFromAI ? 'AI Leaf Scan Active' : 'Microclimate Telemetry Calibration'}
                  </span>
                  {scannedFromAI && (
                    <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {confidenceScore}% AI Confidence
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white mt-0.5">
                  {scannedFromAI
                    ? `Scanned Target: ${primaryThreat.replace('AI Foliar Confirmed: ', '')}`
                    : 'Regional Microclimate Telemetry Baseline'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsScanModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black flex items-center gap-2 shadow-md cursor-pointer transition-transform hover:scale-102"
              >
                <Scan className="size-4" />
                <span>{scannedFromAI ? 'Run New AI Leaf Scan' : 'Run AI Leaf Scan to Calibrate'}</span>
              </button>
            </div>
          </div>

          {/* Diagnosis Telemetry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl frosted-glass-sub border border-white/60 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Host Crop Target</span>
              <span className="text-sm font-black text-slate-950 dark:text-white">{affectedCrop}</span>
            </div>

            <div className="p-3.5 rounded-2xl frosted-glass-sub border border-white/60 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Foliar Damage Impact</span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                {damagePercentage}% Surface Damage
              </span>
            </div>

            <div className="p-3.5 rounded-2xl frosted-glass-sub border border-white/60 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Observed Symptoms</span>
              <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                {symptomsList.join(' • ')}
              </p>
            </div>
          </div>
        </div>

        {/* 2. GEOLOCATION & REAL-TIME TELEMETRY SEARCH & SYNC BAR */}
        <div className="p-5 sm:p-6 rounded-[32px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-[var(--brand-color,#0f9a58)]" />
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">
                  Open-Meteo Precision Geocoding & Telemetry
                </h3>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Enter any Indian village, block, taluka, district, or PIN code for instant microclimate resolution
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => syncDeviceGPS()}
              className="px-4 py-2 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <Navigation className="size-4 text-[var(--brand-color,#0f9a58)]" />
              <span>Live Geo-Sync GPS</span>
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Type village, block, taluka, district, or PIN (e.g., Baramati, Shirur, Latur, 411001)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 text-xs sm:text-sm font-bold text-slate-950 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)]"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || isWeatherLoading}
              className="px-6 py-2.5 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 transition-transform hover:scale-105"
            >
              {isSearching || isWeatherLoading ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              <span>Query Location Radar</span>
            </button>
          </form>

          {/* 7 Live Atmospheric & Agronomic Sensor Layers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
            <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60 dark:border-white/10 text-center">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Elevation</span>
              <span className="text-sm font-black text-slate-950 dark:text-white">{weatherData.elevation || 560} m</span>
            </div>

            <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60 dark:border-white/10 text-center">
              <span className="text-[10px] font-black uppercase text-slate-500 block">VPD (Deficit)</span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-400">{weatherData.vpd || 1.42} kPa</span>
            </div>

            <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60 dark:border-white/10 text-center">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Wind Velocity</span>
              <span className="text-sm font-black text-teal-600 dark:text-teal-400">{weatherData.windSpeed} km/h</span>
            </div>

            <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60 dark:border-white/10 text-center">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Wind Gust</span>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400">{weatherData.windGust} km/h</span>
            </div>

            <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60 dark:border-white/10 text-center">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Azimuth Heading</span>
              <span className="text-sm font-black text-sky-600 dark:text-sky-400">{weatherData.windDirection}° ({downwindHeading.split(' ')[0]})</span>
            </div>

            <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60 dark:border-white/10 text-center">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Canopy Wetness</span>
              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{weatherData.leafWetness}</span>
            </div>

            <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60 dark:border-white/10 text-center">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Soil Moisture</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{weatherData.soilMoisture}%</span>
            </div>
          </div>
        </div>

        {/* ================================================================================= */}
        {/* INTERACTIVE GEOSPATIAL RADAR CONSOLE & LIVE MAP VIEW */}
        {/* ================================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Radar Screen Canvas / Visual Scope (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-[36px] frosted-card border border-white/80 dark:border-white/12 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Crosshair className="size-5 text-emerald-500 animate-spin" style={{ animationDuration: '8s' }} />
                <div>
                  <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Active Spatial Radar Display</span>
                    <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    Live 5-km Sector Radius • Azimuth {weatherData.windDirection}°
                  </p>
                </div>
              </div>

              {/* Layer Modes Switcher */}
              <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-white/40 dark:border-white/10 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setRadarLayer('vectors')}
                  className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                    radarLayer === 'vectors'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  Vectors
                </button>
                <button
                  type="button"
                  onClick={() => setRadarLayer('gdd')}
                  className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                    radarLayer === 'gdd'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  GDD Zones
                </button>
                <button
                  type="button"
                  onClick={() => setRadarLayer('spores')}
                  className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                    radarLayer === 'spores'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  Spores
                </button>
                <button
                  type="button"
                  onClick={() => setRadarLayer('satellite')}
                  className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                    radarLayer === 'satellite'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  Satellite
                </button>
              </div>
            </div>

            {/* RADAR CANVAS SCREEN (Interactive SVG Map Scope) */}
            <div className="relative aspect-square w-full max-w-[520px] mx-auto rounded-[32px] bg-slate-950 border-2 border-emerald-500/40 shadow-inner overflow-hidden flex items-center justify-center p-4 group select-none">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.4) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Concentric Range Rings */}
              <div className="absolute size-[30%] rounded-full border border-emerald-500/30 flex items-center justify-center">
                <span className="text-[9px] font-mono font-bold text-emerald-400/60 absolute -top-3">1 km</span>
              </div>
              <div className="absolute size-[60%] rounded-full border border-emerald-500/30 flex items-center justify-center">
                <span className="text-[9px] font-mono font-bold text-emerald-400/60 absolute -top-3">2.5 km</span>
              </div>
              <div className="absolute size-[90%] rounded-full border border-emerald-500/40 flex items-center justify-center">
                <span className="text-[9px] font-mono font-bold text-emerald-400/80 absolute -top-3">5 km Perimeter</span>
              </div>

              {/* Crosshair Axes */}
              <div className="absolute w-full h-[1px] bg-emerald-500/25" />
              <div className="absolute h-full w-[1px] bg-emerald-500/25" />

              {/* Cardinal Markers */}
              <span className="absolute top-2 font-black text-emerald-400 text-xs tracking-widest">N</span>
              <span className="absolute bottom-2 font-black text-emerald-400 text-xs tracking-widest">S</span>
              <span className="absolute right-3 font-black text-emerald-400 text-xs tracking-widest">E</span>
              <span className="absolute left-3 font-black text-emerald-400 text-xs tracking-widest">W</span>

              {/* DOWNWIND VECTOR PLUME CONE OVERLAY */}
              <svg className="absolute inset-0 size-full pointer-events-none" viewBox="0 0 100 100">
                <path
                  d={`M 50 50 L ${50 + 45 * Math.sin(((downwindDegrees - 25) * Math.PI) / 180)} ${
                    50 - 45 * Math.cos(((downwindDegrees - 25) * Math.PI) / 180)
                  } A 45 45 0 0 1 ${50 + 45 * Math.sin(((downwindDegrees + 25) * Math.PI) / 180)} ${
                    50 - 45 * Math.cos(((downwindDegrees + 25) * Math.PI) / 180)
                  } Z`}
                  fill="rgba(244, 63, 94, 0.22)"
                  stroke="rgba(244, 63, 94, 0.6)"
                  strokeDasharray="2 2"
                  strokeWidth="0.8"
                />
                <line
                  x1="50"
                  y1="50"
                  x2={50 + 42 * Math.sin((downwindDegrees * Math.PI) / 180)}
                  y2={50 - 42 * Math.cos((downwindDegrees * Math.PI) / 180)}
                  stroke="#f43f5e"
                  strokeWidth="1.8"
                  strokeDasharray="3 2"
                />
              </svg>

              {/* ROTATING RADAR SWEEP BEAM */}
              <div
                className="absolute size-full rounded-full pointer-events-none transition-transform"
                style={{
                  transform: `rotate(${sweepAngle}deg)`,
                  background:
                    'conic-gradient(from 0deg, rgba(16, 185, 129, 0.35) 0deg, rgba(16, 185, 129, 0) 60deg, transparent 360deg)',
                }}
              />

              {/* CENTER HUB MARKER */}
              <div className="absolute z-20 flex flex-col items-center">
                <span className="size-4 rounded-full bg-emerald-500 border-2 border-white shadow-lg shadow-emerald-500/80 animate-pulse" />
                <span className="text-[10px] font-black bg-slate-900/90 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40 mt-1 whitespace-nowrap">
                  HQ: {activeLocation.split(',')[0]}
                </span>
              </div>

              {/* HOTSPOT PARCEL NODES */}
              {hotspotParcels.map((parcel) => {
                const radiusPct = Math.min(42, (parcel.distanceKm / 5) * 42);
                const rad = (parcel.bearingDeg * Math.PI) / 180;
                const xPct = 50 + radiusPct * Math.sin(rad);
                const yPct = 50 - radiusPct * Math.cos(rad);
                const isSelected = parcel.id === selectedParcelId;

                return (
                  <button
                    key={parcel.id}
                    type="button"
                    onClick={() => setSelectedParcelId(parcel.id)}
                    style={{ left: `${xPct}%`, top: `${yPct}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-all cursor-pointer group/node ${
                      isSelected ? 'scale-125 z-40' : 'hover:scale-110'
                    }`}
                  >
                    <div className="relative flex items-center justify-center">
                      <span
                        className={`size-5 rounded-full flex items-center justify-center font-mono text-[9px] font-black text-white shadow-lg border ${
                          parcel.threatLevel === 'Critical'
                            ? 'bg-rose-600 border-rose-300 shadow-rose-500/80 animate-bounce'
                            : parcel.threatLevel === 'Severe'
                            ? 'bg-rose-500 border-rose-200 shadow-rose-500/50'
                            : parcel.threatLevel === 'Moderate'
                            ? 'bg-amber-500 border-amber-200 shadow-amber-500/50'
                            : 'bg-emerald-600 border-emerald-200'
                        }`}
                      >
                        {parcel.id.toUpperCase()}
                      </span>

                      <div className="absolute left-6 whitespace-nowrap bg-slate-900/95 text-white text-[10px] p-1.5 rounded-lg border border-slate-700 shadow-xl opacity-90 pointer-events-none transition-opacity font-medium">
                        <span className="font-bold text-emerald-400">{parcel.name.split('(')[0]}</span>
                        <div className="text-[9px] text-slate-300">
                          {parcel.distanceKm} km • {parcel.primaryPest.split('(')[0]}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              <div className="absolute bottom-2 right-3 left-3 z-20 flex justify-between items-center text-[10px] font-mono font-bold text-emerald-400/90 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-emerald-500/30 backdrop-blur-md">
                <span>WIND DRIFT: {downwindHeading}</span>
                <span>BUFFER: {quarantineRadiusMeters} M</span>
                <span>SWEEP: {isRadarScanning ? 'ACTIVE' : 'PAUSED'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex size-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                </span>
                <span>Tap any parcel node on radar to inspect microclimate vectors</span>
              </div>

              <button
                type="button"
                onClick={() => setIsRadarScanning(!isRadarScanning)}
                className="px-3 py-1.5 rounded-xl frosted-glass-sub border border-white/60 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer hover:bg-white dark:hover:bg-slate-700"
              >
                {isRadarScanning ? 'Pause Sweep Beam' : 'Resume Sweep Beam'}
              </button>
            </div>
          </div>

          {/* Selected Target Parcel Detail Panel (5 cols) */}
          <div className="lg:col-span-5 p-6 rounded-[36px] frosted-card border border-white/80 dark:border-white/12 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Locate className="size-5 text-[var(--brand-color,#0f9a58)]" />
                <div>
                  <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">
                    Target Parcel Telemetry
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    Focused Node: {selectedParcel.id.toUpperCase()}
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-black px-3 py-1 rounded-full text-white shadow-2xs ${
                  selectedParcel.threatLevel === 'Critical' || selectedParcel.threatLevel === 'Severe'
                    ? 'bg-rose-600'
                    : selectedParcel.threatLevel === 'Moderate'
                    ? 'bg-amber-600'
                    : 'bg-emerald-600'
                }`}
              >
                {selectedParcel.threatLevel} Threat
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl frosted-glass-sub border border-white/60 dark:border-white/10 space-y-2">
                <h4 className="font-black text-slate-950 dark:text-white text-sm">
                  {selectedParcel.name}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-bold block">Distance / Bearing</span>
                    <strong className="text-slate-900 dark:text-white">{selectedParcel.distanceKm} km @ {selectedParcel.bearingDeg}°</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-bold block">Primary Host Crop</span>
                    <strong className="text-slate-900 dark:text-white">{selectedParcel.crop}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-bold block">Dominant Vector</span>
                    <strong className="text-rose-600 dark:text-rose-400">{selectedParcel.primaryPest}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-bold block">Pest Count / Trap</span>
                    <strong className="text-slate-900 dark:text-white">{selectedParcel.vectorCount} adults/acre</strong>
                  </div>
                </div>
              </div>

              {/* Action Cordon Warning */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 space-y-1">
                <div className="flex items-center justify-between font-black">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="size-4 text-amber-600" /> Vector Containment Cordon
                  </span>
                  <span>{quarantineRadiusMeters} m Radius</span>
                </div>
                <p className="text-[11px] font-medium leading-relaxed">
                  Downwind trajectory heading towards <strong>{downwindHeading}</strong>. Deploy perimeter sticky traps and restrict movement between sectors.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyWhatsAppAdvisory}
                  className="flex-1 py-2.5 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-102"
                >
                  {copiedAdvisory ? <Check className="size-4" /> : <Copy className="size-4" />}
                  <span>{copiedAdvisory ? 'Advisory Copied!' : 'Copy WhatsApp Advisory'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSpeechBroadcast}
                  className="px-3.5 py-2.5 rounded-2xl frosted-glass-sub border border-white/60 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer"
                  title="Listen to Audio Advisory"
                >
                  {isSpeaking ? <VolumeX className="size-4 text-rose-500" /> : <Volume2 className="size-4 text-emerald-500" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================================= */}
        {/* SECTION 2: COMPREHENSIVE DYNAMIC REMEDIES & ICAR PROTOCOLS (3 PATHWAYS) */}
        {/* ================================================================================= */}
        <div className="p-6 sm:p-8 rounded-[36px] frosted-card border border-white/80 dark:border-white/12 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/10 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/15 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] text-xs font-black uppercase tracking-wider">
                  ICAR / CIBRC Standard Protocols
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Integrated Pest Management (IPM) Pathways
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                IPM & Remediation Protocol Matrix
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                3 distinct, scientifically validated remediation pathways tailored for {affectedCrop} against {primaryThreat}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pathway A: Biological & Botanical Remedy Card (Zero-Residue) */}
            <div className="p-5 rounded-[28px] frosted-glass-sub border border-emerald-500/30 flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-2.5">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <Sprout className="size-5" />
                    <h3 className="text-sm font-black uppercase tracking-wider">
                      A. Bio & Botanical (Zero-Residue)
                    </h3>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                    Organic / Export Safe
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-2xl frosted-card border border-white/60 space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Botanical Extract Formulation</span>
                    <p className="font-bold text-slate-950 dark:text-white leading-relaxed">
                      {biologicalTreatmentList[0]}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl frosted-card border border-white/60 space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Bio-Predator & Parasitoid Dosage</span>
                    <p className="font-bold text-slate-950 dark:text-white leading-relaxed">
                      {biologicalTreatmentList[1] || 'Release predatory ladybird beetles Cryptolaemus montrouzieri @ 10-15 beetles/tree.'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBioSimOpen(true)}
                className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-transform hover:scale-102"
              >
                <FlaskConical className="size-4" />
                <span>Open Bio-Control Batch Calculator</span>
              </button>
            </div>

            {/* Pathway B: Target Chemical Protocol Card (Emergency Knockdown) */}
            <div className="p-5 rounded-[28px] frosted-glass-sub border border-rose-500/30 flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-2.5">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                    <Flame className="size-5" />
                    <h3 className="text-sm font-black uppercase tracking-wider">
                      B. Emergency Knockdown
                    </h3>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30">
                    ICAR Approved
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-2xl frosted-card border border-white/60 space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Active CIBRC Molecule & Rate</span>
                    <p className="font-bold text-slate-950 dark:text-white leading-relaxed">
                      {chemicalTreatmentList[0]}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl frosted-card border border-white/60 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                      <span>Pre-Harvest Interval (PHI)</span>
                      <span className="text-rose-600 font-bold">7 - 14 Days</span>
                    </div>
                    <p className="font-bold text-slate-950 dark:text-white text-[11px]">
                      Nozzle: Hollow Cone Nozzle @ 2.5 - 3.0 bar pressure.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTankMixOpen(true)}
                className="w-full py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-transform hover:scale-102"
              >
                <Wrench className="size-4" />
                <span>Calibrate Knapsack vs Drone Tank Dosage</span>
              </button>
            </div>

            {/* Pathway C: Cultural & Preventive Quarantine Card */}
            <div className="p-5 rounded-[28px] frosted-glass-sub border border-sky-500/30 flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-2.5">
                  <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400">
                    <ShieldCheck className="size-5" />
                    <h3 className="text-sm font-black uppercase tracking-wider">
                      C. Cultural & Quarantine
                    </h3>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/30">
                    Preventive Cordon
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-2xl frosted-card border border-white/60 space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Sanitation & Pruning</span>
                    <p className="font-bold text-slate-950 dark:text-white leading-relaxed">
                      {preventiveMeasuresList[0]}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl frosted-card border border-white/60 space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Trap & Barrier Density</span>
                    <p className="font-bold text-slate-950 dark:text-white leading-relaxed">
                      {preventiveMeasuresList[1] || 'Install 8-10 pheromone delta traps per acre along bunds.'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="w-full py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-transform hover:scale-102"
              >
                <Target className="size-4" />
                <span>Launch Studio Quarantine Modal</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================================================================================= */}
        {/* SECTION 3: LIVE MICROCLIMATE PHYSICS & VECTOR VIABILITY FILTERING */}
        {/* ================================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sliders & Controls (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-[32px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="size-5 text-[var(--brand-color,#0f9a58)]" />
                <div>
                  <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">
                    Microclimate Atmospheric Sliders
                  </h3>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Adjust atmospheric conditions to simulate real-time vector surge physics
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTempOverride(weatherData.temp || 29);
                  setRhOverride(weatherData.humidity || 62);
                  setWindOverride(weatherData.windSpeed || 12);
                }}
                className="px-3 py-1 rounded-xl frosted-glass-sub border border-white/60 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Reset Sensors
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Temp */}
              <div className="p-4 rounded-2xl frosted-glass-sub border border-white/60 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="flex items-center gap-1 text-rose-600">
                    <Thermometer className="size-4" /> Ambient Temp
                  </span>
                  <span className="text-sm font-black text-slate-950 dark:text-white">{tempOverride}°C</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="45"
                  value={tempOverride}
                  onChange={(e) => setTempOverride(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-600"
                />
              </div>

              {/* RH */}
              <div className="p-4 rounded-2xl frosted-glass-sub border border-white/60 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="flex items-center gap-1 text-sky-600">
                    <Droplets className="size-4" /> Canopy RH
                  </span>
                  <span className="text-sm font-black text-slate-950 dark:text-white">{rhOverride}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={rhOverride}
                  onChange={(e) => setRhOverride(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
              </div>

              {/* Wind */}
              <div className="p-4 rounded-2xl frosted-glass-sub border border-white/60 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="flex items-center gap-1 text-teal-600">
                    <Wind className="size-4" /> Surface Wind
                  </span>
                  <span className="text-sm font-black text-slate-950 dark:text-white">{windOverride} km/h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  value={windOverride}
                  onChange={(e) => setWindOverride(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>
            </div>

            {/* Microclimate Equations Output */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 space-y-1">
                <span className="text-[10px] font-black uppercase text-teal-700 dark:text-teal-300 block">
                  Dynamic Quarantine Buffer Formula
                </span>
                <p className="font-mono font-black text-slate-950 dark:text-white text-sm">
                  {quarantineRadiusMeters} Meters Cordon
                </p>
                <span className="text-[10px] text-slate-600 dark:text-slate-300 block">
                  Buffer = max(30, round(50 + ({windOverride} * 4.2)))
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 block">
                  Degree-Day (GDD) Accumulation
                </span>
                <p className="font-mono font-black text-slate-950 dark:text-white text-sm">
                  {gddAccumulated} GDD (14-day cumulative)
                </p>
                <span className="text-[10px] text-slate-600 dark:text-slate-300 block">
                  Mealybug T_base 8.5°C • Thrips T_base 10.0°C
                </span>
              </div>
            </div>
          </div>

          {/* Vector Viability List (5 cols) */}
          <div className="lg:col-span-5 p-6 rounded-[32px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Bug className="size-5 text-rose-500" />
                <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">
                  Microclimate Vector Viability Filter
                </h3>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              {pestVectorViabilities.map((v, vIdx) => (
                <div
                  key={vIdx}
                  className={`p-3 rounded-2xl border transition-all ${
                    v.isViable
                      ? 'bg-rose-500/10 border-rose-500/30 text-slate-950 dark:text-white'
                      : 'bg-slate-200/40 dark:bg-slate-800/40 border-slate-300 dark:border-white/10 opacity-55'
                  }`}
                >
                  <div className="flex items-center justify-between font-black">
                    <span className={!v.isViable ? 'line-through text-slate-500' : ''}>
                      {v.name}
                    </span>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        v.isViable
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {v.isViable ? 'VIABLE HAZARD' : 'SUPPRESSED'}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-1">
                    {v.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================================================================================= */}
        {/* SECTION 4: ECONOMIC CROP LOSS & MONETARY REMEDY VALUE */}
        {/* ================================================================================= */}
        <div className="p-6 sm:p-8 rounded-[36px] frosted-card border border-white/80 dark:border-white/12 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/10 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/15 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] text-xs font-black uppercase tracking-wider">
                  Economic Loss & Financial ROI
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Monetary Value of Timely Intervention
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                Potential Revenue at Risk & Net Intervention Savings
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                Field Acreage: <strong>{fieldAcres} Acres</strong> ({affectedCrop}) • Estimated Market Value: ₹{evalData.cropValuePerAcreINR.toLocaleString('en-IN')}/Acre
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Acres:
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="50"
                value={fieldAcres}
                onChange={(e) => setFieldAcres(Number(e.target.value))}
                className="w-20 px-3 py-1.5 rounded-xl frosted-glass-sub border border-white/70 dark:border-white/10 text-xs font-black font-mono text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color,#0f9a58)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 rounded-[28px] frosted-glass-sub border border-rose-500/30 space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                Potential Revenue at Risk
              </span>
              <div className="text-3xl font-black text-slate-950 dark:text-white font-mono">
                ₹{estimatedLossINR.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-650 dark:text-slate-300 font-medium">
                Based on {damagePercentage}% foliar damage across {fieldAcres} acres of {affectedCrop}.
              </p>
            </div>

            <div className="p-5 rounded-[28px] frosted-glass-sub border border-emerald-500/30 space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--brand-color,#0f9a58)] block">
                Net Monetary Savings from Remedy
              </span>
              <div className="text-3xl font-black text-[var(--brand-color,#0f9a58)] font-mono">
                ₹{savingsFromRemedyINR.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-650 dark:text-slate-300 font-medium">
                85% crop recovery value minus input cost (₹{treatmentCostINR.toLocaleString('en-IN')}).
              </p>
            </div>

            <div className="p-5 rounded-[28px] bg-[var(--brand-subtle,#f0faf4)] border border-[var(--brand-border)] flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[var(--brand-text,#0d7342)] block">
                  Procure Input Medicines
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mt-1">
                  Procure verified ICAR bio-agents & CIBRC chemicals at nearest Krishi Kendra.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsShopOpen(true)}
                className="w-full py-3 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-transform hover:scale-102"
              >
                <ShoppingCart className="size-4" />
                <span>Order Remedy Inputs on Kisan Shop</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4-PHASE MULTI-STAGE RADAR EXECUTION SIMULATION BAR */}
        <div className="p-6 rounded-[32px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25">
                  Execution Pipeline
                </span>
                <span className="text-xs font-bold text-slate-650 dark:text-slate-300">
                  4-Phase Epidemiological Engine Loop
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white mt-1">
                Active Radar Physics Execution Status
              </h3>
            </div>

            <button
              type="button"
              onClick={handleRunRadarSimulation}
              disabled={isSimulating}
              className="px-5 py-2.5 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer transition-transform hover:scale-105 shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Executing Physics Loop...' : 'Rescan Radar Physics'}</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-800 dark:text-slate-200">{simStage}</span>
              <span className="text-[var(--brand-color,#0f9a58)] font-mono font-black">{simProgress}%</span>
            </div>
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/60 dark:border-white/10">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${simProgress}%` }}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />

      {/* MODAL DIALOGS */}
      <OutbreakWarningModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <PestDiagnosisModal isOpen={isScanModalOpen} onClose={() => setIsScanModalOpen(false)} />

      <KisanShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        initialCategory="crop_protection"
        initialSearchQuery={primaryThreat.replace('AI Foliar Confirmed: ', '')}
      />

      {/* Bio-Control Batch Simulator Modal */}
      <AnimatePresence>
        {isBioSimOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBioSimOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-50 dark:bg-slate-950 rounded-[32px] border border-white/80 dark:border-white/12 p-6 shadow-2xl z-10"
            >
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200 dark:border-white/10">
                <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <FlaskConical className="size-5 text-emerald-500" />
                  Bio-Control Formulation Batch Calculator
                </h3>
                <button
                  type="button"
                  onClick={() => setIsBioSimOpen(false)}
                  className="p-2 rounded-full frosted-glass-sub text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  <X className="size-5" />
                </button>
              </div>
              <BioControlSimulator
                onClose={() => setIsBioSimOpen(false)}
                onOpenShop={(cat) => {
                  setIsBioSimOpen(false);
                  setIsShopOpen(true);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tank Mix / Dosage Calibrator Modal */}
      <AnimatePresence>
        {isTankMixOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTankMixOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-50 dark:bg-slate-950 rounded-[32px] border border-white/80 dark:border-white/12 p-6 shadow-2xl z-10"
            >
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200 dark:border-white/10">
                <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <Wrench className="size-5 text-rose-500" />
                  Knapsack vs Drone Tank Dosage Calibrator
                </h3>
                <button
                  type="button"
                  onClick={() => setIsTankMixOpen(false)}
                  className="p-2 rounded-full frosted-glass-sub text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  <X className="size-5" />
                </button>
              </div>
              <TankMixSimulator
                onOpenShop={() => {
                  setIsTankMixOpen(false);
                  setIsShopOpen(true);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
