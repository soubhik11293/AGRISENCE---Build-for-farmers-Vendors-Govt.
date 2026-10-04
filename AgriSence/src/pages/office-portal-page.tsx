import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, CheckCircle2, ClipboardList, Download, FileCheck2, KeyRound, Map, Search, ShieldAlert, UserPlus, Users, XCircle } from 'lucide-react';
import { PortalShell, type PortalNavItem } from '@/src/components/portal-shell';
import { useAuth } from '@/src/context/auth-context';
import { fetchPortalRecords, persistPortalRecords, readPortalRecords, writePortalRecords, type OfficeCase } from '@/src/lib/portal-data';
import { getAllSimulationHistory } from '@/src/lib/simulator-sync';
import { callPrivatePortal, type PortalMetrics } from '@/src/lib/portal-api';

const CASE_KEY = 'agrisence_office_cases';
const CASE_COLLECTION = 'officeCases';
const seedCases: OfficeCase[] = [];

const navItems = (items: PortalNavItem[]): PortalNavItem[] => items;

export function OfficePortalPage({ currentPath, onNavigate }: { currentPath: string; onNavigate: (path: string) => void }) {
  const { user } = useAuth();
  const [cases, setCases] = useState<OfficeCase[]>(() => readPortalRecords(CASE_KEY, user?.id, seedCases));
  const [search, setSearch] = useState('');
  const [caseStatus, setCaseStatus] = useState<OfficeCase['status'] | 'All'>('All');
  const [metrics, setMetrics] = useState<PortalMetrics | null>(null);
  const [officials, setOfficials] = useState<Array<{ uid: string; officialId: string; fullName: string; active: boolean }>>([]);
  const [farmers, setFarmers] = useState<Array<{ id: string; fullName: string; district: string; state: string }>>([]);
  const [programs, setPrograms] = useState<Array<{ id: string; title: string; district: string; date: string; status: string; description: string }>>([]);
  const [caseFormOpen, setCaseFormOpen] = useState(false);
  const simulations = getAllSimulationHistory(user?.id);
  const nav: PortalNavItem[] = navItems([{ label: 'Overview', path: '/office', icon: BarChart3 }, { label: 'Farmer registry', path: '/office/farmers', icon: Users }, { label: 'Approval queue', path: '/office/approvals', icon: ClipboardList }, { label: 'Field programs', path: '/office/programs', icon: Map }, { label: 'Reports & exports', path: '/office/reports', icon: FileCheck2 }, ...(user?.isAdmin ? [{ label: 'Official access', path: '/office/access', icon: KeyRound }] : [])]);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void callPrivatePortal<{ metrics: PortalMetrics }>('metrics').then((result) => { if (!cancelled) setMetrics(result.metrics); }).catch(() => {});
      void callPrivatePortal<{ programs: Array<{ id: string; title: string; district: string; date: string; status: string; description: string }>; officials: Array<{ uid: string; officialId: string; fullName: string; active: boolean }> }>('listOfficeData').then((result) => { if (!cancelled) { setPrograms(result.programs); if (user?.isAdmin) setOfficials(result.officials); } }).catch(() => {});
      void callPrivatePortal<{ farmers: Array<{ id: string; fullName: string; district: string; state: string }> }>('listFarmers').then((result) => { if (!cancelled) setFarmers(result.farmers); }).catch(() => {});
    };
    refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [user?.id, user?.isAdmin]);
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const localRecords = readPortalRecords(CASE_KEY, user.id, seedCases);
    setCases(localRecords);
    void fetchPortalRecords<OfficeCase>(CASE_COLLECTION, user.id).then((remoteRecords) => {
      if (cancelled || !remoteRecords) return;
      const next = remoteRecords.length ? remoteRecords : localRecords;
      setCases(next);
      writePortalRecords(CASE_KEY, user.id, next);
      if (!remoteRecords.length) void persistPortalRecords(CASE_COLLECTION, user.id, next);
    });
    return () => { cancelled = true; };
  }, [user?.id]);
  const save = (next: OfficeCase[]) => {
    setCases(next);
    writePortalRecords(CASE_KEY, user?.id, next);
    if (user?.id) void persistPortalRecords(CASE_COLLECTION, user.id, next);
  };
  const filtered = useMemo(() => cases.filter((item) => { const q = search.toLowerCase(); return (caseStatus === 'All' || item.status === caseStatus) && (!q || `${item.id} ${item.farmer} ${item.district} ${item.subject}`.toLowerCase().includes(q)); }), [caseStatus, cases, search]);
  const updateCase = async (id: string, status: OfficeCase['status']) => {
    try {
      await callPrivatePortal('updateCase', { id, status, resolution: status === 'Approved' || status === 'Returned' ? 'Decision recorded from office queue.' : '' });
      save(cases.map((item) => item.id === id ? { ...item, status, updated: 'Just now' } : item));
    } catch { /* The server remains authoritative. */ }
  };
  const exportReport = () => { const body = JSON.stringify({ generatedAt: new Date().toISOString(), officer: user?.email, cases, simulatorRuns: simulations }, null, 2); const url = URL.createObjectURL(new Blob([body], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = 'agrisence-office-report.json'; link.click(); URL.revokeObjectURL(url); };
  const stats = [{ label: 'Open cases', value: cases.filter((item) => item.status !== 'Approved').length, icon: ClipboardList, tone: 'blue' }, { label: 'Registered farmers', value: metrics?.farmers ?? 0, icon: Users, tone: 'emerald' }, { label: 'High priority', value: cases.filter((item) => item.priority === 'High' && item.status !== 'Approved').length, icon: ShieldAlert, tone: 'rose' }, { label: 'Simulator records', value: simulations.length, icon: Activity, tone: 'amber' }];

   return <PortalShell role="office" currentPath={currentPath} navItems={nav} onNavigate={onNavigate}><div className="space-y-6"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">Department operations</p><h2 className="text-3xl font-black mt-1">Office command center</h2><p className="text-sm text-slate-500 mt-2">Review farmer requests, coordinate field programs, and publish accountable reports.</p></div><div className="flex gap-2"><button type="button" onClick={() => setCaseFormOpen((value) => !value)} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black cursor-pointer">{caseFormOpen ? 'Close case form' : 'Create review case'}</button><button type="button" onClick={exportReport} className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-black cursor-pointer flex items-center gap-2"><Download className="size-4" /> Export report</button></div></div>
     {caseFormOpen && <ReviewCasePanel farmers={farmers} onCreated={(item) => { save([item, ...cases]); setCaseFormOpen(false); }} />}
    {currentPath === '/office' && <><div className="grid grid-cols-2 xl:grid-cols-4 gap-3">{stats.map(({ label, value, icon: Icon, tone }) => <div key={label} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm"><Icon className={`size-5 mb-3 ${tone === 'rose' ? 'text-rose-600' : tone === 'blue' ? 'text-blue-600' : tone === 'amber' ? 'text-amber-600' : 'text-emerald-600'}`} /><p className="text-2xl font-black">{value}</p><p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">{label}</p></div>)}</div><div className="grid grid-cols-1 xl:grid-cols-3 gap-4"><div className="xl:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"><div className="flex items-center justify-between mb-4"><h3 className="font-black">Priority work queue</h3><button type="button" onClick={() => onNavigate('/office/approvals')} className="text-xs font-black text-blue-600 cursor-pointer">Open queue →</button></div><CaseTable rows={filtered.slice(0, 4)} onStatus={updateCase} /></div><div className="p-5 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white"><p className="text-xs font-black uppercase tracking-wider text-blue-200">Program pulse</p><h3 className="text-xl font-black mt-2">Field activity is synchronized</h3><p className="text-xs text-blue-100 mt-2 leading-relaxed">Office decisions can use farmer simulator results, soil records, weather observations, and diagnosis history when the farmer has selected a parcel.</p><div className="mt-6 grid grid-cols-2 gap-2"><div className="p-3 rounded-xl bg-white/10"><p className="text-lg font-black">{simulations.filter((row) => row.timestamp > Date.now() - 30 * 86400000).length}</p><p className="text-[10px] text-blue-100">Runs this month</p></div><div className="p-3 rounded-xl bg-white/10"><p className="text-lg font-black">{cases.filter((row) => row.status === 'Approved').length}</p><p className="text-[10px] text-blue-100">Approved cases</p></div></div></div></div></>}
     {currentPath === '/office/approvals' && <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-4"><div className="flex flex-col md:flex-row md:items-center justify-between gap-3"><div><h3 className="text-xl font-black">Approval queue</h3><p className="text-xs text-slate-500 mt-1">Search, review, and update assigned operational cases.</p></div><div className="flex gap-2"><div className="relative"><Search className="size-4 absolute left-3 top-2.5 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search cases" className="h-9 w-48 pl-9 pr-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold outline-none" /></div><select value={caseStatus} onChange={(event) => setCaseStatus(event.target.value as OfficeCase['status'] | 'All')} className="h-9 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"><option>All</option><option>Pending</option><option>In review</option><option>Approved</option><option>Returned</option></select></div></div><CaseTable rows={filtered} onStatus={updateCase} /></section>}
     {currentPath === '/office/farmers' && <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-4"><div><h3 className="text-xl font-black">Farmer registry</h3><p className="text-xs text-slate-500 mt-1">Registered Farmer Board identities available to the office network.</p></div><FarmerTable farmers={farmers} /></section>}
     {currentPath === '/office/programs' && <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-4"><div><h3 className="text-xl font-black">Field programs</h3><p className="text-xs text-slate-500 mt-1">Programs scheduled by the signed-in official.</p></div><ProgramTable programs={programs} /></section>}
     {currentPath === '/office/access' && user?.isAdmin && <OfficialAccessPanel officials={officials} onCreated={(official) => setOfficials((items) => [official, ...items])} />}
     {currentPath === '/office/reports' && <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-5"><div><h3 className="text-xl font-black">Reports and data exports</h3><p className="text-xs text-slate-500 mt-1">Download a local audit package of office cases and synchronized simulator records.</p></div><div className="grid grid-cols-1 md:grid-cols-3 gap-3">{['Case register', 'Program activity', 'Simulator evidence'].map((label, index) => <div key={label} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10"><FileCheck2 className="size-5 text-blue-600 mb-3" /><h4 className="font-black text-sm">{label}</h4><p className="text-xs text-slate-500 mt-1">{index === 0 ? `${cases.length} records` : index === 1 ? 'Field actions and statuses' : `${simulations.length} synchronized runs`}</p><button type="button" onClick={exportReport} className="mt-4 text-xs font-black text-blue-600 cursor-pointer">Download JSON →</button></div>)}</div></section>}
  </div></PortalShell>;
}

function CaseTable({ rows, onStatus }: { rows: OfficeCase[]; onStatus: (id: string, status: OfficeCase['status']) => void | Promise<void> }) { return <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-200 dark:border-white/10 text-[10px] uppercase tracking-wider text-slate-500"><th className="py-3 pr-3">Case</th><th className="py-3 pr-3">Farmer / subject</th><th className="py-3 pr-3">Priority</th><th className="py-3 pr-3">Status</th><th className="py-3">Action</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id} className="border-b border-slate-100 dark:border-white/5"><td className="py-3 pr-3 font-black">{item.id}<span className="block text-[10px] text-slate-500 font-semibold">{item.district}</span></td><td className="py-3 pr-3"><span className="font-black">{item.farmer}</span><span className="block text-slate-500 mt-0.5">{item.subject}</span></td><td className="py-3 pr-3"><span className={`font-black ${item.priority === 'High' ? 'text-rose-600' : item.priority === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}`}>{item.priority}</span></td><td className="py-3 pr-3"><span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold">{item.status}</span></td><td className="py-3"><select value={item.status} onChange={(event) => void onStatus(item.id, event.target.value as OfficeCase['status'])} className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] font-bold"><option>Pending</option><option>In review</option><option>Approved</option><option>Returned</option></select></td></tr>)}{rows.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-slate-500">No cases match this filter.</td></tr>}</tbody></table></div>; }

