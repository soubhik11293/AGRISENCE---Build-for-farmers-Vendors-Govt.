import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, ClipboardList, HandCoins, Package, Plus, Search, ShoppingBag, Truck, Users as UsersIcon, XCircle } from 'lucide-react';
import { PortalShell, type PortalNavItem } from '@/src/components/portal-shell';
import { useAuth } from '@/src/context/auth-context';
import { fetchPortalRecords, persistPortalRecords, readPortalRecords, writePortalRecords, type Lead, type Listing } from '@/src/lib/portal-data';
import { callPrivatePortal, type PortalMetrics } from '@/src/lib/portal-api';

type VendorOrder = { id: string; product: string; farmerName: string; quantity: number; unit: string; total: number; delivery: string; status: 'Requested' | 'Accepted' | 'Dispatched' | 'Completed' | 'Cancelled' };

const LISTING_KEY = 'agrisence_vendor_listings';
const LEAD_KEY = 'agrisence_vendor_leads';
const LISTING_COLLECTION = 'vendorListings';
const LEAD_COLLECTION = 'vendorLeads';
const seedListings: Listing[] = [];
const seedLeads: Lead[] = [];

export function VendorPortalPage({ currentPath, onNavigate }: { currentPath: string; onNavigate: (path: string) => void }) {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>(() => readPortalRecords(LISTING_KEY, user?.id, seedListings));
  const [leads, setLeads] = useState<Lead[]>(() => readPortalRecords(LEAD_KEY, user?.id, seedLeads));
  const [metrics, setMetrics] = useState<PortalMetrics | null>(null);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [listingFormOpen, setListingFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const nav: PortalNavItem[] = [{ label: 'Overview', path: '/vendor', icon: BarChart3 }, { label: 'My listings', path: '/vendor/listings', icon: Package }, { label: 'Buyer leads', path: '/vendor/leads', icon: HandCoins }, { label: 'Trade orders', path: '/vendor/orders', icon: ClipboardList }];
  useEffect(() => {
    let cancelled = false;
    const refresh = () => { void callPrivatePortal<{ metrics: PortalMetrics }>('metrics').then((result) => { if (!cancelled) setMetrics(result.metrics); }).catch(() => {}); };
    refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [user?.id]);
  useEffect(() => {
    let cancelled = false;
    void callPrivatePortal<{ orders: VendorOrder[] }>('listVendorData').then((result) => { if (!cancelled) setOrders(result.orders); }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]);
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const localListings = readPortalRecords(LISTING_KEY, user.id, seedListings);
    const localLeads = readPortalRecords(LEAD_KEY, user.id, seedLeads);
    setListings(localListings);
    setLeads(localLeads);
    void Promise.all([
      fetchPortalRecords<Listing>(LISTING_COLLECTION, user.id),
      fetchPortalRecords<Lead>(LEAD_COLLECTION, user.id),
    ]).then(([remoteListings, remoteLeads]) => {
      if (cancelled) return;
      if (remoteListings) {
        const next = remoteListings.length ? remoteListings : localListings;
        setListings(next);
        writePortalRecords(LISTING_KEY, user.id, next);
        if (!remoteListings.length) void persistPortalRecords(LISTING_COLLECTION, user.id, next);
      }
      if (remoteLeads) {
        const next = remoteLeads.length ? remoteLeads : localLeads;
        setLeads(next);
        writePortalRecords(LEAD_KEY, user.id, next);
        if (!remoteLeads.length) void persistPortalRecords(LEAD_COLLECTION, user.id, next);
      }
    });
    return () => { cancelled = true; };
  }, [user?.id]);
  const saveListings = (next: Listing[]) => { setListings(next); writePortalRecords(LISTING_KEY, user?.id, next); if (user?.id) void persistPortalRecords(LISTING_COLLECTION, user.id, next); };
  const saveLeads = (next: Lead[]) => { setLeads(next); writePortalRecords(LEAD_KEY, user?.id, next); if (user?.id) void persistPortalRecords(LEAD_COLLECTION, user.id, next); };
  const filteredListings = useMemo(() => listings.filter((item) => `${item.product} ${item.location} ${item.category}`.toLowerCase().includes(search.toLowerCase())), [listings, search]);
  const filteredLeads = useMemo(() => leads.filter((item) => `${item.buyer} ${item.product} ${item.location}`.toLowerCase().includes(search.toLowerCase())), [leads, search]);
  const addListing = (item: Listing) => saveListings([item, ...listings]);
  const toggleListing = (id: string) => saveListings(listings.map((item) => item.id === id ? { ...item, status: item.status === 'Active' ? 'Paused' : 'Active', updated: 'Just now' } : item));
  const updateLead = (id: string, status: Lead['status']) => saveLeads(leads.map((item) => item.id === id ? { ...item, status } : item));
  const activeListings = listings.filter((item) => item.status === 'Active');
  return <PortalShell role="vendor" currentPath={currentPath} navItems={nav} onNavigate={onNavigate}><div className="space-y-6"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">Market partner operations</p><h2 className="text-3xl font-black mt-1">Vendor & broker workspace</h2><p className="text-sm text-slate-500 mt-2">Publish offers, respond to farmer demand, and keep trade follow-ups organized.</p></div><div className="flex gap-2"><button type="button" onClick={() => setListingFormOpen((value) => !value)} className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black cursor-pointer flex items-center gap-2"><Plus className="size-4" /> {listingFormOpen ? 'Close form' : 'New listing'}</button><button type="button" onClick={() => onNavigate('/vendor/leads')} className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-black cursor-pointer">View leads</button></div></div>
     {listingFormOpen && <ListingFormPanel onCreated={(item) => { addListing(item); setListingFormOpen(false); }} />}
     <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">{[{ label: 'Active listings', value: activeListings.length, icon: Package }, { label: 'Stock units', value: activeListings.reduce((sum, item) => sum + item.stock, 0), icon: ShoppingBag }, { label: 'New leads', value: leads.filter((item) => item.status === 'New').length, icon: HandCoins }, { label: 'Orders to follow', value: leads.filter((item) => item.status !== 'Closed').length, icon: Truck }, { label: 'Farmers in network', value: metrics?.farmers ?? 0, icon: UsersIcon }].map(({ label, value, icon: Icon }) => <div key={label} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm"><Icon className="size-5 text-amber-600 mb-3" /><p className="text-2xl font-black">{value}</p><p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">{label}</p></div>)}</div>
    {(currentPath === '/vendor' || currentPath === '/vendor/listings') && <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-4"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h3 className="text-xl font-black">{currentPath === '/vendor' ? 'Listing portfolio' : 'My listings'}</h3><p className="text-xs text-slate-500 mt-1">Manage live commodity and farm-input offers.</p></div><div className="relative"><Search className="size-4 absolute left-3 top-2.5 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search listings" className="h-9 w-52 pl-9 pr-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold outline-none" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{filteredListings.map((item) => <div key={item.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 space-y-3"><div className="flex items-start justify-between gap-2"><div><span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">{item.category}</span><h4 className="font-black text-sm mt-1">{item.product}</h4></div><span className={`px-2 py-1 rounded-lg text-[10px] font-black ${item.status === 'Active' ? 'bg-emerald-500/15 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{item.status}</span></div><p className="text-xs text-slate-500">{item.location}</p><div className="flex items-end justify-between"><div><p className="text-lg font-black">₹{item.price.toLocaleString('en-IN')} <span className="text-[10px] text-slate-500">{item.unit}</span></p><p className="text-[10px] text-slate-500">Stock: {item.stock} • Updated {item.updated}</p></div><button type="button" onClick={() => toggleListing(item.id)} className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[10px] font-black cursor-pointer">{item.status === 'Active' ? 'Pause' : 'Activate'}</button></div></div>)}</div></section>}
     {currentPath === '/vendor/leads' && <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-4"><div><h3 className="text-xl font-black">Buyer leads</h3><p className="text-xs text-slate-500 mt-1">Leads are created automatically when farmers request one of your active listings.</p></div><LeadTable leads={filteredLeads} onStatus={updateLead} /></section>}
     {currentPath === '/vendor/orders' && <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-4"><div><h3 className="text-xl font-black">Trade orders and follow-ups</h3><p className="text-xs text-slate-500 mt-1">Track real farmer requests, stock acceptance, dispatch, and completion.</p></div><OrderTable orders={orders} onStatus={async (id, status) => { try { await callPrivatePortal('updateOrder', { id, status }); setOrders((items) => items.map((item) => item.id === id ? { ...item, status } : item)); } catch { /* The server remains authoritative. */ } }} /></section>}
  </div></PortalShell>;
}

function LeadTable({ leads, onStatus }: { leads: Lead[]; onStatus: (id: string, status: Lead['status']) => void }) { return <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-200 dark:border-white/10 text-[10px] uppercase tracking-wider text-slate-500"><th className="py-3 pr-3">Lead</th><th className="py-3 pr-3">Buyer / demand</th><th className="py-3 pr-3">Quantity</th><th className="py-3 pr-3">Location</th><th className="py-3">Status</th></tr></thead><tbody>{leads.map((item) => <tr key={item.id} className="border-b border-slate-100 dark:border-white/5"><td className="py-3 pr-3 font-black">{item.id}</td><td className="py-3 pr-3"><span className="font-black">{item.buyer}</span><span className="block text-slate-500 mt-0.5">{item.product}</span></td><td className="py-3 pr-3 font-bold">{item.quantity}</td><td className="py-3 pr-3 text-slate-500">{item.location}</td><td className="py-3"><select value={item.status} onChange={(event) => onStatus(item.id, event.target.value as Lead['status'])} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold"><option>New</option><option>Quoted</option><option>Closed</option></select></td></tr>)}{leads.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-slate-500">No leads yet.</td></tr>}</tbody></table></div>; }

function OrderTable({ orders, onStatus }: { orders: VendorOrder[]; onStatus: (id: string, status: Exclude<VendorOrder['status'], 'Requested'>) => void }) { return <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-200 dark:border-white/10 text-[10px] uppercase tracking-wider text-slate-500"><th className="py-3 pr-3">Order</th><th className="py-3 pr-3">Farmer / product</th><th className="py-3 pr-3">Quantity</th><th className="py-3 pr-3">Total</th><th className="py-3">Status</th></tr></thead><tbody>{orders.map((item) => <tr key={item.id} className="border-b border-slate-100 dark:border-white/5"><td className="py-3 pr-3 font-black">{item.id.slice(0, 10)}</td><td className="py-3 pr-3"><span className="font-black">{item.farmerName}</span><span className="block text-slate-500 mt-0.5">{item.product}</span></td><td className="py-3 pr-3 font-bold">{item.quantity} {item.unit}</td><td className="py-3 pr-3 font-bold">₹{Number(item.total || 0).toLocaleString('en-IN')}</td><td className="py-3"><select value={item.status} disabled={item.status === 'Completed' || item.status === 'Cancelled'} onChange={(event) => onStatus(item.id, event.target.value as Exclude<VendorOrder['status'], 'Requested'>)} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold"><option>Requested</option><option>Accepted</option><option>Dispatched</option><option>Completed</option><option>Cancelled</option></select></td></tr>)}{orders.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-slate-500">No farmer orders yet.</td></tr>}</tbody></table></div>; }

function ListingFormPanel({ onCreated }: { onCreated: (item: Listing) => void }) {
  const [product, setProduct] = useState(''); const [category, setCategory] = useState<Listing['category']>('Farm input'); const [location, setLocation] = useState(''); const [price, setPrice] = useState(''); const [unit, setUnit] = useState('₹/unit'); const [stock, setStock] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { const result = await callPrivatePortal<{ id: string }>('saveListing', { product, category, location, price: Number(price), unit, stock: Number(stock), status: 'Active', description: '' }); onCreated({ id: result.id, product, category, location, price: Number(price), unit, stock: Number(stock), status: 'Active', updated: 'Just now' }); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Unable to publish listing.'); } finally { setSaving(false); } };
  return <form onSubmit={submit} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 space-y-4"><div><h3 className="font-black">Publish a real offer</h3><p className="text-xs text-slate-500 mt-1">Farmers will see active listings and can submit tracked requests against available stock.</p></div><div className="grid md:grid-cols-2 gap-3"><input required value={product} onChange={(event) => setProduct(event.target.value)} placeholder="Product or commodity" className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 text-xs font-semibold" /><select value={category} onChange={(event) => setCategory(event.target.value as Listing['category'])} className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 text-xs font-semibold"><option>Mandi commodity</option><option>Farm input</option></select><input required value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location / delivery zone" className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 text-xs font-semibold" /><input required value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="Unit, e.g. ₹/qtl" className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 text-xs font-semibold" /><input required min="0.01" type="number" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Price" className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 text-xs font-semibold" /><input required min="0" type="number" value={stock} onChange={(event) => setStock(event.target.value)} placeholder="Available stock" className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 text-xs font-semibold" /></div>{error && <p className="text-xs font-bold text-rose-600">{error}</p>}<button disabled={saving} type="submit" className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black cursor-pointer disabled:opacity-50">{saving ? 'Publishing…' : 'Publish listing'}</button></form>;
}
