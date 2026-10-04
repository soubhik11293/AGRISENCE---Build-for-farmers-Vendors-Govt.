import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, query, setDoc, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/context/auth-context';
import type { CropCycle, Farm } from '@/src/types';
import { SELECTED_CROP_CYCLE_KEY } from '@/src/lib/platform-sync';

const SELECTED_FARM_KEY = 'agrisence_selected_farm_id';

const DEFAULT_FARMS: Farm[] = [];

function normaliseFarm(data: any, fallbackId?: number): Farm {
  return {
    id: typeof data.id === 'number' ? data.id : Number(data.id || fallbackId || Date.now()),
    userId: data.userId,
    name: data.name || 'Unnamed Parcel',
    village: data.village || '',
    district: data.district || '',
    state: data.state || '',
    country: data.country || 'India',
    pincode: data.pincode || '',
    latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
    longitude: typeof data.longitude === 'number' ? data.longitude : undefined,
    areaAcres: String(data.areaAcres ?? '0'),
    primaryCrop: data.primaryCrop || '',
    healthScore: Number(data.healthScore ?? 0),
    moisturePercent: Number(data.moisturePercent ?? 0),
    nitrogen: Number(data.nitrogen ?? 0),
    phosphorus: Number(data.phosphorus ?? 0),
    potassium: Number(data.potassium ?? 0),
    phLevel: Number(data.phLevel ?? 0),
    irrigationType: data.irrigationType || undefined,
    soilType: data.soilType || undefined,
    ownershipType: data.ownershipType || undefined,
    notes: data.notes || undefined,
    createdAt: data.createdAt?.toMillis?.() ?? data.createdAt,
    updatedAt: data.updatedAt?.toMillis?.() ?? data.updatedAt,
  };
}

interface FarmContextValue {
  farms: Farm[];
  selectedFarmId: number | null;
  selectedFarm: Farm | null;
  loading: boolean;
  error: string | null;
  setSelectedFarmId: (id: number) => void;
  addFarm: (farm: Partial<Farm>) => Promise<Farm>;
  updateFarm: (id: number, farm: Partial<Farm>) => Promise<Farm>;
  deleteFarm: (id: number) => Promise<void>;
  refreshFarms: () => Promise<void>;
  cropCycles: CropCycle[];
  selectedCropCycleId: string | null;
  selectedCropCycle: CropCycle | null;
  setSelectedCropCycleId: (id: string) => void;
  createCropCycle: (cycle: Partial<CropCycle>) => Promise<CropCycle>;
}

