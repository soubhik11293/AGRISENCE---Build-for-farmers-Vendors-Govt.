export interface Farm {
  id: number;
  userId?: string;
  country?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: number | string;
  updatedAt?: number | string;
  name: string;
  village: string;
  district: string;
  state: string;
  areaAcres: string;
  primaryCrop: string;
  healthScore: number;
  moisturePercent: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  phLevel: number;
  irrigationType?: string;
  soilType?: string;
  ownershipType?: string;
  notes?: string;
}

export interface CropCycle {
  id: string;
  userId: string;
  farmId: number;
  crop: string;
  variety?: string;
  season?: string;
  acreage?: number;
  sowingDate?: string;
  expectedHarvestDate?: string;
  actualHarvestDate?: string;
  currentStage?: string;
  irrigationType?: string;
  status: 'planned' | 'active' | 'harvested' | 'cancelled';
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface PestDiagnosisResult {
  id?: string;
  userId?: string;
  farmId?: number;
  cropCycleId?: string;
  detectedAt?: string;
  pestName: string;
  scientificName: string;
  confidence: number;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  affectedCrop: string;
  damagePercentage: number;
  symptoms: string[];
  biologicalTreatment: string[];
  chemicalTreatment: string[];
  preventiveMeasures: string[];
  quarantineRadiusMeters: number;
}

export interface Scheme {
  id: string;
  name: string;
  hindiName?: string;
  state: string; // 'Central' or specific Indian State / UT
  category: string;
  type: 'Central' | 'State' | 'Credit' | 'Insurance' | 'Subsidy';
  shortDescription: string;
  benefit: string;
  eligibility: string[] | string;
  officialUrl: string;
  portalName: string;
  helpline?: string;
  applicationDeadline?: string;
}

export interface MarketPrice {
  id: string;
  commodity: string;
  variety: string;
  market: string;
  district: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  changePercent: number | null;
  category: string;
  arrivalVolume?: string;
  trend?: 'up' | 'down' | 'stable';
  highestMandi?: string;
  highestMandiPrice?: number;
  arbitrageSpread?: number;
  updatedAt: string;
  source?: string;
  sourceUrl?: string;
  observedAt?: string;
  arrivalDate?: string;
  unit?: string;
  grade?: string;
  comparisonCount?: number;
  history?: PriceHistoryPoint[];
}

export interface PriceHistoryPoint {
  date: string;
  timestamp: number;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  arrivalVolume: number;
}

export interface FeatureItem {
  id: string;
  title: string;
  tagline: string;
  category: string;
  description: string;
  badge?: string;
  isFree?: boolean; // For free access without auth gate
  iconName: string;
  target: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  alternatePhone?: string;
  dob?: string; // YYYY-MM-DD format
  avatarUrl?: string; // Custom uploaded image DataURL or URL
  avatarType?: 'initials' | 'preset' | 'upload' | 'url';
  avatarColor?: string; // Gradient preset ID or color for name-based monogram
  district?: string;
  state?: string;
  village?: string;
  pincode?: string;
  role?: string;
  portalRole?: 'farmer' | 'office' | 'vendor';
  portalRoles?: Array<'farmer' | 'office' | 'vendor'>;
  accountType?: 'farmer' | 'official' | 'vendor';
  officialId?: string;
  vendorId?: string;
  isAdmin?: boolean;
  accessStatus?: 'active' | 'inactive';
  occupation?: string;
  bio?: string;
  specialization?: string;
  crops?: string[];
  primaryCrop?: string;
  acreage?: string | number;
  irrigationType?: string;
  farmerRole?: string;
  passwordChangedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthSession {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  maxTemp: number;
  minTemp: number;
  precipitationProb: number;
  weatherCode: number;
  isRain: boolean;
  et0: number;
}

export interface SprayHour {
  hour: string;
  timeLabel: string;
  status: 'Optimal' | 'Caution' | 'Prohibited';
  windSpeed: number;
  rainProb: number;
  temp: number;
  reason: string;
}

export interface WeatherData {
  locationName: string;
  elevation?: number;
  temp: number;
  apparentTemp: number;
  humidity: number;
  dewPoint: number;
  pressure: number;
  uvIndex: number;
  cloudCover: number;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  isRainingNow: boolean;
  rainAmount: number;
  rainProb: number;
  hailRisk: 'Low' | 'Moderate' | 'Severe';
  thunderstormAlert: 'None' | 'Advisory' | 'Severe Warning';
  weatherCode: number;
  // Agronomic layers
  et0: number; // mm/day
  vpd: number; // kPa
  leafWetness: 'Dry' | 'Intermittent' | 'Saturated';
  soilTempSurface: number; // 0-7cm
  soilTempDeep: number; // 7-28cm
  soilMoistureSurface: number; // %
  soilMoistureDeep: number; // %
  soilMoisture: number; // % volumetric surface water content
  advisory: string;
  sprayTimeline: SprayHour[];
  daily: DailyForecast[];
  timestamp?: number;
  source?: 'open-meteo' | 'fallback';
}

export interface OutbreakTelemetry {
  hazardLevel: 'Low' | 'Moderate' | 'Severe';
  threatTitle: string;
  threatDescription: string;
  predictedPathogens: string[];
  quarantineRadiusMeters: number;
  bioDosage: string;
  emergencySprayProtocol: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  locationName: string;
}
