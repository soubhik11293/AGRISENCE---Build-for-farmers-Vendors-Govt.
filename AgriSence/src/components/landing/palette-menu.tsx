import React, { useState, useRef, useEffect } from 'react';
import { Palette as PaletteIcon, ChevronDown, Check, Sprout as Sparkles } from 'lucide-react';
import { useTheme, type Palette } from '@/src/components/theme-provider';
import { PaletteComparisonModal } from '@/src/components/palette-comparison-modal';

const PALETTES_LIST: { id: Palette; name: string; hex: string }[] = [
  { id: 'emerald', name: 'Glassy Green', hex: '#0f9a58' },
  { id: 'pink', name: 'Glassy Pink', hex: '#be4d7b' },
  { id: 'orange', name: 'Glassy Orange', hex: '#c9652a' },
  { id: 'blue', name: 'Glassy Blue', hex: '#2575b5' },
  { id: 'teal', name: 'Glassy Teal', hex: '#0d8d82' },
  { id: 'sage', name: 'Glassy Sage', hex: '#4f8f70' },
  { id: 'violet', name: 'Glassy Violet', hex: '#8064bd' },
];

export function PaletteMenu({ className }: { className?: string }) {
  const { palette, setPalette } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activePalette =
    PALETTES_LIST.find((p) => p.id === palette || (p.id === 'emerald' && palette === 'option-1') || (p.id === 'sage' && palette === 'option-4')) ||
    PALETTES_LIST[0];

  return (
    <div className={`relative ${className || ''}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl frosted-glass-sub hover:bg-white dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 border border-white/70 dark:border-white/10 shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
        title="Change theme palette"
      >
        <span
          className="size-3 rounded-full shrink-0 shadow-2xs"
          style={{ backgroundColor: activePalette.hex }}
        />
        <span className="hidden md:inline">{activePalette.name}</span>
        <ChevronDown className="size-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl frosted-card border border-white/80 dark:border-white/15 p-2 shadow-xl backdrop-blur-2xl z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between">
            <span>Color Palette</span>
            <Sparkles className="size-3 text-amber-500" />
          </div>

          {PALETTES_LIST.map((p) => {
             const isSelected = palette === p.id || (p.id === 'emerald' && palette === 'option-1') || (p.id === 'sage' && palette === 'option-4');
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPalette(p.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--brand-color,#0f9a58)] text-white shadow-2xs'
                    : 'text-slate-800 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: p.hex }}
                  />
                  <span>{p.name}</span>
                </div>
                {isSelected && <Check className="size-3.5 stroke-[2.5]" />}
              </button>
            );
          })}

          <div className="pt-1 border-t border-slate-200/60 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowFullModal(true);
              }}
              className="w-full text-center px-2 py-1.5 rounded-xl text-[11px] font-black text-[var(--brand-text,#0d7342)] hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <PaletteIcon className="size-3.5" />
              <span>Compare All Palettes</span>
            </button>
          </div>
        </div>
      )}

      <PaletteComparisonModal
        isOpen={showFullModal}
        onClose={() => setShowFullModal(false)}
      />
    </div>
  );
}
