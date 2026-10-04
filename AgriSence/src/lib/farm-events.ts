import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

export type FarmEventType =
  | 'WEATHER_OBSERVATION' | 'SOIL_TEST' | 'SATELLITE_OBSERVATION' | 'SENSOR_OBSERVATION'
  | 'PEST_DIAGNOSIS' | 'DISEASE_DIAGNOSIS' | 'OUTBREAK_ALERT' | 'RECOMMENDATION'
  | 'TASK_CREATED' | 'TASK_COMPLETED' | 'TASK_CANCELLED' | 'IRRIGATION'
  | 'FERTILIZER_APPLICATION' | 'SPRAY_APPLICATION' | 'BIOCONTROL_APPLICATION'
  | 'CROP_STAGE_UPDATE' | 'MARKET_PRICE' | 'HARVEST' | 'SALE' | 'EXPENSE'
  | 'REVENUE' | 'MARKET_PURCHASE' | 'SIMULATION' | 'REPORT_GENERATED';

export async function recordFarmEvent(input: {
  userId: string;
  farmId?: number;
  cropCycleId?: string;
  type: FarmEventType;
  source?: string;
  data?: Record<string, unknown>;
}) {
  const ref = await addDoc(collection(db, 'farmEvents'), {
    ...input,
    timestamp: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('agrisence_farm_event_recorded', { detail: { ...input, id: ref.id } }));
  }
  return ref;
}
