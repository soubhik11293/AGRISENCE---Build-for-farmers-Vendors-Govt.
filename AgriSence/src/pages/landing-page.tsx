import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Navbar } from '@/src/components/landing/navbar';
import { Hero } from '@/src/components/landing/hero';
import { Stats } from '@/src/components/landing/stats';
import { Features } from '@/src/components/landing/features';
import { PlatformShowcase } from '@/src/components/landing/platform-showcase';
import { CTA } from '@/src/components/landing/cta';
import { Footer } from '@/src/components/landing/footer';
import { WeatherModal } from '@/src/components/weather-modal';
import { MarketModal } from '@/src/components/market-modal';
import { ProfitabilityModal } from '@/src/components/profitability-modal';
import { VoiceAssistantModal } from '@/src/components/voice-assistant-modal';
import { PestDiagnosisModal } from '@/src/components/pest-diagnosis-modal';
import { OutbreakWarningModal } from '@/src/components/outbreak-warning-modal';
import { FeatureInteractiveModal } from '@/src/components/feature-interactive-modal';
import { WorkflowModal } from '@/src/components/workflow-modal';
import { AiChatDrawer } from '@/src/components/ai-chat-drawer';
import { useAuth } from '@/src/context/auth-context';
import { setPortalRole } from '@/src/lib/portal-session';

export function LandingPage({ onNavigate, autoOpenFarmerAuth = false }: { onNavigate?: (route: string) => void; autoOpenFarmerAuth?: boolean }) {
  const { requireAuth, openAuthModal, updateProfile, isAuthenticated, isLoading } = useAuth();
  const [weatherModalOpen, setWeatherModalOpen] = useState(false);
  const [marketModalOpen, setMarketModalOpen] = useState(false);
  const [profitModalOpen, setProfitModalOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [pestModalOpen, setPestModalOpen] = useState(false);
  const [outbreakModalOpen, setOutbreakModalOpen] = useState(false);
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [activeFeatureTarget, setActiveFeatureTarget] = useState<string | null>(null);

  React.useEffect(() => {
    if (!autoOpenFarmerAuth || isLoading || isAuthenticated) return;
    openAuthModal(
      'Farmer Board Sign In',
      'Sign in or create your farmer account to unlock saved farms, dashboards, simulators, and synchronized records.',
      async () => {
        setPortalRole('farmer');
        await updateProfile({ portalRole: 'farmer' });
        onNavigate?.('/dashboard');
      },
      'signin'
    );
  }, [autoOpenFarmerAuth, isAuthenticated, isLoading, onNavigate, openAuthModal, updateProfile]);

  // Safe navigation with auth gating for member-only routes
  const handleGatedNavigate = (route: string, title = 'Member Capability') => {
    if (route === '/dashboard' || route === '/schemes') {
      requireAuth(() => onNavigate && onNavigate(route), title);
    } else {
      if (onNavigate) onNavigate(route);
    }
  };

  return (
    <div className="landing-page min-h-screen text-slate-950 dark:text-slate-100 flex flex-col">
      {/* Top Navbar with integrated APMC ticker below and aligned Weather widget */}
      <Navbar
        currentRoute="/farmer"
        onNavigate={(route) => handleGatedNavigate(route)}
        onOpenOutbreakModal={() => setOutbreakModalOpen(true)}
        onOpenPestModal={() => setPestModalOpen(true)}
        onOpenWeatherModal={() => setWeatherModalOpen(true)}
        onOpenMarketModal={() => setMarketModalOpen(true)}
      />

      {/* Hero Section */}
      <Hero
        onOpenWeather={() => setWeatherModalOpen(true)}
        onOpenMarket={() =>
          requireAuth(() => setMarketModalOpen(true), 'APMC Mandi Price Discovery & Arbitrage')
        }
        onOpenAiScan={() => setPestModalOpen(true)}
        onNavigate={(route) => handleGatedNavigate(route, 'Farm Command Center')}
      />

      {/* Stats Counter Section */}
      <Stats />

      {/* 20+ Capabilities Section: Pest Diagnosis & Outbreak Warning free, others gated */}
      <Features
        onOpenPestDiagnosis={() => setPestModalOpen(true)}
        onOpenOutbreakWarning={() => setOutbreakModalOpen(true)}
        onOpenFeatureModal={(target) => setActiveFeatureTarget(target)}
        onNavigate={(route) => handleGatedNavigate(route)}
      />

      {/* Interactive Platform Showcase */}
      <PlatformShowcase onNavigate={(route) => handleGatedNavigate(route)} />

      {/* Call to Action Banner */}
      <CTA onNavigate={(route) => handleGatedNavigate(route)} />

      {/* Global Footer */}
      <Footer onNavigate={(route) => handleGatedNavigate(route)} />

      {/* Info "i" Button Just Above The Robot FAB */}
      <div className="fixed bottom-[88px] right-7 z-40 flex flex-col items-center">
        <button
          type="button"
          onClick={() => setWorkflowModalOpen(true)}
          aria-label="How AgriSence Works: 5-Phase Interactive Workflow"
          className="relative flex items-center justify-center size-11 rounded-full frosted-card border border-white/80 dark:border-white/15 text-[var(--brand-color,#0f9a58)] shadow-[0_6px_20px_-2px_var(--brand-glow)] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer group"
          title="App Workflow Guide (Click to see how AgriSence works)"
        >
          <Info className="size-5 stroke-[2.5]" />
          
          <span className="absolute right-13 px-2.5 py-1 rounded-xl frosted-card border border-white/80 dark:border-white/10 text-[11px] font-black text-slate-800 dark:text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md pointer-events-none">
            How It Works
          </span>

          <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-[var(--brand-color,#0f9a58)] ring-2 ring-white dark:ring-slate-900 animate-pulse" />
        </button>
      </div>

      {/* High-Level Agro AI Conversational Drawer with FAB at Bottom-Right */}
      <AiChatDrawer onNavigate={(route) => handleGatedNavigate(route, 'AgriSence Guide AI')} />

      {/* Interactive Modals */}
      <WeatherModal isOpen={weatherModalOpen} onClose={() => setWeatherModalOpen(false)} />
      <MarketModal isOpen={marketModalOpen} onClose={() => setMarketModalOpen(false)} />
      <ProfitabilityModal isOpen={profitModalOpen} onClose={() => setProfitModalOpen(false)} />
      <VoiceAssistantModal isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} />
      <PestDiagnosisModal isOpen={pestModalOpen} onClose={() => setPestModalOpen(false)} />
      <OutbreakWarningModal isOpen={outbreakModalOpen} onClose={() => setOutbreakModalOpen(false)} />
      <WorkflowModal
        isOpen={workflowModalOpen}
        onClose={() => setWorkflowModalOpen(false)}
        onNavigate={(route) => handleGatedNavigate(route)}
      />
      <FeatureInteractiveModal
        featureTarget={activeFeatureTarget}
        isOpen={Boolean(activeFeatureTarget)}
        onClose={() => setActiveFeatureTarget(null)}
      />
    </div>
  );
}
