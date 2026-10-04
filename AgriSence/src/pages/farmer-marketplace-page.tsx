import React, { useEffect, useState } from 'react';
import { ArrowLeft, Package, ShoppingCart, Store } from 'lucide-react';
import { Navbar } from '@/src/components/landing/navbar';
import { useAuth } from '@/src/context/auth-context';
import { callPrivatePortal } from '@/src/lib/portal-api';

type Listing = { id: string; product: string; category: string; location: string; price: number; unit: string; stock: number; businessName?: string; description?: string };

export function FarmerMarketplacePage({ onNavigate }: { onNavigate: (route: string) => void }) {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [delivery, setDelivery] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void callPrivatePortal<{ listings: Listing[] }>('listFarmerListings').then((result) => { if (!cancelled) setListings(result.listings); }).catch((error) => { if (!cancelled) setMessage(error instanceof Error ? error.message : 'Unable to load vendor listings.'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const request = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setMessage('');
    try {
      await callPrivatePortal('requestOrder', { listingId: selected.id, quantity: Number(quantity), delivery, phone });
      setMessage('Request sent. The vendor can now accept, dispatch, and complete your order.');
      setSelected(null);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to send order request.'); }
  };

  return <div className="min-h-screen text-slate-950 dark:text-slate-100"><Navbar currentRoute="/dashboard" onNavigate={onNavigate} /><main className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-16 space-y-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Farmer marketplace</p><h1 className="text-3xl font-black mt-1">Verified vendor listings</h1><p className="text-sm text-slate-500 mt-2">Request real stock from registered vendors and track the order in your account.</p></div><button type="button" onClick={() => onNavigate('/dashboard')} className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-black cursor-pointer"><ArrowLeft className="size-4 inline mr-1" />Dashboard</button></div>{message && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-700">{message}</div>}{loading ? <div className="p-12 text-center text-sm font-bold text-slate-500">Loading active vendor offers…</div> : listings.length === 0 ? <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-center space-y-3"><Store className="size-10 mx-auto text-emerald-600" /><h2 className="text-xl font-black">No active vendor listings yet</h2><p className="text-sm text-slate-500">Registered vendors will appear here when they publish stock.</p></div> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{listings.map((item) => <article key={item.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-3"><div className="flex items-start justify-between gap-2"><div><span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">{item.category}</span><h2 className="font-black mt-1">{item.product}</h2></div><Package className="size-5 text-emerald-600" /></div><p className="text-xs text-slate-500">{item.businessName || 'Registered vendor'} · {item.location}</p><p className="text-xl font-black">₹{Number(item.price).toLocaleString('en-IN')} <span className="text-xs text-slate-500">{item.unit}</span></p><p className="text-xs font-bold text-slate-500">Available stock: {item.stock}</p><button type="button" onClick={() => { setSelected(item); setQuantity('1'); setDelivery(''); setPhone(user?.phone || ''); }} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black cursor-pointer"><ShoppingCart className="size-4 inline mr-1" />Request this listing</button></article>)}</div>}{selected && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50"><form onSubmit={request} className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl space-y-4"><div><h2 className="text-xl font-black">Request {selected.product}</h2><p className="text-xs text-slate-500 mt-1">This creates a vendor order request; payment is not collected here.</p></div><input required min="0.01" max={selected.stock} type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Quantity" className="w-full h-11 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 text-sm font-semibold" /><input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Contact phone" className="w-full h-11 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 text-sm font-semibold" /><textarea required value={delivery} onChange={(event) => setDelivery(event.target.value)} placeholder="Delivery address" className="w-full min-h-24 rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-sm font-semibold" /><div className="flex gap-2"><button type="button" onClick={() => setSelected(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-black cursor-pointer">Cancel</button><button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black cursor-pointer">Send request</button></div></form></div>}</main></div>;
}
