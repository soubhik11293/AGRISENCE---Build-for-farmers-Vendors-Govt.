import React, { useEffect, useState } from 'react';
import { Activity, BarChart3, CalendarDays, Droplets, FlaskConical, IndianRupee, ListChecks, RefreshCw, ShieldAlert, Sprout, Store, TestTube2, TrendingUp, Waves, CloudSun } from 'lucide-react';
import { getFarmAnalytics, type FarmAnalytics, type ReportPeriod } from '@/src/lib/analytics-engine';
import { useAuth } from '@/src/context/auth-context';
import { useFarms } from '@/src/context/farm-context';
import { useLanguage } from '@/src/context/language-context';

const PERIODS: Array<{ id: ReportPeriod; key: string; label: string }> = [
  { id: 'daily', key: 'command.daily', label: 'Daily' },
  { id: 'weekly', key: 'command.weekly', label: 'Weekly' },
  { id: 'monthly', key: 'command.monthly', label: 'Monthly' },
  { id: 'yearly', key: 'command.yearly', label: 'Yearly' },
];

const emptyAnalytics: FarmAnalytics = {
  period: 'daily', periodStart: '', periodEnd: '', eventCount: 0, diagnosisCount: 0, severeDiagnosisCount: 0,
  irrigationCount: 0, waterApplied: 0, simulationCount: 0, taskCompletedCount: 0, taskCreatedCount: 0,
  marketObservationCount: 0, weatherObservationCount: 0, soilTestCount: 0, outbreakCount: 0, recommendationCount: 0,
  sprayApplicationCount: 0, fertilizerApplicationCount: 0, harvestCount: 0, saleCount: 0,
  expenseTotal: 0, revenueTotal: 0, netAmount: 0, dataCompleteness: 0, uniqueSources: 0,
};

