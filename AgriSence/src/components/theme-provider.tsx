import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type Palette = 'emerald' | 'teal' | 'orange' | 'pink' | 'blue' | 'sage' | 'violet' | 'option-4' | 'option-1';

export interface PaletteConfig {
  name: string;
  brandColor: string;
  brandHover: string;
  brandText: string;
  brandSubtle: string;
  brandBorder: string;
  brandGlow: string;
  bgLight: string;
  bgDark: string;
}

export const PALETTE_CONFIGS: Record<string, PaletteConfig> = {
  emerald: {
    name: 'Glassy Green',
    brandColor: '#0f9a58',
    brandHover: '#0d844b',
    brandText: '#0d7342',
    brandSubtle: '#f0faf4',
    brandBorder: 'rgba(15, 154, 88, 0.20)',
    brandGlow: 'rgba(15, 154, 88, 0.12)',
    bgLight: '#f6f8f6',
    bgDark: '#101613',
  },
  'option-1': {
    name: 'Bio-Emerald',
    brandColor: '#0f9a58',
    brandHover: '#0d844b',
    brandText: '#0d7342',
    brandSubtle: '#f0faf4',
    brandBorder: 'rgba(15, 154, 88, 0.20)',
    brandGlow: 'rgba(15, 154, 88, 0.12)',
    bgLight: '#f6f8f6',
    bgDark: '#101613',
  },
  teal: {
    name: 'Glassy Teal',
    brandColor: '#0d8d82',
    brandHover: '#0a756c',
    brandText: '#095f57',
    brandSubtle: '#f0faf8',
    brandBorder: 'rgba(13, 141, 130, 0.20)',
    brandGlow: 'rgba(13, 141, 130, 0.12)',
    // Softer seafoam mist ambient canvas
    bgLight: 'linear-gradient(180deg, #f0f9f8 0%, #f8fcfb 30%, #e5f4f2 75%, #eff8f7 100%)',
    bgDark: 'radial-gradient(circle at top left, rgba(13, 141, 130, 0.35) 0%, #0a1416 45%, #040809 100%)',
  },
  orange: {
    name: 'Glassy Orange',
    brandColor: '#c9652a',
    brandHover: '#ad521e',
    brandText: '#924215',
    brandSubtle: '#fdf6f0',
    brandBorder: 'rgba(201, 101, 42, 0.20)',
    brandGlow: 'rgba(201, 101, 42, 0.12)',
    // Softer warm honey peach ambient canvas
    bgLight: 'linear-gradient(180deg, #fdf8f4 0%, #fffcf8 30%, #faeee4 75%, #fdf4ed 100%)',
    bgDark: 'radial-gradient(circle at top left, rgba(173, 82, 30, 0.35) 0%, #150f0c 45%, #080605 100%)',
  },
  pink: {
    name: 'Glassy Pink',
    brandColor: '#be4d7b',
    brandHover: '#a43b65',
    brandText: '#8a2c51',
    brandSubtle: '#fdf2f6',
    brandBorder: 'rgba(190, 77, 123, 0.20)',
    brandGlow: 'rgba(190, 77, 123, 0.12)',
    // Softer dusty rose blossom ambient canvas
    bgLight: 'linear-gradient(180deg, #fcf4f7 0%, #fff9fb 30%, #f8e7ef 75%, #faf0f4 100%)',
    bgDark: 'radial-gradient(circle at top left, rgba(164, 59, 101, 0.35) 0%, #150c12 45%, #080407 100%)',
  },
  blue: {
    name: 'Glassy Blue',
    brandColor: '#2575b5',
    brandHover: '#1d5f94',
    brandText: '#164d78',
    brandSubtle: '#f0f6fc',
    brandBorder: 'rgba(37, 117, 181, 0.20)',
    brandGlow: 'rgba(37, 117, 181, 0.12)',
    // Softer morning sky cerulean ambient canvas
    bgLight: 'linear-gradient(180deg, #f1f6fb 0%, #f9fcfe 30%, #e6eff7 75%, #edf4fa 100%)',
    bgDark: 'radial-gradient(circle at top left, rgba(37, 117, 181, 0.35) 0%, #0c1218 45%, #04070a 100%)',
  },
  sage: {
    name: 'Glassy Sage',
    brandColor: '#4f8f70',
    brandHover: '#3e755a',
    brandText: '#2f6048',
    brandSubtle: '#f1f7f3',
    brandBorder: 'rgba(79, 143, 112, 0.22)',
    brandGlow: 'rgba(79, 143, 112, 0.14)',
    bgLight: 'linear-gradient(180deg, #f3f8f4 0%, #fbfdfb 34%, #e7f0e9 100%)',
    bgDark: 'radial-gradient(circle at top left, rgba(79, 143, 112, 0.34) 0%, #0e1712 48%, #050907 100%)',
  },
  violet: {
    name: 'Glassy Violet',
    brandColor: '#8064bd',
    brandHover: '#674ba4',
    brandText: '#5b438f',
    brandSubtle: '#f5f1fc',
    brandBorder: 'rgba(128, 100, 189, 0.22)',
    brandGlow: 'rgba(128, 100, 189, 0.14)',
    bgLight: 'linear-gradient(180deg, #f7f4fc 0%, #fdfbff 34%, #eee8f8 100%)',
    bgDark: 'radial-gradient(circle at top left, rgba(128, 100, 189, 0.34) 0%, #15111d 48%, #08060b 100%)',
  },
  'option-4': {
    name: 'Alpine Sage',
    brandColor: '#3b846c',
    brandHover: '#2f6b57',
    brandText: '#245444',
    brandSubtle: '#f1f5f3',
    brandBorder: 'rgba(59, 132, 108, 0.20)',
    brandGlow: 'rgba(59, 132, 108, 0.12)',
    // Softer eucalyptus stone mist ambient canvas
    bgLight: 'linear-gradient(180deg, #f2f5f4 0%, #f9fbfb 30%, #e7ecea 75%, #eef3f1 100%)',
    bgDark: 'radial-gradient(circle at top left, rgba(59, 132, 108, 0.35) 0%, #0d1312 45%, #040706 100%)',
  },
};

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultPalette?: Palette;
  storageKey?: string;
  paletteStorageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light';
  palette: Palette;
  setPalette: (palette: Palette) => void;
};

