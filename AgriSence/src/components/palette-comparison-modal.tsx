import React from 'react';
import { X, Check, Sprout as Sparkles, Sun, Moon, Palette as PaletteIcon, ShieldCheck } from 'lucide-react';
import { useTheme, type Palette } from '@/src/components/theme-provider';

interface PaletteOption {
  id: Palette;
  name: string;
  tagline: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  bgLightPreview: string;
  bgDarkPreview: string;
  swatches: { name: string; hex: string }[];
}

const PALETTES: PaletteOption[] = [
  {
    id: 'emerald',
    name: 'Bio-Precision Emerald',
    tagline: 'Default AgTech Standard',
    description: 'Chlorophyll green inspired by sunlit crops and living biomass, calibrated for peak outdoor visibility in sunlight.',
    primaryColor: '#0f9a58',
    accentColor: '#0d7342',
    bgLightPreview: '#f2faf5',
    bgDarkPreview: '#0d131a',
    swatches: [
      { name: 'Emerald', hex: '#0f9a58' },
      { name: 'Forest', hex: '#0d7342' },
      { name: 'Sunlit Mint', hex: '#f0faf4' },
      { name: 'Bio Tint', hex: '#dff4e6' },
    ],
  },
  {
    id: 'pink', name: 'Glassy Pink', tagline: 'Soft Blossom Glass',
    description: 'A warm rose palette with a calm, high-contrast dark mode for long field sessions.',
    primaryColor: '#be4d7b', accentColor: '#8a2c51', bgLightPreview: '#fdf2f6', bgDarkPreview: '#171116',
    swatches: [{ name: 'Rose', hex: '#be4d7b' }, { name: 'Berry', hex: '#8a2c51' }, { name: 'Blush', hex: '#fdf2f6' }, { name: 'Petal', hex: '#f5dce7' }],
  },
  {
    id: 'orange', name: 'Glassy Orange', tagline: 'Warm Harvest Glass',
    description: 'A warm amber-orange interface inspired by harvested grain, sunlight, and market activity.',
    primaryColor: '#c9652a', accentColor: '#924215', bgLightPreview: '#fdf6f0', bgDarkPreview: '#17120f',
    swatches: [{ name: 'Orange', hex: '#c9652a' }, { name: 'Clay', hex: '#924215' }, { name: 'Cream', hex: '#fdf6f0' }, { name: 'Peach', hex: '#f7dfcf' }],
  },
  {
    id: 'blue', name: 'Glassy Blue', tagline: 'Sky & Water Glass',
    description: 'A clear blue palette for weather, telemetry, and analytical dashboards with a night-sky dark mode.',
    primaryColor: '#2575b5', accentColor: '#164d78', bgLightPreview: '#f0f6fc', bgDarkPreview: '#11161b',
    swatches: [{ name: 'Blue', hex: '#2575b5' }, { name: 'Navy', hex: '#164d78' }, { name: 'Cloud', hex: '#f0f6fc' }, { name: 'Mist', hex: '#dceaf6' }],
  },
  {
    id: 'teal', name: 'Glassy Teal', tagline: 'Waterwise Glass',
    description: 'A luminous teal palette that keeps controls crisp while preserving the frosted-glass identity.',
    primaryColor: '#0d8d82', accentColor: '#095f57', bgLightPreview: '#f0faf8', bgDarkPreview: '#101716',
    swatches: [{ name: 'Teal', hex: '#0d8d82' }, { name: 'Deep Teal', hex: '#095f57' }, { name: 'Foam', hex: '#f0faf8' }, { name: 'Water', hex: '#d9f1ed' }],
  },
  {
    id: 'sage', name: 'Glassy Sage', tagline: 'Field Calm Glass',
    description: 'A muted sage palette for a softer field-operations workspace and comfortable dark mode.',
    primaryColor: '#4f8f70', accentColor: '#2f6048', bgLightPreview: '#f1f7f3', bgDarkPreview: '#0e1712',
    swatches: [{ name: 'Sage', hex: '#4f8f70' }, { name: 'Forest', hex: '#2f6048' }, { name: 'Leaf', hex: '#f1f7f3' }, { name: 'Moss', hex: '#dcece1' }],
  },
  {
    id: 'violet', name: 'Glassy Violet', tagline: 'Insight Glass',
    description: 'A focused violet palette for analytics, comparison views, and a distinctive high-contrast dark mode.',
    primaryColor: '#8064bd', accentColor: '#5b438f', bgLightPreview: '#f5f1fc', bgDarkPreview: '#15111d',
    swatches: [{ name: 'Violet', hex: '#8064bd' }, { name: 'Plum', hex: '#5b438f' }, { name: 'Lilac', hex: '#f5f1fc' }, { name: 'Haze', hex: '#e9e0f7' }],
  },
];

