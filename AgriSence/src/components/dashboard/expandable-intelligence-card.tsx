import React, { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';

type Detail = { label: string; value: string };

interface ExpandableIntelligenceCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  details: Detail[];
  relatedLabel?: string;
  onRelated?: () => void;
  className?: string;
}

export function ExpandableIntelligenceCard({
  label,
  value,
  subtitle,
  icon: Icon,
  details,
  relatedLabel,
  onRelated,
  className = '',
}: ExpandableIntelligenceCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-2xl bg-white/70 dark:bg-slate-900/55 border border-white/70 dark:border-white/10 min-w-0 overflow-hidden transition-all ${className}`}>
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="w-full text-left p-3.5 cursor-pointer hover:bg-white/70 dark:hover:bg-slate-800/60 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 min-w-0">
            <Icon className="size-3.5 text-[var(--brand-color,#0f9a58)] shrink-0" />
            <span className="truncate">{label}</span>
          </div>
          <ChevronDown className={`size-4 text-slate-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
        <div className="text-sm font-black text-slate-950 dark:text-white mt-2 truncate">{value}</div>
        {subtitle && <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">{subtitle}</div>}
        <div className="text-[9px] font-black uppercase tracking-wide text-[var(--brand-text,#0d7342)] mt-2">
          {expanded ? 'Hide connected details' : 'Open connected details'}
        </div>
      </button>

      {expanded && (
        <div className="px-3.5 pb-3.5 border-t border-slate-200/60 dark:border-white/10 pt-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {details.map((detail) => (
              <div key={`${label}-${detail.label}`} className="rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/50 dark:border-white/8 px-2.5 py-2">
                <div className="text-[9px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{detail.label}</div>
                <div className="text-[11px] font-bold text-slate-900 dark:text-white mt-0.5 break-words">{detail.value}</div>
              </div>
            ))}
          </div>
          {onRelated && relatedLabel && (
            <button
              type="button"
              onClick={onRelated}
              className="w-full mt-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] text-[10px] font-black cursor-pointer hover:bg-emerald-500/15 transition-colors"
            >
              {relatedLabel}
              <ExternalLink className="size-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
