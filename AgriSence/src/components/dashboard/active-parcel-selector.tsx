import React from 'react';
import { MapPin, ChevronDown, Sprout } from 'lucide-react';
import { useFarms } from '@/src/context/farm-context';
import { useLanguage } from '@/src/context/language-context';

interface ActiveParcelSelectorProps {
  compact?: boolean;
  className?: string;
}

export function ActiveParcelSelector({ compact = false, className = '' }: ActiveParcelSelectorProps) {
  const { t } = useLanguage();
  const { farms, selectedFarmId, setSelectedFarmId, selectedCropCycle, cropCycles, setSelectedCropCycleId } = useFarms();
  const farmCycles = cropCycles.filter((cycle) => Number(cycle.farmId) === Number(selectedFarmId));

  if (!farms.length) return null;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'}`}>
        <MapPin className="size-4 text-[var(--brand-color,#0f9a58)] shrink-0" />
        <div className="min-w-0">
          <span className="block text-[9px] uppercase tracking-wider font-black text-slate-500 dark:text-slate-400">{t('command.activeParcel', 'Active Parcel')}</span>
          <div className="relative flex items-center gap-1">
            <select
              value={selectedFarmId ?? ''}
              onChange={(e) => setSelectedFarmId(Number(e.target.value))}
              className="appearance-none bg-transparent pr-5 text-xs font-black text-slate-950 dark:text-white outline-none cursor-pointer max-w-[240px]"
              aria-label={t('command.selectParcel', 'Select active parcel')}
            >
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id} className="text-slate-950">
                  {farm.name} • {farm.areaAcres} acres
                </option>
              ))}
            </select>
            <ChevronDown className="size-3.5 text-slate-500 pointer-events-none absolute right-0" />
          </div>
        </div>
      </div>

      {farmCycles.length > 0 && (
        <div className={`flex items-center gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/8 ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'}`}>
          <Sprout className="size-4 text-sky-600 shrink-0" />
          <div className="min-w-0">
            <span className="block text-[9px] uppercase tracking-wider font-black text-slate-500 dark:text-slate-400">{t('command.cropCycle', 'Crop Cycle')}</span>
            <div className="relative flex items-center gap-1">
              <select
                value={selectedCropCycle?.id || ''}
                onChange={(e) => setSelectedCropCycleId(e.target.value)}
                className="appearance-none bg-transparent pr-5 text-xs font-black text-slate-950 dark:text-white outline-none cursor-pointer max-w-[220px]"
                aria-label={t('command.selectCycle', 'Select active crop cycle')}
              >
                {farmCycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.id} className="text-slate-950">
                    {cycle.crop}{cycle.variety ? ` • ${cycle.variety}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="size-3.5 text-slate-500 pointer-events-none absolute right-0" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
