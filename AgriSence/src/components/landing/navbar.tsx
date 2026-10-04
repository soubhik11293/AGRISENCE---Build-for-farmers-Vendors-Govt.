import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  X,
  Mic,
  ArrowRight,
  TrendingUp,
  Sprout as Sparkles,
  ShieldAlert,
  Bug,
  Landmark,
  LayoutDashboard,
  CloudSun,
  Droplets,
  Wind,
  LogOut,
  User,
  ChevronDown,
  Edit3,
  Calendar,
  Phone,
  ShieldCheck,
  Check,
  Globe,
  ShoppingCart,
  Headphones,
} from 'lucide-react';
import { Logo } from '@/src/components/logo';
import { ThemeToggle } from '@/src/components/theme-toggle';
import { PaletteMenu } from '@/src/components/landing/palette-menu';
import { VoiceAssistantModal } from '@/src/components/voice-assistant-modal';
import { MarketModal } from '@/src/components/market-modal';
import { KisanShopModal } from '@/src/components/kisan-shop-modal';
import { SupportDeskModal } from '@/src/components/support-desk-modal';
import { UserAvatar } from '@/src/components/user-avatar';
import { useLanguage, SUPPORTED_LANGUAGES } from '@/src/context/language-context';
import { useAuth } from '@/src/context/auth-context';
import { useTelemetry } from '@/src/context/telemetry-context';

interface NavbarProps {
  currentRoute?: string;
  onNavigate?: (route: string) => void;
  onOpenOutbreakModal?: () => void;
  onOpenPestModal?: () => void;
  onOpenWeatherModal?: () => void;
  onOpenMarketModal?: () => void;
}

