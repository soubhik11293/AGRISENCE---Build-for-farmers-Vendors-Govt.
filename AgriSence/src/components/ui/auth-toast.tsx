import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sprout as Sparkles, X, ShieldCheck, UserCheck, LogIn, LogOut } from 'lucide-react';

export interface ToastPayload {
  type: 'account_created' | 'signed_in' | 'signed_out' | 'profile_updated' | 'info';
  title: string;
  description?: string;
}

export function triggerAuthToast(payload: ToastPayload) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('agrisence_toast_notify', { detail: payload }));
  }
}

export function AuthToast() {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const custom = e as CustomEvent<ToastPayload>;
      if (custom.detail) {
        setToast(custom.detail);
      }
    };

    window.addEventListener('agrisence_toast_notify', handleToastEvent);
    return () => window.removeEventListener('agrisence_toast_notify', handleToastEvent);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!toast) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto"
      >
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-900/95 dark:bg-black/95 text-white border-2 border-emerald-500/50 shadow-[0_12px_36px_rgba(0,168,89,0.35)] backdrop-blur-2xl max-w-md min-w-[320px]">
          <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
            toast.type === 'signed_out' ? 'bg-amber-500 text-slate-950' : 'bg-[var(--brand-color,#0f9a58)] text-white'
          }`}>
            {toast.type === 'account_created' ? (
              <UserCheck className="size-5" />
            ) : toast.type === 'signed_in' ? (
              <LogIn className="size-5" />
            ) : toast.type === 'signed_out' ? (
              <LogOut className="size-5" />
            ) : (
              <CheckCircle2 className="size-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`font-black text-xs uppercase tracking-wider ${
                toast.type === 'signed_out' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {toast.type === 'account_created'
                  ? 'Account Created'
                  : toast.type === 'signed_out'
                  ? 'Logged Out'
                  : 'Authentication Success'}
              </span>
              <Sparkles className="size-3 text-amber-400" />
            </div>
            <h4 className="text-sm font-black text-white truncate">
              {toast.title}
            </h4>
            {toast.description && (
              <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                {toast.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setToast(null)}
            className="size-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
