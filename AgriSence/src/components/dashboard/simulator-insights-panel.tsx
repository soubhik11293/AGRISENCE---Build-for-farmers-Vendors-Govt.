import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, FlaskConical, History, RefreshCw, ShoppingCart, Sparkles } from 'lucide-react';
import { useAuth } from '@/src/context/auth-context';
import { useFarms } from '@/src/context/farm-context';
import {
  getSimulationHistory,
  loadCloudSimulationHistory,
  type SimulationRecord,
} from '@/src/lib/simulator-sync';
import { buildSimulationGuidance, type ProcurementCategory } from '@/src/lib/simulator-guidance';

interface SimulatorInsightsPanelProps {
  onOpenShop?: (query: string, category: ProcurementCategory) => void;
}

function recordKey(record: SimulationRecord) {
  return `${record.moduleId}:${record.timestamp}:${record.farmId || ''}`;
}

function guidanceFor(record: SimulationRecord) {
  return record.result || buildSimulationGuidance(record);
}

export function SimulatorInsightsPanel({ onOpenShop }: SimulatorInsightsPanelProps) {
  const { user } = useAuth();
  const { selectedFarmId } = useFarms();
  const [history, setHistory] = useState<SimulationRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const local = getSimulationHistory({
        farmId: selectedFarmId || undefined,
      });
      const cloud = user?.id && selectedFarmId
        ? await loadCloudSimulationHistory(user.id, selectedFarmId)
        : [];
      const merged = new Map<string, SimulationRecord>();
      [...local, ...cloud].forEach((record) => merged.set(recordKey(record), record));
      setHistory(Array.from(merged.values()).sort((a, b) => Number(b.timestamp) - Number(a.timestamp)).slice(0, 30));
    } finally {
      setLoading(false);
    }
  }, [selectedFarmId, user?.id]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const refresh = () => { void load(); };
    window.addEventListener('agrisence_simulation_updated', refresh);
    window.addEventListener('agrisence_farm_event_recorded', refresh);
    return () => {
      window.removeEventListener('agrisence_simulation_updated', refresh);
      window.removeEventListener('agrisence_farm_event_recorded', refresh);
    };
  }, [load]);

  const latest = history[0];
  const latestGuidance = latest ? guidanceFor(latest) : null;
  const needs = useMemo(() => {
    const unique = new Map<string, { query: string; category: ProcurementCategory; reason: string; priority: string }>();
    history.slice(0, 10).forEach((record) => {
      guidanceFor(record).procurementNeeds.forEach((need) => unique.set(`${need.category}:${need.query}`, need));
    });
    return Array.from(unique.values()).slice(0, 6);
  }, [history]);

  return (
    <section className="p-5 sm:p-6 rounded-[32px] frosted-card border border-white/80 dark:border-white/10 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[var(--brand-text,#0d7342)]">
            <FlaskConical className="size-4" /> Simulator intelligence
          </div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white mt-1">Results, history & next actions</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1">
            Every completed simulator run is summarized for the selected parcel and turned into guidance.
          </p>
        </div>
        <button type="button" onClick={() => void load()} className="size-9 rounded-xl frosted-glass-sub border border-white/70 dark:border-white/10 flex items-center justify-center cursor-pointer" aria-label="Refresh simulator history">
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!latest || !latestGuidance ? (
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-white/10 text-center">
          <History className="size-6 mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-black text-slate-700 dark:text-slate-300">No completed simulator runs for this parcel yet.</p>
          <p className="text-xs text-slate-500 mt-1">Run a calculator to create the first result, summary, guidance, and follow-up record.</p>
        </div>
      ) : (
        <>
          <div className={`p-4 rounded-2xl border space-y-2 ${latestGuidance.status === 'warning' ? 'bg-rose-500/10 border-rose-500/25' : latestGuidance.status === 'positive' ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-amber-500/10 border-amber-500/25'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                {latestGuidance.status === 'warning' ? <AlertTriangle className="size-5 text-rose-600 shrink-0" /> : <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />}
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-black text-slate-500">Latest result • {latest.moduleName}</p>
                  <h3 className="text-sm font-black text-slate-950 dark:text-white mt-1">{latestGuidance.summary}</h3>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{new Date(latest.timestamp).toLocaleString('en-IN')}</span>
            </div>
            <ul className="space-y-1.5 pl-7">
              {latestGuidance.guidance.map((item) => <li key={item} className="text-xs font-semibold text-slate-700 dark:text-slate-300 list-disc">{item}</li>)}
            </ul>
          </div>

          {needs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black"><ShoppingCart className="size-4 text-[var(--brand-color,#0f9a58)]" /> Suggested inputs from simulator needs</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {needs.map((need) => (
                  <div key={`${need.category}:${need.query}`} className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/55 border border-white/70 dark:border-white/10 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-black truncate">{need.query}</p>
                      <p className="text-[10px] text-slate-500 truncate">{need.reason}</p>
                    </div>
                    {onOpenShop && <button type="button" onClick={() => onOpenShop(need.query, need.category)} className="px-2.5 py-1.5 rounded-xl bg-[var(--brand-color,#0f9a58)] text-white text-[10px] font-black shrink-0 cursor-pointer">Buy</button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black"><History className="size-4 text-slate-500" /> Recent simulator history ({history.length})</div>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {history.slice(0, 8).map((record) => {
                const result = guidanceFor(record);
                return <div key={recordKey(record)} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-white/10">
                  <div className="flex items-center gap-2 min-w-0"><Sparkles className="size-3.5 text-[var(--brand-color,#0f9a58)] shrink-0" /><span className="text-xs font-bold truncate">{record.moduleName}</span></div>
                  <div className="flex items-center gap-2 shrink-0"><span className={`text-[10px] font-black ${result.status === 'warning' ? 'text-rose-600' : result.status === 'positive' ? 'text-emerald-600' : 'text-amber-600'}`}>{result.status}</span><Clock3 className="size-3 text-slate-400" /><span className="text-[10px] text-slate-500">{new Date(record.timestamp).toLocaleDateString('en-IN')}</span></div>
                </div>;
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
