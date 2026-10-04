import {
  addDoc,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/src/lib/firebase';

export const SELECTED_FARM_KEY = 'agrisence_selected_farm_id';
export const SELECTED_CROP_CYCLE_KEY = 'agrisence_selected_crop_cycle_id';

export interface PlatformRecordContext {
  userId?: string;
  farmId?: number;
  cropCycleId?: string;
  source?: string;
  timestamp?: string;
}

function getLocalNumber(key: string): number | undefined {
  if (typeof window === 'undefined') return undefined;
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function getLocalString(key: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const value = localStorage.getItem(key);
  return value || undefined;
}

export function getPlatformContext(overrides: PlatformRecordContext = {}): PlatformRecordContext {
  return {
    userId: overrides.userId || auth.currentUser?.uid,
    farmId: overrides.farmId ?? getLocalNumber(SELECTED_FARM_KEY),
    cropCycleId: overrides.cropCycleId || getLocalString(SELECTED_CROP_CYCLE_KEY),
    source: overrides.source,
    timestamp: overrides.timestamp || new Date().toISOString(),
  };
}

export async function savePlatformRecord(
  collectionName: string,
  data: Record<string, unknown>,
  context: PlatformRecordContext = {}
) {
  const enriched = {
    ...getPlatformContext(context),
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (!enriched.userId) return null;
  const ref = await addDoc(collection(db, collectionName), enriched);
  return ref.id;
}

export async function saveSoilAnalysis(
  payload: Record<string, unknown>,
  context: PlatformRecordContext = {}
) {
  const ctx = getPlatformContext(context);
  const record = {
    ...payload,
    userId: ctx.userId,
    farmId: ctx.farmId,
    cropCycleId: ctx.cropCycleId,
    source: ctx.source || 'soil-analysis-simulator',
    timestamp: ctx.timestamp,
  };

  if (typeof window !== 'undefined') {
    if (ctx.userId) localStorage.setItem(`agrisence_saved_soil_analysis:${ctx.userId}`, JSON.stringify(record));
    window.dispatchEvent(new CustomEvent('agrisence_soil_updated', { detail: record }));
  }

  if (!record.userId) return null;
  const id = await savePlatformRecord('soilTests', record, ctx);
  if (ctx.farmId) {
    await savePlatformRecord('farmEvents', { type: 'SOIL_TEST', data: record }, { ...ctx, source: 'soil-analysis-simulator' });
  }
  return id;
}

export async function saveOutbreakEvaluation(
  payload: Record<string, unknown>,
  context: PlatformRecordContext = {}
) {
  const ctx = getPlatformContext(context);
  const record = {
    ...payload,
    userId: ctx.userId,
    farmId: ctx.farmId,
    cropCycleId: ctx.cropCycleId,
    source: ctx.source || 'outbreak-radar',
    timestamp: ctx.timestamp,
  };

  if (typeof window !== 'undefined') {
    if (ctx.userId) localStorage.setItem(`agrisence_outbreak_evaluation:${ctx.userId}`, JSON.stringify(record));
    window.dispatchEvent(new CustomEvent('agrisence_outbreak_updated', { detail: record }));
  }

  if (!record.userId) return null;
  const id = await savePlatformRecord('outbreakAlerts', record, ctx);
  if (ctx.userId && ctx.farmId) {
    await savePlatformRecord('farmEvents', {
      type: 'OUTBREAK_ALERT',
      data: record,
    }, { ...ctx, source: 'outbreak-radar' });
  }
  return id;
}

export async function saveTask(
  task: any,
  context: PlatformRecordContext = {}
) {
  const ctx = getPlatformContext(context);
  const record: Record<string, any> = {
    ...task,
    userId: ctx.userId,
    farmId: ctx.farmId,
    cropCycleId: ctx.cropCycleId,
  };
  if (!record.userId) return null;
  if (record.id) {
    const id = String(record.id);
    await setDoc(doc(db, 'tasks', id), { ...record, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
    return id;
  }
  return savePlatformRecord('tasks', record, ctx);
}

export async function loadFarmRecords<T = any>(
  collectionName: string,
  userId: string,
  farmId: number,
  limit = 100
): Promise<T[]> {
  try {
    const snap = await getDocs(query(collection(db, collectionName), where('userId', '==', userId)));
    return snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as T))
      .filter((row: any) => Number(row.farmId) === Number(farmId))
      .slice(0, limit);
  } catch {
    return [];
  }
}