const initialState: ThemeProviderState = {
  theme: 'light',
  setTheme: () => null,
  resolvedTheme: 'light',
  palette: 'emerald',
  setPalette: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  defaultPalette = 'emerald',
  storageKey = 'agrisence-theme',
  paletteStorageKey = 'agrisence-palette',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) as Theme;
      if (stored) return stored;
    }
    return defaultTheme;
  });

  const [palette, setPaletteState] = useState<Palette>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(paletteStorageKey) as Palette;
       if (stored === 'emerald' || stored === 'teal' || stored === 'orange' || stored === 'pink' || stored === 'blue' || stored === 'sage' || stored === 'violet' || stored === 'option-1' || stored === 'option-4') return stored;
    }
    return defaultPalette;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('light');

  // Sync Light / Dark mode
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      setResolvedTheme(systemTheme);
      return;
    }

    root.classList.add(theme);
    setResolvedTheme(theme);
  }, [theme]);

  // Sync Palette variables directly onto document.documentElement
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;

    root.classList.remove(
      'palette-emerald',
      'palette-teal',
      'palette-orange',
      'palette-pink',
      'palette-blue',
      'palette-opt1',
      'palette-opt4',
      'palette-sage',
      'palette-violet'
    );

    const paletteKey = palette === 'option-1' ? 'emerald' : palette === 'option-4' ? 'sage' : palette;
    const activeConfig = PALETTE_CONFIGS[paletteKey] || PALETTE_CONFIGS.emerald;

    // Direct property injection to guarantee instantaneous global application
    root.style.setProperty('--brand-color', activeConfig.brandColor);
    root.style.setProperty('--brand-hover', activeConfig.brandHover);
    root.style.setProperty('--brand-text', activeConfig.brandText);
    root.style.setProperty('--brand-subtle', activeConfig.brandSubtle);
    root.style.setProperty('--brand-border', activeConfig.brandBorder);
    root.style.setProperty('--brand-glow', activeConfig.brandGlow);
    root.style.setProperty('--bg-light-active', activeConfig.bgLight);
    root.style.setProperty('--bg-dark-active', activeConfig.bgDark);

    root.classList.add(`palette-${paletteKey === 'option-4' ? 'opt4' : paletteKey}`);

    // Also apply to body to prevent any sub-surface white flashing
    if (root.classList.contains('dark')) {
      root.style.background = activeConfig.bgDark;
      if (body) body.style.background = 'transparent';
    } else {
      root.style.background = activeConfig.bgLight;
      if (body) body.style.background = 'transparent';
    }
  }, [palette, theme]);

  const setPalette = (newPalette: Palette) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(paletteStorageKey, newPalette);
    }
    setPaletteState(newPalette);
  };

  const value = {
    theme,
    resolvedTheme,
    palette,
    setPalette,
    setTheme: (newTheme: Theme) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, newTheme);
      }
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
