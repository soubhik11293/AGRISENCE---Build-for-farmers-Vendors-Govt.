import React from 'react';
import { ArrowLeft, Bell, ChevronRight, LogOut, Menu, Sprout, UserCircle } from 'lucide-react';
import { useAuth } from '@/src/context/auth-context';
import { clearPortalRole, PORTAL_META, type PortalRole } from '@/src/lib/portal-session';

export interface PortalNavItem { label: string; path: string; icon: React.ComponentType<{ className?: string }>; }

export function PortalShell({ role, currentPath, navItems, onNavigate, children }: { role: PortalRole; currentPath: string; navItems: PortalNavItem[]; onNavigate: (path: string) => void; children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const meta = PORTAL_META[role];
  const signOut = async () => { clearPortalRole(); await logout(); onNavigate('/'); };

  return <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-950 dark:text-slate-100 flex">
    <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-slate-950 text-white p-5 flex flex-col transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center gap-3 pb-6 border-b border-white/10"><div className="size-10 rounded-xl bg-emerald-500 flex items-center justify-center"><Sprout className="size-5" /></div><div><p className="font-black">AgriSence</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">{meta.shortLabel} Workspace</p></div></div>
      <nav className="pt-6 space-y-1.5 flex-1">{navItems.map((item) => { const Icon = item.icon; const active = currentPath === item.path; return <button key={item.path} type="button" onClick={() => { onNavigate(item.path); setMobileOpen(false); }} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-xs font-black cursor-pointer transition-colors ${active ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:bg-white/10'}`}><Icon className="size-4" />{item.label}<ChevronRight className={`size-3 ml-auto ${active ? 'opacity-100' : 'opacity-30'}`} /></button>; })}</nav>
      <button type="button" onClick={() => void signOut()} className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-black text-slate-300 hover:bg-rose-500/20 hover:text-rose-300 cursor-pointer"><LogOut className="size-4" /> Sign out</button>
    </aside>
    {mobileOpen && <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-20 bg-slate-950/50 lg:hidden" />}
     <div className="flex-1 lg:ml-72 min-w-0"><header className="h-20 px-5 sm:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 flex items-center justify-between sticky top-0 z-10"><div className="flex items-center gap-3"><button type="button" onClick={() => setMobileOpen(true)} className="lg:hidden size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer"><Menu className="size-4" /></button><div><p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">{meta.label}</p><h1 className="text-lg font-black">Internal operations console</h1></div></div><div className="flex items-center gap-2 sm:gap-3"><button type="button" onClick={() => onNavigate('/')} className="flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-[11px] font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"><ArrowLeft className="size-3.5" /><span className="hidden sm:inline">Workspaces</span></button><Bell className="size-4 text-slate-400" /><div className="hidden sm:flex items-center gap-2 text-right"><p className="text-xs font-black">{user?.fullName || 'Authenticated user'}</p><p className="text-[10px] text-slate-500">{user?.email || 'Secure account'}</p></div><UserCircle className="size-8 text-emerald-600" /></div></header><main className="p-5 sm:p-8 max-w-[1600px] mx-auto">{children}</main></div>
  </div>;
}
