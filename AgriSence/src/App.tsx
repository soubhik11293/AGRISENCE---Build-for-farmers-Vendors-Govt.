import React, { lazy, Suspense, useState, useEffect } from 'react';
import { ThemeProvider } from '@/src/components/theme-provider';
import { LanguageProvider } from '@/src/context/language-context';
import { AuthProvider, useAuth } from '@/src/context/auth-context';
import { DiagnosisProvider } from '@/src/context/diagnosis-context';
import { FarmProvider } from '@/src/context/farm-context';
import { TelemetryProvider } from '@/src/context/telemetry-context';
const AuthGateModal = lazy(() => import('@/src/components/auth-gate-modal').then((module) => ({ default: module.AuthGateModal })));
const ProfileModal = lazy(() => import('@/src/components/profile-modal').then((module) => ({ default: module.ProfileModal })));
const AuthToast = lazy(() => import('@/src/components/ui/auth-toast').then((module) => ({ default: module.AuthToast })));
const GlobalLanguageSync = lazy(() => import('@/src/components/global-language-sync').then((module) => ({ default: module.GlobalLanguageSync })));
const LandingPage = lazy(() => import('@/src/pages/landing-page').then((module) => ({ default: module.LandingPage })));
const DashboardPage = lazy(() => import('@/src/pages/dashboard-page').then((module) => ({ default: module.DashboardPage })));
const ScanPage = lazy(() => import('@/src/pages/scan-page').then((module) => ({ default: module.ScanPage })));
const OutbreakPage = lazy(() => import('@/src/pages/outbreak-page').then((module) => ({ default: module.OutbreakPage })));
const SchemesPage = lazy(() => import('@/src/pages/schemes-page').then((module) => ({ default: module.SchemesPage })));
const HarvestProtectionPage = lazy(() => import('@/src/pages/harvest-protection-page').then((module) => ({ default: module.HarvestProtectionPage })));
const PestSoilProtectionPage = lazy(() => import('@/src/pages/pest-soil-protection-page').then((module) => ({ default: module.PestSoilProtectionPage })));
const SignupPage = lazy(() => import('@/src/pages/signup-page').then((module) => ({ default: module.SignupPage })));
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
const PortalEntryPage = lazy(() => import('@/src/pages/portal-entry-page').then((module) => ({ default: module.PortalEntryPage })));
const PortalLoginPage = lazy(() => import('@/src/pages/portal-login-page').then((module) => ({ default: module.PortalLoginPage })));
const OfficePortalPage = lazy(() => import('@/src/pages/office-portal-page').then((module) => ({ default: module.OfficePortalPage })));
const VendorPortalPage = lazy(() => import('@/src/pages/vendor-portal-page').then((module) => ({ default: module.VendorPortalPage })));
const FarmerMarketplacePage = lazy(() => import('@/src/pages/farmer-marketplace-page').then((module) => ({ default: module.FarmerMarketplacePage })));
import { type PortalRole } from '@/src/lib/portal-session';

/**
 * Route Gating Component for Member-Only Pages
 * Keeps Pest Scan & Outbreak Radar free, gates Command Center and Schemes.
 */
function ProtectedRouteView({
  children,
  onNavigate,
  featureTitle,
}: {
  children: React.ReactNode;
  onNavigate: (route: string) => void;
  featureTitle: string;
}) {
  const { user, isAuthenticated, isLoading, openAuthModal } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-sm font-black text-slate-500">Checking secure session…</div>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-[32px] frosted-card border border-white/80 dark:border-white/12 shadow-2xl text-center space-y-5 text-slate-950 dark:text-slate-100">
          <div className="size-14 rounded-2xl bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-color,#0f9a58)] flex items-center justify-center mx-auto border border-[var(--brand-border)] shadow-xs">
            <Lock className="size-7" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--brand-subtle,#f0faf4)] text-[var(--brand-text,#0d7342)] border border-[var(--brand-border)]">
              Member Capability
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white pt-1">
              Sign In to Access {featureTitle}
            </h2>
            <p className="text-xs text-slate-650 dark:text-slate-300 font-medium leading-relaxed">
              <strong>AI Pest Scan</strong> and <strong>Outbreak Radar</strong> are completely free without login.
              Sign in or create an account to access farm telemetry, satellite NDVI, and {featureTitle}.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => openAuthModal(featureTitle, '', () => onNavigate('/dashboard'))}
              className="w-full h-11 rounded-2xl bg-[var(--brand-color,#0f9a58)] hover:bg-[var(--brand-hover,#0d844b)] text-white text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
            >
              <span>Sign In / Create Free Account</span>
              <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="w-full h-10 rounded-2xl frosted-glass-sub text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-white/80 dark:hover:bg-slate-800 cursor-pointer"
            >
              Back to Home
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 text-[11px] font-bold text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
            <span>Zero-barrier agritech access for Indian farmers</span>
          </div>
        </div>
      </div>
    );
  }

  if (user?.accountType && user.accountType !== 'farmer') return <PortalAccountRedirect accountType={user.accountType} onNavigate={onNavigate} />;

  return <>{children}</>;
}

