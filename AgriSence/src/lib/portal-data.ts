import { collection, db, doc, getDocs, query, serverTimestamp, setDoc, where } from '@/src/lib/firebase';

export type OfficeCase = {
  id: string;
  farmer: string;
  district: string;
  subject: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In review' | 'Approved' | 'Returned';
  updated: string;
};

export type Listing = {
  id: string;
  product: string;
  category: 'Mandi commodity' | 'Farm input';
  location: string;
  price: number;
  unit: string;
  stock: number;
  status: 'Active' | 'Paused';
  updated: string;
};

export type Lead = {
  id: string;
  buyer: string;
  product: string;
  quantity: string;
  location: string;
  status: 'New' | 'Quoted' | 'Closed';
};

type PortalRecord = { id: string };

const scopedKey = (key: string, userId?: string) => `${key}:${userId || 'guest'}`;

export function readPortalRecords<T>(key: string, userId: string | undefined, fallback: T[]): T[] {
  try {
    const scoped = userId ? localStorage.getItem(scopedKey(key, userId)) : null;
    const saved = userId ? scoped : localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed as T[] : fallback;
  } catch {
    return fallback;
  }
}

export function writePortalRecords<T>(key: string, userId: string | undefined, records: T[]) {
  try {
    localStorage.setItem(scopedKey(key, userId), JSON.stringify(records));
    if (!userId) localStorage.setItem(key, JSON.stringify(records));
  } catch {
    // Local persistence is a convenience fallback; UI state remains usable if storage is unavailable.
  }
}

export async function fetchPortalRecords<T extends PortalRecord>(collectionName: string, userId: string): Promise<T[] | null> {
  try {
    const records = await getDocs(query(collection(db, collectionName), where(collectionName === 'vendorListings' || collectionName === 'vendorLeads' ? 'vendorId' : 'userId', '==', userId)));
    return records.docs.map((record) => ({ id: record.id, ...record.data() } as T));
  } catch (error) {
    console.warn(`Unable to load ${collectionName} from Firestore; using local portal data.`, error);
    return null;
  }
}

export async function persistPortalRecord<T extends PortalRecord>(collectionName: string, userId: string, record: T) {
  try {
    await setDoc(doc(db, collectionName, record.id), {
      ...record,
      userId,
      ...(collectionName === 'vendorListings' || collectionName === 'vendorLeads' ? { vendorId: userId } : {}),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn(`Unable to save ${collectionName}/${record.id} to Firestore; local data is retained.`, error);
  }
}

export async function persistPortalRecords<T extends PortalRecord>(collectionName: string, userId: string, records: T[]) {
  await Promise.all(records.map((record) => persistPortalRecord(collectionName, userId, record)));
}
