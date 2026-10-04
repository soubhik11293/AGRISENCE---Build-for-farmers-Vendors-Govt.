import React, { useState } from 'react';
import { Navbar } from '@/src/components/landing/navbar';
import { Footer } from '@/src/components/landing/footer';
import { schemes, schemeCategories, allIndianStates } from '@/src/lib/data/schemes';
import { useLanguage } from '@/src/context/language-context';
import {
  Landmark,
  ExternalLink,
  Search,
  Filter,
  ShieldCheck,
  PhoneCall,
  MapPin,
  Calendar,
  Sprout as Sparkles,
} from 'lucide-react';

export function SchemesPage({ onNavigate }: { onNavigate?: (route: string) => void }) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All States');

  const filteredSchemes = schemes.filter((scheme) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      scheme.name.toLowerCase().includes(term) ||
      (scheme.hindiName && scheme.hindiName.includes(term)) ||
      scheme.shortDescription.toLowerCase().includes(term) ||
      scheme.benefit.toLowerCase().includes(term);

    const matchesCategory =
      categoryFilter === 'All' || scheme.category === categoryFilter;

    const matchesState =
      stateFilter === 'All States' ||
      (stateFilter === 'Central Schemes' ? scheme.state === 'Central Schemes' : scheme.state === stateFilter);

    return matchesSearch && matchesCategory && matchesState;
  });

  return (
    <div className="min-h-screen text-slate-950 dark:text-slate-100 flex flex-col">
      <Navbar currentRoute="/schemes" onNavigate={onNavigate} />

      <main className="flex-1 max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 w-full space-y-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--brand-subtle,#f0faf4)] border border-[var(--brand-border)] text-[var(--brand-text,#0d7342)] text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-2xs">
            <Landmark className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
            <span>{t('schemes.badge', 'Pan-India Direct Benefit Transfer & Subsidies')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
            {t('schemes.title', 'Central & State Agricultural Schemes Directory')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-750 dark:text-slate-200 font-semibold leading-relaxed">
            {t('schemes.desc', 'Verified financial subsidies, PM-KISAN top-ups, solar pump grants, PMFBY crop insurance, and subsidized 4% KCC credit across Central programs and all Indian states.')}
          </p>
        </div>

        {/* Search & State Filter Control Ribbon */}
        <div className="p-4 sm:p-5 rounded-[28px] frosted-card border border-white/80 dark:border-white/12 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('schemes.searchPlaceholder', 'Search schemes, subsidies, crops...')}
                className="w-full h-11 pl-9 pr-3 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 text-xs font-bold text-slate-950 dark:text-white focus:outline-none focus:border-[var(--brand-color,#0f9a58)] shadow-2xs"
              />
            </div>

            {/* Indian State Dropdown Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-750 dark:text-slate-200 shrink-0">
                <MapPin className="size-4 text-[var(--brand-color,#0f9a58)]" />
                <span>{t('schemes.stateRegion', 'State / Region:')}</span>
              </div>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full md:w-64 h-11 px-3.5 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 text-xs font-black text-slate-950 dark:text-white focus:outline-none focus:border-[var(--brand-color,#0f9a58)] shadow-2xs cursor-pointer"
              >
                {allIndianStates.map((st) => (
                  <option key={st} value={st} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold pt-2 border-t border-slate-200/60 dark:border-white/10">
            <span className="text-[11px] font-black uppercase text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="size-3" /> {t('schemes.category', 'Category:')}
            </span>
            {['All', ...schemeCategories].map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setCategoryFilter(category)}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  categoryFilter === category
                    ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs'
                    : 'frosted-glass-sub text-slate-800 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 border border-white/60 dark:border-white/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Schemes Results Count */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-650 dark:text-slate-300 px-1">
          <span>Showing {filteredSchemes.length} verified government schemes</span>
          <span className="flex items-center gap-1 text-[var(--brand-text,#0d7342)]">
            <Sparkles className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
            Direct official portal DBT links
          </span>
        </div>

        {/* Schemes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchemes.map((scheme, idx) => (
            <div
              key={`scheme-${scheme.id}-${idx}`}
              className="p-6 rounded-[32px] frosted-card border border-white/80 dark:border-white/12 shadow-[0_8px_24px_-4px_var(--brand-glow)] dark:shadow-none flex flex-col justify-between space-y-4 transition-all hover:scale-[1.01]"
            >
              <div>
                {/* Category & State Tag */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] uppercase tracking-wider">
                    {scheme.category}
                  </span>
                  <span className="text-xs font-black text-slate-750 dark:text-slate-200 flex items-center gap-1">
                    <MapPin className="size-3 text-[var(--brand-color,#0f9a58)]" /> {scheme.state}
                  </span>
                </div>

                {/* Scheme Title */}
                <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight leading-snug">
                  {scheme.name}
                </h3>
                {scheme.hindiName && (
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                    {scheme.hindiName}
                  </p>
                )}

                {/* Highlighted Benefit Pill */}
                <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/25 text-xs text-[var(--brand-text,#0d7342)] font-black">
                  Benefit: {scheme.benefit}
                </div>

                {/* Description */}
                <p className="text-xs font-medium text-slate-750 dark:text-slate-300 mt-2.5 leading-relaxed">
                  {scheme.shortDescription}
                </p>

                {/* Eligibility Criteria */}
                <div className="mt-4 p-3 rounded-2xl frosted-glass-sub border border-white/60 dark:border-white/10 text-xs space-y-1.5">
                  <span className="text-[10px] uppercase font-black text-[var(--brand-text,#0d7342)] block">
                    Key Eligibility Criteria
                  </span>
                  <ul className="space-y-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    {(Array.isArray(scheme.eligibility)
                      ? scheme.eligibility
                      : [scheme.eligibility]
                    ).map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[var(--brand-color,#0f9a58)] font-black">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer: Helpline & Official Portal Link */}
              <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-2 text-xs">
                {scheme.helpline ? (
                  <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1 truncate max-w-[160px]">
                    <PhoneCall className="size-3 text-[var(--brand-color,#0f9a58)] shrink-0" />
                    <span>{scheme.helpline}</span>
                  </span>
                ) : (
                  <span />
                )}

                <a
                  href={scheme.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-transform hover:scale-105 shrink-0"
                >
                  <span>{scheme.portalName || 'Official Portal'}</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
