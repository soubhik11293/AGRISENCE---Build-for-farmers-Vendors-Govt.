import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Radio,
  X,
  Volume2,
  VolumeX,
  Thermometer,
  Droplets,
  Wind,
  MapPin,
  RefreshCw,
  Bug,
  Search,
  Loader2,
  Navigation,
  Sprout as Sparkles,
  ArrowRight,
  Maximize2,
  Scan,
  FlaskConical,
  Wrench,
  Target,
  Sliders,
  Crosshair,
  Locate,
  Check,
  Copy,
  Sprout,
  Flame,
  ShieldCheck,
  ShoppingCart,
  Calculator,
  AlertTriangle,
} from 'lucide-react';
import { ActiveParcelSelector } from '@/src/components/dashboard/active-parcel-selector';
import { saveOutbreakEvaluation } from '@/src/lib/platform-sync';
import { useLanguage } from '@/src/context/language-context';
import { useDiagnosis } from '@/src/context/diagnosis-context';
import { useTelemetry } from '@/src/context/telemetry-context';
import { KisanShopModal } from '@/src/components/kisan-shop-modal';
import { PestDiagnosisModal } from '@/src/components/pest-diagnosis-modal';
import { BioControlSimulator } from '@/src/components/bio-control-simulator';
import { TankMixSimulator } from '@/src/components/tank-mix-simulator';

interface OutbreakWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
}

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