export function PaletteComparisonModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { palette, setPalette, theme, setTheme } = useTheme();

  if (!isOpen) return null;

  const isSelected = (id: Palette) => {
    if (id === 'emerald') return palette === 'emerald' || palette === 'option-1';
    if (id === 'sage') return palette === 'sage' || palette === 'option-4';
    return palette === id;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-[32px] frosted-glass border border-white/60 dark:border-white/12 shadow-[0_24px_70px_rgba(0,0,0,0.35)] text-slate-950 dark:text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl frosted-glass-sub border border-white/80 dark:border-white/10 shadow-2xs">
              <PaletteIcon className="size-5 text-[var(--brand-color,#0f9a58)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
                  Theme & Glass Engine
                </span>
                <span className="text-xs font-semibold text-slate-500">Instant Global Re-Skinning</span>
              </div>
              <h3 className="text-xl font-black text-slate-950 dark:text-white tracking-tight">
                Select Your Palette & Frosted Glass Aesthetic
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="px-3.5 py-1.5 rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-white/80 dark:hover:bg-slate-700 transition-colors shadow-2xs"
              title="Toggle Light / Dark Mode"
            >
              {theme === 'dark' ? <Sun className="size-3.5 text-amber-400" /> : <Moon className="size-3.5 text-slate-700" />}
              <span className="hidden sm:inline">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl text-slate-500 hover:text-slate-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          <div className="flex items-center justify-between flex-wrap gap-2 text-slate-700 dark:text-slate-300">
            <p className="font-semibold text-xs leading-relaxed max-w-3xl">
              Choose any colour palette below. Every component across AgriSence — including the frosted glass navbar, APMC mandi tickers, radar maps, action buttons, and analytical cards — updates seamlessly in real-time.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <Sparkles className="size-4 text-amber-500" />
              <span>Frosted Glass Active</span>
            </div>
          </div>

          {/* Palette Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {PALETTES.map((item) => {
              const active = isSelected(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => setPalette(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setPalette(item.id);
                    }
                  }}
                  className={`p-4.5 rounded-[26px] transition-all flex flex-col justify-between space-y-4 frosted-card relative overflow-hidden cursor-pointer select-none ${
                    active
                      ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-xl scale-[1.02]'
                      : 'hover:scale-[1.015] hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                  style={{
                    borderColor: active ? item.primaryColor : undefined,
                    boxShadow: active ? `0 14px 36px -4px ${item.primaryColor}45` : undefined,
                  }}
                >
                  <div className="space-y-3.5">
                    {/* Tag + Active indicator */}
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${item.primaryColor}18`,
                          color: item.primaryColor,
                        }}
                      >
                        {item.tagline}
                      </span>
                      {active ? (
                        <span
                          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-white text-[10px] font-black shadow-xs animate-pulse"
                          style={{ backgroundColor: item.primaryColor }}
                        >
                          <Check className="size-3 stroke-[2.5]" /> Active Now
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-700">
                          Click to apply →
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                        <span
                          className="size-3 rounded-full inline-block shrink-0 shadow-2xs"
                          style={{ backgroundColor: item.primaryColor }}
                        />
                        {item.name}
                      </h4>
                      <p className="text-slate-650 dark:text-slate-400 font-medium text-[11px] mt-1 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Swatches Bar */}
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">
                        Color Harmonies
                      </span>
                      <div className="grid grid-cols-4 gap-1.5 text-center">
                        {item.swatches.map((swatch, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-1.5 rounded-xl text-white font-black text-[9px] shadow-2xs flex flex-col justify-between h-12"
                            style={{ backgroundColor: swatch.hex }}
                          >
                            <span className="text-[8px] opacity-90 drop-shadow-xs truncate">{swatch.name}</span>
                            <span className="text-[8px] opacity-80 drop-shadow-xs">{swatch.hex}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPalette(item.id);
                    }}
                    className="w-full py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs hover:scale-[1.02]"
                    style={{
                      backgroundColor: active ? item.primaryColor : undefined,
                      color: active ? '#ffffff' : undefined,
                    }}
                  >
                    {active ? (
                      <>
                        <Check className="size-3.5" /> Applied to Entire Website
                      </>
                    ) : (
                      <span className="text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white font-black">
                        Apply {item.name.split(' ')[0]} Palette
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Quick Info Banner */}
          <div className="p-4 rounded-2xl frosted-glass-sub border border-slate-200/80 dark:border-white/10 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="size-4 text-[var(--brand-color,#0f9a58)] shrink-0" />
              <p className="text-slate-750 dark:text-slate-300 text-[11px] font-semibold">
                All palettes support authentic frosted glass with dual-layer specular refraction, zero visual distortion, and AA-grade contrast ratings.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white font-black text-xs shadow-2xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
