import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, ShoppingBag, Sprout } from 'lucide-react';
import { useAuth } from '@/src/context/auth-context';
import { portalLogin, registerVendor } from '@/src/lib/portal-api';
import { PORTAL_META, setPortalRole, type PortalRole } from '@/src/lib/portal-session';

const icons = { farmer: Sprout, office: Building2, vendor: ShoppingBag };

export function PortalLoginPage({ role, onNavigate }: { role: Exclude<PortalRole, 'farmer'>; onNavigate: (route: string) => void }) {
  const { user } = useAuth();
  const meta = PORTAL_META[role];
  const Icon = icons[role];
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.portalRoles?.includes(role) && user.accountType !== 'farmer') {
      setPortalRole(role);
      onNavigate(`/${role}`);
    }
  }, [onNavigate, role, user?.accountType, user?.portalRoles]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (mode === 'register' && role === 'vendor') {
        await registerVendor({ identifier, password, fullName, businessName, phone, location });
      } else {
        await portalLogin(role, identifier, password);
      }
      setPortalRole(role);
      onNavigate(`/${role}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to complete portal access.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top,#e8f8ef,transparent_45%),#f4f8f6] dark:bg-[radial-gradient(circle_at_top,#15372b,transparent_45%),#071510]">
      <div className="w-full max-w-xl p-7 sm:p-9 rounded-[36px] bg-white/90 dark:bg-slate-900/90 border border-white/90 dark:border-white/10 shadow-2xl text-slate-950 dark:text-slate-100">
        <button type="button" onClick={() => onNavigate('/')} className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-emerald-600 cursor-pointer"><ArrowLeft className="size-4" /> Back to workspaces</button>
        <div className="flex items-start gap-4 mt-7"><div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><Icon className="size-7" /></div><div><span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Separate authenticated access</span><h1 className="text-2xl font-black mt-1">{meta.label}</h1></div></div>
        <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold leading-relaxed mt-5">{role === 'office' ? 'Use the official ID and password issued by the AgriSence administrator. Farmer credentials never work in this portal.' : 'Vendor accounts are separate from farmer accounts. You can use the same contact email, but you must complete vendor enrollment again.'}</p>

        {role === 'vendor' && <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 mt-6"><button type="button" onClick={() => { setMode('signin'); setError(''); }} className={`py-2.5 rounded-xl text-xs font-black cursor-pointer ${mode === 'signin' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}>Vendor sign in</button><button type="button" onClick={() => { setMode('register'); setError(''); }} className={`py-2.5 rounded-xl text-xs font-black cursor-pointer ${mode === 'register' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}>Register as vendor</button></div>}

        <form onSubmit={submit} className="space-y-4 mt-6">
          {mode === 'register' && <>
            <Field label="Your full name" value={fullName} onChange={setFullName} placeholder="e.g. Ramesh Patil" />
            <Field label="Business or trading name" value={businessName} onChange={setBusinessName} placeholder="e.g. Patil Agri Trade" />
            <div className="grid sm:grid-cols-2 gap-3"><Field label="Contact phone" value={phone} onChange={setPhone} placeholder="+91 98765 43210" /><Field label="Service location" value={location} onChange={setLocation} placeholder="Pune, Maharashtra" /></div>
          </>}
          <Field label={role === 'office' ? 'Official ID issued by admin' : 'Vendor contact email'} value={identifier} onChange={setIdentifier} placeholder={role === 'office' ? 'e.g. pune-officer-01' : 'you@business.com'} />
          <label className="block space-y-1.5"><span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Password</span><span className="relative block"><input required value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} minLength={10} className="w-full h-11 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 pr-11 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="At least 10 characters" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-3 text-slate-400 cursor-pointer" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span></label>
          {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-700 dark:text-rose-300">{error}</div>}
          <button disabled={isSubmitting} type="submit" className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg">{isSubmitting ? 'Connecting securely…' : mode === 'register' ? 'Create vendor account' : `Enter ${meta.shortLabel} portal`} <ArrowRight className="size-4" /></button>
        </form>

        <div className="grid sm:grid-cols-2 gap-2 mt-6"><Trust icon={role === 'office' ? KeyRound : CheckCircle2} text={role === 'office' ? 'Admin-issued credentials' : 'Separate vendor profile'} /><Trust icon={LockKeyhole} text="Firebase-secured session" /></div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="block space-y-1.5"><span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</span><input required value={value} onChange={(event) => onChange(event.target.value)} className="w-full h-11 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder={placeholder} /></label>;
}

function Trust({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return <div className="p-3 rounded-xl bg-emerald-500/10 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2"><Icon className="size-4 text-emerald-600 shrink-0" />{text}</div>;
}
