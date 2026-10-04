import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/context/auth-context';
import { useFarms } from '@/src/context/farm-context';
import { recordFarmEvent } from '@/src/lib/farm-events';
import { savePlatformRecord } from '@/src/lib/platform-sync';
import type { PestDiagnosisResult } from '@/src/types';

export const DIAGNOSIS_STORAGE_KEY = 'agrisence_active_diagnosis';
export const DIAGNOSIS_HISTORY_KEY = 'agrisence_diagnosis_history';

export interface DiagnosisContextType {
  activeDiagnosis: PestDiagnosisResult | null;
  diagnosisHistory: PestDiagnosisResult[];
  setLatestDiagnosis: (result: PestDiagnosisResult) => void;
  clearDiagnosis: () => void;
}

const DiagnosisContext = createContext<DiagnosisContextType | undefined>(undefined);

export function DiagnosisProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { selectedFarmId, selectedFarm } = useFarms();
  const [activeDiagnosis, setActiveDiagnosis] = useState<PestDiagnosisResult | null>(null);
  const [diagnosisHistory, setDiagnosisHistory] = useState<PestDiagnosisResult[]>([]);

  useEffect(() => {
    setActiveDiagnosis(null);
    setDiagnosisHistory([]);
    if (!user?.id) return;
    try {
      const stored = localStorage.getItem(`${DIAGNOSIS_STORAGE_KEY}:${user.id}`);
      if (stored) setActiveDiagnosis(JSON.parse(stored));
      const history = localStorage.getItem(`${DIAGNOSIS_HISTORY_KEY}:${user.id}`);
      if (history) setDiagnosisHistory(JSON.parse(history));
    } catch {}
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      if (!user?.id) return;
      try {
        const snap = await getDocs(query(collection(db, 'pestDiagnoses'), where('userId', '==', user.id)));
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PestDiagnosisResult));
        rows.sort((a, b) => String(b.detectedAt || '').localeCompare(String(a.detectedAt || '')));
        if (!cancelled && rows.length) {
          setDiagnosisHistory(rows);
          const farmRows = selectedFarmId ? rows.filter((r) => r.farmId === selectedFarmId) : rows;
          if (farmRows[0]) setActiveDiagnosis(farmRows[0]);
        }
      } catch (error) {
        console.warn('Unable to load diagnosis history from Firestore:', error);
      }
    }
    loadHistory();
    return () => { cancelled = true; };
  }, [user?.id, selectedFarmId]);

  const setLatestDiagnosis = useCallback((result: PestDiagnosisResult) => {
    const enriched: PestDiagnosisResult = {
      ...result,
      id: result.id || `${Date.now()}`,
      userId: user?.id || result.userId,
      farmId: result.farmId ?? selectedFarmId ?? undefined,
      detectedAt: result.detectedAt || new Date().toISOString(),
    };

    setActiveDiagnosis(enriched);
    setDiagnosisHistory((prev) => {
      const updated = [enriched, ...prev];
      if (user?.id) try { localStorage.setItem(`${DIAGNOSIS_HISTORY_KEY}:${user.id}`, JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (user?.id) try { localStorage.setItem(`${DIAGNOSIS_STORAGE_KEY}:${user.id}`, JSON.stringify(enriched)); } catch {}
    window.dispatchEvent(new CustomEvent('agrisence_diagnosis_updated', { detail: enriched }));

    if (user?.id) {
      void (async () => {
        try {
          await addDoc(collection(db, 'pestDiagnoses'), {
            ...enriched,
            selectedFarmName: selectedFarm?.name || null,
            createdAt: new Date().toISOString(),
          });
          if (enriched.farmId) {
            await recordFarmEvent({
              userId: user.id,
              farmId: enriched.farmId,
              type: 'PEST_DIAGNOSIS',
              source: 'AI_PEST_DIAGNOSIS',
              data: JSON.parse(JSON.stringify(enriched)) as Record<string, unknown>,
            });
          }
          if (enriched.farmId) {
            await savePlatformRecord('recommendations', {
              category: 'PEST_DIAGNOSIS',
              title: `Field response plan for ${enriched.pestName}`,
              summary: enriched.biologicalTreatment?.[0] || enriched.chemicalTreatment?.[0] || 'Review diagnosis and scout the affected parcel.',
              severity: enriched.severity,
              confidence: enriched.confidence,
              diagnosisId: enriched.id,
            }, { userId: user.id, farmId: enriched.farmId, cropCycleId: enriched.cropCycleId, source: 'AI_PEST_DIAGNOSIS' });
          }
        } catch (error) {
          console.warn('Failed to persist diagnosis:', error);
        }
      })();
    }
  }, [user?.id, selectedFarmId, selectedFarm?.name]);

  const clearDiagnosis = useCallback(() => {
    setActiveDiagnosis(null);
    if (user?.id) try { localStorage.removeItem(`${DIAGNOSIS_STORAGE_KEY}:${user.id}`); } catch {}
    window.dispatchEvent(new CustomEvent('agrisence_diagnosis_updated', { detail: null }));
  }, []);

  return <DiagnosisContext.Provider value={{ activeDiagnosis, diagnosisHistory, setLatestDiagnosis, clearDiagnosis }}>{children}</DiagnosisContext.Provider>;
}

export function useDiagnosis() {
  const context = useContext(DiagnosisContext);
  if (!context) throw new Error('useDiagnosis must be used within a DiagnosisProvider');
  return context;
}