function FarmerTable({ farmers }: { farmers: Array<{ id: string; fullName: string; district: string; state: string }> }) { return <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-200 dark:border-white/10 text-[10px] uppercase tracking-wider text-slate-500"><th className="py-3">Farmer</th><th className="py-3">District</th><th className="py-3">State</th><th className="py-3">Profile ID</th></tr></thead><tbody>{farmers.map((farmer) => <tr key={farmer.id} className="border-b border-slate-100 dark:border-white/5"><td className="py-3 font-black">{farmer.fullName}</td><td className="py-3 text-slate-500">{farmer.district || '—'}</td><td className="py-3 text-slate-500">{farmer.state || '—'}</td><td className="py-3 font-mono text-[10px]">{farmer.id}</td></tr>)}{farmers.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-slate-500">No registered farmers yet.</td></tr>}</tbody></table></div>; }

function ProgramTable({ programs }: { programs: Array<{ id: string; title: string; district: string; date: string; status: string; description: string }> }) { return <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-200 dark:border-white/10 text-[10px] uppercase tracking-wider text-slate-500"><th className="py-3 pr-3">Program</th><th className="py-3 pr-3">District</th><th className="py-3 pr-3">Date</th><th className="py-3">Status</th></tr></thead><tbody>{programs.map((program) => <tr key={program.id} className="border-b border-slate-100 dark:border-white/5"><td className="py-3 pr-3"><span className="font-black">{program.title}</span><span className="block text-slate-500 mt-0.5">{program.description}</span></td><td className="py-3 pr-3 text-slate-500">{program.district}</td><td className="py-3 pr-3 font-bold">{program.date}</td><td className="py-3"><span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-700 font-bold">{program.status}</span></td></tr>)}{programs.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-slate-500">No field programs have been scheduled.</td></tr>}</tbody></table></div>; }

function ReviewCasePanel({ farmers, onCreated }: { farmers: Array<{ id: string; fullName: string; district: string; state: string }>; onCreated: (item: OfficeCase) => void }) {
  const [farmerId, setFarmerId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<OfficeCase['priority']>('Medium');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const create = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setSaving(true);
    const farmer = farmers.find((item) => item.id === farmerId);
    try {
      if (!farmer) throw new Error('Select a registered farmer.');
      const result = await callPrivatePortal<{ id: string }>('createCase', { farmerId, subject, description, priority });
      onCreated({ id: result.id, farmer: farmer.fullName, district: `${farmer.district}${farmer.state ? `, ${farmer.state}` : ''}`, subject, priority, status: 'Pending', updated: 'Just now' });
    } catch (createError) { setError(createError instanceof Error ? createError.message : 'Unable to create review case.'); }
    finally { setSaving(false); }
  };
  return <form onSubmit={create} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 space-y-4"><div><h3 className="font-black">Create farmer review case</h3><p className="text-xs text-slate-500 mt-1">This case is saved against the selected farmer in the operations database.</p></div><div className="grid md:grid-cols-2 gap-3"><select required value={farmerId} onChange={(event) => setFarmerId(event.target.value)} className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 text-xs font-semibold"><option value="">Select registered farmer</option>{farmers.map((farmer) => <option key={farmer.id} value={farmer.id}>{farmer.fullName} — {farmer.district}</option>)}</select><select value={priority} onChange={(event) => setPriority(event.target.value as OfficeCase['priority'])} className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 text-xs font-semibold"><option>High</option><option>Medium</option><option>Low</option></select></div><input required value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Case subject" className="w-full h-10 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 text-xs font-semibold" /><textarea required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What needs to be reviewed?" className="w-full min-h-24 rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-xs font-semibold" />{farmers.length === 0 && <p className="text-xs font-bold text-amber-700">No farmer profiles are available yet. A farmer must complete Farmer Board registration first.</p>}{error && <p className="text-xs font-bold text-rose-600">{error}</p>}<button disabled={saving || farmers.length === 0} type="submit" className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black cursor-pointer disabled:opacity-50">{saving ? 'Saving case…' : 'Save review case'}</button></form>;
}

function OfficialAccessPanel({ officials, onCreated }: { officials: Array<{ uid: string; officialId: string; fullName: string; active: boolean }>; onCreated: (official: { uid: string; officialId: string; fullName: string; active: boolean }) => void }) {
  const [officialId, setOfficialId] = useState('');
  const [fullName, setFullName] = useState('');
  const [district, setDistrict] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const create = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setMessage(''); setSaving(true);
    try {
      const result = await callPrivatePortal<{ uid: string; identifier: string }>('createOfficial', { identifier: officialId, fullName, district, password });
      onCreated({ uid: result.uid, officialId: result.identifier, fullName, active: true });
      setOfficialId(''); setFullName(''); setDistrict(''); setPassword(''); setMessage(`Official ID ${result.identifier} created. Share it with the selected official securely.`);
    } catch (createError) { setError(createError instanceof Error ? createError.message : 'Unable to create official account.'); }
    finally { setSaving(false); }
  };
  return <section className="space-y-5"><div className="p-5 rounded-2xl bg-blue-700 text-white"><div className="flex items-center gap-3"><KeyRound className="size-6" /><div><h3 className="text-xl font-black">Official account control</h3><p className="text-xs text-blue-100 mt-1">Only the owner account can create and issue office IDs. Farmers and vendors cannot enter this workspace.</p></div></div></div><div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-5"><form onSubmit={create} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-4"><div><h4 className="font-black">Issue a new official ID</h4><p className="text-xs text-slate-500 mt-1">Use a unique ID and temporary password. The official can later change the password.</p></div><input required value={officialId} onChange={(event) => setOfficialId(event.target.value)} placeholder="official ID, e.g. pune-agri-01" className="w-full h-10 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 text-xs font-semibold" /><input required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Official full name" className="w-full h-10 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 text-xs font-semibold" /><input required value={district} onChange={(event) => setDistrict(event.target.value)} placeholder="Assigned district" className="w-full h-10 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 text-xs font-semibold" /><input required minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Temporary password (10+ characters)" className="w-full h-10 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 text-xs font-semibold" />{error && <p className="text-xs font-bold text-rose-600">{error}</p>}{message && <p className="text-xs font-bold text-emerald-600">{message}</p>}<button disabled={saving} type="submit" className="w-full h-10 rounded-xl bg-blue-600 text-white text-xs font-black cursor-pointer disabled:opacity-50"><UserPlus className="size-4 inline mr-2" />{saving ? 'Creating secure account…' : 'Create official account'}</button></form><div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"><h4 className="font-black">Issued officials</h4><div className="mt-4 space-y-2">{officials.map((official) => <div key={official.uid} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800"><div><p className="text-xs font-black">{official.fullName}</p><p className="text-[11px] text-slate-500">{official.officialId}</p></div><span className={`px-2 py-1 rounded-lg text-[10px] font-black ${official.active ? 'bg-emerald-500/15 text-emerald-700' : 'bg-rose-500/15 text-rose-700'}`}>{official.active ? 'Active' : 'Inactive'}</span></div>)}{officials.length === 0 && <p className="py-8 text-center text-xs text-slate-500">No official accounts issued yet.</p>}</div></div></div></section>; }
