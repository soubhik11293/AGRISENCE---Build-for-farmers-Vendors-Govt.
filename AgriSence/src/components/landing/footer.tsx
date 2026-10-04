import React, { useState } from 'react';
import { Logo } from '@/src/components/logo';
import { Sprout, ShieldCheck, Heart, ShoppingCart, Headphones, MapPin, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/src/context/auth-context';
import { KisanShopModal } from '@/src/components/kisan-shop-modal';
import { SupportDeskModal } from '@/src/components/support-desk-modal';

export function Footer({ onNavigate }: { onNavigate?: (route: string) => void }) {
  const { openAuthModal } = useAuth();
  const [kisanShopOpen, setKisanShopOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [shopCategory, setShopCategory] = useState<'seeds' | 'crop_protection' | 'fertilizers' | 'machinery' | 'hyperlocal'>('seeds');

  const handleNav = (path: string) => {
    if (onNavigate) onNavigate(path);
  };

  return (
    <footer className="mt-auto border-t border-slate-200/60 dark:border-white/10 py-12 px-4 sm:px-6 lg:px-8 w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto text-xs text-slate-650 dark:text-slate-400">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        {/* Brand & Description */}
        <div className="space-y-3 sm:col-span-2 md:col-span-1">
          <Logo onClick={() => handleNav('/')} />
          <p className="text-xs leading-relaxed max-w-sm font-medium">
            AgriSence is India’s precision agricultural intelligence platform, providing hyper-localized early pest outbreak alerts, computer vision disease identification, and APMC mandi price discovery.
          </p>
          <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--brand-text,#0d7342)]">
            <ShieldCheck className="size-4 text-[var(--brand-color,#0f9a58)]" />
            <span>Calibrated with ICAR, IMD & AGMARKNET standards</span>
          </div>
        </div>

        {/* Platform Portals */}
        <div className="space-y-2.5">
          <h4 className="font-black text-slate-950 dark:text-white uppercase tracking-wider text-[11px]">
            Platform Portals
          </h4>
          <ul className="space-y-2 font-bold text-slate-700 dark:text-slate-300">
            <li>
              <button
                type="button"
                onClick={() => handleNav('/dashboard')}
                className="hover:text-[var(--brand-color,#0f9a58)] transition-colors cursor-pointer"
              >
                Agronomic Command Center
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleNav('/scan')}
                className="hover:text-[var(--brand-color,#0f9a58)] transition-colors cursor-pointer"
              >
                AI Pest & Leaf Diagnosis
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleNav('/outbreak-warning')}
                className="hover:text-[var(--brand-color,#0f9a58)] transition-colors cursor-pointer"
              >
                Early Outbreak Warning Radar
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => handleNav('/schemes')}
                className="hover:text-[var(--brand-color,#0f9a58)] transition-colors cursor-pointer"
              >
                Central & State Subsidies
              </button>
            </li>
          </ul>
        </div>

        {/* Kisan Shop & Procurement */}
        <div className="space-y-2.5">
          <h4 className="font-black text-slate-950 dark:text-white uppercase tracking-wider text-[11px]">
            Kisan Procurement & Kendra
          </h4>
          <ul className="space-y-2 font-bold text-slate-700 dark:text-slate-300">
            <li>
              <button
                type="button"
                onClick={() => {
                  setShopCategory('seeds');
                  setKisanShopOpen(true);
                }}
                className="hover:text-[var(--brand-color,#0f9a58)] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ShoppingCart className="size-3.5 text-[var(--brand-color,#0f9a58)]" />
                <span>Kisan Direct Agri-Store</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setShopCategory('hyperlocal');
                  setKisanShopOpen(true);
                }}
                className="hover:text-[var(--brand-color,#0f9a58)] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <MapPin className="size-3.5 text-amber-500" />
                <span>Nearby Krishi Kendra (50km)</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setSupportModalOpen(true)}
                className="hover:text-[var(--brand-color,#0f9a58)] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Headphones className="size-3.5 text-sky-500" />
                <span>Omnichannel Kisan Helpdesk</span>
              </button>
            </li>
            <li>
              <a
                href="tel:+9118008893247"
                className="hover:text-[var(--brand-color,#0f9a58)] transition-colors flex items-center gap-1.5 text-[11px] text-slate-500"
              >
                <Phone className="size-3 text-slate-400" />
                <span>Toll-Free: 1800-889-3247</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Farmer Access & Portals */}
        <div className="space-y-2.5">
          <h4 className="font-black text-slate-950 dark:text-white uppercase tracking-wider text-[11px]">
            Farmer Access
          </h4>
          <ul className="space-y-2 font-bold text-slate-700 dark:text-slate-300">
            <li>
              <button
                type="button"
                onClick={() => openAuthModal('Farmer Sign In', 'Sign in to access your parcel telemetry, disease diagnostics, and mandis.', () => handleNav('/dashboard'), 'signin')}
                className="hover:text-[var(--brand-color,#0f9a58)] transition-colors cursor-pointer"
              >
                Sign In to Dashboard
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openAuthModal('Farmer Registration', 'Create a farmer account with Firebase email verification and saved field telemetry.', () => handleNav('/dashboard'), 'signup')}
                className="hover:text-[var(--brand-color,#0f9a58)] transition-colors cursor-pointer"
              >
                Register Free Account
              </button>
            </li>
            <li>
              <a
                href="https://pmfby.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--brand-color,#0f9a58)] transition-colors"
              >
                PMFBY Official Portal
              </a>
            </li>
            <li>
              <a
                href="https://pmkisan.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--brand-color,#0f9a58)] transition-colors"
              >
                PM-KISAN DBT Portal
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-semibold text-slate-500">
        <div>
          © {new Date().getFullYear()} AgriSence Platform. All rights reserved. Precision Agriculture for India.
        </div>
        <div className="flex items-center gap-1">
          <span>Engineered for rural resilience with</span>
          <Heart className="size-3 text-rose-500 fill-rose-500" />
        </div>
      </div>

      {/* Kisan Shop Modal */}
      <KisanShopModal
        isOpen={kisanShopOpen}
        onClose={() => setKisanShopOpen(false)}
        initialCategory={shopCategory}
      />

      {/* Support Desk Modal */}
      <SupportDeskModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
      />
    </footer>
  );
}
