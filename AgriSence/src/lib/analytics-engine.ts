import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface FarmAnalytics {
  period: ReportPeriod;
  periodStart: string;
  periodEnd: string;
  eventCount: number;
  diagnosisCount: number;
  severeDiagnosisCount: number;
  irrigationCount: number;
  waterApplied: number;
  simulationCount: number;
  taskCompletedCount: number;
  taskCreatedCount: number;
  marketObservationCount: number;
  weatherObservationCount: number;
  soilTestCount: number;
  outbreakCount: number;
  recommendationCount: number;
  sprayApplicationCount: number;
  fertilizerApplicationCount: number;
  harvestCount: number;
  saleCount: number;
  expenseTotal: number;
  revenueTotal: number;
  netAmount: number;
  dataCompleteness: number;
  uniqueSources: number;
}

function periodBounds(period: ReportPeriod, anchor = new Date()) {
  const end = new Date(anchor);
  const start = new Date(anchor);
  if (period === 'daily') start.setHours(0, 0, 0, 0);
  if (period === 'weekly') {
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
  }
  if (period === 'monthly') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  if (period === 'yearly') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }
  return { start, end };
}

export async function getFarmAnalytics(userId: string, farmId: number, period: ReportPeriod, anchor = new Date()): Promise<FarmAnalytics> {
  const { start, end } = periodBounds(period, anchor);
  const snap = await getDocs(query(collection(db, 'farmEvents'), where('userId', '==', userId)));
  const events = snap.docs.map((d) => d.data()).filter((event: any) => {
    if (Number(event.farmId) !== Number(farmId)) return false;
    const timestamp = event.timestamp?.toMillis?.() ?? new Date(event.timestamp || event.createdAt || 0).getTime();
    return timestamp >= start.getTime() && timestamp <= end.getTime();
  });

  let severeDiagnosisCount = 0;
  let waterApplied = 0;
  let expenseTotal = 0;
  let revenueTotal = 0;
  let diagnosisCount = 0;
  let irrigationCount = 0;
  let simulationCount = 0;
  let taskCompletedCount = 0;
  let taskCreatedCount = 0;
  let marketObservationCount = 0;
  let weatherObservationCount = 0;
  let soilTestCount = 0;
  let outbreakCount = 0;
  let recommendationCount = 0;
  let sprayApplicationCount = 0;
  let fertilizerApplicationCount = 0;
  let harvestCount = 0;
  let saleCount = 0;

  for (const event of events as any[]) {
    const data = event.data || {};
    if (event.type === 'PEST_DIAGNOSIS' || event.type === 'DISEASE_DIAGNOSIS') {
      diagnosisCount++;
      if (['Severe', 'Critical'].includes(String(data.severity))) severeDiagnosisCount++;
    }
    if (event.type === 'IRRIGATION') {
      irrigationCount++;
      waterApplied += Number(data.waterApplied || 0);
    }
    if (event.type === 'SIMULATION') simulationCount++;
    if (event.type === 'TASK_CREATED' || event.type === 'TASK') taskCreatedCount++;
    if (event.type === 'TASK_COMPLETED') taskCompletedCount++;
    if (event.type === 'MARKET_PRICE') marketObservationCount++;
    if (event.type === 'WEATHER_OBSERVATION') weatherObservationCount++;
    if (event.type === 'SOIL_TEST') soilTestCount++;
    if (event.type === 'OUTBREAK_ALERT') outbreakCount++;
    if (event.type === 'RECOMMENDATION') recommendationCount++;
    if (event.type === 'SPRAY_APPLICATION') sprayApplicationCount++;
    if (event.type === 'FERTILIZER_APPLICATION') fertilizerApplicationCount++;
    if (event.type === 'HARVEST') harvestCount++;
    if (event.type === 'SALE') saleCount++;
    if (event.type === 'EXPENSE') expenseTotal += Number(data.amount || data.total || 0);
    if (event.type === 'REVENUE' || event.type === 'SALE') revenueTotal += Number(data.amount || data.total || 0);
  }

  const sources = new Set(events.map((e: any) => e.source).filter(Boolean));
  const completeness = Math.min(100, Math.round((new Set(events.map((e: any) => e.type)).size / 18) * 100));
  return {
    period,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    eventCount: events.length,
    diagnosisCount,
    severeDiagnosisCount,
    irrigationCount,
    waterApplied,
    simulationCount,
    taskCompletedCount,
    taskCreatedCount,
    marketObservationCount,
    weatherObservationCount,
    soilTestCount,
    outbreakCount,
    recommendationCount,
    sprayApplicationCount,
    fertilizerApplicationCount,
    harvestCount,
    saleCount,
    expenseTotal,
    revenueTotal,
    netAmount: revenueTotal - expenseTotal,
    dataCompleteness: completeness,
    uniqueSources: sources.size,
  };
}
