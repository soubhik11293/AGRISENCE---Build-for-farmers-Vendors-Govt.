import React from 'react';
import { MapPin, Sprout, Trash2, Activity } from 'lucide-react';
import { GlassCard } from '@/src/components/ui/glass-card';
import type { Farm } from '@/src/types';

export function FarmList({
  farms,
  selectedFarmId,
  onSelectFarm,
  onDeleteFarm,
}: {
  farms: Farm[];
  selectedFarmId?: number;
  onSelectFarm?: (id: number) => void;
  onDeleteFarm?: (id: number) => void;
}) {
  if (farms.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center gap-2 p-10 text-center">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-[var(--brand-color,#0f9a58)]">
          <Sprout className="size-6" />
        </span>
        <h3 className="text-base font-bold text-slate-950 dark:text-white">No parcel plots recorded</h3>
        <p className="max-w-xs text-xs text-slate-650 dark:text-slate-400 leading-relaxed">
          Add your first field plot to calibrate localized weather telemetry and NDVI canopy monitoring.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      {farms.map((farm) => {
        const isSelected = selectedFarmId === farm.id;
        const location = [farm.village, farm.district, farm.state].filter(Boolean).join(', ');

        return (
          <div
            key={farm.id}
            onClick={() => onSelectFarm && onSelectFarm(farm.id)}
            className={`p-4 rounded-[28px] border transition-all cursor-pointer backdrop-blur-md shadow-2xs ${
              isSelected
                ? 'bg-emerald-500/18 dark:bg-emerald-950/60 border-[var(--brand-color,#0f9a58)] shadow-md ring-2 ring-emerald-500/30'
                : 'frosted-card border-white/70 dark:border-white/10 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-black text-sm text-slate-950 dark:text-white">{farm.name}</h4>
                {location && (
                  <p className="text-xs text-slate-750 dark:text-slate-300 flex items-center gap-1 mt-0.5 font-medium">
                    <MapPin className="size-3 text-[var(--brand-color,#0f9a58)] shrink-0" />
                    <span className="truncate">{location}</span>
                  </p>
                )}
              </div>

              {onDeleteFarm && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFarm(farm.id);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  aria-label="Delete field"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/10 text-xs">
              {farm.primaryCrop && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-[var(--brand-text,#0d7342)] font-bold border border-[var(--brand-border)]">
                  {farm.primaryCrop}
                </span>
              )}
              {farm.areaAcres && (
                <span className="px-2 py-0.5 rounded-full frosted-glass-sub text-slate-800 dark:text-slate-200 font-bold border border-white/60">
                  {farm.areaAcres} Acres
                </span>
              )}
              {farm.healthScore && (
                <span className="ml-auto text-[11px] font-black text-[var(--brand-color,#0f9a58)] flex items-center gap-1">
                  <Activity className="size-3" /> NDVI {farm.healthScore}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
