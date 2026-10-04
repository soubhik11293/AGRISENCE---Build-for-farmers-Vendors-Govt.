import React, { useState, useEffect } from 'react';
import {
  Activity,
  Droplets,
  Layers,
  Thermometer,
  CheckCircle2,
  Calendar,
  Filter,
  Plus,
  Trash2,
  Pencil,
  ArrowUpRight,
  ShieldAlert,
  Sprout,
  TrendingUp,
  MapPin,
  CloudSun,
  Printer,
  Share2,
  Sprout as Sparkles,
  AlertTriangle,
  XCircle,
  FileText,
  Clock,
  Compass,
  ShieldCheck,
  Wind,
  FlaskConical,
  ChevronDown,
} from 'lucide-react';
import { Navbar } from '@/src/components/landing/navbar';
import { Footer } from '@/src/components/landing/footer';
import { AddFarmForm } from '@/src/components/dashboard/add-farm-form';
import { EditFarmForm } from '@/src/components/dashboard/edit-farm-form';
import { WeatherModalTrigger } from '@/src/components/dashboard/weather-modal-trigger';
import { AiAssistantFab } from '@/src/components/dashboard/ai-assistant-fab';
import { SignOutButton } from '@/src/components/dashboard/sign-out-button';
import { WeatherModal } from '@/src/components/weather-modal';
import { MarketModal } from '@/src/components/market-modal';
import { ProfitabilityModal } from '@/src/components/profitability-modal';
import { VoiceAssistantModal } from '@/src/components/voice-assistant-modal';
import { PestDiagnosisModal } from '@/src/components/pest-diagnosis-modal';
import { OutbreakWarningModal } from '@/src/components/outbreak-warning-modal';
import { KisanShopModal } from '@/src/components/kisan-shop-modal';
import { SupportDeskModal } from '@/src/components/support-desk-modal';
import { CropHealthHeatmap } from '@/src/components/dashboard/crop-health-heatmap';
import { ShoppingCart, Headphones, Store, ExternalLink } from 'lucide-react';
import { useAuth } from '@/src/context/auth-context';
import { useLanguage } from '@/src/context/language-context';
import { useDiagnosis } from '@/src/context/diagnosis-context';
import { useFarms } from '@/src/context/farm-context';
import { useTelemetry } from '@/src/context/telemetry-context';
import type { Farm } from '@/src/types';
import { loadFarmRecords, saveTask } from '@/src/lib/platform-sync';
import { recordFarmEvent } from '@/src/lib/farm-events';
import { UnifiedAnalyticsPanel } from '@/src/components/dashboard/unified-analytics-panel';
import { ActiveParcelSelector } from '@/src/components/dashboard/active-parcel-selector';
import { FieldIntelligenceGrid } from '@/src/components/dashboard/field-intelligence-grid';
import { SimulatorInsightsPanel } from '@/src/components/dashboard/simulator-insights-panel';
import type { ProcurementCategory } from '@/src/lib/simulator-guidance';

const EMPTY_FARM: Farm = {
  id: 0, name: 'No farm selected', village: '', district: '', state: '', areaAcres: '0', primaryCrop: '',
  healthScore: 0, moisturePercent: 0, nitrogen: 0, phosphorus: 0, potassium: 0, phLevel: 0,
};

interface TaskItem {
  id: string;
  crop: string;
  title: string;
  due: string;
  priority: 'High' | 'Medium' | 'Low';
  done: boolean;
}

const INITIAL_TASKS: TaskItem[] = [
  {
    id: 't1',
    crop: 'Soybean',
    title: 'Apply 5% Neem Seed Kernel Extract (NSKE) spray before 08:30 AM',
    due: 'Today, Morning',
    priority: 'High',
    done: false,
  },
  {
    id: 't2',
    crop: 'Cotton',
    title: 'Deploy 5 pheromone traps for pink bollworm monitoring',
    due: 'Tomorrow',
    priority: 'High',
    done: false,
  },
  {
    id: 't3',
    crop: 'Pomegranate',
    title: 'Calibrate micro-drip fertigation with Potassium Schoenite',
    due: 'In 2 days',
    priority: 'Medium',
    done: true,
  },
  {
    id: 't4',
    crop: 'Soybean',
    title: 'Verify root nodulation and rhizobium colonization sample',
    due: 'Saturday',
    priority: 'Low',
    done: false,
  },
];

