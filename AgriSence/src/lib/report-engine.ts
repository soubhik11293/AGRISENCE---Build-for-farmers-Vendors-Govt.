import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { getFarmAnalytics, type ReportPeriod, type FarmAnalytics } from '@/src/lib/analytics-engine';
import { recordFarmEvent } from '@/src/lib/farm-events';

export interface FarmReport {
  id?: string;
  userId: string;
  farmId: number;
  cropCycleId?: string;
  reportType: ReportPeriod;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  analytics: FarmAnalytics;
}

export async function generateFarmReport(input: { userId: string; farmId: number; cropCycleId?: string; reportType: ReportPeriod; anchor?: Date }) {
  const analytics = await getFarmAnalytics(input.userId, input.farmId, input.reportType, input.anchor);
  const report: FarmReport = {
    userId: input.userId,
    farmId: input.farmId,
    cropCycleId: input.cropCycleId,
    reportType: input.reportType,
    periodStart: analytics.periodStart,
    periodEnd: analytics.periodEnd,
    generatedAt: new Date().toISOString(),
    analytics,
  };
  const ref = await addDoc(collection(db, 'reports'), { ...report, createdAt: serverTimestamp() });
  await recordFarmEvent({ userId: input.userId, farmId: input.farmId, cropCycleId: input.cropCycleId, type: 'REPORT_GENERATED', source: 'ReportEngine', data: { reportId: ref.id, reportType: input.reportType, periodStart: analytics.periodStart, periodEnd: analytics.periodEnd } });
  return { ...report, id: ref.id };
}


export async function generateDailyReport(userId: string, farmId: number, cropCycleId?: string, anchor?: Date) {
  return generateFarmReport({ userId, farmId, cropCycleId, reportType: 'daily', anchor });
}

export async function generateWeeklyReport(userId: string, farmId: number, cropCycleId?: string, anchor?: Date) {
  return generateFarmReport({ userId, farmId, cropCycleId, reportType: 'weekly', anchor });
}

export async function generateMonthlyReport(userId: string, farmId: number, cropCycleId?: string, anchor?: Date) {
  return generateFarmReport({ userId, farmId, cropCycleId, reportType: 'monthly', anchor });
}

export async function generateYearlyReport(userId: string, farmId: number, cropCycleId?: string, anchor?: Date) {
  return generateFarmReport({ userId, farmId, cropCycleId, reportType: 'yearly', anchor });
}