export function UnifiedAnalyticsPanel() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { selectedFarmId, selectedFarm, selectedCropCycle } = useFarms();
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [data, setData] = useState<FarmAnalytics>(emptyAnalytics);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user?.id || !selectedFarmId) return;
    setLoading(true);
    try {
      setData(await getFarmAnalytics(user.id, selectedFarmId, period));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [user?.id, selectedFarmId, period]);

  useEffect(() => {
    const refresh = () => { void load(); };
    window.addEventListener('agrisence_farm_event_recorded', refresh);
    window.addEventListener('agrisence_simulation_updated', refresh);
    window.addEventListener('agrisence_simulator_updated', refresh);
    window.addEventListener('agrisence_soil_updated', refresh);
    window.addEventListener('agrisence_outbreak_updated', refresh);
    window.addEventListener('agrisence_farm_selected', refresh);
    return () => {
      window.removeEventListener('agrisence_farm_event_recorded', refresh);
      window.removeEventListener('agrisence_simulation_updated', refresh);
      window.removeEventListener('agrisence_simulator_updated', refresh);
      window.removeEventListener('agrisence_soil_updated', refresh);
      window.removeEventListener('agrisence_outbreak_updated', refresh);
      window.removeEventListener('agrisence_farm_selected', refresh);
    };
  }, [user?.id, selectedFarmId, period]);

  const cards = [
    { label: t('command.fieldEvents', 'Field Events'), value: data.eventCount, icon: Activity },
    { label: t('command.diagnoses', 'Diagnoses'), value: data.diagnosisCount, icon: ShieldAlert },
    { label: t('command.simulations', 'Simulations'), value: data.simulationCount, icon: FlaskConical },
    { label: t('command.tasksCompleted', 'Tasks Completed'), value: data.taskCompletedCount, icon: ListChecks },
    { label: t('command.irrigation', 'Irrigation'), value: `${data.irrigationCount} • ${data.waterApplied.toFixed(0)} L`, icon: Droplets },
    { label: t('command.weatherReads', 'Weather Reads'), value: data.weatherObservationCount, icon: CloudSun },
    { label: t('command.soilTests', 'Soil Tests'), value: data.soilTestCount, icon: TestTube2 },
    { label: t('command.outbreakAlerts', 'Outbreak Alerts'), value: data.outbreakCount, icon: ShieldAlert },
    { label: t('command.recommendations', 'Recommendations'), value: data.recommendationCount, icon: Sprout },
    { label: t('command.sprayApplications', 'Spray Applications'), value: data.sprayApplicationCount, icon: Waves },
    { label: t('command.marketObservations', 'Market Observations'), value: data.marketObservationCount, icon: Store },
    { label: t('command.harvestSales', 'Harvest / Sales'), value: `${data.harvestCount} / ${data.saleCount}`, icon: TrendingUp },
  ];

  return (
    <section className="p-5 sm:p-6 rounded-[32px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-5">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[var(--brand-text,#0d7342)]">
            <BarChart3 className="size-4" /> {t('command.analyticsEyebrow', 'Platform Summary Analyzer')}
          </div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white mt-1">{selectedFarm?.name || 'Selected Parcel'} intelligence summary</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1">
            {selectedCropCycle?.crop || selectedFarm?.primaryCrop || 'Current crop'} • {t('command.analyticsDesc', 'Aggregated from synchronized field events, searches, simulations and actions.')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200/60 dark:border-white/10">
            {PERIODS.map((item) => (
              <button key={item.id} type="button" onClick={() => setPeriod(item.id)} className={`px-3 py-1.5 rounded-xl text-[11px] font-black cursor-pointer ${period === item.id ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>
                {t(item.key, item.label)}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => void load()} className="size-9 rounded-xl frosted-glass-sub border border-white/70 dark:border-white/10 flex items-center justify-center cursor-pointer" aria-label={t('command.refreshAnalytics', 'Refresh analytics')}>
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/55 border border-white/70 dark:border-white/10">
            <Icon className="size-4 text-[var(--brand-color,#0f9a58)] mb-2" />
            <div className="text-lg font-black text-slate-950 dark:text-white truncate">{value}</div>
            <div className="text-[9px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-xs font-black"><IndianRupee className="size-4 text-emerald-600" /> {t('command.financialMovement', 'Financial movement')}</div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div><div className="text-base font-black">₹{data.revenueTotal.toLocaleString('en-IN')}</div><span className="text-[9px] text-slate-500">{t('command.revenue', 'Revenue')}</span></div>
            <div><div className="text-base font-black">₹{data.expenseTotal.toLocaleString('en-IN')}</div><span className="text-[9px] text-slate-500">{t('command.expenses', 'Expenses')}</span></div>
            <div><div className={`text-base font-black ${data.netAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₹{data.netAmount.toLocaleString('en-IN')}</div><span className="text-[9px] text-slate-500">{t('command.net', 'Net')}</span></div>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-sky-500/8 border border-sky-500/20">
          <div className="flex items-center gap-2 text-xs font-black"><CalendarDays className="size-4 text-sky-600" /> {t('command.periodCoverage', 'Period coverage')}</div>
          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-3">{data.periodStart ? new Date(data.periodStart).toLocaleDateString('en-IN') : '—'} → {data.periodEnd ? new Date(data.periodEnd).toLocaleDateString('en-IN') : '—'}</p>
          <p className="text-[10px] text-slate-500 mt-1">{data.uniqueSources} synchronized sources • {data.dataCompleteness}% event-type coverage</p>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/8 border border-amber-500/20">
          <div className="flex items-center gap-2 text-xs font-black"><Activity className="size-4 text-amber-600" /> {t('command.riskPulse', 'Risk & action pulse')}</div>
          <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-3">{data.severeDiagnosisCount} severe/critical diagnoses • {data.outbreakCount} outbreak evaluations • {data.taskCreatedCount} tasks created</p>
          <p className="text-[10px] text-slate-500 mt-1">Use this period selector to compare operational load across the season.</p>
        </div>
      </div>
    </section>
  );
}
