import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '@/src/lib/firebase';
import { recordFarmEvent } from '@/src/lib/farm-events';
import { SELECTED_CROP_CYCLE_KEY, saveTask, savePlatformRecord } from '@/src/lib/platform-sync';
import { buildSimulationGuidance, type ProcurementNeed, type SimulationGuidance } from '@/src/lib/simulator-guidance';

export interface SimulationRecord {
  id?: string;
  moduleId: string;
  moduleName: string;
  timestamp: number;
  userId?: string;
  farmId?: number;
  cropCycleId?: string;
  parameters: Record<string, any>;
  calculatedMetrics: Record<string, any>;
  suggestedPrompts: string[];
  followUpTask?: { title: string; priority?: 'High' | 'Medium' | 'Low'; due?: string };
  result?: SimulationGuidance;
  summary?: string;
  guidance?: string[];
  procurementNeeds?: ProcurementNeed[];
}

const STORAGE_KEY = 'agrisence_latest_simulation';
const LEGACY_STORAGE_KEY = 'agrisence_latest_simulator_run';
const HISTORY_KEY = 'agrisence_simulation_history';
const DRAFTS_KEY = 'agrisence_simulator_drafts';
const scoped = (key: string, userId?: string) => userId ? `${key}:${userId}` : key;

export function saveSimulationDraft(moduleId: string, payload: Record<string, unknown>) {
  if (typeof window === 'undefined' || !moduleId) return;
  try {
    const raw = localStorage.getItem(scoped(DRAFTS_KEY, getSessionContext().userId));
    const drafts = raw ? JSON.parse(raw) as Record<string, unknown> : {};
    drafts[moduleId] = { ...payload, moduleId, updatedAt: Date.now() };
    localStorage.setItem(scoped(DRAFTS_KEY, getSessionContext().userId), JSON.stringify(drafts));
    window.dispatchEvent(new CustomEvent('agrisence_simulator_draft_updated', { detail: drafts[moduleId] }));
  } catch {
    // Draft synchronization is best-effort and must never block calculations.
  }
}

export function loadSimulationDraft<T = Record<string, unknown>>(moduleId: string): T | null {
  if (typeof window === 'undefined' || !moduleId) return null;
  try {
    const raw = localStorage.getItem(scoped(DRAFTS_KEY, getSessionContext().userId));
    const drafts = raw ? JSON.parse(raw) as Record<string, T> : {};
    return drafts[moduleId] || null;
  } catch {
    return null;
  }
}

function getSessionContext() {
  if (typeof window === 'undefined') return {};
  try {
    const session = JSON.parse(localStorage.getItem('agrisence_user_session') || '{}');
    const selectedFarmId = Number(localStorage.getItem('agrisence_selected_farm_id')) || undefined;
    const cropCycleId = localStorage.getItem(SELECTED_CROP_CYCLE_KEY) || undefined;
    return { userId: auth.currentUser?.uid || session?.user?.id, farmId: selectedFarmId, cropCycleId };
  } catch {
    return {};
  }
}

export async function saveSimulationTelemetry(record: SimulationRecord) {
  const context = getSessionContext();
  const result = record.result || buildSimulationGuidance(record);
  const enriched = {
    ...context,
    ...record,
    result,
    summary: record.summary || result.summary,
    guidance: record.guidance || result.guidance,
    procurementNeeds: record.procurementNeeds || result.procurementNeeds,
    userId: record.userId || context.userId,
    farmId: record.farmId ?? context.farmId,
    cropCycleId: record.cropCycleId || context.cropCycleId,
  };

  if (typeof window !== 'undefined') {
    try {
      if (enriched.userId) {
        localStorage.setItem(scoped(STORAGE_KEY, enriched.userId), JSON.stringify(enriched));
        localStorage.setItem(scoped(LEGACY_STORAGE_KEY, enriched.userId), JSON.stringify(enriched));
      }
      const history = getAllSimulationHistory(enriched.userId);
      const duplicate = (item: SimulationRecord) => item.moduleId === enriched.moduleId && Number(item.timestamp) === Number(enriched.timestamp);
      if (enriched.userId) localStorage.setItem(scoped(HISTORY_KEY, enriched.userId), JSON.stringify([enriched, ...history.filter((item) => !duplicate(item))].slice(0, 100)));
      window.dispatchEvent(new CustomEvent('agrisence_simulation_updated', { detail: enriched }));
    } catch (err) {
      console.warn('Failed to cache simulation telemetry:', err);
    }
  }

  if (enriched.userId) {
    try {
      const ref = await addDoc(collection(db, 'simulationRuns'), { ...enriched, createdAt: new Date().toISOString() });
      if (enriched.farmId) {
        await recordFarmEvent({
          userId: enriched.userId,
          farmId: enriched.farmId,
          cropCycleId: enriched.cropCycleId,
          type: 'SIMULATION',
          source: enriched.moduleId,
          data: enriched.parameters,
        });
        const followUp = enriched.followUpTask || {
          title: `Review ${enriched.moduleName} result and apply the recommended field action`,
          priority: 'Medium' as const,
          due: 'After simulation',
        };
        await saveTask({
          id: `sim-${enriched.moduleId}-${enriched.timestamp}`,
          crop: enriched.parameters?.crop || enriched.parameters?.targetCrop || 'Selected Crop',
          title: followUp.title,
          due: followUp.due || 'After simulation',
          priority: followUp.priority || 'Medium',
          done: false,
          source: 'simulator-follow-up',
          simulationId: ref.id,
        }, {
          userId: enriched.userId,
          farmId: enriched.farmId,
          cropCycleId: enriched.cropCycleId,
          source: 'simulator-follow-up',
        });
        await savePlatformRecord('recommendations', {
          category: 'SIMULATOR',
          moduleId: enriched.moduleId,
          title: `${enriched.moduleName} follow-up`,
          summary: followUp.title,
          metrics: enriched.calculatedMetrics,
          suggestedPrompts: enriched.suggestedPrompts,
          simulationId: ref.id,
        }, {
          userId: enriched.userId,
          farmId: enriched.farmId,
          cropCycleId: enriched.cropCycleId,
          source: 'simulator-recommendation',
        });
      }
      return ref.id;
    } catch (err) {
      console.warn('Failed to persist simulation telemetry:', err);
    }
  }
  return null;
}

export function getLatestSimulationTelemetry(userId?: string): SimulationRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const id = userId || getSessionContext().userId;
    const raw = localStorage.getItem(scoped(STORAGE_KEY, id)) || localStorage.getItem(scoped(LEGACY_STORAGE_KEY, id));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function loadCloudSimulationHistory(userId: string, farmId?: number): Promise<SimulationRecord[]> {
  try {
    const snap = await getDocs(query(collection(db, 'simulationRuns'), where('userId', '==', userId)));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as SimulationRecord))
      .filter((row) => farmId == null || Number(row.farmId) === Number(farmId))
      .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0))
      .slice(0, 100);
  } catch {
    return [];
  }
}

export function getAllSimulationHistory(userId?: string): SimulationRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(scoped(HISTORY_KEY, userId || getSessionContext().userId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function getSimulationHistory(filters: { moduleId?: string; farmId?: number; cropCycleId?: string; userId?: string } = {}) {
  return getAllSimulationHistory(filters.userId).filter((record) => {
    if (filters.moduleId && record.moduleId !== filters.moduleId) return false;
    if (filters.farmId != null && Number(record.farmId) !== Number(filters.farmId)) return false;
    if (filters.cropCycleId && record.cropCycleId !== filters.cropCycleId) return false;
    return true;
  });
}