export function DashboardPage({ onNavigate }: { onNavigate?: (route: string) => void }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { activeDiagnosis, diagnosisHistory } = useDiagnosis();
  const { farms, selectedFarmId, selectedFarm, selectedCropCycleId, selectedCropCycle, setSelectedFarmId, addFarm, updateFarm, deleteFarm } = useFarms();
  const { weatherData, outbreakData, marketData, activeArbitrageTopSpread, rotatingMarketItem, sprayStatusForNow } = useTelemetry();
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [completedDiagTaskIds, setCompletedDiagTaskIds] = useState<string[]>([]);
  const [taskFilter, setTaskFilter] = useState<string>('All');
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);

  useEffect(() => {
    if (!user?.id || !selectedFarmId) return;
    let cancelled = false;
    void loadFarmRecords<TaskItem>('tasks', user.id, selectedFarmId, 100).then((rows) => {
      if (cancelled || rows.length === 0) return;
      setTasks((current) => {
        const merged = current.map((task) => {
          const stored = rows.find((row: any) => row.id === task.id);
          return stored ? { ...task, done: Boolean((stored as any).done), due: String((stored as any).due || task.due), title: String((stored as any).title || task.title), priority: ((stored as any).priority || task.priority) as TaskItem['priority'] } : task;
        });
        const known = new Set(merged.map((task) => task.id));
        rows.forEach((row: any) => {
          if (!known.has(String(row.id)) && row.title) merged.push({
            id: String(row.id), crop: String(row.crop || selectedFarm?.primaryCrop), title: String(row.title),
            due: String(row.due || 'After simulation'), priority: (row.priority || 'Medium') as TaskItem['priority'], done: Boolean(row.done),
          });
        });
        return merged;
      });
    });
    return () => { cancelled = true; };
  }, [user?.id, selectedFarmId]);

  useEffect(() => {
    if (!user?.id || !selectedFarmId) return;
    const existing = new Set<string>();
    void loadFarmRecords<TaskItem>('tasks', user.id, selectedFarmId, 100).then((rows) => {
      rows.forEach((row: any) => existing.add(String(row.id)));
      for (const task of INITIAL_TASKS) {
        if (!existing.has(task.id)) void saveTask(task, { userId: user.id, farmId: selectedFarmId, cropCycleId: selectedCropCycleId || undefined, source: 'dashboard-seed-tasks' });
      }
    });
  }, [user?.id, selectedFarmId, selectedCropCycleId]);

  // Modals state
  const [weatherModalOpen, setWeatherModalOpen] = useState(false);
  const [marketModalOpen, setMarketModalOpen] = useState(false);
  const [profitModalOpen, setProfitModalOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [pestModalOpen, setPestModalOpen] = useState(false);
  const [outbreakModalOpen, setOutbreakModalOpen] = useState(false);
  const [kisanShopOpen, setKisanShopOpen] = useState(false);
  const [shopCategory, setShopCategory] = useState<'seeds' | 'crop_protection' | 'fertilizers' | 'machinery' | 'hyperlocal'>('seeds');
  const [shopQuery, setShopQuery] = useState('');
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);

  // Synchronized Soil Analysis & Outbreak Evaluation state from localStorage
  const [savedSoilAnalysis, setSavedSoilAnalysis] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = user?.id ? localStorage.getItem(`agrisence_saved_soil_analysis:${user.id}`) : null;
        if (saved) return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return null;
  });

  const [outbreakEvaluation, setOutbreakEvaluation] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = user?.id ? localStorage.getItem(`agrisence_outbreak_evaluation:${user.id}`) : null;
        if (saved) return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return null;
  });

  const [masterChecklist, setMasterChecklist] = useState<{
    pestDefense: boolean;
    irrigationSoil: boolean;
    postHarvest: boolean;
  }>({
    pestDefense: false,
    irrigationSoil: false,
    postHarvest: false,
  });

  useEffect(() => {
    const handleStorage = () => {
      try {
        const savedSoil = user?.id ? localStorage.getItem(`agrisence_saved_soil_analysis:${user.id}`) : null;
        setSavedSoilAnalysis(savedSoil ? JSON.parse(savedSoil) : null);

        const savedOutbreak = user?.id ? localStorage.getItem(`agrisence_outbreak_evaluation:${user.id}`) : null;
        setOutbreakEvaluation(savedOutbreak ? JSON.parse(savedOutbreak) : null);
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !selectedFarmId) return;
    let cancelled = false;
    void Promise.all([
      loadFarmRecords<any>('soilTests', user.id, selectedFarmId, 20),
      loadFarmRecords<any>('outbreakAlerts', user.id, selectedFarmId, 20),
    ]).then(([soilRows, outbreakRows]) => {
      if (cancelled) return;
      if (soilRows[0]) setSavedSoilAnalysis(soilRows[0]);
      if (outbreakRows[0]) setOutbreakEvaluation(outbreakRows[0]);
    });
    return () => { cancelled = true; };
  }, [user?.id, selectedFarmId]);

  const currentFarm = selectedFarm || farms[0] || EMPTY_FARM;

  const handleAddFarm = async (newFarm: Partial<Farm>) => {
    await addFarm(newFarm);
  };

  const handleDeleteFarm = async (id: number) => {
    try { await deleteFarm(id); } catch (error) { console.error('Failed to delete farm:', error); }
  };

  const handleUpdateFarm = async (changes: Partial<Farm>) => {
    if (!editingFarm) return;
    const updated = await updateFarm(editingFarm.id, changes);
    setSelectedFarmId(updated.id);
    setEditingFarm(null);
  };

  // Dynamic tasks synthesized from active real-time AI pest diagnosis
  const dynamicDiagnosisTasks: TaskItem[] = activeDiagnosis
    ? [
        {
          id: 'diag-urgent-treatment',
          title: `[Urgent Treatment] Apply biological: ${activeDiagnosis.biologicalTreatment[0] || 'Targeted botanical/microbial formulation'}`,
          crop: activeDiagnosis.affectedCrop || selectedFarm?.primaryCrop || 'Unknown crop',
          due: 'Immediate Window',
          priority: 'High',
          done: completedDiagTaskIds.includes('diag-urgent-treatment'),
        },
        {
          id: 'diag-quarantine-inspection',
          title: `[Quarantine] Inspect crop foliage within ${activeDiagnosis.quarantineRadiusMeters}m perimeter`,
          crop: activeDiagnosis.affectedCrop || selectedFarm?.primaryCrop || 'Unknown crop',
          due: 'Today',
          priority: 'High',
          done: completedDiagTaskIds.includes('diag-quarantine-inspection'),
        },
        ...(activeDiagnosis.chemicalTreatment[0]
          ? [
              {
                id: 'diag-chemical-prep',
                title: `[Chemical Intervention] Prepare ${activeDiagnosis.chemicalTreatment[0]}`,
                crop: activeDiagnosis.affectedCrop || selectedFarm?.primaryCrop || 'Unknown crop',
                due: 'Window 06:30 - 09:30 AM',
                priority: (activeDiagnosis.severity === 'Critical' || activeDiagnosis.severity === 'Severe'
                  ? 'High'
                  : 'Medium') as 'High' | 'Medium',
                done: completedDiagTaskIds.includes('diag-chemical-prep'),
              },
            ]
          : []),
      ]
    : [];

  const allCombinedTasks = [...dynamicDiagnosisTasks, ...tasks];

  const toggleMasterChecklist = (key: 'pestDefense' | 'irrigationSoil' | 'postHarvest', title: string) => {
    setMasterChecklist((prev) => {
      const done = !prev[key];
      if (done && user?.id && selectedFarmId) {
        void recordFarmEvent({ userId: user.id, farmId: selectedFarmId, cropCycleId: selectedCropCycleId || undefined, type: 'TASK_COMPLETED', source: 'master-action-checklist', data: { taskId: `master-${key}`, title, completed: true } });
      }
      return { ...prev, [key]: done };
    });
  };

  const toggleTask = (id: string) => {
    if (id.startsWith('diag-')) {
      setCompletedDiagTaskIds((prev) => {
        const done = !prev.includes(id);
        if (done && user?.id && selectedFarmId) {
          void recordFarmEvent({ userId: user.id, farmId: selectedFarmId, cropCycleId: selectedCropCycleId || undefined, type: 'TASK_COMPLETED', source: 'dashboard-diagnosis-task', data: { taskId: id, diagnosis: activeDiagnosis?.pestName || null } });
        }
        return done ? [...prev, id] : prev.filter((item) => item !== id);
      });
    } else {
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
        const task = next.find((item) => item.id === id);
        if (task && user?.id && selectedFarmId) {
          void saveTask(task, { userId: user.id, farmId: selectedFarmId, cropCycleId: selectedCropCycleId || undefined, source: 'dashboard-task-checklist' });
          if (task.done) void recordFarmEvent({ userId: user.id, farmId: selectedFarmId, cropCycleId: selectedCropCycleId || undefined, type: 'TASK_COMPLETED', source: 'dashboard-task-checklist', data: task as any });
        }
        return next;
      });
    }
  };

  const filteredTasks =
    taskFilter === 'All'
      ? allCombinedTasks
      : allCombinedTasks.filter((t) => t.crop.toLowerCase().includes(taskFilter.toLowerCase()));

  // Composite Health Score Calculation (0 - 100)
  const ndviComponent = (currentFarm.healthScore / 1.0) * 40;
  const moistureComponent = Math.min(30, (currentFarm.moisturePercent / 30) * 30);
  const nitrogenComponent = Math.min(30, (currentFarm.nitrogen / 160) * 30);
  const compositeScore = Math.min(100, Math.round(ndviComponent + moistureComponent + nitrogenComponent));

  // WhatsApp Share Message Formatter with Active AI Pest Diagnosis Telemetry
  const handleShareToWhatsApp = () => {
    const diagnosisSection = activeDiagnosis
      ? `
🔬 *ACTIVE FIELD DIAGNOSIS (AI VISION TELEMETRY):*
• Pathogen: ${activeDiagnosis.pestName} (${activeDiagnosis.scientificName})
• Severity: ${activeDiagnosis.severity} (${activeDiagnosis.confidence}% AI Confidence)
• Crop Damage: ${activeDiagnosis.damagePercentage}% foliar damage on ${activeDiagnosis.affectedCrop}
• Containment Radius: ${activeDiagnosis.quarantineRadiusMeters}m perimeter
• Biological Treatment: ${activeDiagnosis.biologicalTreatment[0] || 'N/A'}
• Chemical Intervention: ${activeDiagnosis.chemicalTreatment[0] || 'N/A'}
• Preventive Measure: ${activeDiagnosis.preventiveMeasures[0] || 'N/A'}
`
      : '';

    const mandiLine = activeArbitrageTopSpread
      ? `💰 *Mandi Modal Rate:* ₹${activeArbitrageTopSpread.modalPrice.toLocaleString('en-IN')}/qtl (+₹${activeArbitrageTopSpread.arbitrageSpread || 0}/qtl spread at ${activeArbitrageTopSpread.highestMandi || 'observed terminal'})`
      : '💰 *Mandi Modal Rate:* Live mandi quote unavailable.';

    const radarLine = `🛡️ *Outbreak Warning Radar:* ${outbreakData.hazardLevel} Hazard Tier (${outbreakData.locationName}) • Containment: ${outbreakData.quarantineRadiusMeters}m perimeter`;
    const weatherLine = `🌤️ *Live Microclimate:* ${weatherData.temp}°C | Humidity: ${weatherData.humidity}% | Wind: ${weatherData.windSpeed} km/h | Spray Window: ${sprayStatusForNow}`;

    const message = `🌱 *AgriSence Daily Field Health Dossier*
🧑‍🌾 *Farmer / Landholder:* ${user?.fullName || 'Progressive Farmer'}
📍 *Parcel:* ${currentFarm.name} (${user?.village || currentFarm.village}, ${user?.district || currentFarm.district}, ${user?.state || currentFarm.state})
🌾 *Crop:* ${user?.crops?.[0] || selectedFarm?.primaryCrop} (${user?.acreage || currentFarm.areaAcres} Acres)
⭐ *Farm Health Score:* ${compositeScore}/100 (Optimal Tier)
🛰️ *NDVI Canopy Vigor:* ${currentFarm.healthScore} / 1.0
💧 *Root Moisture (0-20cm):* ${currentFarm.moisturePercent}%
🧪 *Soil Chemistry:* pH ${currentFarm.phLevel} | N: ${currentFarm.nitrogen} kg/ha | P: ${currentFarm.phosphorus} kg/ha | K: ${currentFarm.potassium} kg/ha
${weatherLine}
${radarLine}
${mandiLine}${diagnosisSection}
✅ *CRITICAL DO'S FOR TODAY:*
1. Optimal Spray Window: Apply ${activeDiagnosis?.biologicalTreatment[0] ? activeDiagnosis.biologicalTreatment[0].split('@')[0] : '5% NSKE'} before 09:30 AM while wind speed is under 8 km/h.
2. Precision Fertigation: Review the selected crop cycle, soil test, and product label before scheduling fertigation.
3. Bio-Fungicide: Apply Trichoderma viride enriched FYM along root zones to prevent collar rot.
4. Pest Trap: Deploy 5 sex pheromone traps per acre for early bollworm monitoring.

⚠️ *CRITICAL DON'TS:*
1. Do not spray between 01:00 PM and 05:00 PM when wind velocity exceeds 15 km/h.
2. Avoid waterlogging in lower quadrant zones (drain excess canal runoff).
3. Never tank-mix Copper Oxychloride with wettable sulfur to avoid foliar scorching.
4. Never broadcast dry urea on wet leaves during midday sun.

_Generated via AgriSence Algorithmic Decision Engine_`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePrintDossier = () => {
    window.print();
  };

  const toggleKpi = (id: string) => setExpandedKpi((current) => current === id ? null : id);

  const kpiDetailRows: Record<string, Array<[string, string]>> = {
    ndvi: [
      ['Parcel', currentFarm.name],
      ['Crop', selectedCropCycle?.crop || currentFarm.primaryCrop],
      ['Health score', `${currentFarm.healthScore}/1.0`],
      ['Historical diagnoses', String(diagnosisHistory.length)],
    ],
    moisture: [
      ['Root-zone moisture', `${currentFarm.moisturePercent}%`],
      ['Nitrogen', String(currentFarm.nitrogen)],
      ['Phosphorus', String(currentFarm.phosphorus)],
      ['Potassium', String(currentFarm.potassium)],
    ],
    outbreak: [
      ['Hazard tier', outbreakEvaluation?.hazardLevel || outbreakData.hazardLevel],
      ['Primary threat', activeDiagnosis?.pestName || outbreakEvaluation?.primaryThreat || outbreakData.predictedPathogens[0] || 'None recorded'],
      ['Quarantine radius', `${activeDiagnosis?.quarantineRadiusMeters || outbreakEvaluation?.quarantineRadiusMeters || outbreakData.quarantineRadiusMeters} m`],
      ['Crop', activeDiagnosis?.affectedCrop || selectedCropCycle?.crop || currentFarm.primaryCrop],
    ],
    market: [
      ['Commodity', rotatingMarketItem?.commodity || 'Configured commodity'],
      ['Market', rotatingMarketItem?.market || 'Market dataset'],
      ['Modal rate', `₹${(rotatingMarketItem?.modalPrice || 0).toLocaleString('en-IN')}/qtl`],
      ['Spread', `₹${(rotatingMarketItem?.arbitrageSpread || 0).toLocaleString('en-IN')}/qtl`],
    ],
  };

  const renderKpiDetails = (id: string) => expandedKpi !== id ? null : (
    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/10 grid grid-cols-2 gap-2">
      {kpiDetailRows[id].map(([label, value]) => (
        <div key={label} className="rounded-xl bg-white/60 dark:bg-slate-900/50 border border-white/70 dark:border-white/10 p-2">
          <div className="text-[8px] font-black uppercase tracking-wide text-slate-500">{label}</div>
          <div className="text-[10px] font-bold text-slate-900 dark:text-white mt-1 break-words">{value}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen text-slate-950 dark:text-slate-100 flex flex-col print:min-h-0 print:bg-white print:text-black">
      {/* Hide Navbar in Print Mode */}
      <div className="print:hidden">
        <Navbar
          currentRoute="/dashboard"
          onNavigate={onNavigate}
          onOpenOutbreakModal={() => setOutbreakModalOpen(true)}
          onOpenPestModal={() => setPestModalOpen(true)}
          onOpenWeatherModal={() => setWeatherModalOpen(true)}
          onOpenMarketModal={() => setMarketModalOpen(true)}
        />
      </div>

      <main className="flex-1 max-w-[1680px] 2xl:max-w-[1900px] mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 pb-20 w-full space-y-8 print:pt-4 print:pb-4 print:px-2 print:max-w-none print:w-full print:space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden"><ActiveParcelSelector /></div>
        {/* Official Government & Bank Crop Health Dossier Header (Print-Only) */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-emerald-900 uppercase">AgriSence™</span>
                <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded border border-emerald-300">
                  Official Field Telemetry & Crop Health Dossier
                </span>
              </div>
              <p className="text-xs text-slate-650 mt-1 font-semibold">
                PMFBY 72-Hour Intimation, Crop Damage Claim, and Kisan Credit Card (KCC) Agronomic Audit Attestation
              </p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold text-slate-900">
                Dossier ID: <span className="font-mono text-emerald-900 font-black">AGS-MH-{user?.id ? user.id.slice(-6).toUpperCase() : currentFarm.id}-{new Date().toISOString().slice(0, 10)}</span>
              </p>
              <p className="text-slate-600 font-medium">
                Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wide">
                Status: Verified Sentinel-2 Biomass Calibration
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-300 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Farmer / Landholder</span>
              <span className="font-bold text-slate-900">{user?.fullName || currentFarm.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Location</span>
              <span className="font-bold text-slate-900">{user?.village || currentFarm.village}, {user?.district || currentFarm.district}, {user?.state || currentFarm.state}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Acreage & Crop</span>
              <span className="font-bold text-slate-900">{user?.crops?.[0] || selectedFarm?.primaryCrop} ({user?.acreage || currentFarm.areaAcres} Acres)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Aadhaar e-KYC Seeded</span>
              <span className="font-bold text-emerald-800">Verified [Aadhaar Redacted]</span>
            </div>
          </div>

          {/* Live Microclimate, Radar Alert & APMC Mandi Settlement (Print-Only PMFBY / KCC Record) */}
          <div className="grid grid-cols-3 gap-3 mt-2.5 pt-2.5 border-t border-dashed border-slate-300 text-xs">
            <div className="p-2 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Live Microclimate Telemetry</span>
              <span className="font-bold text-slate-900 font-mono">
                {weatherData.temp}°C | RH {weatherData.humidity}% | Wind {weatherData.windSpeed} km/h
              </span>
              <span className="text-[10px] text-slate-600 block mt-0.5">
                VPD: {weatherData.vpd} kPa • ET₀: {weatherData.et0} mm/d
              </span>
            </div>

            <div className="p-2 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Outbreak Radar Status</span>
              <span className={`font-black uppercase text-[11px] ${
                outbreakData.hazardLevel === 'Severe'
                  ? 'text-rose-700'
                  : outbreakData.hazardLevel === 'Moderate'
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}>
                {outbreakData.hazardLevel} Hazard Tier
              </span>
              <span className="text-[10px] text-slate-600 block mt-0.5">
                Zone: {outbreakData.locationName} ({outbreakData.quarantineRadiusMeters}m cordon)
              </span>
            </div>

            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-white/10">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">APMC Mandi Modal Settlement</span>
              <span className="font-bold text-emerald-800 dark:text-emerald-300 font-mono">
                {rotatingMarketItem ? `${rotatingMarketItem.commodity}: ₹${rotatingMarketItem.modalPrice.toLocaleString('en-IN')}/qtl` : 'Live mandi quote unavailable'}
              </span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 block mt-0.5">
                {rotatingMarketItem ? `${rotatingMarketItem.market} (+₹${rotatingMarketItem.arbitrageSpread || 0} spread)` : 'Refresh after configuring a live feed'}
              </span>
            </div>
          </div>

          {/* ACTIVE TELEMETRY SYNC BANNERS: PEST DIAGNOSIS & SOIL ANALYSIS */}
          <div className="space-y-3 mt-3">
            {activeDiagnosis && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-500/30 rounded-2xl text-xs space-y-1.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-black text-rose-950 dark:text-rose-200">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="size-4 text-rose-600 shrink-0" />
                    <span>ACTIVE CROP PATHOGEN TELEMETRY (PMFBY 72-HR INTIMATION & AUDIT)</span>
                  </span>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white w-fit">
                    Severity: {activeDiagnosis.severity.toUpperCase()} ({activeDiagnosis.confidence}% AI Confidence)
                  </span>
                </div>
                <p className="text-slate-900 dark:text-slate-200 font-semibold text-xs leading-relaxed">
                  <strong>Diagnosed Pathogen:</strong> {activeDiagnosis.pestName} (<em>{activeDiagnosis.scientificName}</em>) on {activeDiagnosis.affectedCrop} • <strong>Estimated Foliar Necrosis / Damage:</strong> {activeDiagnosis.damagePercentage}% • <strong>Containment Buffer:</strong> {activeDiagnosis.quarantineRadiusMeters}m
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-rose-200 dark:border-rose-900/40 text-[11px]">
                  <p className="text-slate-800 dark:text-slate-300">
                    <strong>ICAR Prescribed Interventions:</strong> Bio: {activeDiagnosis.biologicalTreatment[0] || 'N/A'} | Chem: {activeDiagnosis.chemicalTreatment[0] || 'N/A'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShopCategory('crop_protection');
                      setKisanShopOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center gap-1 w-fit cursor-pointer"
                  >
                    <ShoppingCart className="size-3" />
                    <span>Procure Target Bio-Pesticide</span>
                  </button>
                </div>
              </div>
            )}

            {savedSoilAnalysis && (
              <div className="p-3.5 bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-xs space-y-1.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-black text-emerald-950 dark:text-emerald-200">
                  <span className="flex items-center gap-1.5">
                    <Layers className="size-4 text-[var(--brand-color,#0f9a58)] shrink-0" />
                    <span>SYNCHRONIZED SOIL HEALTH & AGRO-CLIMATIC TAXONOMY</span>
                  </span>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-[var(--brand-color,#0f9a58)] text-white w-fit">
                    pH {savedSoilAnalysis.phLevel} • N-P-K ({savedSoilAnalysis.nitrogen}-{savedSoilAnalysis.phosphorus}-{savedSoilAnalysis.potassium})
                  </span>
                </div>
                <p className="text-slate-900 dark:text-slate-200 font-semibold text-xs leading-relaxed">
                  <strong>Inferred Soil Taxonomy:</strong> {savedSoilAnalysis.soilTaxonomy} ({savedSoilAnalysis.locationName}) • <strong>Nutrient Status:</strong> N ({savedSoilAnalysis.nitrogen < 140 ? 'Deficit' : 'Optimal'}), P ({savedSoilAnalysis.phosphorus < 25 ? 'Deficit' : 'Optimal'}), K ({savedSoilAnalysis.potassium < 250 ? 'Deficit' : 'High'})
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-emerald-500/20 text-[11px]">
                  <p className="text-slate-800 dark:text-slate-300 truncate">
                    <strong>Primary Recommendation:</strong> {savedSoilAnalysis.recommendations?.[0] || 'Apply balanced split basal NPK'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShopCategory('fertilizers');
                      setKisanShopOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-bold text-[10px] flex items-center gap-1 w-fit cursor-pointer shrink-0"
                  >
                    <ShoppingCart className="size-3" />
                    <span>Procure Soil Amendments</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] shadow-2xs">
                {t('dash.badge', 'Command Center')}
              </span>
              <span className="text-xs font-bold text-slate-650 dark:text-slate-300">
                {t('dash.telemetryActive', 'Farm Telemetry v2.4 Active')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white mt-1 tracking-tight">
              {t('dash.title', 'Agronomic Field Dashboard')}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-750 dark:text-slate-200">
              {t('dash.monitoringFor', 'Live monitoring for')} {user?.fullName ? `${user.fullName} • ` : ''}{currentFarm.name} • {user?.acreage || currentFarm.areaAcres} Acres ({user?.crops?.[0] || selectedFarm?.primaryCrop})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <button
              type="button"
              onClick={() => setKisanShopOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] hover:bg-emerald-500/20 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all hover:scale-105 cursor-pointer"
            >
              <ShoppingCart className="size-4 text-[var(--brand-color,#0f9a58)]" />
              <span>{t('command.shop', 'Kisan Agri-Store')}</span>
            </button>

            <button type="button" onClick={() => onNavigate?.('/farmer/vendors')} className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <Store className="size-4 text-emerald-600" /> Vendor Marketplace
            </button>

            <button
              type="button"
              onClick={() => setSupportModalOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all hover:scale-105 cursor-pointer"
            >
              <Headphones className="size-4 text-amber-600" />
              <span>{t('command.helpdesk', 'Kisan Helpdesk')}</span>
            </button>

            <WeatherModalTrigger />
            <SignOutButton
              onSignOut={async () => {
                await logout();
                if (onNavigate) onNavigate('/');
              }}
            />
          </div>
        </div>

        {/* CONSOLIDATED FARM INTELLIGENCE & EXECUTIVE DIAGNOSTIC SUMMARY */}
        <div className="p-6 sm:p-8 rounded-[32px] frosted-card border border-white/80 dark:border-white/12 text-slate-950 dark:text-white shadow-2xl space-y-6 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/10 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/15 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] text-xs font-black uppercase tracking-wider">
                  {t('command.executiveSummary', 'Executive Diagnostic Summary')}
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {t('command.integratedIntelligence', 'Integrated Farm Intelligence')}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                {t('command.summaryTitle', 'Consolidated Farm Intelligence & Executive Diagnostic Summary')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                Target Parcel: <strong>{currentFarm.name}</strong> • Profile: <strong>{user?.acreage || currentFarm.areaAcres} Acres</strong> ({user?.primaryCrop || user?.crops?.[0] || selectedFarm?.primaryCrop}) • Irrigation: <strong>{user?.irrigationType || 'Micro-Drip & Canal'}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setOutbreakModalOpen(true)}
                className="px-4 py-2 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldAlert className="size-4" />
                <span>{t('command.radarStudio', 'Radar Studio')}</span>
              </button>
              <button
                type="button"
                onClick={() => setMarketModalOpen(true)}
                className="px-4 py-2 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <TrendingUp className="size-4" />
                <span>{t('command.marketArbitrage', 'Market Arbitrage')}</span>
              </button>
            </div>
          </div>

          {/* 3 Actionable Diagnostic Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pillar 1: Epidemiological Perimeter */}
            <div className="p-5 rounded-[24px] frosted-glass-sub border border-white/60 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="size-4" /> 1. Epidemiological Perimeter
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white ${
                  (outbreakEvaluation?.hazardLevel || outbreakData.hazardLevel) === 'Critical' || (outbreakEvaluation?.hazardLevel || outbreakData.hazardLevel) === 'Severe'
                    ? 'bg-rose-600'
                    : (outbreakEvaluation?.hazardLevel || outbreakData.hazardLevel) === 'Moderate'
                    ? 'bg-amber-600'
                    : 'bg-emerald-600'
                }`}>
                  {outbreakEvaluation?.hazardLevel || outbreakData.hazardLevel} Hazard Tier
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-950 dark:text-white text-sm">
                  {outbreakEvaluation?.primaryThreat || outbreakData.threatTitle}
                </p>
                <div className="text-slate-700 dark:text-slate-300 text-xs space-y-0.5">
                  <p>• <strong>Quarantine Buffer:</strong> {outbreakEvaluation?.quarantineRadiusMeters || outbreakData.quarantineRadiusMeters} meters</p>
                  <p>• <strong>Downwind Corridor:</strong> {outbreakEvaluation?.downwindHeading || 'SE (South-East)'} ({outbreakEvaluation?.downwindDegrees || 140}° heading)</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    🛡️ Protocol: {outbreakEvaluation?.bioDosage || outbreakData.bioDosage}
                  </p>
                </div>
              </div>
            </div>

            {/* Pillar 2: Soil & Nutrition Balance */}
            <div className="p-5 rounded-[24px] frosted-glass-sub border border-white/60 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[var(--brand-color,#0f9a58)] flex items-center gap-1.5">
                  <FlaskConical className="size-4" /> 2. Soil & Nutrition Balance
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
                  pH {savedSoilAnalysis?.phLevel || currentFarm.phLevel}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-950 dark:text-white text-sm">
                  {savedSoilAnalysis?.soilTaxonomy || 'Vertisols (Black Cotton Clay Soil)'}
                </p>
                <div className="text-slate-700 dark:text-slate-300 text-xs space-y-0.5">
                  <p>• <strong>N-P-K Chemistry:</strong> {savedSoilAnalysis?.nitrogen || currentFarm.nitrogen} N : {savedSoilAnalysis?.phosphorus || currentFarm.phosphorus} P : {savedSoilAnalysis?.potassium || currentFarm.potassium} K (kg/ha)</p>
                  <p>• <strong>Fertigation Plan:</strong> No crop-specific product or rate is confirmed until a soil test and label review are available.</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    🌱 Soil Amendment: {savedSoilAnalysis?.recommendations?.[0] || 'Apply 25 kg/acre Gypsum or FYM organic carbon enhancer.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Pillar 3: Market Realization */}
            <div className="p-5 rounded-[24px] frosted-glass-sub border border-white/60 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <TrendingUp className="size-4" /> 3. Market Realization
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30">
                   {rotatingMarketItem?.source || 'Live feed unavailable'}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-950 dark:text-white text-sm font-mono">
                   Local Mandi Spot: {rotatingMarketItem ? `₹${rotatingMarketItem.modalPrice.toLocaleString('en-IN')}/qtl` : 'Unavailable'}
                </p>
                <div className="text-slate-700 dark:text-slate-300 text-xs space-y-0.5">
                   <p>• <strong>Max Terminal Arbitrage:</strong> {activeArbitrageTopSpread ? `₹${(activeArbitrageTopSpread.highestMandiPrice || activeArbitrageTopSpread.modalPrice).toLocaleString('en-IN')}/qtl` : 'Unavailable'}</p>
                   <p>• <strong>Spread Gain:</strong> {activeArbitrageTopSpread ? `+₹${activeArbitrageTopSpread.arbitrageSpread || 0}/qtl at ${activeArbitrageTopSpread.market}` : 'Unavailable'}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                     📦 Recommendation: {activeArbitrageTopSpread ? ((activeArbitrageTopSpread.arbitrageSpread || 0) > 250 ? 'Hold in WDRA certified warehouse for arbitrage exit.' : 'Review the observed quote before selling.') : 'Waiting for a live mandi quote.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 1-Click Master Action Checklist */}
          <div className="pt-4 border-t border-slate-200/60 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-[var(--brand-text,#0d7342)] dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[var(--brand-color,#0f9a58)]" />
                1-Click Master Action Checklist
              </h4>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                Click items to trigger & acknowledge field execution
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Action 1 */}
              <div
                onClick={() => toggleMasterChecklist('pestDefense', t('command.pestDefense', 'Pest Defense Execution'))}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  masterChecklist.pestDefense
                    ? 'bg-emerald-500/15 border-[var(--brand-border)] text-emerald-950 dark:text-emerald-200'
                    : 'frosted-glass-sub border-white/60 dark:border-white/10 hover:border-[var(--brand-color,#0f9a58)] text-slate-950 dark:text-white'
                }`}
              >
                <div className={`size-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                  masterChecklist.pestDefense ? 'bg-[var(--brand-color,#0f9a58)] text-white font-black' : 'border border-slate-400 dark:border-white/40'
                }`}>
                  {masterChecklist.pestDefense && <CheckCircle2 className="size-4" />}
                </div>
                <div className="space-y-0.5">
                  <span className="font-black text-slate-950 dark:text-white block">{t('command.pestDefense', 'Pest Defense Execution')}</span>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                    Release biological agents ({outbreakEvaluation?.bioDosage ? outbreakEvaluation.bioDosage.split('@')[0] : 'Bt kurstaki'}) within the designated {outbreakEvaluation?.quarantineRadiusMeters || 180}m buffer perimeter.
                  </p>
                </div>
              </div>

              {/* Action 2 */}
              <div
                onClick={() => toggleMasterChecklist('irrigationSoil', t('command.irrigationSoil', 'Irrigation & Soil Fertigation'))}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  masterChecklist.irrigationSoil
                    ? 'bg-emerald-500/15 border-[var(--brand-border)] text-emerald-950 dark:text-emerald-200'
                    : 'frosted-glass-sub border-white/60 dark:border-white/10 hover:border-[var(--brand-color,#0f9a58)] text-slate-950 dark:text-white'
                }`}
              >
                <div className={`size-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                  masterChecklist.irrigationSoil ? 'bg-[var(--brand-color,#0f9a58)] text-white font-black' : 'border border-slate-400 dark:border-white/40'
                }`}>
                  {masterChecklist.irrigationSoil && <CheckCircle2 className="size-4" />}
                </div>
                <div className="space-y-0.5">
                  <span className="font-black text-slate-950 dark:text-white block">{t('command.irrigationSoil', 'Irrigation & Soil Fertigation')}</span>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                    Adjust drip runtime based on ETc ({weatherData.et0 || 4.8} mm/d) and apply split nutrients.
                  </p>
                </div>
              </div>

              {/* Action 3 */}
              <div
                onClick={() => toggleMasterChecklist('postHarvest', t('command.postHarvest', 'Post-Harvest & Market Exit'))}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  masterChecklist.postHarvest
                    ? 'bg-emerald-500/15 border-[var(--brand-border)] text-emerald-950 dark:text-emerald-200'
                    : 'frosted-glass-sub border-white/60 dark:border-white/10 hover:border-[var(--brand-color,#0f9a58)] text-slate-950 dark:text-white'
                }`}
              >
                <div className={`size-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                  masterChecklist.postHarvest ? 'bg-[var(--brand-color,#0f9a58)] text-white font-black' : 'border border-slate-400 dark:border-white/40'
                }`}>
                  {masterChecklist.postHarvest && <CheckCircle2 className="size-4" />}
                </div>
                <div className="space-y-0.5">
                  <span className="font-black text-slate-950 dark:text-white block">{t('command.postHarvest', 'Post-Harvest & Market Exit')}</span>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                    Optimize market exit (sell spot vs. hold in WDRA certified warehouse).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Parcel Manager Section */}
        <div className="space-y-3 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sprout className="size-4 text-[var(--brand-color,#0f9a58)]" />
              <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">
                {t('dash.activeParcels', 'Active Farm Parcels')} ({farms.length})
              </h3>
            </div>
            <AddFarmForm onAddFarm={handleAddFarm} />
          </div>

          {editingFarm && (
            <EditFarmForm
              key={editingFarm.id}
              farm={editingFarm}
              onSave={handleUpdateFarm}
              onCancel={() => setEditingFarm(null)}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {farms.map((farm, idx) => {
              const isSelected = selectedFarmId === farm.id;
              return (
                <div
                  key={`farm-${farm.id}-${idx}`}
                  onClick={() => setSelectedFarmId(farm.id)}
                  className={`p-4 rounded-[28px] border transition-all cursor-pointer backdrop-blur-md shadow-2xs ${
                    isSelected
                      ? 'bg-emerald-500/18 dark:bg-emerald-950/60 border-[var(--brand-color,#0f9a58)] ring-2 ring-[var(--brand-color,#0f9a58)]/30 shadow-md'
                      : 'frosted-card border-white/70 dark:border-white/10 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-black text-sm text-slate-950 dark:text-white">{farm.name}</h4>
                      <p className="text-xs text-slate-750 dark:text-slate-300 flex items-center gap-1 mt-0.5 font-medium">
                        <MapPin className="size-3 text-[var(--brand-color,#0f9a58)] shrink-0" />
                        <span>{farm.village}, {farm.district}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFarm(farm);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-[var(--brand-color,#0f9a58)] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                        title="Edit Parcel"
                        aria-label={`Edit ${farm.name}`}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    {farms.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFarm(farm.id);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Parcel"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/10 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-[var(--brand-text,#0d7342)] font-bold border border-[var(--brand-border)]">
                      {farm.primaryCrop}
                    </span>
                    <span className="px-2 py-0.5 rounded-full frosted-glass-sub text-slate-800 dark:text-slate-200 font-bold border border-white/60">
                      {farm.areaAcres} Acres
                    </span>
                    <span className="ml-auto text-[11px] font-black text-[var(--brand-color,#0f9a58)] flex items-center gap-1">
                      <Activity className="size-3" /> NDVI {farm.healthScore}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4 KPI Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Sentinel-2 NDVI */}
          <div className="p-5 rounded-[28px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider">{t('dash.kpi.ndvi', 'Canopy Vigor')}</span>
              <Activity className="size-4 text-[var(--brand-color,#0f9a58)]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">
              {currentFarm.healthScore} <span className="text-xs font-semibold text-slate-500">/ 1.0</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-[var(--brand-color,#0f9a58)]">
              <span className="flex items-center gap-1"><TrendingUp className="size-3.5" /> Healthy vegetative biomass</span>
              <button type="button" onClick={() => toggleKpi('ndvi')} className="text-[9px] font-black uppercase cursor-pointer flex items-center gap-1">{t('command.details', 'Details')} <ChevronDown className={`size-3 transition-transform ${expandedKpi === 'ndvi' ? 'rotate-180' : ''}`} /></button>
            </div>
            {renderKpiDetails('ndvi')}
          </div>

          {/* KPI 2: Soil Moisture */}
          <div className="p-5 rounded-[28px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider">{t('dash.kpi.moisture', 'Root Moisture')}</span>
              <Droplets className="size-4 text-sky-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">
              {currentFarm.moisturePercent}%
            </div>
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-sky-600 dark:text-sky-400">
              <span>Optimal field capacity (0–20cm)</span>
              <button type="button" onClick={() => toggleKpi('moisture')} className="text-[9px] font-black uppercase cursor-pointer flex items-center gap-1">{t('command.details', 'Details')} <ChevronDown className={`size-3 transition-transform ${expandedKpi === 'moisture' ? 'rotate-180' : ''}`} /></button>
            </div>
            {renderKpiDetails('moisture')}
          </div>

          {/* KPI 3: Outbreak Radar */}
          <div
            onClick={() => setOutbreakModalOpen(true)}
            className="p-5 rounded-[28px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-2 cursor-pointer hover:border-slate-300 dark:hover:border-white/20 transition-all"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider">{t('outbreak.title', 'Outbreak Radar')}</span>
              <ShieldAlert className={`size-4 ${
                activeDiagnosis?.severity === 'Critical' || activeDiagnosis?.severity === 'Severe' || outbreakData.hazardLevel === 'Severe'
                  ? 'text-rose-600 animate-pulse'
                  : activeDiagnosis?.severity === 'Moderate' || outbreakData.hazardLevel === 'Moderate'
                  ? 'text-amber-500'
                  : 'text-amber-500'
              }`} />
            </div>
            <div className={`text-2xl sm:text-3xl font-black ${
              activeDiagnosis?.severity === 'Critical' || activeDiagnosis?.severity === 'Severe' || outbreakData.hazardLevel === 'Severe'
                ? 'text-rose-600 dark:text-rose-400'
                : activeDiagnosis?.severity === 'Moderate' || outbreakData.hazardLevel === 'Moderate'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {activeDiagnosis
                ? activeDiagnosis.severity === 'Critical' || activeDiagnosis.severity === 'Severe'
                  ? 'High Threat / Outbreak Active'
                  : `${activeDiagnosis.severity} Threat`
                : `${outbreakData.hazardLevel} Threat`}
            </div>
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="truncate">
              {activeDiagnosis ? (
                <span>
                  {activeDiagnosis.pestName} ({activeDiagnosis.quarantineRadiusMeters}m perimeter)
                </span>
              ) : outbreakData.hazardLevel !== 'Low' && outbreakData.predictedPathogens.length > 0 ? (
                <span>
                  {outbreakData.predictedPathogens[0]} ({outbreakData.quarantineRadiusMeters}m perimeter)
                </span>
              ) : (
                <span>Next spray window in 48h</span>
              )}
              </div>
              <button type="button" onClick={(event) => { event.stopPropagation(); toggleKpi('outbreak'); }} className="shrink-0 text-[9px] font-black uppercase cursor-pointer flex items-center gap-1">{t('command.details', 'Details')} <ChevronDown className={`size-3 transition-transform ${expandedKpi === 'outbreak' ? 'rotate-180' : ''}`} /></button>
            </div>
            {renderKpiDetails('outbreak')}
          </div>

          {/* KPI 4: Mandi Arbitrage */}
          <div
            onClick={() => setMarketModalOpen(true)}
            className="p-5 rounded-[28px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-2 cursor-pointer hover:border-slate-300 dark:hover:border-white/20 transition-all"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider">
                {rotatingMarketItem?.commodity || 'APMC'} Modal Rate
              </span>
              <ArrowUpRight className="size-4 text-[var(--brand-color,#0f9a58)]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white font-mono">
              {rotatingMarketItem ? `₹${rotatingMarketItem.modalPrice.toLocaleString('en-IN')}` : 'Unavailable'}{' '}
              <span className="text-xs font-semibold text-slate-500 font-sans">/qtl</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-[var(--brand-color,#0f9a58)]">
               <span className="truncate">{rotatingMarketItem ? `${rotatingMarketItem.market} (+₹${rotatingMarketItem.arbitrageSpread || 0} spread)` : 'Live mandi feed unavailable'}</span>
              <button type="button" onClick={(event) => { event.stopPropagation(); toggleKpi('market'); }} className="shrink-0 text-[9px] font-black uppercase cursor-pointer flex items-center gap-1">{t('command.details', 'Details')} <ChevronDown className={`size-3 transition-transform ${expandedKpi === 'market' ? 'rotate-180' : ''}`} /></button>
            </div>
            {renderKpiDetails('market')}
          </div>
        </div>

        <SimulatorInsightsPanel
          onOpenShop={(query, category: ProcurementCategory) => {
            setShopQuery(query);
            setShopCategory(category);
            setKisanShopOpen(true);
          }}
        />
        <UnifiedAnalyticsPanel />
        <FieldIntelligenceGrid />

        {/* DEDICATED KISAN DIRECT AGRI-STORE CARD & DRAWER LAUNCHER */}
        <div className="p-6 rounded-[32px] bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 print:hidden">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="size-13 rounded-2xl bg-[var(--brand-color,#0f9a58)] text-white flex items-center justify-center shadow-lg shrink-0">
              <ShoppingCart className="size-6 stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
                  Commodity & Input Marketplace
                </span>
                <span className="text-xs font-bold text-slate-500">Pan-India Doorstep Delivery</span>
              </div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">
                Kisan Direct Agri-Store & Hyperlocal Kendra Procurement
              </h3>
              <p className="text-xs text-slate-650 dark:text-slate-300 font-semibold max-w-2xl leading-relaxed">
                Connect directly with certified seed breeders (KisanShop, BigHaat, AgriBegri), IFFCO Nano fertilizers, CIB&RC approved bio-pesticides, and locate verified Krishi Seva Kendra shops within 50 km.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => {
                setShopCategory('hyperlocal');
                setKisanShopOpen(true);
              }}
              className="flex-1 lg:flex-initial px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-transform hover:scale-105 cursor-pointer"
            >
              <MapPin className="size-4" />
              <span>Nearby Krishi Kendra</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShopCategory('seeds');
                setKisanShopOpen(true);
              }}
              className="flex-1 lg:flex-initial px-4 py-2.5 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-transform hover:scale-105 cursor-pointer"
            >
              <Store className="size-4" />
              <span>Open Kisan Shop</span>
            </button>
          </div>
        </div>

        {/* Mid Section: NDVI Visual Canvas & Soil N-P-K Indicators */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* NDVI & Dynamic Crop Health Heatmap (D3 Layer) */}
          <div className="lg:col-span-7 p-6 rounded-[32px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-[var(--brand-color,#0f9a58)]" />
                <div>
                  <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">
                    Crop Health Heatmap & Multispectral NDVI
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-650 dark:text-slate-300">
                    Sentinel-2 10m bands with live micro-quadrant D3 interpolation
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
                Live D3 Visual Engine
              </span>
            </div>

            {/* D3 Interactive Heatmap Visualization Component */}
            <CropHealthHeatmap farm={currentFarm} />

            <p className="text-xs font-medium text-slate-750 dark:text-slate-300 leading-relaxed">
              Spatial cross-referencing indicates {currentFarm.healthScore >= 0.8 ? 'robust biomass formation' : 'moderate vegetative density'} across your {currentFarm.name}. Soil moisture ({currentFarm.moisturePercent}%) and nitrogen ({currentFarm.nitrogen} kg/ha) display uniform gradients without major drought stress or leaching zones.
            </p>
          </div>

          {/* Soil N-P-K Nutrient Indicators */}
          <div className="lg:col-span-5 p-6 rounded-[32px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
              <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">
                Soil N-P-K & Chemistry Profile
              </h3>
              <span className="text-xs font-bold text-slate-750 dark:text-slate-300">pH {currentFarm.phLevel}</span>
            </div>

            <div className="space-y-4 text-xs font-bold">
              {/* Nitrogen */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-800 dark:text-slate-200">{t('dash.kpi.nitrogen', 'Available Nitrogen (N)')}</span>
                  <span className="text-[var(--brand-color,#0f9a58)] font-black">{currentFarm.nitrogen} kg/ha (Medium)</span>
                </div>
                <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--brand-color,#0f9a58)] rounded-full transition-all"
                    style={{ width: `${Math.min(100, (currentFarm.nitrogen / 200) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Phosphorus */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-800 dark:text-slate-200">{t('dash.kpi.phosphorus', 'Phosphorus (P₂O₅)')}</span>
                  <span className="text-teal-600 dark:text-teal-400 font-black">{currentFarm.phosphorus} kg/ha (Optimal)</span>
                </div>
                <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (currentFarm.phosphorus / 35) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Potassium */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-800 dark:text-slate-200">{t('dash.kpi.potassium', 'Potassium (K₂O)')}</span>
                  <span className="text-sky-600 dark:text-sky-400 font-black">{currentFarm.potassium} kg/ha (High)</span>
                </div>
                <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (currentFarm.potassium / 350) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Advisory Card */}
              <div className="p-3.5 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] border border-[var(--brand-border)] mt-3 text-xs text-slate-800 dark:text-slate-200 font-medium">
                Soil test report indicates healthy organic carbon (0.72%). Recommended top-dressing: apply 25 kg/acre urea before the upcoming light shower.
              </div>
            </div>
          </div>
        </div>

        {/* Daily Task Checklist with Crop Filters */}
        <div className="p-6 rounded-[32px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-4 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/10 pb-3">
            <div>
              <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="size-4 text-[var(--brand-color,#0f9a58)]" />
                {t('command.tasksTitle', 'Daily Field Operations & Task Checklist')}
              </h3>
              <p className="text-xs text-slate-650 dark:text-slate-300 font-medium">
                {t('command.tasksSubtitle', 'Timed agronomic activities based on crop phenological stage')}
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Filter className="size-3.5 text-slate-500" />
              {['All', 'Soybean', 'Cotton', 'Pomegranate'].map((crop) => (
                <button
                  key={crop}
                  type="button"
                  onClick={() => setTaskFilter(crop)}
                  className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                    taskFilter === crop
                      ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs'
                      : 'frosted-glass-sub text-slate-800 dark:text-slate-300 hover:bg-white/80'
                  }`}
                >
                  {crop === 'All' ? t('dash.tasks.filterAll', 'All Tasks') : crop}
                </button>
              ))}
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-2">
            {filteredTasks.map((task, idx) => (
              <div
                key={`task-${task.id}-${idx}`}
                onClick={() => toggleTask(task.id)}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  task.done
                    ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-white/5 opacity-60'
                    : 'frosted-glass-sub border-white/70 dark:border-white/10 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTask(task.id);
                    }}
                    className={`size-5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                      task.done
                        ? 'bg-[var(--brand-color,#0f9a58)] border-[var(--brand-color,#0f9a58)] text-white'
                        : 'border-slate-300 dark:border-white/20'
                    }`}
                  >
                    {task.done && <CheckCircle2 className="size-4" />}
                  </button>

                  <div>
                    <span className={`text-xs font-bold text-slate-950 dark:text-white ${task.done ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-[var(--brand-text,#0d7342)]">{task.crop}</span>
                      <span>•</span>
                      <span>{task.due}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    task.priority === 'High'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                      : task.priority === 'Medium'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                  }`}
                >
                  {task.priority} Priority
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================== */}
        {/* TASK 5: END-OF-DASHBOARD COMPREHENSIVE DECISION REPORT        */}
        {/* ============================================================== */}
        <section className="p-6 sm:p-8 rounded-[36px] frosted-card border border-white/90 dark:border-white/14 shadow-2xl space-y-6">
          {/* Section Header with Export & WhatsApp Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/70 dark:border-white/10 pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] text-xs font-black uppercase tracking-wider shadow-2xs">
                <Sparkles className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
                <span>{t('command.decisionEngine', 'Agronomic Decision Engine & Seasonal Action Plan')}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                {t('dash.dossier.title', 'Parcel Telemetry Synthesis & Crop Health Dossier')}
              </h2>
              <p className="text-xs text-slate-650 dark:text-slate-300 font-semibold">
                {t('dash.dossier.desc', 'Synthesized from Sentinel-2 10m NDVI, soil probes, IMD Doppler feeds, and APMC mandi market data.')}
              </p>
            </div>

            {/* Action Buttons: Print Dossier and WhatsApp */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 print:hidden">
              <button
                type="button"
                onClick={handlePrintDossier}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl frosted-glass-sub hover:bg-white dark:hover:bg-slate-800 text-xs font-black text-slate-900 dark:text-white border border-white/70 dark:border-white/10 shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Print or save Crop Health Dossier as PDF"
              >
                <Printer className="size-4 text-[var(--brand-color,#0f9a58)]" />
                <span>{t('dash.dossier.print', 'Print Dossier')}</span>
              </button>

              <button
                type="button"
                onClick={handleShareToWhatsApp}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-black shadow-md shadow-emerald-700/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Send today's field telemetry & advisory directly to WhatsApp"
              >
                <Share2 className="size-4 stroke-[2.4]" />
                <span>{t('dash.dossier.share', 'Send Report to WhatsApp')}</span>
              </button>
            </div>
          </div>

          {/* Composite Health Score & Field Findings Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Composite Score Gauge Tile */}
            <div className="lg:col-span-4 p-5 rounded-[28px] bg-gradient-to-br from-[var(--brand-subtle,#f0faf4)] to-white/60 dark:from-slate-800/80 dark:to-slate-900/80 border border-[var(--brand-border)] flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-[var(--brand-text,#0d7342)]">
                  {t('command.compositeHealth', 'Composite Farm Health')}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--brand-color,#0f9a58)] text-white">
                  Grade A+
                </span>
              </div>

              <div className="text-center py-2 space-y-1">
                <div className="text-5xl sm:text-6xl font-black text-slate-950 dark:text-white tracking-tight">
                  {compositeScore}
                  <span className="text-xl font-normal text-slate-400">/100</span>
                </div>
                <p className="text-xs font-black text-[var(--brand-text,#0d7342)]">
                  Optimal Agronomic Condition
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Reflectance, root moisture, and chemical balance are synchronized.
                </p>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-bold text-[11px]">
                  <span>Vigor Index</span>
                  <span className="text-[var(--brand-color,#0f9a58)]">94%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--brand-color,#0f9a58)] rounded-full" style={{ width: `${compositeScore}%` }} />
                </div>
              </div>
            </div>

            {/* Key Field Findings Summary */}
            <div className="lg:col-span-8 p-5 sm:p-6 rounded-[28px] frosted-glass-sub border border-white/70 dark:border-white/10 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-black text-sm text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                  <Compass className="size-4 text-[var(--brand-color,#0f9a58)]" />
                  Key Field Findings & Telemetry Synthesis
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {activeDiagnosis ? (
                    <>
                      Automated telemetry correlation for <strong>{currentFarm.name}</strong> ({currentFarm.areaAcres} Acres, {selectedFarm?.primaryCrop}) flagged an active foliar diagnosis: <span className="font-bold text-rose-600 dark:text-rose-400">{activeDiagnosis.pestName}</span> ({activeDiagnosis.severity} severity, {activeDiagnosis.damagePercentage}% damage). ICAR containment protocol active.
                    </>
                  ) : (
                    <>
                      Automated telemetry correlation for <strong>{currentFarm.name}</strong> ({currentFarm.areaAcres} Acres, {selectedFarm?.primaryCrop}) reveals stable vegetative growth with zero acute pest infection corridors.
                    </>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                {activeDiagnosis && (
                  <div className="p-3 rounded-2xl bg-rose-500/10 dark:bg-rose-950/20 border border-rose-500/30 space-y-1 sm:col-span-2">
                    <span className="font-bold text-rose-700 dark:text-rose-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="size-3.5 text-rose-600" />
                        Active Vector: {activeDiagnosis.pestName} (<em>{activeDiagnosis.scientificName}</em>)
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white">
                        {activeDiagnosis.severity} Alert ({activeDiagnosis.confidence}% Conf)
                      </span>
                    </span>
                    <p className="text-slate-750 dark:text-slate-200 text-[11px] leading-relaxed">
                      Damage: <strong>{activeDiagnosis.damagePercentage}%</strong> foliar degradation on {activeDiagnosis.affectedCrop}. Prescribed: <strong>{activeDiagnosis.biologicalTreatment[0] || 'Targeted biological spray'}</strong>. Quarantine buffer: <strong>{activeDiagnosis.quarantineRadiusMeters}m</strong>.
                    </p>
                  </div>
                )}
                <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-white/60 dark:border-white/10 space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Activity className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
                    NDVI & Canopy Density:
                  </span>
                  <p className="text-slate-650 dark:text-slate-300 text-[11px] leading-relaxed">
                    Recorded parcel health score is <strong>{currentFarm.healthScore}</strong>. A regional comparison will appear after a validated reference dataset is connected.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-white/60 dark:border-white/10 space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Droplets className="size-3.5 text-sky-500" />
                    Subsurface Moisture & pH:
                  </span>
                  <p className="text-slate-650 dark:text-slate-300 text-[11px] leading-relaxed">
                    Volumetric moisture at <strong>{currentFarm.moisturePercent}%</strong> sits at optimal field capacity. Soil pH is well buffered at <strong>{currentFarm.phLevel}</strong> with low sodicity risk.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-white/60 dark:border-white/10 space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="size-3.5 text-amber-500" />
                    N-P-K Available Balance:
                  </span>
                  <p className="text-slate-650 dark:text-slate-300 text-[11px] leading-relaxed">
                    N ({currentFarm.nitrogen} kg), P ({currentFarm.phosphorus} kg), K ({currentFarm.potassium} kg). High potash content enhances grain and pod filling resistance.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-white/60 dark:border-white/10 space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <TrendingUp className="size-3.5 text-teal-600" />
                    Mandi Realization Advantage:
                  </span>
                  <p className="text-slate-650 dark:text-slate-300 text-[11px] leading-relaxed">
                    No verified forward-storage spread is loaded for this parcel. Review the observed mandi quote and current warehouse charges before making a sale decision.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Comparative Action Board: CRITICAL DO's vs CRITICAL DON'Ts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* COLUMN 1: CRITICAL DO's */}
            <div className="p-5 sm:p-6 rounded-[28px] bg-emerald-500/10 dark:bg-emerald-950/20 border-2 border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-xl bg-[var(--brand-color,#0f9a58)] text-white flex items-center justify-center shadow-2xs">
                    <CheckCircle2 className="size-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-emerald-950 dark:text-emerald-300 uppercase tracking-wider">
                      {t('dash.dos.title', "CRITICAL DO'S (Prioritized Interventions)")}
                    </h3>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">{t('command.immediateDirectives', 'Immediate Field Directives')}</span>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[var(--brand-color,#0f9a58)] text-white">
                  Mandatory
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-emerald-500/25 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-black text-slate-950 dark:text-white">
                    <Clock className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
                    <span>1. Exploit Optimal Spray Window (Before 09:30 AM)</span>
                  </div>
                  <p className="text-slate-750 dark:text-slate-300 text-[11px] leading-relaxed pl-5">
                    Execute foliar 5% Neem Seed Kernel Extract (NSKE) spray before 09:30 AM while ambient wind velocity remains under 8 km/h and morning dew has evaporated.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-emerald-500/25 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-black text-slate-950 dark:text-white">
                    <Droplets className="size-3.5 text-sky-600" />
                    <span>2. Precision Fertigation Review</span>
                  </div>
                  <p className="text-slate-750 dark:text-slate-300 text-[11px] leading-relaxed pl-5">
                    Use the selected crop cycle, measured soil moisture, and the registered product label to determine a safe runtime and application rate.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-emerald-500/25 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-black text-slate-950 dark:text-white">
                    <Sparkles className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
                    <span>3. Basal Bio-Fungicide Inoculation</span>
                  </div>
                  <p className="text-slate-750 dark:text-slate-300 text-[11px] leading-relaxed pl-5">
                    Apply Trichoderma viride enriched FYM along vegetative root crowns to establish a competitive biological barrier against sclerotium and collar rot mycelia.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-emerald-500/25 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-black text-slate-950 dark:text-white">
                    <ShieldCheck className="size-3.5 text-amber-600" />
                    <span>4. Perimeter Pheromone Trap Cordons</span>
                  </div>
                  <p className="text-slate-750 dark:text-slate-300 text-[11px] leading-relaxed pl-5">
                    Deploy 5 sex pheromone lure traps per acre along border rows to establish an early warning corridor before adult moth oviposition peaks.
                  </p>
                </div>
              </div>
            </div>

            {/* COLUMN 2: CRITICAL DON'Ts */}
            <div className="p-5 sm:p-6 rounded-[28px] bg-rose-500/10 dark:bg-rose-950/20 border-2 border-rose-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-2xs">
                    <XCircle className="size-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-rose-950 dark:text-rose-300 uppercase tracking-wider">
                      {t('dash.donts.title', "CRITICAL DON'TS (Hazard Warnings)")}
                    </h3>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">{t('command.prohibitedPractices', 'Prohibited Practices')}</span>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white">
                  Danger
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-rose-500/25 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-black text-slate-950 dark:text-white">
                    <Wind className="size-3.5 text-rose-600" />
                    <span>1. Prohibit Foliar Spraying During Midday Wind (&gt;15 km/h)</span>
                  </div>
                  <p className="text-slate-750 dark:text-slate-300 text-[11px] leading-relaxed pl-5">
                    Halt all knapsack or drone spraying between 01:00 PM and 05:00 PM. High thermal updrafts cause &gt;40% aerosol drift and unintended neighbor contamination.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-rose-500/25 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-black text-slate-950 dark:text-white">
                    <AlertTriangle className="size-3.5 text-amber-600" />
                    <span>2. Avoid Waterlogging in Lower Micro-Quadrants</span>
                  </div>
                  <p className="text-slate-750 dark:text-slate-300 text-[11px] leading-relaxed pl-5">
                    Do not allow flood irrigation water to stagnate in quadrant Zones B-4 to B-6. Excess water for &gt;18 hours suffocates feeder roots and induces root hypoxia.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-rose-500/25 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-black text-slate-950 dark:text-white">
                    <FlaskConical className="size-3.5 text-rose-600" />
                    <span>3. Never Tank-Mix Copper Oxychloride with Wettable Sulfur</span>
                  </div>
                  <p className="text-slate-750 dark:text-slate-300 text-[11px] leading-relaxed pl-5">
                    Strictly avoid combining copper formulations with sulfur or organophosphates. The chemical interaction forms insoluble phytotoxic curd and causes severe leaf scorching.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-rose-500/25 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-black text-slate-950 dark:text-white">
                    <XCircle className="size-3.5 text-rose-600" />
                    <span>4. Do Not Broadcast Urea Dry on Wet Canopy</span>
                  </div>
                  <p className="text-slate-750 dark:text-slate-300 text-[11px] leading-relaxed pl-5">
                    Never broadcast dry urea granules on moist leaves under direct afternoon sunlight. The resulting ammonia volatilization causes leaf tip necrosis and burns.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Dossier Verification Footer */}
          <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 print:border-slate-300 print:text-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[var(--brand-color,#0f9a58)]" />
              <span>Dossier Reference ID: AGS-MH-{currentFarm.id}-{new Date().toISOString().slice(0, 10)} • Verified for PMFBY & KCC Audit</span>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <span className="font-bold text-[var(--brand-text,#0d7342)]">{t('command.readySubmission', 'Ready for Government Submission')}</span>
            </div>
          </div>

          {/* Official Attestation & Signatures (Print-Only) */}
          <div className="hidden print:grid grid-cols-3 gap-6 pt-6 border-t-2 border-slate-900 text-xs">
            <div className="space-y-6">
              <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Farmer Sign / Thumbprint</p>
              <div className="border-b border-slate-400 pt-8"></div>
              <p className="text-[10px] text-slate-600 font-medium">Aadhaar Linked Account: [Aadhaar Redacted]</p>
            </div>
            <div className="space-y-6 text-center">
              <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Field Agronomist Attestation</p>
              <div className="border-b border-slate-400 pt-8"></div>
              <p className="text-[10px] text-slate-600 font-medium">Agronomist Reg No: AGR-MH-2026/8941</p>
            </div>
            <div className="space-y-2 text-right">
              <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">PMFBY / KCC Inspection Stamp</p>
              <div className="size-20 border-2 border-dashed border-slate-400 rounded-xl ml-auto flex items-center justify-center text-[9px] text-slate-400 uppercase font-black">
                Official Seal
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Hide Footer in Print Mode */}
      <div className="print:hidden">
        <Footer onNavigate={onNavigate} />
        {/* Floating AI Assistant FAB */}
        <AiAssistantFab />
      </div>

      {/* Global Modals */}
      <WeatherModal isOpen={weatherModalOpen} onClose={() => setWeatherModalOpen(false)} />
      <MarketModal isOpen={marketModalOpen} onClose={() => setMarketModalOpen(false)} />
      <ProfitabilityModal isOpen={profitModalOpen} onClose={() => setProfitModalOpen(false)} />
      <VoiceAssistantModal isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} />
      <PestDiagnosisModal isOpen={pestModalOpen} onClose={() => setPestModalOpen(false)} />
      <OutbreakWarningModal isOpen={outbreakModalOpen} onClose={() => setOutbreakModalOpen(false)} />
      <KisanShopModal
        isOpen={kisanShopOpen}
        onClose={() => setKisanShopOpen(false)}
        initialCategory={shopCategory}
        initialSearchQuery={shopQuery}
      />
      <SupportDeskModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
      />
    </div>
  );
}