function PortalProtectedView({ role, currentPath, onNavigate, children }: { role: Exclude<PortalRole, 'farmer'>; currentPath: string; onNavigate: (route: string) => void; children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const activeRole = user?.portalRoles?.includes(role) ? role : user?.portalRole;
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-sm font-black text-slate-500">Loading secure portal…</div>;
  if (!isAuthenticated) return <PortalLoginPage role={role} onNavigate={onNavigate} />;
  if (activeRole !== role) {
    return <div className="min-h-screen flex items-center justify-center p-4"><div className="max-w-md p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl text-center space-y-4"><ShieldCheck className="size-10 mx-auto text-amber-500" /><h2 className="text-xl font-black">Select this workspace to continue</h2><p className="text-sm text-slate-500">Your account is signed in under another portal role.</p><button type="button" onClick={() => onNavigate(`/${role}/login`)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black cursor-pointer">Switch to {role} login</button></div></div>;
  }
  return <>{children}</>;
}

function FarmerPortalView({ onNavigate }: { onNavigate: (route: string) => void }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-sm font-black text-slate-500">Checking secure session…</div>;
  if (user?.accountType && user.accountType !== 'farmer') return <PortalAccountRedirect accountType={user.accountType} onNavigate={onNavigate} />;
  return <LandingPage autoOpenFarmerAuth onNavigate={onNavigate} />;
}

function PortalAccountRedirect({ accountType, onNavigate }: { accountType: string; onNavigate: (route: string) => void }) {
  const label = accountType === 'official' ? 'Office' : 'Vendor / Broker';
  return <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950"><div className="max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl text-center space-y-4"><ShieldCheck className="size-10 mx-auto text-emerald-600" /><h2 className="text-xl font-black">This is a {label} account</h2><p className="text-sm text-slate-500">This identity is kept separate from the Farmer Board. Return to the workspace chooser to continue.</p><button type="button" onClick={() => onNavigate('/')} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black cursor-pointer">Back to workspaces</button></div></div>;
}

function RouteNotFound({ onNavigate }: { onNavigate: (route: string) => void }) {
  return <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950"><div className="max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl text-center space-y-4"><h1 className="text-4xl font-black">404</h1><p className="text-sm text-slate-500">That AgriSence page does not exist.</p><button type="button" onClick={() => onNavigate('/')} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black cursor-pointer">Back to workspaces</button></div></div>;
}

function normalisePath(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function MainAppContent() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
       return normalisePath(window.location.pathname);
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(normalisePath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      const url = new URL(path, window.location.origin);
      const nextPath = normalisePath(url.pathname);
      if (nextPath !== currentPath || url.search !== window.location.search || url.hash !== window.location.hash) {
        window.history.pushState({}, '', path);
        setCurrentPath(nextPath);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const renderCurrentView = () => {
    switch (currentPath) {
      case '/':
        return <PortalEntryPage onNavigate={navigate} />;
      // 100% Free Capabilities (Never require login or sign up)
      case '/scan':
        return <ScanPage onNavigate={navigate} />;
      case '/outbreak-warning':
        return <OutbreakPage onNavigate={navigate} />;
      case '/harvest-protection':
      case '/mandi-profits':
        return <HarvestProtectionPage onNavigate={navigate} />;
      case '/pest-soil-protection':
        return <PestSoilProtectionPage onNavigate={navigate} />;

      // Portal entry and role-specific authentication
      case '/farmer/login':
        return <FarmerPortalView onNavigate={navigate} />;
      case '/office/login':
        return <PortalLoginPage role="office" onNavigate={navigate} />;
      case '/vendor/login':
        return <PortalLoginPage role="vendor" onNavigate={navigate} />;
      case '/farmer':
        return <FarmerPortalView onNavigate={navigate} />;

      // Internal office workspace
      case '/office':
      case '/office/farmers':
      case '/office/approvals':
      case '/office/programs':
      case '/office/reports':
      case '/office/access':
        return <PortalProtectedView role="office" currentPath={currentPath} onNavigate={navigate}><OfficePortalPage currentPath={currentPath} onNavigate={navigate} /></PortalProtectedView>;

      // Internal vendor/broker workspace
      case '/vendor':
      case '/vendor/listings':
      case '/vendor/leads':
      case '/vendor/orders':
        return <PortalProtectedView role="vendor" currentPath={currentPath} onNavigate={navigate}><VendorPortalPage currentPath={currentPath} onNavigate={navigate} /></PortalProtectedView>;

      // Member-Only Capabilities (Gated by Auth)
      case '/dashboard':
        return (
          <ProtectedRouteView onNavigate={navigate} featureTitle="Farm Command Center">
            <DashboardPage onNavigate={navigate} />
          </ProtectedRouteView>
        );
      case '/farmer/vendors':
        return <ProtectedRouteView onNavigate={navigate} featureTitle="Vendor Marketplace"><FarmerMarketplacePage onNavigate={navigate} /></ProtectedRouteView>;
      case '/schemes':
        return (
          <ProtectedRouteView onNavigate={navigate} featureTitle="Govt Subsidies & Schemes">
            <SchemesPage onNavigate={navigate} />
          </ProtectedRouteView>
        );

      // Auth Views
      case '/login':
        return <FarmerPortalView onNavigate={navigate} />;
      case '/signup':
        return <SignupPage onNavigate={navigate} />;

      default:
        return <RouteNotFound onNavigate={navigate} />;
    }
  };

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm font-black text-slate-500">Loading AgriSence…</div>}>
      <div className="relative min-h-screen selection:bg-emerald-500/20 selection:text-[#008746]">
        {renderCurrentView()}
        <AuthGateModal />
        <ProfileModal />
        <AuthToast />
      </div>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <LanguageProvider>
        <Suspense fallback={null}><GlobalLanguageSync /></Suspense>
        <AuthProvider>
          <FarmProvider>
            <DiagnosisProvider>
              <TelemetryProvider>
              <MainAppContent />
              </TelemetryProvider>
            </DiagnosisProvider>
          </FarmProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