export function OutbreakWarningModal({ isOpen, onClose, onNavigate }: OutbreakWarningModalProps) {
  const { t } = useLanguage();
  const { activeDiagnosis } = useDiagnosis();
  const { weatherData, fetchWeather, isWeatherLoading, refreshWeather, syncDeviceGPS } = useTelemetry();

  // Child Modals Management
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isBioSimOpen, setIsBioSimOpen] = useState(false);
  const [isTankMixOpen, setIsTankMixOpen] = useState(false);

  // Search & Geocoding state
  const [searchLocation, setSearchLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Sound & Speech Synthesis
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copiedAdvisory, setCopiedAdvisory] = useState<boolean>(false);

  // Radar Scope View Controls
  const [radarLayer, setRadarLayer] = useState<'vectors' | 'gdd' | 'spores' | 'satellite'>('vectors');
  const [selectedParcelId, setSelectedParcelId] = useState<string>('p1');
  const [isRadarScanning, setIsRadarScanning] = useState<boolean>(true);
  const [sweepAngle, setSweepAngle] = useState<number>(0);

  // Field acreage state
  const [fieldAcres, setFieldAcres] = useState<number>(2.5);

  // Simulation execution loop state
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Interactive Microclimate Override Sliders
  const [tempOverride, setTempOverride] = useState<number>(weatherData.temp || 29);
  const [rhOverride, setRhOverride] = useState<number>(weatherData.humidity || 62);
  const [windOverride, setWindOverride] = useState<number>(weatherData.windSpeed || 12);

  // Sync state dynamically when live weather telemetry updates
  useEffect(() => {
    if (weatherData) {
      setTempOverride(weatherData.temp || 29);
      setRhOverride(weatherData.humidity || 62);
      setWindOverride(weatherData.windSpeed || 12);
    }
  }, [weatherData]);

  // Continuous Radar Sweep Beam Animation Loop
  useEffect(() => {
    if (!isOpen || !isRadarScanning) return;
    const interval = setInterval(() => {
      setSweepAngle((prev) => (prev + 3) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isOpen, isRadarScanning]);

  const activeLocation = weatherData.locationName || 'Pune / Baramati Sector';

  // --- MATHEMATICAL & BIOLOGICAL EPIDEMIOLOGICAL MODELS ---
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
    let affectedCrop = activeDiagnosis?.affectedCrop || 'Soybean / Cotton / Pomegranate';
    let primaryThreat = 'Microclimate Equilibrium • Low Vector Dispersal';
    let scientificName = 'Planococcus citri / Microclimate Equilibrium';
    let damagePercentage = activeDiagnosis?.damagePercentage || (hazardLevel === 'Critical' ? 45 : hazardLevel === 'Severe' ? 28 : 12);
    let confidenceScore = activeDiagnosis?.confidence || 94;
    let symptomsList = activeDiagnosis?.symptoms || [
      'Wax secretion on vegetative terminal nodes',
      'Sooty mold growth along sub-canopy leaves',
      'Foliar chlorosis and feeding punctures',
    ];

    if (activeDiagnosis) {
      primaryThreat = `AI Foliar Confirmed: ${activeDiagnosis.pestName}`;
      scientificName = activeDiagnosis.scientificName || 'Planococcus citri Complex';
    } else {
      if (hazardLevel === 'Critical') {
        primaryThreat = 'Critical Outbreak Risk: Rapid Thermal Eclosion & Fungal Spore Explosion';
        scientificName = 'Planococcus citri / Magnaporthe oryzae Complex';
      } else if (hazardLevel === 'Severe') {
        primaryThreat = 'Severe Vector Threat: High Crawler Mobility & Canopy Spore Germination';
        scientificName = 'Planococcus citri / Spodoptera frugiperda';
      } else if (hazardLevel === 'Moderate') {
        primaryThreat = 'Moderate Hazard: Sucking Pest Vector Multiplication Active';
        scientificName = 'Scirtothrips dorsalis / Tetranychus urticae';
      }
    }

    // Comprehensive Remediation Pathways
    let biologicalTreatmentList: string[] = activeDiagnosis?.biologicalTreatment?.length
      ? activeDiagnosis.biologicalTreatment
      : [
          '5% Neem Seed Kernel Extract (NSKE) @ 5 ml/L + 1 ml/L Khadi soap surfactant.',
          'Release predatory ladybird beetles (Cryptolaemus montrouzieri) @ 10-15 beetles per tree or 100-120/acre.',
          'Inundative release of Trichogramma chilonis egg parasitoid cards @ 50,000 eggs/acre.',
        ];

    let chemicalTreatmentList: string[] = activeDiagnosis?.chemicalTreatment?.length
      ? activeDiagnosis.chemicalTreatment
      : [
          'Foliar spray of Buprofezin 25% SC @ 1.25 ml/L or Spirotetramat 150 OD @ 1 ml/L.',
          'Emergency knockdown with Profenofos 50% EC @ 2 ml/L or Chlorantraniliprole 18.5% SC @ 0.4 ml/L.',
          'Apply organosilicone super-spreader adjuvant @ 0.3 ml/L for complete wax layer penetration.',
        ];

    let preventiveMeasuresList: string[] = activeDiagnosis?.preventiveMeasures?.length
      ? activeDiagnosis.preventiveMeasures
      : [
          'Prune and burn heavily infested terminal shoots and fallen fruit debris.',
          'Apply 5-inch yellow sticky grease barrier bands around main tree trunks.',
          'Install 8-10 pheromone delta traps per acre along leeward bunds for adult moth monitoring.',
        ];

    const bioDosageText = biologicalTreatmentList[0] || 'Apply 5% NSKE @ 5 ml/L + predatory beetles release.';
    const chemicalProtocolText = chemicalTreatmentList[0] || 'Spray Buprofezin 25% SC @ 1.25 ml/L with hollow cone nozzle.';

    // Economic Crop Loss & Value Calculations
    let cropValuePerAcreINR = 65000;
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
        primaryPest: primaryThreat.replace('AI Foliar Confirmed: ', '').split(':')[0] || 'Mealybug',
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

  // Persist State to LocalStorage for Dashboard Synchronization
  useEffect(() => {
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
      // Ignore storage error
    }
  }, [activeLocation, evalData]);

  const playAlertChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = hazardLevel === 'Severe' || hazardLevel === 'Critical' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(hazardLevel === 'Severe' || hazardLevel === 'Critical' ? 880 : 440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(hazardLevel === 'Severe' || hazardLevel === 'Critical' ? 440 : 880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // ignore
    }
  };

  const handleSimulateScan = async () => {
    setIsScanning(true);
    setTimeout(async () => {
      await refreshWeather();
      setIsScanning(false);
      playAlertChime();
    }, 1200);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLocation.trim()) return;
    setIsSearching(true);
    try {
      await fetchWeather(searchLocation.trim());
      setSearchLocation('');
      playAlertChime();
    } finally {
      setIsSearching(false);
    }
  };

  // WhatsApp Community Advisory Copy
  const handleCopyWhatsAppAdvisory = () => {
    const advisoryText = `🚨 *AGRISENSE HYPERLOCAL OUTBREAK ADVISORY* 🚨\n📍 *Location:* ${activeLocation}\n⚡ *Hazard Tier:* ${hazardLevel.toUpperCase()}\n🦠 *Threat:* ${primaryThreat}\n🔬 *Taxa:* ${scientificName}\n🍃 *Crop:* ${affectedCrop} (${damagePercentage}% Foliar Impact)\n📐 *Quarantine Cordon:* ${quarantineRadiusMeters} meters\n💨 *Downwind Drift Corridor:* ${downwindHeading}\n💰 *Revenue at Risk:* ₹${estimatedLossINR.toLocaleString('en-IN')}\n\n🌿 *Bio-Control Protocol:* ${bioDosage}\n🧪 *Chemical Knockdown:* ${chemicalProtocol}\n\n_Generated live via AgriSense Microclimate Radar Network_`;
    navigator.clipboard.writeText(advisoryText);
    setCopiedAdvisory(true);
    setTimeout(() => setCopiedAdvisory(false), 2500);
  };

  // TTS Speech Broadcast
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

  useEffect(() => {
    if (isOpen) {
      playAlertChime();
    }
  }, [isOpen, hazardLevel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md transition-opacity"
          />

          {/* WIDE MODAL CONTAINER (max-w-7xl) WITH EMBEDDED FULL RADAR STUDIO */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative w-full max-w-6xl sm:max-w-7xl lg:max-w-[95vw] rounded-[36px] frosted-card border border-white/80 dark:border-white/12 p-4 sm:p-6 shadow-2xl z-10 space-y-6 max-h-[94vh] overflow-y-auto text-slate-950 dark:text-slate-100"
          >
            <ActiveParcelSelector compact />
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`size-11 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
                    hazardLevel === 'Severe' || hazardLevel === 'Critical'
                      ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                      : hazardLevel === 'Moderate'
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-[var(--brand-color,#0f9a58)] border border-[var(--brand-border)]'
                  }`}
                >
                  <ShieldAlert className="size-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25">
                      Interactive Radar Studio • Modal
                    </span>
                    <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight mt-0.5">
                    Hyperlocal Pest & Pathogen Outbreak Radar
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSpeechBroadcast}
                  className="p-2.5 rounded-2xl frosted-glass-sub text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-white/70 dark:border-white/10 transition-colors cursor-pointer shadow-2xs"
                  title="Listen to Audio Advisory"
                >
                  {isSpeaking ? <VolumeX className="size-4 text-rose-500" /> : <Volume2 className="size-4 text-[var(--brand-color,#0f9a58)]" />}
                </button>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2.5 rounded-2xl frosted-glass-sub text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-white/70 dark:border-white/10 transition-colors cursor-pointer shadow-2xs"
                  title={soundEnabled ? 'Mute Alert Chimes' : 'Enable Alert Chimes'}
                >
                  {soundEnabled ? <Radio className="size-4 text-[var(--brand-color,#0f9a58)] animate-pulse" /> : <VolumeX className="size-4" />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="size-9 rounded-full frosted-glass-sub hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer border border-white/60 dark:border-white/10"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* AI PEST SCANNER INTEGRATION BANNER */}
            <div className="p-4 sm:p-5 rounded-[28px] frosted-card border border-white/80 dark:border-white/12 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`size-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
                      scannedFromAI
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    }`}
                  >
                    <Scan className="size-5 stroke-[2.2]" />
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
                        {scannedFromAI ? 'AI Leaf Scan Active' : 'Regional Microclimate Telemetry Baseline'}
                      </span>
                      {scannedFromAI && (
                        <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {confidenceScore}% AI Confidence
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-black text-slate-950 dark:text-white mt-0.5">
                      {scannedFromAI
                        ? `Scanned Target: ${primaryThreat.replace('AI Foliar Confirmed: ', '')}`
                        : 'Regional Microclimate Telemetry Baseline'}
                    </h4>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsScanModalOpen(true)}
                  className="px-4 py-2 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-102 shrink-0"
                >
                  <Scan className="size-3.5" />
                  <span>{scannedFromAI ? 'Run New AI Leaf Scan' : 'Run AI Leaf Scan to Calibrate'}</span>
                </button>
              </div>

              {/* Diagnosis Telemetry Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60 space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Host Crop Target</span>
                  <span className="text-xs font-black text-slate-950 dark:text-white">{affectedCrop}</span>
                </div>

                <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60 space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Foliar Damage Impact</span>
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 font-mono">
                    {damagePercentage}% Surface Damage
                  </span>
                </div>

                <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60 space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Observed Symptoms</span>
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {symptomsList.join(' • ')}
                  </p>
                </div>
              </div>
            </div>

            {/* LOCATION SEARCH & GEOLOCATION BAR */}
            <div className="p-4 rounded-[28px] frosted-glass-sub border border-white/70 dark:border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white">
                  <MapPin className="size-4 text-[var(--brand-color,#0f9a58)] shrink-0" />
                  <span>Active Location:</span>
                  <span className="text-[var(--brand-text,#0d7342)] font-mono truncate max-w-[280px]">
                    {activeLocation}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => syncDeviceGPS()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] text-xs font-black flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Navigation className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
                  <span>Live GPS Sync</span>
                </button>
              </div>

              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="size-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    placeholder="Search village, block, district, or PIN (e.g., Baramati, Shirur)..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl frosted-card border border-white/70 dark:border-white/10 text-xs font-bold text-slate-950 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--brand-color,#0f9a58)]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || isWeatherLoading}
                  className="px-4 py-1.5 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isSearching || isWeatherLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3.5" />
                  )}
                  <span>Query Radar</span>
                </button>
              </form>
            </div>

            {/* INTERACTIVE GEOSPATIAL RADAR CONSOLE GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Radar Scope Visual (7 cols) */}
              <div className="lg:col-span-7 p-5 rounded-[32px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-3 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Crosshair className="size-4 text-emerald-500 animate-spin" style={{ animationDuration: '8s' }} />
                    <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Spatial Radar Canvas</span>
                      <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                    </h4>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-xl border border-white/40 dark:border-white/10 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setRadarLayer('vectors')}
                      className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                        radarLayer === 'vectors' ? 'bg-emerald-600 text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Vectors
                    </button>
                    <button
                      type="button"
                      onClick={() => setRadarLayer('gdd')}
                      className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                        radarLayer === 'gdd' ? 'bg-rose-600 text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      GDD
                    </button>
                    <button
                      type="button"
                      onClick={() => setRadarLayer('spores')}
                      className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                        radarLayer === 'spores' ? 'bg-sky-600 text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Spores
                    </button>
                  </div>
                </div>

                {/* Radar Scope Display */}
                <div className="relative aspect-square w-full max-w-[460px] mx-auto rounded-[28px] bg-slate-950 border-2 border-emerald-500/40 shadow-inner overflow-hidden flex items-center justify-center p-3 select-none">
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

                  {/* Axes */}
                  <div className="absolute w-full h-[1px] bg-emerald-500/25" />
                  <div className="absolute h-full w-[1px] bg-emerald-500/25" />

                  {/* Cardinal Markers */}
                  <span className="absolute top-2 font-black text-emerald-400 text-[10px] tracking-widest">N</span>
                  <span className="absolute bottom-2 font-black text-emerald-400 text-[10px] tracking-widest">S</span>
                  <span className="absolute right-2 font-black text-emerald-400 text-[10px] tracking-widest">E</span>
                  <span className="absolute left-2 font-black text-emerald-400 text-[10px] tracking-widest">W</span>

                  {/* Downwind Vector Plume Cone */}
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

                  {/* Rotating Sweep Beam */}
                  <div
                    className="absolute size-full rounded-full pointer-events-none transition-transform"
                    style={{
                      transform: `rotate(${sweepAngle}deg)`,
                      background:
                        'conic-gradient(from 0deg, rgba(16, 185, 129, 0.35) 0deg, rgba(16, 185, 129, 0) 60deg, transparent 360deg)',
                    }}
                  />

                  {/* Center Hub */}
                  <div className="absolute z-20 flex flex-col items-center">
                    <span className="size-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-lg shadow-emerald-500/80 animate-pulse" />
                    <span className="text-[9px] font-black bg-slate-900/90 text-emerald-300 px-1 py-0.5 rounded border border-emerald-500/40 mt-1 whitespace-nowrap">
                      HQ: {activeLocation.split(',')[0]}
                    </span>
                  </div>

                  {/* Hotspot Parcels */}
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
                            className={`size-4.5 rounded-full flex items-center justify-center font-mono text-[8px] font-black text-white shadow-lg border ${
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

                          <div className="absolute left-5 whitespace-nowrap bg-slate-900/95 text-white text-[9px] p-1 rounded-md border border-slate-700 shadow-xl opacity-90 pointer-events-none transition-opacity font-medium">
                            <span className="font-bold text-emerald-400">{parcel.name.split('(')[0]}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  <div className="absolute bottom-2 right-2 left-2 z-20 flex justify-between items-center text-[9px] font-mono font-bold text-emerald-400/90 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-emerald-500/30 backdrop-blur-md">
                    <span>DRIFT: {downwindHeading}</span>
                    <span>CORDON: {quarantineRadiusMeters} M</span>
                  </div>
                </div>
              </div>

              {/* Target Parcel Telemetry (5 cols) */}
              <div className="lg:col-span-5 p-5 rounded-[32px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Locate className="size-4 text-[var(--brand-color,#0f9a58)]" />
                    <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">
                      Selected Parcel Node ({selectedParcel.id.toUpperCase()})
                    </h4>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full text-white ${
                      selectedParcel.threatLevel === 'Critical' || selectedParcel.threatLevel === 'Severe'
                        ? 'bg-rose-600'
                        : selectedParcel.threatLevel === 'Moderate'
                        ? 'bg-amber-600'
                        : 'bg-emerald-600'
                    }`}
                  >
                    {selectedParcel.threatLevel} Tier
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60 space-y-1.5">
                    <h5 className="font-black text-slate-950 dark:text-white text-xs">
                      {selectedParcel.name}
                    </h5>
                    <div className="grid grid-cols-2 gap-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                      <div>
                        <span className="text-[9px] uppercase text-slate-500 font-bold block">Distance</span>
                        <strong className="text-slate-900 dark:text-white">{selectedParcel.distanceKm} km @ {selectedParcel.bearingDeg}°</strong>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-slate-500 font-bold block">Crop</span>
                        <strong className="text-slate-900 dark:text-white">{selectedParcel.crop}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-slate-500 font-bold block">Dominant Pest</span>
                        <strong className="text-rose-600 dark:text-rose-400">{selectedParcel.primaryPest}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-slate-500 font-bold block">Vector Count</span>
                        <strong className="text-slate-900 dark:text-white">{selectedParcel.vectorCount} adults/acre</strong>
                      </div>
                    </div>
                  </div>

                  {/* Action Cordon Warning */}
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-black">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="size-3.5 text-amber-600" /> Vector Cordon
                      </span>
                      <span>{quarantineRadiusMeters} m Radius</span>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed">
                      Downwind trajectory towards <strong>{downwindHeading}</strong>. Restrict movement across sectors.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyWhatsAppAdvisory}
                    className="w-full py-2.5 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-102"
                  >
                    {copiedAdvisory ? <Check className="size-4" /> : <Copy className="size-4" />}
                    <span>{copiedAdvisory ? 'Advisory Copied!' : 'Copy WhatsApp Advisory'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* INTEGRATED PEST MANAGEMENT (IPM) 3-PATHWAY REMEDY MATRIX */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-[var(--brand-color,#0f9a58)]" />
                  <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">
                    IPM & Remediation Protocol Matrix
                  </h3>
                </div>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
                  ICAR / CIBRC Verified
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pathway A: Bio & Botanical */}
                <div className="p-4 rounded-[24px] frosted-glass-sub border border-emerald-500/30 flex flex-col justify-between space-y-3">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between font-black text-emerald-700 dark:text-emerald-400">
                      <span className="flex items-center gap-1">
                        <Sprout className="size-4" /> A. Bio & Botanical
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15">Zero-Residue</span>
                    </div>

                    <div className="p-2.5 rounded-xl frosted-card border border-white/60 space-y-0.5">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">Botanical Spray</span>
                      <p className="font-bold text-slate-950 dark:text-white leading-tight">
                        {biologicalTreatmentList[0]}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl frosted-card border border-white/60 space-y-0.5">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">Bio-Predators Rate</span>
                      <p className="font-bold text-slate-950 dark:text-white leading-tight">
                        {biologicalTreatmentList[1] || 'Release Cryptolaemus beetles @ 10-15/tree.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBioSimOpen(true)}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <FlaskConical className="size-3.5" />
                    <span>Bio-Control Batch Calculator</span>
                  </button>
                </div>

                {/* Pathway B: Emergency Knockdown Chemistry */}
                <div className="p-4 rounded-[24px] frosted-glass-sub border border-rose-500/30 flex flex-col justify-between space-y-3">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between font-black text-rose-700 dark:text-rose-400">
                      <span className="flex items-center gap-1">
                        <Flame className="size-4" /> B. Target Chemical
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/15">Knockdown</span>
                    </div>

                    <div className="p-2.5 rounded-xl frosted-card border border-white/60 space-y-0.5">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">CIBRC Molecule & Rate</span>
                      <p className="font-bold text-slate-950 dark:text-white leading-tight">
                        {chemicalTreatmentList[0]}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl frosted-card border border-white/60 space-y-0.5">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">PHI & Nozzle Type</span>
                      <p className="font-bold text-slate-950 dark:text-white leading-tight">
                        PHI 7-14 Days • Hollow Cone Nozzle @ 2.5-3.0 bar
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsTankMixOpen(true)}
                    className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Wrench className="size-3.5" />
                    <span>Tank Mix Dosage Calibrator</span>
                  </button>
                </div>

                {/* Pathway C: Cultural & Preventive Quarantine */}
                <div className="p-4 rounded-[24px] frosted-glass-sub border border-sky-500/30 flex flex-col justify-between space-y-3">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between font-black text-sky-700 dark:text-sky-400">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="size-4" /> C. Cultural & Quarantine
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/15">Preventive</span>
                    </div>

                    <div className="p-2.5 rounded-xl frosted-card border border-white/60 space-y-0.5">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">Field Sanitation</span>
                      <p className="font-bold text-slate-950 dark:text-white leading-tight">
                        {preventiveMeasuresList[0]}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl frosted-card border border-white/60 space-y-0.5">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">Trunk Sticky Bands</span>
                      <p className="font-bold text-slate-950 dark:text-white leading-tight">
                        Apply 5-inch yellow sticky grease barrier bands on trunks.
                      </p>
                    </div>
                  </div>

                  <div className="p-2 text-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    🛡️ Restrict machinery movement across downwind buffer.
                  </div>
                </div>
              </div>
            </div>

            {/* ATMOSPHERIC SLIDERS & VECTOR VIABILITY FILTER */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              <div className="lg:col-span-7 p-5 rounded-[32px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="size-4 text-[var(--brand-color,#0f9a58)]" />
                    <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">
                      Microclimate Atmospheric Sliders
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTempOverride(weatherData.temp || 29);
                      setRhOverride(weatherData.humidity || 62);
                      setWindOverride(weatherData.windSpeed || 12);
                    }}
                    className="px-2.5 py-0.5 rounded-lg frosted-glass-sub text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60 space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-rose-600 flex items-center gap-1">
                        <Thermometer className="size-3.5" /> Temp
                      </span>
                      <span className="text-slate-950 dark:text-white font-black">{tempOverride}°C</span>
                    </div>
                    <input
                      type="range"
                      min="14"
                      max="45"
                      value={tempOverride}
                      onChange={(e) => setTempOverride(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-600"
                    />
                  </div>

                  <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60 space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-sky-600 flex items-center gap-1">
                        <Droplets className="size-3.5" /> RH
                      </span>
                      <span className="text-slate-950 dark:text-white font-black">{rhOverride}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={rhOverride}
                      onChange={(e) => setRhOverride(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
                    />
                  </div>

                  <div className="p-3 rounded-2xl frosted-glass-sub border border-white/60 space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-teal-600 flex items-center gap-1">
                        <Wind className="size-3.5" /> Wind
                      </span>
                      <span className="text-slate-950 dark:text-white font-black">{windOverride} km/h</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="35"
                      value={windOverride}
                      onChange={(e) => setWindOverride(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 p-5 rounded-[32px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Bug className="size-4 text-rose-500" />
                    <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">
                      Microclimate Vector Viability
                    </h4>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  {pestVectorViabilities.slice(0, 3).map((v, vIdx) => (
                    <div
                      key={vIdx}
                      className={`p-2 rounded-xl border flex items-center justify-between ${
                        v.isViable
                          ? 'bg-rose-500/10 border-rose-500/30 text-slate-950 dark:text-white'
                          : 'bg-slate-200/40 dark:bg-slate-800/40 border-slate-300 dark:border-white/10 opacity-55'
                      }`}
                    >
                      <span className={`font-bold ${!v.isViable ? 'line-through text-slate-500' : ''}`}>
                        {v.name.split('(')[0]}
                      </span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          v.isViable ? 'bg-rose-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600'
                        }`}
                      >
                        {v.isViable ? 'VIABLE' : 'SUPPRESSED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ECONOMIC LOSS & MONETARY SAVINGS CARD */}
            <div className="p-5 rounded-[32px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/10 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
                    Economic Revenue Impact
                  </span>
                  <h4 className="text-base font-black text-slate-950 dark:text-white">
                    Potential Revenue at Risk & Intervention ROI
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Field Size:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50"
                    value={fieldAcres}
                    onChange={(e) => setFieldAcres(Number(e.target.value))}
                    className="w-20 px-2.5 py-1 rounded-xl frosted-glass-sub border border-white/70 dark:border-white/10 text-xs font-black font-mono text-slate-950 dark:text-white"
                  />
                  <span className="text-xs font-bold">Acres</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl frosted-glass-sub border border-rose-500/30 space-y-1">
                  <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 block">
                    Potential Revenue at Risk
                  </span>
                  <span className="text-2xl font-black text-slate-950 dark:text-white font-mono">
                    ₹{estimatedLossINR.toLocaleString('en-IN')}
                  </span>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    {damagePercentage}% damage across {fieldAcres} acres of {affectedCrop}.
                  </p>
                </div>

                <div className="p-4 rounded-2xl frosted-glass-sub border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] font-black uppercase text-[var(--brand-color,#0f9a58)] block">
                    Net Monetary Savings
                  </span>
                  <span className="text-2xl font-black text-[var(--brand-color,#0f9a58)] font-mono">
                    ₹{savingsFromRemedyINR.toLocaleString('en-IN')}
                  </span>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    85% recovery minus input cost (₹{evalData.treatmentCostINR.toLocaleString('en-IN')}).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] border border-[var(--brand-border)] flex flex-col justify-between space-y-2">
                  <span className="text-[10px] font-black uppercase text-[var(--brand-text,#0d7342)] block">
                    Procure Input Medicines
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsShopOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-102"
                  >
                    <ShoppingCart className="size-4" />
                    <span>Order Inputs on Kisan Shop</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* EMBEDDED CHILD MODALS */}
      <PestDiagnosisModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
      />

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
                onOpenShop={() => {
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
    </AnimatePresence>
  );
}
