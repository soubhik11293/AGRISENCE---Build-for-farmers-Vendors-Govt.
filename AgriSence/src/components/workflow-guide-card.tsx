import React, { useState } from 'react';
import {
  Satellite,
  Camera,
  ShieldAlert,
  TrendingUp,
  Coins,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Workflow,
  Sprout as Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';

export interface WorkflowPhase {
  id: string;
  stepNumber: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  briefSummary: string;
  describedWorkflow: {
    overview: string;
    actionSteps: { title: string; detail: string }[];
    impactMetric: string;
    telemetryBadge: string;
    proTip: string;
  };
}

export const WORKFLOW_PHASES: WorkflowPhase[] = [
  {
    id: 'phase-1',
    stepNumber: '01',
    title: 'Geo-Map Farm & Soil Profile',
    category: 'Setup & Baseline',
    icon: Satellite,
    briefSummary:
      'Polygon satellite boundary marking, seasonal crop cycle selection, and baseline N-P-K soil profiling.',
    describedWorkflow: {
      overview:
        'Establish your farm digital twin in under 60 seconds with satellite boundary zoning and soil chemistry profiling.',
      actionSteps: [
        {
          title: 'Satellite Boundary Geofencing',
          detail:
            'Pinpoint acreage boundaries using high-resolution Sentinel-2 multispectral satellite imagery without requiring physical land surveying.',
        },
        {
          title: 'Crop Cycle & Sowing Registry',
          detail:
            'Select current Kharif / Rabi sowing dates, crop type (Cotton, Soybean, Wheat, Sugarcane, Chana), and irrigation type (Drip, Furrow, Rainfed).',
        },
        {
          title: 'Soil Health & NPK Calibration',
          detail:
            'Calibrate soil texture (Black Regur, Alluvial, Red Sandy Loam) and baseline pH to establish organic moisture retention thresholds.',
        },
        {
          title: 'Yield Potential Baseline',
          detail:
            'AgriSence AI computes your plot’s maximum genetic yield potential and sets customized weather risk triggers.',
        },
      ],
      impactMetric: 'Personalized Plot Baseline',
      telemetryBadge: '100% Zero-Hardware Setup',
      proTip:
        'Linking your 7/12 land record automatically verifies your acreage for instant state insurance eligibility.',
    },
  },
  {
    id: 'phase-2',
    stepNumber: '02',
    title: 'Multimodal AI Vision Diagnosis',
    category: 'Crop Health & Scans',
    icon: Camera,
    briefSummary:
      '1.4s field camera diagnosis detecting 30+ pest pathologies, blight, and nutrient deficiencies.',
    describedWorkflow: {
      overview:
        'Instant edge AI diagnosis detects infestations before foliage shows widespread wilting, operating with sub-second latency.',
      actionSteps: [
        {
          title: 'Instant Field Image Capture',
          detail:
            'Snap clear photos of leaf tops, undersides, stem nodes, or fruits using any basic smartphone camera.',
        },
        {
          title: 'Edge Neural Vision Inference',
          detail:
            'Our 1.4-second neural vision model identifies exact pest species (e.g. Pink Bollworm, Fall Armyworm, Whitefly, Powdery Mildew).',
        },
        {
          title: 'Bio-First Dosage Recommendations',
          detail:
            'Prioritizes organic biological solutions (Neem oil azadirachtin, Trichoderma viride, Beauveria bassiana) before chemical pesticides.',
        },
        {
          title: 'Sprayer Tank Dilution Calculator',
          detail:
            'Calculates exact chemical grams and water liters needed for your 16L knapsack or battery sprayer tank based on your acre size.',
        },
      ],
      impactMetric: '96.8% Neural Accuracy in 1.4s',
      telemetryBadge: 'Instant Edge Field Diagnostics',
      proTip:
        'Taking photo early in the morning when dew has dried gives optimal lighting for micro-spore detection.',
    },
  },
  {
    id: 'phase-3',
    stepNumber: '03',
    title: '25km Outbreak Early Warning Radar',
    category: 'Community Intelligence',
    icon: ShieldAlert,
    briefSummary:
      'Village-level radar network providing 48-hour advance alerts before airborne spores cross your mandals.',
    describedWorkflow: {
      overview:
        'Community radar monitors surrounding farm diagnoses to intercept airborne spores and pest swarms before arrival.',
      actionSteps: [
        {
          title: 'Perimeter Observation Aggregation',
          detail:
            'Analyzes the verified pest observations available for the selected field and clearly labels modeled risk.',
        },
        {
          title: 'Micro-Meteorology & Wind Vector Tracking',
          detail:
            'Combines real-time wind speed, air humidity (>85%), and night temperatures to simulate spore trajectory and arrival timing.',
        },
        {
          title: 'Proactive Multilingual Audio Alerts',
          detail:
            'Sends WhatsApp voice notes and SMS in your native tongue 48 hours in advance so you can initiate prophylactic bio-sprays.',
        },
        {
          title: 'Coordinated Cluster Containment',
          detail:
            'Synchronizes spraying with adjoining farm plots to eliminate pest migration and stop recurring pesticide resistance.',
        },
      ],
      impactMetric: '48h Early Preventative Window',
      telemetryBadge: '25km Radial Doppler Radar',
      proTip:
        'Prophylactic biological spraying 48 hours prior saves up to 70% spray costs compared to reactive chemical treatments.',
    },
  },
  {
    id: 'phase-4',
    stepNumber: '04',
    title: 'APMC Mandi Arbitrage & Direct Trade',
    category: 'Market Intelligence',
    icon: TrendingUp,
    briefSummary:
      'Real-time price tracking across 24+ APMC mandis deducting freight and transit shrinkage for peak profit.',
    describedWorkflow: {
      overview:
        'Calculate true net quintal realization across all nearby mandis and sell at peak profitability without middlemen.',
      actionSteps: [
        {
          title: 'Continuous Live Price Streaming',
          detail:
            'Uses the configured live mandi provider and displays source, observation date, freshness, and unavailable-feed states.',
        },
        {
          title: 'True Net Realization Calculator',
          detail:
            'Automatically factors in diesel transport expenses, loading fees, and commission deductions to show your true take-home earnings.',
        },
        {
          title: 'Observed Price History & Watch Ranking',
          detail:
            'Ranks same-product mandi quotes using observed price position, spread, movement, and arrival liquidity; it does not invent future prices.',
        },
        {
          title: 'Direct FPO & Buyer Connectivity',
          detail:
            'Access certified wholesale buyers, FPOs, and corporate procurers to bypass multiple layers of intermediaries.',
        },
      ],
      impactMetric: '+₹350 - ₹600/qtl Net Realization',
      telemetryBadge: '24+ APMC Mandis Monitored',
      proTip:
        'Checking mandi arrivals before 6 AM helps pick the lowest-supply mandi for peak morning auction bids.',
    },
  },
  {
    id: 'phase-5',
    stepNumber: '05',
    title: 'DBT Scheme Subsidy & Insurance Claims',
    category: 'Govt Benefits & Security',
    icon: Coins,
    briefSummary:
      'Pre-filled applications for PM-KUSUM solar pumps, PMFBY crop insurance, and state micro-irrigation grants.',
    describedWorkflow: {
      overview:
        'Unlock government agricultural subsidies and fast-track crop loss claims with automated satellite dossiers.',
      actionSteps: [
        {
          title: 'Automated Eligibility Matching',
          detail:
            'Matches your land size and crop with 14+ Central and State welfare programs (PM-KUSUM, PMFBY, Drip Irrigation Subsidies).',
        },
        {
          title: 'One-Click Pre-Filled Dossier',
          detail:
            'Generates pre-filled official application packages using stored farm coordinates and Aadhaar integration.',
        },
        {
          title: 'Satellite Weather Proof For Insurance',
          detail:
            'Downloads verified satellite rainfall deficit and drought anomaly reports to substantiate PMFBY crop insurance claims.',
        },
        {
          title: 'Live DBT Direct Benefit Tracking',
          detail:
            'Receive real-time milestone updates as government subsidies are sanctioned and deposited directly into your bank account.',
        },
      ],
      impactMetric: 'Up to 60% Govt Capital Subsidy',
      telemetryBadge: 'Direct Bank Transfer (DBT)',
      proTip:
        'Satellite loss certificates eliminate delays with local insurance assessment inspections.',
    },
  },
];

interface WorkflowGuideCardProps {
  onNavigate?: (route: string) => void;
  isModal?: boolean;
  onClose?: () => void;
  initialExpandedId?: string | null;
}

export function WorkflowGuideCard({
  onNavigate,
  isModal = false,
  onClose,
  initialExpandedId = null,
}: WorkflowGuideCardProps) {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(initialExpandedId);

  const toggleStep = (stepId: string) => {
    setExpandedStepId((prev) => (prev === stepId ? null : stepId));
  };

  const expandAll = () => {
    if (expandedStepId === 'ALL') {
      setExpandedStepId(null);
    } else {
      setExpandedStepId('ALL');
    }
  };

  return (
    <div
      className={`w-full rounded-[30px] frosted-card border border-white/70 dark:border-white/12 shadow-[0_12px_36px_-4px_var(--brand-glow)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.65)] backdrop-blur-2xl backdrop-saturate-190 text-slate-950 dark:text-slate-100 transition-all ${
        isModal ? 'p-5 sm:p-7 max-h-[85vh] overflow-y-auto' : 'p-5 sm:p-7'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200/70 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-color,#0f9a58)] flex items-center justify-center border border-[var(--brand-border)] shadow-xs shrink-0">
            <Workflow className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white">
                How AgriSence Works
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
                5-Phase Workflow
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-0.5">
              Click any step below to reveal its complete described workflow & telemetry.
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={expandAll}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl frosted-glass-sub hover:bg-white/80 dark:hover:bg-slate-700 text-[11px] font-black text-slate-700 dark:text-slate-200 border border-white/60 dark:border-white/10 cursor-pointer transition-colors"
          >
            <Layers className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
            <span>{expandedStepId === 'ALL' ? 'Brief View' : 'Expand All Steps'}</span>
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close workflow guide"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Brief Flow Interactive Timeline */}
      <div className="mt-5 space-y-3">
        {WORKFLOW_PHASES.map((phase) => {
          const isExpanded = expandedStepId === phase.id || expandedStepId === 'ALL';
          const Icon = phase.icon;

          return (
            <div
              key={phase.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? 'frosted-card border-[var(--brand-color,#0f9a58)] shadow-md ring-1 ring-[var(--brand-color,#0f9a58)]/30'
                  : 'frosted-glass-sub border-white/60 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleStep(phase.id)}
                className="w-full text-left p-3.5 sm:p-4 flex items-start gap-3 sm:gap-3.5 cursor-pointer select-none transition-colors group"
                aria-expanded={isExpanded}
              >
                <div
                  className={`size-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs transition-colors shadow-2xs ${
                    isExpanded
                      ? 'bg-[var(--brand-color,#0f9a58)] text-white'
                      : 'bg-white dark:bg-slate-800 text-[var(--brand-color,#0f9a58)] border border-slate-200/80 dark:border-white/10 group-hover:bg-[var(--brand-color,#0f9a58)] group-hover:text-white'
                  }`}
                >
                  <Icon className="size-4.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[var(--brand-color,#0f9a58)]">
                        Phase {phase.stepNumber}
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-950 dark:text-white">
                        {phase.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
                        {phase.describedWorkflow.impactMetric}
                      </span>
                      <div className="text-slate-400 group-hover:text-[var(--brand-color,#0f9a58)] transition-colors">
                        {isExpanded ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-650 dark:text-slate-300 font-medium leading-relaxed">
                    {phase.briefSummary}
                  </p>

                  {!isExpanded && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-[var(--brand-color,#0f9a58)] group-hover:underline">
                      <span>Click to inspect described workflow</span>
                      <span>→</span>
                    </div>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-3.5 sm:px-4 pb-4 pt-1 border-t border-slate-200/60 dark:border-white/10 space-y-3.5 bg-white/40 dark:bg-slate-900/40">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed italic bg-[var(--brand-subtle,#f0faf4)] p-2.5 rounded-xl border border-[var(--brand-border)]">
                    "{phase.describedWorkflow.overview}"
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {phase.describedWorkflow.actionSteps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-3 rounded-xl frosted-glass-sub border border-white/60 dark:border-white/10 space-y-1 shadow-2xs"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="size-4 rounded-full bg-[var(--brand-color,#0f9a58)] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                            {sIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-950 dark:text-white">
                            {step.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-650 dark:text-slate-300 font-medium leading-relaxed pl-5.5">
                          {step.detail}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs">
                        {phase.describedWorkflow.telemetryBadge}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-650 dark:text-slate-300 font-bold">
                      <Sparkles className="size-3.5 text-[var(--brand-color,#0f9a58)] shrink-0" />
                      <span>{phase.describedWorkflow.proTip}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Card Footer */}
      <div className="mt-5 p-3.5 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] border border-[var(--brand-border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-850 dark:text-slate-200 font-bold">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-[var(--brand-color,#0f9a58)] shrink-0" />
          <span>Zero external hardware • Fast field response • 100% Free 30-Day Pilot</span>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              onNavigate('/signup');
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <span>Start Free AgTech Pilot</span>
            <ArrowRight className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
