import React from 'react';
import { ArrowRight, Building2, CheckCircle2, Landmark, ShieldCheck, ShoppingBag, Sprout } from 'lucide-react';
import { Logo } from '@/src/components/logo';
import { PORTAL_META, type PortalRole } from '@/src/lib/portal-session';

const roles: Array<{ role: PortalRole; icon: typeof Sprout; tone: string }> = [
  { role: 'office', icon: Building2, tone: 'blue' },
  { role: 'farmer', icon: Sprout, tone: 'emerald' },
  { role: 'vendor', icon: ShoppingBag, tone: 'amber' },
];

export function PortalEntryPage({ onNavigate }: { onNavigate: (route: string) => void }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e7f8ef,transparent_42%),linear-gradient(135deg,#f8fbfa,#eef5f2)] dark:bg-[radial-gradient(circle_at_top,#123629,transparent_42%),#071510] text-slate-950 dark:text-slate-100 flex flex-col">
      <header className="px-5 sm:px-10 pt-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo onClick={() => onNavigate('/')} />
          <span className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"><ShieldCheck className="size-4 text-emerald-600" /> Secure multi-portal access</span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-5 sm:px-10 py-14 sm:py-20 flex items-center">
        <div className="w-full space-y-10">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/75 dark:bg-white/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300"><Landmark className="size-3.5" /> AgriSence Digital Agriculture Network</div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.02]">Choose your secure workspace</h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-semibold leading-relaxed max-w-2xl">One platform for farmers, agriculture offices, and market partners. Select how you work with the agricultural network to continue.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {roles.map(({ role, icon: Icon, tone }) => {
              const meta = PORTAL_META[role];
              const selected = role === 'farmer';
              return (
                <button key={role} type="button" onClick={() => onNavigate(meta.route)} className={`group text-left p-6 sm:p-7 rounded-[32px] border shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer ${selected ? 'bg-emerald-700 text-white border-emerald-500' : 'bg-white/80 dark:bg-slate-900/75 border-white/80 dark:border-white/10 text-slate-950 dark:text-white'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className={`size-14 rounded-2xl flex items-center justify-center ${selected ? 'bg-white/15 text-white' : tone === 'blue' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/15 text-amber-600'}`}><Icon className="size-7" /></div>
                    {selected && <span className="px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-black uppercase tracking-wider">Existing AgriSence website</span>}
                  </div>
                  <h2 className="text-2xl font-black mt-8">{meta.label}</h2>
                  <p className={`text-sm font-semibold leading-relaxed mt-3 ${selected ? 'text-emerald-50' : 'text-slate-600 dark:text-slate-300'}`}>{meta.description}</p>
                  <div className={`mt-8 pt-4 border-t flex items-center justify-between text-xs font-black ${selected ? 'border-white/20 text-white' : 'border-slate-200 dark:border-white/10 text-emerald-700 dark:text-emerald-300'}`}><span>Continue securely</span><ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl text-xs font-semibold text-slate-600 dark:text-slate-300">
            {['Role-specific dashboards', 'Activity and approval history', 'Secure authenticated sessions'].map((item) => <div key={item} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" />{item}</div>)}
          </div>
        </div>
      </main>
    </div>
  );
}