const FarmContext = createContext<FarmContextValue | undefined>(undefined);

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmIdState] = useState<number | null>(null);
  const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);
  const [selectedCropCycleId, setSelectedCropCycleIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setSelectedFarmId = useCallback((id: number) => {
    setSelectedFarmIdState(id);
    if (typeof window !== 'undefined') localStorage.setItem(SELECTED_FARM_KEY, String(id));
    window.dispatchEvent(new CustomEvent('agrisence_farm_selected', { detail: id }));
    setSelectedCropCycleIdState((current) => {
      const matching = cropCycles.find((cycle) => Number(cycle.farmId) === Number(id));
      if (matching) {
        if (typeof window !== 'undefined') localStorage.setItem(SELECTED_CROP_CYCLE_KEY, matching.id);
        return matching.id;
      }
      return current;
    });
  }, [cropCycles]);

  const setSelectedCropCycleId = useCallback((id: string) => {
    setSelectedCropCycleIdState(id);
    if (typeof window !== 'undefined') localStorage.setItem(SELECTED_CROP_CYCLE_KEY, id);
    window.dispatchEvent(new CustomEvent('agrisence_crop_cycle_selected', { detail: id }));
  }, []);

  const refreshFarms = useCallback(async () => {
    if (!user?.id) {
      setFarms([]);
      setSelectedFarmIdState(null);
      setCropCycles([]);
      setSelectedCropCycleIdState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(query(collection(db, 'farms'), where('userId', '==', user.id)));
      if (snap.empty) {
        setFarms([]);
        setCropCycles([]);
      } else {
        setFarms(snap.docs.map((d) => normaliseFarm({ ...d.data(), id: d.id })));
      }
      const cycleSnap = await getDocs(query(collection(db, 'cropCycles'), where('userId', '==', user.id)));
      const cycles = cycleSnap.docs.map((d) => ({ id: d.id, ...d.data() } as CropCycle));
      setCropCycles(cycles);
      setSelectedCropCycleIdState((current) => {
        if (current && cycles.some((c) => c.id === current)) return current;
        const stored = typeof window !== 'undefined' ? localStorage.getItem(SELECTED_CROP_CYCLE_KEY) : null;
        if (stored && cycles.some((c) => c.id === stored)) return stored;
        return cycles.find((c) => Number(c.farmId) === Number(selectedFarmId))?.id || cycles[0]?.id || null;
      });
    } catch (e: any) {
      setError(e?.message || 'Unable to load farm data.');
      const cached = typeof window !== 'undefined' ? localStorage.getItem(`agrisence_farms_cache:${user.id}`) : null;
      setFarms(cached ? JSON.parse(cached) : []);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setFarms([]);
      setSelectedFarmIdState(null);
      setLoading(false);
      return;
    }
    const farmsQuery = query(collection(db, 'farms'), where('userId', '==', user.id));
    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(farmsQuery, async (snap) => {
        if (snap.empty) {
          await refreshFarms();
          return;
        }
        const next = snap.docs.map((d) => normaliseFarm({ ...d.data(), id: d.id }));
        setFarms(next);
        if (typeof window !== 'undefined') localStorage.setItem(`agrisence_farms_cache:${user.id}`, JSON.stringify(next));
        setSelectedFarmIdState((current) => {
          const stored = Number(localStorage.getItem(SELECTED_FARM_KEY));
          if (current && next.some((f) => f.id === current)) return current;
          if (stored && next.some((f) => f.id === stored)) return stored;
          return next[0]?.id ?? null;
        });
        setLoading(false);
      }, async () => {
        await refreshFarms();
      });
    } catch {
      refreshFarms();
    }
    return () => unsubscribe();
  }, [user?.id, refreshFarms]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    void getDocs(query(collection(db, 'cropCycles'), where('userId', '==', user.id))).then((snap) => {
      if (cancelled) return;
      const cycles = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CropCycle));
      setCropCycles(cycles);
      setSelectedCropCycleIdState((current) => {
        if (current && cycles.some((cycle) => cycle.id === current)) return current;
        const stored = typeof window !== 'undefined' ? localStorage.getItem(SELECTED_CROP_CYCLE_KEY) : null;
        return stored && cycles.some((cycle) => cycle.id === stored) ? stored : cycles[0]?.id || null;
      });
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [user?.id, selectedFarmId]);

  const ensureCropCycle = useCallback(async (farm: Farm) => {
    if (!user?.id || !farm.primaryCrop) return;
    const cycleId = `${farm.id}-active`;
    await setDoc(doc(db, 'cropCycles', cycleId), {
      id: cycleId, userId: user.id, farmId: farm.id, crop: farm.primaryCrop, acreage: Number(farm.areaAcres || 0), status: 'active', updatedAt: serverTimestamp(), createdAt: serverTimestamp(),
    }, { merge: true });
  }, [user?.id]);

  const addFarm = useCallback(async (input: Partial<Farm>) => {
    if (!user?.id) throw new Error('Please sign in before adding a farm.');
    const id = Date.now();
    const farm = normaliseFarm({
      ...input,
      id,
      userId: user.id,
      name: input.name || 'New Plot',
      areaAcres: input.areaAcres || '2.0',
      primaryCrop: input.primaryCrop || 'Soybean',
      healthScore: input.healthScore ?? 0.75,
      moisturePercent: input.moisturePercent ?? 25,
      nitrogen: input.nitrogen ?? 130,
      phosphorus: input.phosphorus ?? 20,
      potassium: input.potassium ?? 250,
      phLevel: input.phLevel ?? 7,
    });
    await setDoc(doc(db, 'farms', String(id)), { ...farm, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
    await ensureCropCycle(farm);
    // Optimistically update the local authoritative context immediately. The Firestore
    // listener will reconcile this state with the persisted record afterwards.
    setFarms((prev) => [farm, ...prev.filter((item) => Number(item.id) !== Number(id))]);
    const cycle: CropCycle = {
      id: `${farm.id}-active`,
      userId: user.id,
      farmId: farm.id,
      crop: farm.primaryCrop,
      acreage: Number(farm.areaAcres || 0),
      currentStage: 'Seedling',
      irrigationType: 'Drip',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCropCycles((prev) => [cycle, ...prev.filter((item) => item.id !== cycle.id)]);
    setSelectedCropCycleId(cycle.id);
    setSelectedFarmId(id);
    return farm;
  }, [user?.id, setSelectedFarmId, ensureCropCycle]);

  const createCropCycle = useCallback(async (input: Partial<CropCycle>) => {
    if (!user?.id) throw new Error('Please sign in before creating a crop cycle.');
    const farm = farms.find((item) => Number(item.id) === Number(input.farmId ?? selectedFarmId));
    if (!farm) throw new Error('Select a farm before creating a crop cycle.');
    const id = input.id || `${farm.id}-${Date.now()}`;
    const cycle: CropCycle = {
      id, userId: user.id, farmId: farm.id, crop: input.crop || farm.primaryCrop,
      variety: input.variety, season: input.season, acreage: input.acreage ?? Number(farm.areaAcres || 0),
      sowingDate: input.sowingDate, expectedHarvestDate: input.expectedHarvestDate, currentStage: input.currentStage || 'Seedling',
      irrigationType: input.irrigationType || 'Drip', status: input.status || 'active',
      createdAt: input.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'cropCycles', id), { ...cycle, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
    setCropCycles((prev) => [cycle, ...prev.filter((item) => item.id !== id)]);
    setSelectedCropCycleId(id);
    return cycle;
  }, [user?.id, farms, selectedFarmId, setSelectedCropCycleId]);

  const updateFarm = useCallback(async (id: number, input: Partial<Farm>) => {
    if (!user?.id) throw new Error('Please sign in before editing a farm.');
    const current = farms.find((farm) => Number(farm.id) === Number(id));
    if (!current) throw new Error('The selected farm could not be found.');

    const updated = normaliseFarm({
      ...current,
      ...input,
      id: current.id,
      userId: user.id,
      createdAt: current.createdAt,
      updatedAt: Date.now(),
    });

    const persistedFarm = Object.fromEntries(
      Object.entries(updated).filter(([, value]) => value !== undefined)
    );
    await setDoc(
      doc(db, 'farms', String(id)),
      { ...persistedFarm, updatedAt: serverTimestamp() },
      { merge: true }
    );
    await ensureCropCycle(updated);
    setFarms((previous) => previous.map((farm) => Number(farm.id) === Number(id) ? updated : farm));
    window.dispatchEvent(new CustomEvent('agrisence_farm_updated', { detail: id }));
    return updated;
  }, [user?.id, farms, ensureCropCycle]);

  const deleteFarm = useCallback(async (id: number) => {
    if (!user?.id || farms.length <= 1) return;
    await deleteDoc(doc(db, 'farms', String(id)));
    if (selectedFarmId === id) {
      const next = farms.find((f) => f.id !== id);
      if (next) setSelectedFarmId(next.id);
    }
  }, [user?.id, farms, selectedFarmId, setSelectedFarmId]);

  const selectedFarm = useMemo(() => farms.find((farm) => farm.id === selectedFarmId) || farms[0] || null, [farms, selectedFarmId]);
  const selectedCropCycle = useMemo(() => cropCycles.find((cycle) => cycle.id === selectedCropCycleId) || null, [cropCycles, selectedCropCycleId]);

  return <FarmContext.Provider value={{ farms, selectedFarmId, selectedFarm, loading, error, setSelectedFarmId, addFarm, updateFarm, deleteFarm, refreshFarms, cropCycles, selectedCropCycleId, selectedCropCycle, setSelectedCropCycleId, createCropCycle }}>{children}</FarmContext.Provider>;
}

export function useFarms() {
  const context = useContext(FarmContext);
  if (!context) throw new Error('useFarms must be used within a FarmProvider');
  return context;
}
