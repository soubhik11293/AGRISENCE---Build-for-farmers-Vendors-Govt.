import type { PestDiagnosisResult } from '../types/index.js';

export const GUIDE_DESTINATIONS = [
  { route: '/', title: 'Secure portal chooser', requiresAuth: false, steps: 'Choose Office, Farmer, or Vendor/Broker access. The Farmer portal contains the existing AgriSence feature experience.' },
  { route: '/farmer', title: 'Farmer platform', requiresAuth: false, steps: 'Browse AgriSence features, simulators, weather, pest intelligence, and market tools.' },
  { route: '/scan', title: 'AI Pest Scan', requiresAuth: false, steps: 'Select Launch Neural Diagnostic Camera, then Upload File or Take Photo. Choose a clear crop or pest photo for Pest Vision AI.' },
  { route: '/outbreak-warning', title: 'Outbreak Radar', requiresAuth: false, steps: 'Review weather-based hazard estimates and the active diagnosis. These are modeled risks, not confirmed nearby outbreaks.' },
  { route: '/dashboard', title: 'Farm Command Center', requiresAuth: true, steps: 'Add or select a farm parcel, review weather and field intelligence, manage tasks, and inspect analytics. Enter your own measurements into simulators.' },
  { route: '/schemes', title: 'Government Schemes', requiresAuth: true, steps: 'Filter schemes by state and category, review eligibility, then follow the official portal link to apply.' },
  { route: '/harvest-protection', title: 'Harvest & mandi profits', requiresAuth: false, steps: 'Explore market comparisons, harvest protection and sell-versus-store planning. Market rates are a configured dataset, not a live exchange feed.' },
  { route: '/pest-soil-protection', title: 'Pest & soil protection', requiresAuth: false, steps: 'Explore pest diagnosis and soil protection tools. Advanced tools may ask you to sign in.' },
  { route: '/login', title: 'Sign in', requiresAuth: false, steps: 'Sign in to your farmer account to access saved farms and member tools.' },
  { route: '/signup', title: 'Create account', requiresAuth: false, steps: 'Create a farmer account and complete your farm profile.' },
] as const;

export interface ChatAction { label: string; route: string; reason?: string }
export interface ChatTurn { sender: 'user' | 'assistant'; text: string }
export interface ChatReply { reply: string; actions: ChatAction[]; modelUsed: string }

export function isGuideRoute(route: unknown): route is string {
  return typeof route === 'string' && GUIDE_DESTINATIONS.some((item) => item.route === route);
}

export function validateChatActions(value: unknown): ChatAction[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.filter((item) => {
    if (!item || typeof item.label !== 'string' || !item.label.trim() || !isGuideRoute(item.route) || seen.has(item.route)) return false;
    seen.add(item.route);
    return true;
  }).slice(0, 3).map((item) => ({
    label: item.label.trim().slice(0, 80), route: item.route,
    ...(typeof item.reason === 'string' ? { reason: item.reason.trim().slice(0, 160) } : {}),
  }));
}

export type VisionDiagnosis = (PestDiagnosisResult & { isInvalidPhoto: false }) | { isInvalidPhoto: true; errorMessage: string };

/** Reject incomplete model output instead of inventing damage, confidence or remedies. */
export function validateVisionDiagnosis(value: unknown): VisionDiagnosis {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Incomplete vision response.');
  const row = value as Record<string, unknown>;
  if (row.isInvalidPhoto === true) {
    if (typeof row.errorMessage !== 'string' || !row.errorMessage.trim()) throw new Error('Missing image feedback.');
    return { isInvalidPhoto: true, errorMessage: row.errorMessage.trim().slice(0, 800) };
  }
  if (row.isInvalidPhoto !== false) throw new Error('Missing image classification.');
  for (const field of ['pestName', 'scientificName', 'affectedCrop']) {
    if (typeof row[field] !== 'string' || !(row[field] as string).trim()) throw new Error(`Missing ${field}.`);
  }
  for (const field of ['confidence', 'damagePercentage']) {
    if (typeof row[field] !== 'number' || !Number.isFinite(row[field]) || row[field] < 0 || row[field] > 100) throw new Error(`Invalid ${field}.`);
  }
  if (!['Mild', 'Moderate', 'Severe', 'Critical'].includes(String(row.severity))) throw new Error('Invalid severity.');
  if (typeof row.quarantineRadiusMeters !== 'number' || !Number.isFinite(row.quarantineRadiusMeters) || row.quarantineRadiusMeters < 0) throw new Error('Invalid inspection radius.');
  for (const field of ['symptoms', 'biologicalTreatment', 'chemicalTreatment', 'preventiveMeasures']) {
    if (!Array.isArray(row[field]) || !row[field].every((item) => typeof item === 'string' && item.trim())) throw new Error(`Invalid ${field}.`);
  }
  return {
    isInvalidPhoto: false,
    pestName: row.pestName as string, scientificName: row.scientificName as string,
    affectedCrop: row.affectedCrop as string, confidence: row.confidence as number,
    severity: row.severity as PestDiagnosisResult['severity'], damagePercentage: row.damagePercentage as number,
    symptoms: row.symptoms as string[], biologicalTreatment: row.biologicalTreatment as string[],
    chemicalTreatment: row.chemicalTreatment as string[], preventiveMeasures: row.preventiveMeasures as string[],
    quarantineRadiusMeters: row.quarantineRadiusMeters,
  };
}
