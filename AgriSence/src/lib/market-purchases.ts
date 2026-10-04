import { loadFarmRecords, savePlatformRecord } from '@/src/lib/platform-sync';
import { recordFarmEvent } from '@/src/lib/farm-events';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import type { MarketPrice } from '@/src/types';

export interface MarketPurchaseIntent {
  id: string;
  commodity: string;
  variety: string;
  market: string;
  district: string;
  state: string;
  quantityQtl: number;
  modalPrice: number;
  estimatedTotal: number;
  source?: string;
  createdAt: string;
  farmId?: number;
  cropCycleId?: string;
  userId?: string;
  status: 'planned' | 'contacted' | 'completed';
}

const PURCHASE_HISTORY_KEY = 'agrisence_market_purchase_history';

function readLocal(userId?: string): MarketPurchaseIntent[] {
  if (typeof window === 'undefined') return [];
  if (!userId) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(`${PURCHASE_HISTORY_KEY}:${userId}`) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getMarketPurchaseHistory(filters: { userId?: string; farmId?: number } = {}) {
  return readLocal(filters.userId).filter((entry) => {
    if (filters.userId && entry.userId !== filters.userId) return false;
    if (filters.farmId != null && Number(entry.farmId) !== Number(filters.farmId)) return false;
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function recordMarketPurchaseIntent(input: {
  quote: MarketPrice;
  quantityQtl: number;
  userId?: string;
  farmId?: number;
  cropCycleId?: string;
}) {
  const now = new Date().toISOString();
  const entry: MarketPurchaseIntent = {
    id: `buy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    commodity: input.quote.commodity,
    variety: input.quote.variety,
    market: input.quote.market,
    district: input.quote.district,
    state: input.quote.state,
    quantityQtl: Math.max(0.01, Number(input.quantityQtl) || 0),
    modalPrice: input.quote.modalPrice,
    estimatedTotal: Math.round((Math.max(0.01, Number(input.quantityQtl) || 0)) * input.quote.modalPrice),
    source: input.quote.source,
    createdAt: now,
    farmId: input.farmId,
    cropCycleId: input.cropCycleId,
    userId: input.userId,
    status: 'planned',
  };
  if (typeof window !== 'undefined') {
    if (input.userId) localStorage.setItem(`${PURCHASE_HISTORY_KEY}:${input.userId}`, JSON.stringify([entry, ...readLocal(input.userId)].slice(0, 100)));
    window.dispatchEvent(new CustomEvent('agrisence_market_purchase_updated', { detail: entry }));
  }
  await savePlatformRecord('marketPurchases', { ...entry }, {
    userId: input.userId,
    farmId: input.farmId,
    cropCycleId: input.cropCycleId,
    source: 'market-buy-intent',
  }).catch(() => null);
  if (input.userId && input.farmId) {
    void recordFarmEvent({
      userId: input.userId,
      farmId: input.farmId,
      cropCycleId: input.cropCycleId,
      type: 'MARKET_PURCHASE',
      source: 'market-buy-intent',
      data: { ...entry },
    });
  }
  return entry;
}

export async function loadCloudMarketPurchaseHistory(userId: string, farmId?: number) {
  try {
    if (farmId) return await loadFarmRecords<MarketPurchaseIntent>('marketPurchases', userId, farmId, 100);
    const snapshot = await getDocs(query(collection(db, 'marketPurchases'), where('userId', '==', userId)));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MarketPurchaseIntent));
  } catch {
    return [];
  }
}