export function Navbar({
  currentRoute = '/',
  onNavigate,
  onOpenOutbreakModal,
  onOpenPestModal,
  onOpenWeatherModal,
  onOpenMarketModal,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [internalMarketModalOpen, setInternalMarketModalOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [kisanShopOpen, setKisanShopOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const compactUserMenuRef = useRef<HTMLDivElement | null>(null);
  const langMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);

  const { t, language, setLanguage, currentLangConfig } = useLanguage();
  const { isAuthenticated, user, logout, requireAuth, openProfileModal, openAuthModal } = useAuth();

  // Close user and language dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: PointerEvent) => {
      const target = e.target as Node;
      const insideDesktopProfile = userMenuRef.current?.contains(target);
      const insideCompactProfile = compactUserMenuRef.current?.contains(target);
      if (!insideDesktopProfile && !insideCompactProfile) {
        setUserMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
      const insideMobileMenu = mobileMenuRef.current?.contains(target);
      const insideMobileMenuButton = mobileMenuButtonRef.current?.contains(target);
      if (!insideMobileMenu && !insideMobileMenuButton) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, []);

  const { weatherData, marketData, isMarketOpen, marketStatusText, activeArbitrageTopSpread, rotatingMarketItem } = useTelemetry();
  const quickWeather = {
    temp: weatherData.temp,
    humidity: weatherData.humidity,
    windSpeed: weatherData.windSpeed,
    windDirection: weatherData.windDirection,
    locationName: weatherData.locationName?.split(',')[0] || 'Pune',
  };

  // Rotating highlight commodity for the Market Intelligence Pill (changes every 10s)
  const highlightMarketItem = rotatingMarketItem || activeArbitrageTopSpread || marketData[0] || null;

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith('#')) {
      if (currentRoute !== '/') {
        if (onNavigate) onNavigate('/farmer');
        setTimeout(() => {
          const el = document.querySelector(href);
           el?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        const el = document.querySelector(href);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      if (onNavigate) onNavigate(href);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex flex-col items-center pointer-events-none">
        {/* ROW 1: Main Widened Navbar Ribbon Container */}
        <div className="w-full px-3 sm:px-5 lg:px-8 pt-2.5 pointer-events-auto relative z-30">
          <nav className="w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto h-16 rounded-[28px] frosted-glass px-3.5 sm:px-5 lg:px-6 flex items-center justify-between gap-2 border border-white/80 dark:border-white/12 shadow-[0_12px_36px_-4px_var(--brand-glow)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.65)]">
            {/* Left: Brand Logo */}
            <div className="shrink-0 flex items-center">
              <Logo className="max-[430px]:[&>span:last-child]:hidden" onClick={() => (onNavigate ? onNavigate('/') : null)} />
            </div>

            {/* Center: Navigation Links (Desktop) */}
            <div className="hidden xl:flex items-center gap-1.5 lg:gap-2 text-xs font-black text-slate-800 dark:text-slate-200">
              <button
                type="button"
                onClick={() => handleNavClick('#features')}
                className="px-3 py-1.5 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t('nav.capabilities', 'Platform Capabilities')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onOpenOutbreakModal) onOpenOutbreakModal();
                  else handleNavClick('/outbreak-warning');
                }}
                className="px-3 py-1.5 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ShieldAlert className="size-3.5 text-rose-500" />
                <span>{t('nav.outbreak', 'Outbreak Radar')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onOpenPestModal) onOpenPestModal();
                  else handleNavClick('/scan');
                }}
                className="px-3 py-1.5 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Bug className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
                <span>{t('nav.pestScan', 'AI Pest Scan')}</span>
              </button>
              <button
                type="button"
                onClick={() => setKisanShopOpen(true)}
                className="px-3 py-1.5 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ShoppingCart className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
                <span>Kisan Shop</span>
              </button>
              <button
                type="button"
                onClick={() => requireAuth(() => handleNavClick('/schemes'), 'Government Schemes & Subsidies')}
                className="px-3 py-1.5 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Landmark className="size-3.5 text-amber-600" />
                <span>{t('nav.schemes', 'Govt Schemes')}</span>
              </button>
              <button
                type="button"
                onClick={() => requireAuth(() => handleNavClick('/dashboard'), 'Farm dashboard')}
                className="px-3 py-1.5 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-[var(--brand-text,#0d7342)] font-black"
              >
                <LayoutDashboard className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
                <span>{t('nav.dashboard', 'Dashboard')}</span>
              </button>
            </div>

            {/* Rightmost Utilities Ribbon: Never wraps, clips or overflows */}
            <div className="hidden xl:flex items-center flex-nowrap shrink-0 gap-1.5 lg:gap-2.5">
              {/* Theme Toggle Button */}
              <ThemeToggle />
              <PaletteMenu />

              {/* Voice AI Trigger Button with Attached Auto-Closing Language Dropdown */}
              <div ref={langMenuRef} className="relative flex items-center shrink-0">
                <div className="inline-flex items-center rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 shadow-2xs overflow-hidden">
                  {/* Voice AI Trigger Button */}
                  <button
                    type="button"
                    onClick={() => requireAuth(() => setVoiceModalOpen(true), 'AgriSense Multilingual Voice AI')}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 hover:bg-white dark:hover:bg-slate-800 text-xs font-bold text-slate-850 dark:text-slate-200 transition-all cursor-pointer"
                    title={`AgriSence Multilingual Voice AI (${currentLangConfig.label}) - Click to speak`}
                  >
                    <Mic className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
                    <span className="hidden sm:inline">{t('nav.voiceAi', 'Voice AI')}</span>
                  </button>

                  {/* Language Selector Dropdown Trigger with Language Badge */}
                  <button
                    type="button"
                    onClick={() => setLangMenuOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1 pr-2 pl-1 py-1.5 hover:bg-white dark:hover:bg-slate-800 text-xs font-black transition-all border-l border-white/40 dark:border-white/10 cursor-pointer"
                    title={`Current Language: ${currentLangConfig.label}. Click to switch dialect.`}
                  >
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[var(--brand-color,#0f9a58)] text-white uppercase tracking-wider">
                      {currentLangConfig.id}
                    </span>
                    <ChevronDown
                      className={`size-3 text-slate-500 transition-transform duration-200 ${
                        langMenuOpen ? 'rotate-180 text-[var(--brand-color,#0f9a58)]' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Auto-Closing Language Popover Dropdown */}
                {langMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 sm:w-56 rounded-[24px] bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-white/20 p-2 shadow-2xl backdrop-blur-3xl z-50 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                    <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Globe className="size-3 text-[var(--brand-color,#0f9a58)]" />
                        <span>Select Language</span>
                      </div>
                      <span className="size-1.5 rounded-full bg-[var(--brand-color,#0f9a58)] animate-pulse" />
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-0.5 pt-1">
                      {SUPPORTED_LANGUAGES.map((lang) => {
                        const isSelected = language === lang.id;
                        return (
                          <button
                            key={lang.id}
                            type="button"
                            onClick={() => {
                              setLanguage(lang.id);
                              setLangMenuOpen(false); // AUTO-CLOSE IMMEDIATELY ON SELECTION!
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[var(--brand-color,#0f9a58)] text-white font-black shadow-2xs'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{lang.nativeName}</span>
                              <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                                ({lang.label.split(' ')[0]})
                              </span>
                            </div>
                            {isSelected && <Check className="size-3.5 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Auth Status & Profile Menu */}
              {isAuthenticated ? (
                <div ref={userMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-2xl frosted-glass-sub hover:bg-white dark:hover:bg-slate-800 text-xs font-black text-slate-900 dark:text-white border border-white/70 dark:border-white/10 shadow-2xs transition-all hover:scale-[1.02] cursor-pointer"
                    title="Farmer Profile & Settings"
                  >
                    <UserAvatar user={user} size="sm" showBadge />
                    <span className="max-w-[100px] truncate hidden sm:inline">
                      {user?.fullName?.split(' ')[0] || 'Farmer'}
                    </span>
                    <ChevronDown
                      className={`size-3 text-slate-500 transition-transform duration-200 ${
                        userMenuOpen ? 'rotate-180 text-[var(--brand-color,#0f9a58)]' : ''
                      }`}
                    />
                  </button>

                  {/* Profile Dropdown Popover */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-[28px] bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-white/20 p-4 shadow-2xl backdrop-blur-3xl z-50 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-3 drop-shadow-2xl">
                      {/* Farmer Identity Badge */}
                      <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-white/10">
                        <UserAvatar user={user} size="md" showBadge />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-xs text-slate-950 dark:text-white truncate">
                              {user?.fullName || 'Progressive Farmer'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-650 dark:text-slate-400 truncate">
                            {user?.email}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-[var(--brand-text,#0d7342)]">
                            <ShieldCheck className="size-3 text-[var(--brand-color,#0f9a58)]" />
                            <span>{user?.role || 'AgriSence Verified Farmer'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Meta Chips */}
                      {(user?.phone || user?.dob || user?.district) && (
                        <div className="px-2 text-[11px] text-slate-600 dark:text-slate-300 font-medium space-y-1">
                          {user?.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="size-3 text-slate-400" />
                              <span className="font-mono">{user.phone}</span>
                            </div>
                          )}
                          {user?.dob && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="size-3 text-amber-500" />
                              <span>DOB: {new Date(user.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Menu Actions */}
                      <div className="pt-1 border-t border-slate-200/70 dark:border-white/10 space-y-1 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            openProfileModal();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-[var(--brand-text,#0d7342)] flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Edit3 className="size-4 text-[var(--brand-color,#0f9a58)]" />
                            <span className="font-black">Edit Profile & Display Image</span>
                          </div>
                          <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-[var(--brand-color,#0f9a58)] text-white">
                            Settings
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleNavClick('/dashboard');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors text-slate-800 dark:text-slate-200"
                        >
                          <LayoutDashboard className="size-4 text-emerald-600" />
                          <span>{t('nav.dashboard', 'Dashboard')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleNavClick('/schemes');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors text-slate-800 dark:text-slate-200"
                        >
                          <Landmark className="size-4 text-amber-600" />
                          <span>Govt Subsidies & Schemes</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/15 text-rose-600 flex items-center gap-2 cursor-pointer transition-colors mt-1 pt-1.5 border-t border-slate-100 dark:border-white/5"
                        >
                          <LogOut className="size-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Sign In Button */}
                  <button
                    type="button"
                    onClick={() => openAuthModal('Farmer Sign In', 'Sign in to access your parcel telemetry, disease diagnostics, and mandis.', undefined, 'signin')}
                    className="inline-flex items-center justify-center px-3 sm:px-3.5 py-1.5 rounded-2xl frosted-glass-sub hover:bg-white dark:hover:bg-slate-800 text-xs font-black text-slate-900 dark:text-white border border-white/70 dark:border-white/10 shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    {t('nav.signIn', 'Sign In')}
                  </button>

                  {/* Get Started Button */}
                  <button
                    type="button"
                     onClick={() => openAuthModal('Farmer Registration', 'Create a farmer account with Firebase email verification and saved field telemetry.', undefined, 'signup')}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <span>{t('nav.getStarted', 'Get Started')}</span>
                    <ArrowRight className="size-3.5 stroke-[2.5]" />
                  </button>
                </>
              )}

            </div>

            {/* Compact navigation: Dashboard stays visible; all other actions live in the menu. */}
            <div className="xl:hidden flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => requireAuth(() => handleNavClick('/dashboard'), 'Farm dashboard')}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] text-xs font-black cursor-pointer"
              >
                <LayoutDashboard className="size-4 text-[var(--brand-color,#0f9a58)]" />
                <span className="max-[360px]:hidden">{t('nav.dashboard', 'Dashboard')}</span>
              </button>
              {isAuthenticated && (
                <div ref={compactUserMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setUserMenuOpen((previous) => !previous);
                    }}
                    className="inline-flex size-10 items-center justify-center rounded-2xl frosted-glass-sub border border-white/70 dark:border-white/10 shadow-2xs cursor-pointer"
                    title="Farmer Profile & Settings"
                    aria-label="Open farmer profile menu"
                    aria-expanded={userMenuOpen}
                  >
                    <UserAvatar user={user} size="sm" showBadge />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-[24px] bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-white/20 p-3 shadow-2xl backdrop-blur-3xl z-50 text-slate-900 dark:text-slate-100 space-y-2">
                      <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90">
                        <UserAvatar user={user} size="md" showBadge />
                        <div className="min-w-0">
                          <p className="text-xs font-black truncate">{user?.fullName || 'Progressive Farmer'}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          openProfileModal();
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-[var(--brand-text,#0d7342)] flex items-center gap-2 text-xs font-black"
                      >
                        <Edit3 className="size-4" />
                        <span>Edit Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-600 flex items-center gap-2 text-xs font-bold"
                      >
                        <LogOut className="size-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button
                ref={mobileMenuButtonRef}
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-2xl frosted-glass-sub text-slate-800 dark:text-white border border-white/60 dark:border-white/10 cursor-pointer shrink-0"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </nav>
        </div>

        {/* ROW 2: APMC Live Modal Marquee Ticker Below Navbar with Small Separation */}
        <div className="w-full px-3 sm:px-5 lg:px-8 pt-1.5 pointer-events-auto relative z-10">
          <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto rounded-2xl bg-slate-900/90 dark:bg-black/90 text-white text-[11px] py-1 px-3 sm:px-4 overflow-hidden border border-white/15 dark:border-white/10 backdrop-blur-md flex items-center shadow-md">
            <div className="flex items-center gap-2 pr-3.5 shrink-0 font-black text-[#00A859] border-r border-white/15">
              <span className="size-2 rounded-full bg-[#00A859] animate-pulse" />
              <span className="uppercase tracking-wider text-[10px] sm:text-[11px]">
                 {highlightMarketItem?.source?.includes('reference') ? 'APMC Reference Ticker' : t('nav.tickerTitle', 'APMC Live Ticker')}
              </span>
            </div>

            <div className="overflow-hidden whitespace-nowrap flex-1 ml-3">
              <div className="animate-marquee inline-flex items-center gap-6">
                {[...marketData, ...marketData].map((item, idx) => (
                  <div key={idx} className="inline-flex items-center gap-1.5 text-slate-300">
                    <span className="font-bold text-white">{item.commodity}:</span>
                    <span className="font-mono text-emerald-400 font-bold">₹{item.modalPrice}/qtl</span>
                    <span className="text-[10px] text-slate-400">({item.market})</span>
                    {item.arbitrageSpread && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-black">
                        +{item.arbitrageSpread} Spread
                      </span>
                    )}
                    <span className="text-slate-600">•</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: Weather & Live Market Intelligence Pills Below Tracker, Aligned with Navbar Container - 100% Free Access */}
        <div className="hidden xl:block w-full px-3 sm:px-5 lg:px-8 pt-2 pointer-events-auto relative z-10">
          <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto flex flex-wrap items-center justify-start gap-2.5 sm:gap-3">
            {/* Weather Pill */}
            <button
              type="button"
              onClick={() => {
                if (onOpenWeatherModal) onOpenWeatherModal();
              }}
              aria-label="Open Hyperlocal Microclimate Intelligence Modal"
              className="group flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-2.5 sm:py-3 rounded-[24px] frosted-glass border-2 border-white/90 dark:border-white/18 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_38px_rgba(0,0,0,0.6)] transition-all hover:scale-[1.03] active:scale-95 cursor-pointer backdrop-blur-xl"
            >
              {/* Live Pulse Dot */}
              <span className="relative flex size-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-color,#0f9a58)] opacity-75" />
                <span className="relative inline-flex rounded-full size-3 bg-[var(--brand-color,#0f9a58)]" />
              </span>

              {/* Weather Icon & Temp */}
              <div className="flex items-center gap-2 shrink-0">
                <CloudSun className="size-5 sm:size-6 text-amber-500 stroke-[2.2] drop-shadow-xs" />
                <span className="text-sm sm:text-base font-black text-slate-950 dark:text-white font-mono tracking-tight">
                  {quickWeather.temp}°C
                </span>
              </div>

              <span className="text-slate-300 dark:text-white/20 text-xs sm:text-sm">•</span>

              {/* Location & Microclimate */}
              <div className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-[13px] font-black text-slate-800 dark:text-slate-100">
                <span className="text-slate-950 dark:text-white font-black truncate max-w-[90px] sm:max-w-[120px]">
                  {quickWeather.locationName}
                </span>
                <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-bold">
                  <Droplets className="size-3.5" />
                  <span>{quickWeather.humidity}%</span>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-teal-600 dark:text-teal-400 font-bold">
                  <Wind className="size-3.5" />
                  <span>{quickWeather.windSpeed} km/h SE</span>
                </div>
              </div>

              {/* Radar Tag */}
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)] group-hover:bg-[var(--brand-color,#0f9a58)] group-hover:text-white transition-colors shadow-2xs">
                <Sparkles className="size-2.5" />
                 <span>{weatherData.source === 'open-meteo' ? 'Observed weather' : 'Fallback estimate'}</span>
              </div>
            </button>

            {/* Live APMC Market Intelligence Pill (Placed Immediately to the Right of Weather Pill) */}
            <button
              type="button"
              onClick={() => {
                if (onOpenMarketModal) {
                  onOpenMarketModal();
                } else {
                  setInternalMarketModalOpen(true);
                }
              }}
              aria-label="Open Real-Time APMC Mandi Market Intelligence & Arbitrage Modal"
              className="group flex items-center gap-2.5 sm:gap-3.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-[24px] frosted-glass border-2 border-white/90 dark:border-white/18 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_38px_rgba(0,0,0,0.6)] transition-all hover:scale-[1.03] active:scale-95 cursor-pointer backdrop-blur-xl"
            >
              {/* Market Status Indicator (Open vs. Closed based on Indian Standard Time) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="relative flex size-2.5 shrink-0">
                  {isMarketOpen ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A859] opacity-75" />
                      <span className="relative inline-flex rounded-full size-2.5 bg-[#00A859]" />
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full size-2.5 bg-amber-500" />
                  )}
                </span>
                <span
                  className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${
                    isMarketOpen
                      ? 'text-[#00A859] dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {isMarketOpen ? 'Market Open' : marketStatusText}
                </span>
              </div>

              <span className="text-slate-300 dark:text-white/20 text-xs sm:text-sm">•</span>

              {/* Commodity & Live Modal Rate */}
              <div className="flex items-center gap-1.5 shrink-0">
                <TrendingUp className="size-4 text-[var(--brand-color,#0f9a58)] stroke-[2.2]" />
                 <span className="text-xs sm:text-[13px] font-black text-slate-950 dark:text-white font-mono">
                   {highlightMarketItem ? `${highlightMarketItem.commodity} ₹${highlightMarketItem.modalPrice.toLocaleString('en-IN')}/qtl` : 'Live mandi quote unavailable'}
                 </span>
              </div>

              <span className="hidden sm:inline text-slate-300 dark:text-white/20 text-xs">•</span>

              {/* Local Mandi & Spread Badge */}
              <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <span className="truncate max-w-[100px] lg:max-w-[130px] font-black text-slate-900 dark:text-white">
                   {highlightMarketItem ? highlightMarketItem.market.replace(' APMC', '') : 'Mandi feed unavailable'}
                </span>
                 {highlightMarketItem?.arbitrageSpread && highlightMarketItem.arbitrageSpread > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
                    +₹{highlightMarketItem.arbitrageSpread} Spread
                  </span>
                )}
              </div>
            </button>

            {/* Kisan Help Desk Pill (Positioned in leftover small place to the right of Mandi & Weather pills, 9AM-6PM Mon-Fri) */}
            <button
              type="button"
              onClick={() => setSupportModalOpen(true)}
              aria-label="Open Omnichannel Kisan Support Desk"
              title="Kisan Support Desk: Mon – Fri (09:00 AM – 06:00 PM, Closed Sat & Sun)"
              className="group flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[24px] frosted-glass border-2 border-amber-500/30 dark:border-amber-500/25 hover:border-amber-500/60 shadow-[0_10px_28px_-4px_rgba(245,158,11,0.18)] transition-all hover:scale-[1.03] active:scale-95 cursor-pointer backdrop-blur-xl"
            >
              <div className="size-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Headphones className="size-3.5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] sm:text-[11px] font-black text-slate-900 dark:text-white leading-tight flex items-center gap-1">
                  <span>Kisan Help Desk</span>
                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold hidden sm:inline">
                  Mon–Fri: 09 AM – 06 PM
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div ref={mobileMenuRef} className="xl:hidden w-full px-4 pt-2 pb-4 pointer-events-auto">
            <div className="max-w-md max-h-[calc(100vh-7rem)] overflow-y-auto mx-auto rounded-[28px] frosted-card border border-white/80 dark:border-white/12 p-4 shadow-xl space-y-2 text-xs font-black text-slate-900 dark:text-slate-100">
              {!isAuthenticated && (
                <div className="grid grid-cols-2 gap-2 mb-3 pb-2 border-b border-slate-200/60 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal('Farmer Sign In', 'Sign in to access your parcel telemetry, disease diagnostics, and mandis.', undefined, 'signin');
                    }}
                    className="py-2 px-3 rounded-xl frosted-glass-sub text-slate-900 dark:text-white text-xs font-black text-center"
                  >
                    {t('nav.signIn', 'Sign In')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal('Farmer Registration', 'Create a farmer account with Firebase email verification and saved field telemetry.', undefined, 'signup');
                    }}
                    className="py-2 px-3 rounded-xl bg-[var(--brand-color,#0f9a58)] text-white text-xs font-black text-center"
                  >
                    {t('nav.getStarted', 'Get Started')}
                  </button>
                </div>
              )}

                <div className="grid grid-cols-[auto_1fr] gap-2 pb-3 mb-2 border-b border-slate-200/60 dark:border-white/10">
                  <ThemeToggle className="h-10 w-10 rounded-xl" />
                  <PaletteMenu className="col-span-2" />
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    requireAuth(() => setVoiceModalOpen(true), 'AgriSense Multilingual Voice AI');
                  }}
                  className="h-10 px-3 rounded-xl frosted-glass-sub border border-white/70 dark:border-white/10 flex items-center justify-center gap-2 text-xs font-black"
                >
                  <Mic className="size-4 text-[var(--brand-color,#0f9a58)]" />
                  <span>{t('nav.voiceAi', 'Voice AI')}</span>
                </button>
                <label className="col-span-2 grid grid-cols-[auto_1fr] items-center gap-2 px-3 py-2 rounded-xl frosted-glass-sub border border-white/70 dark:border-white/10">
                  <Globe className="size-4 text-[var(--brand-color,#0f9a58)]" />
                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className="w-full bg-transparent text-xs font-black text-slate-900 dark:text-white outline-none cursor-pointer"
                    aria-label="Select language"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.id} value={lang.id} className="text-slate-950">
                        {lang.nativeName} ({lang.label.split(' ')[0]})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {onOpenWeatherModal && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenWeatherModal();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <CloudSun className="size-4 text-amber-500" />
                  <span>Weather & Field Telemetry</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenMarketModal) onOpenMarketModal();
                  else setInternalMarketModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <TrendingUp className="size-4 text-[var(--brand-color,#0f9a58)]" />
                <span>Mandi Market Intelligence</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSupportModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <Headphones className="size-4 text-amber-600" />
                <span>Kisan Help Desk</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('#features')}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800"
              >
                {t('nav.capabilities', 'Platform Capabilities')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenOutbreakModal) onOpenOutbreakModal();
                  else handleNavClick('/outbreak-warning');
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <ShieldAlert className="size-4 text-rose-500" />
                <span>{t('nav.outbreak', 'Early Outbreak Warning Radar')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenPestModal) onOpenPestModal();
                  else handleNavClick('/scan');
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <Bug className="size-4 text-[var(--brand-color,#0f9a58)]" />
                <span>{t('nav.pestScan', 'AI Pest Diagnosis')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('/schemes')}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <Landmark className="size-4 text-amber-600" />
                <span>{t('nav.schemes', 'Central & State Subsidies')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setKisanShopOpen(true);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <ShoppingCart className="size-4 text-[var(--brand-color,#0f9a58)]" />
                <span>Kisan Agri-Store & Kendra Locator</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Multilingual Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
      />

      {/* Standalone APMC Market Modal (when invoked directly from Navbar Market Pill) */}
      <MarketModal
        isOpen={internalMarketModalOpen}
        onClose={() => setInternalMarketModalOpen(false)}
      />

      {/* Kisan Shop Modal */}
      <KisanShopModal
        isOpen={kisanShopOpen}
        onClose={() => setKisanShopOpen(false)}
      />

      {/* Support Desk Modal */}
      <SupportDeskModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
      />
    </>
  );
}
