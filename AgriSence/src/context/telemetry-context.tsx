import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { WeatherData, DailyForecast, SprayHour, OutbreakTelemetry, MarketPrice } from '@/src/types';
import { PAN_INDIA_COMMODITIES } from '@/src/lib/data/market';
import { isFreshQuote, isSourcedQuote, mergeObservedHistory, QUOTE_MAX_AGE_DAYS, withComparableSpreads } from '@/src/lib/mandi-quotes';

const REFERENCE_MARKET_SOURCE = 'AgriSence reference mandi catalog (not live)';

function getReferenceMarketData(): MarketPrice[] {
  return withComparableSpreads(PAN_INDIA_COMMODITIES.map((item) => ({
    ...item,
    source: REFERENCE_MARKET_SOURCE,
    sourceUrl: 'local-reference-catalog',
    observedAt: item.updatedAt || item.arrivalDate || undefined,
    arrivalDate: item.arrivalDate || item.updatedAt || undefined,
    unit: 'quintal',
    grade: item.variety,
    changePercent: item.changePercent ?? 0,
  })));
}
import { useDiagnosis } from '@/src/context/diagnosis-context';
import { useFarms } from '@/src/context/farm-context';
import { useAuth } from '@/src/context/auth-context';
import { recordFarmEvent } from '@/src/lib/farm-events';

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(input, { ...init, signal: controller.signal }); }
  finally { window.clearTimeout(timer); }
}

export const WEATHER_CACHE_KEY = 'agrisence_weather_cache';
export const MARKET_CACHE_KEY = 'agrisence_market_cache';
const WEATHER_TTL_MS = 15 * 60 * 1000; // 15 Minutes TTL

const defaultSprayTimeline: SprayHour[] = [
  { hour: '06:00', timeLabel: '06 AM', status: 'Optimal', windSpeed: 6, rainProb: 5, temp: 22, reason: 'Calm winds (<12 km/h), zero drift risk, low evaporation' },
  { hour: '08:00', timeLabel: '08 AM', status: 'Optimal', windSpeed: 8, rainProb: 10, temp: 25, reason: 'Ideal foliar absorption, open stomata' },
  { hour: '10:00', timeLabel: '10 AM', status: 'Optimal', windSpeed: 11, rainProb: 15, temp: 28, reason: 'Standard knapsack & boom spray window' },
  { hour: '12:00', timeLabel: '12 PM', status: 'Caution', windSpeed: 15, rainProb: 20, temp: 32, reason: 'High heat & VPD acceleration increases droplet vaporization' },
  { hour: '14:00', timeLabel: '02 PM', status: 'Prohibited', windSpeed: 21, rainProb: 25, temp: 34, reason: 'Wind gusts > 18 km/h cause extreme drift damage' },
  { hour: '16:00', timeLabel: '04 PM', status: 'Caution', windSpeed: 16, rainProb: 30, temp: 31, reason: 'Gusts subsiding, wait for thermal inversion' },
  { hour: '18:00', timeLabel: '06 PM', status: 'Optimal', windSpeed: 9, rainProb: 15, temp: 27, reason: 'Excellent dusk window for bio-pesticides & Bt sprays' },
  { hour: '20:00', timeLabel: '08 PM', status: 'Optimal', windSpeed: 7, rainProb: 10, temp: 25, reason: 'Minimal nocturnal drift, good dew settlement' },
];

const fallbackDaily: DailyForecast[] = Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index);
  return { date: date.toISOString().slice(0, 10), dayName: index === 0 ? 'Today' : date.toLocaleDateString('en-IN', { weekday: 'short' }), maxTemp: 0, minTemp: 0, precipitationProb: 0, weatherCode: 0, isRain: false, et0: 0 };
});

const initialWeatherData: WeatherData = {
  locationName: 'Pune, Maharashtra',
  elevation: 560,
  temp: 29,
  apparentTemp: 31,
  humidity: 62,
  dewPoint: 20.8,
  pressure: 1012,
  uvIndex: 7.4,
  cloudCover: 28,
  windSpeed: 12,
  windGust: 18,
  windDirection: 140,
  isRainingNow: false,
  rainAmount: 0,
  rainProb: 15,
  hailRisk: 'Low',
  thunderstormAlert: 'None',
  weatherCode: 1,
  et0: 4.8,
  vpd: 1.42,
  leafWetness: 'Dry',
  soilTempSurface: 27.2,
  soilTempDeep: 25.8,
  soilMoistureSurface: 28.4,
  soilMoistureDeep: 32.1,
  soilMoisture: 28.4,
  advisory: 'Optimal weather for foliar nutrient sprays, bio-control release, and soil fertilization.',
  sprayTimeline: defaultSprayTimeline,
  daily: fallbackDaily,
  timestamp: Date.now(),
  source: 'fallback',
};

interface TelemetryContextType {
  // Weather
  weatherData: WeatherData;
  isWeatherLoading: boolean;
  weatherError: string | null;
  gpsNotice: string | null;
  setGpsNotice: (msg: string | null) => void;
  fetchWeather: (query: string) => Promise<void>;
  syncDeviceGPS: (isAutoPrompt?: boolean) => Promise<{ success: boolean; locationName?: string; message?: string }>;
  refreshWeather: () => Promise<void>;
  sprayStatusForNow: 'Optimal' | 'Caution' | 'Prohibited';

  // Outbreak
  outbreakData: OutbreakTelemetry;

  // Market Mandi
  marketData: MarketPrice[];
  isMarketLoading: boolean;
  lastMarketUpdate: string;
  refreshMarketData: () => Promise<void>;
  activeArbitrageTopSpread: MarketPrice | null;
  rotatingMarketItem: MarketPrice | null;
  isMarketOpen: boolean;
  marketStatusText: string;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const { activeDiagnosis } = useDiagnosis();
  const { selectedFarm, selectedFarmId, selectedCropCycleId } = useFarms();
  const { user } = useAuth();
  const hasAutoPromptedGpsRef = useRef(false);

  // 1. WEATHER STATE
  const [weatherData, setWeatherData] = useState<WeatherData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(WEATHER_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - (parsed.timestamp || 0) < WEATHER_TTL_MS) {
            return parsed;
          }
        }
      } catch {
        // fallback
      }
    }
    return initialWeatherData;
  });

  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  // 2. MARKET STATE
  const [marketData, setMarketData] = useState<MarketPrice[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(MARKET_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isSourcedQuote)) {
            return withComparableSpreads(parsed.filter((item): item is MarketPrice => isFreshQuote(item)));
          }
          // Remove outdated configured/static market cache.
          localStorage.removeItem(MARKET_CACHE_KEY);
        }
      } catch {
        // fallback
      }
    }
    return getReferenceMarketData();
  });

  const [isMarketLoading, setIsMarketLoading] = useState(false);
  const [lastMarketUpdate, setLastMarketUpdate] = useState<string>('Reference mandi catalog loaded; configure a live feed for current prices');

  // Compute Current Spray Status
  const sprayStatusForNow = useMemo(() => {
    const currentWind = weatherData.windSpeed;
    const currentRainProb = weatherData.rainProb;
    const currentTemp = weatherData.temp;
    if (currentWind > 18 || currentRainProb > 50 || weatherData.isRainingNow) {
      return 'Prohibited';
    }
    if (currentWind > 12 || currentTemp > 33 || currentRainProb > 30) {
      return 'Caution';
    }
    return 'Optimal';
  }, [weatherData]);

  // Compute Outbreak Telemetry Dynamically based on Microclimate + Diagnosis
  const outbreakData = useMemo<OutbreakTelemetry>(() => {
    const temp = weatherData.temp;
    const rh = weatherData.humidity;
    const wind = weatherData.windSpeed;

    let hazardLevel: 'Low' | 'Moderate' | 'Severe' = 'Low';
    let threatTitle = 'Optimal Microclimate • Low Spore Dispersal & Pest Activity';
    let threatDescription = `Dry canopy microclimate (${rh}% RH, ${temp}°C). Thermal accumulation and humidity are below fungal spore germination and insect swarm propagation thresholds.`;
    let predictedPathogens = ['Sporadic Thrips', 'Minor Leaf Webber'];
    let quarantineRadiusMeters = 50;
    let bioDosage = 'Preventive foliar neem spray (1,500 ppm) @ 2 ml/L once every 14 days.';
    let emergencySprayProtocol = 'Maintain soil mulch. Routine field scouting along leeward bunds.';

    // Algorithmic Hazard Calculation per strict requirements:
    if (rh >= 75 && temp >= 24 && temp <= 34) {
      hazardLevel = 'Severe';
      threatTitle = 'Severe Outbreak Alert: Fungal Blast & Spodoptera Hatching Triggered';
      threatDescription = `Critical microclimate condition: High relative humidity (${rh}%) and warm canopy (${temp}°C) create peak saturation for blast sporulation, sheath blight, and Fall Armyworm / bollworm oviposition.`;
      predictedPathogens = [
        'Fall Armyworm (Spodoptera frugiperda)',
        'Rice / Millet Blast (Magnaporthe oryzae)',
        'Early Blight (Alternaria solani)',
        'Pink Bollworm (Pectinophora gossypiella)',
      ];
      quarantineRadiusMeters = 250;
      bioDosage = 'Bacillus thuringiensis (Bt kurstaki) @ 2.5 g/L + 5% NSKE directly on vegetative whorls.';
      emergencySprayProtocol = 'Deploy 5 pheromone delta traps per acre immediately. Restrict movement across infested parcel perimeter.';
    } else if (rh >= 60 || temp >= 32) {
      hazardLevel = 'Moderate';
      threatTitle = 'Moderate Hazard: Sucking Pest Vector Multiplication Active';
      threatDescription = `Elevated thermal indices (${temp}°C) and ambient humidity (${rh}%) accelerating nymph hatching cycles and vector transmission for thrips, whiteflies, and aphids.`;
      predictedPathogens = [
        'Chilli & Cotton Thrips (Scirtothrips dorsalis)',
        'Whitefly (Bemisia tabaci)',
        'Cowpea & Mustard Aphids (Aphis craccivora)',
        'Powdery Mildew (Erysiphe)',
      ];
      quarantineRadiusMeters = 120;
      bioDosage = 'Verticillium lecanii @ 5 g/L or cold-pressed neem oil (10,000 ppm) @ 3 ml/L with soap emulsion.';
      emergencySprayProtocol = 'Install yellow sticky traps @ 10/acre and blue sticky traps @ 6/acre. Inspect leaf abaxial surfaces.';
    }

    if (activeDiagnosis) {
      if (activeDiagnosis.severity === 'Critical' || activeDiagnosis.severity === 'Severe') {
        hazardLevel = 'Severe';
      } else if (activeDiagnosis.severity === 'Moderate') {
        hazardLevel = 'Moderate';
      }

      threatTitle = `Field Scanner Confirmed: ${activeDiagnosis.pestName} (${activeDiagnosis.scientificName})`;
      threatDescription = `Scanned on ${activeDiagnosis.affectedCrop} with ${activeDiagnosis.damagePercentage}% foliar damage (${activeDiagnosis.confidence}% AI confidence). Verified symptoms: ${activeDiagnosis.symptoms.slice(0, 2).join('. ')}.`;
      if (!predictedPathogens.includes(activeDiagnosis.pestName)) {
        predictedPathogens = [activeDiagnosis.pestName, ...predictedPathogens];
      }
      quarantineRadiusMeters = Math.max(quarantineRadiusMeters, activeDiagnosis.quarantineRadiusMeters || 150);
      if (activeDiagnosis.biologicalTreatment && activeDiagnosis.biologicalTreatment.length > 0) {
        bioDosage = activeDiagnosis.biologicalTreatment[0];
      }
      if (activeDiagnosis.chemicalTreatment && activeDiagnosis.chemicalTreatment.length > 0) {
        emergencySprayProtocol = `Emergency protocol: ${activeDiagnosis.chemicalTreatment[0]}. Inspect within ${quarantineRadiusMeters}m perimeter.`;
      }
    }

    return {
      hazardLevel,
      threatTitle,
      threatDescription,
      predictedPathogens,
      quarantineRadiusMeters,
      bioDosage,
      emergencySprayProtocol,
      temperature: temp,
      humidity: rh,
      windSpeed: wind,
      locationName: weatherData.locationName || 'All-India Agro-Zone',
    };
  }, [weatherData, activeDiagnosis]);

  // Compute Live APMC Trading Status based on Indian Standard Time (IST = UTC+5:30)
  // Market Open: Monday through Saturday, between 06:00 AM and 05:00 PM IST
  // Market Closed: Sundays, or before 06:00 AM / after 05:00 PM IST
  const { isMarketOpen, marketStatusText } = useMemo(() => {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(utcMs + istOffsetMs);

    const istDay = istDate.getDay(); // 0 is Sun, 1 is Mon, ..., 6 is Sat
    const istHour = istDate.getHours();
    const istMinute = istDate.getMinutes();
    const istTimeDecimal = istHour + istMinute / 60;

    const isWorkingDay = istDay >= 1 && istDay <= 6;
    const isWithinHours = istTimeDecimal >= 6.0 && istTimeDecimal < 17.0;
    const open = isWorkingDay && isWithinHours;

    let statusText = 'Closed (Last Settlement)';
    if (open) {
      statusText = 'Market Open';
    } else if (istDay === 0) {
      statusText = 'Closed (Sunday Holiday)';
    } else if (istTimeDecimal < 6.0) {
      statusText = 'Closed (Opens 06:00 AM IST)';
    } else {
      statusText = 'Closed (Settled 05:00 PM IST)';
    }

    return {
      isMarketOpen: open,
      marketStatusText: statusText,
    };
  }, []);

  // Internal helper to parse Open-Meteo response into WeatherData
  const parseOpenMeteoResponse = (data: any, locationTitle: string): WeatherData => {
    const currentRain = (data.current?.precipitation || 0) > 0;
    const currentRainAmt = data.current?.precipitation || 0;
    const currentHourIndex = new Date().getHours();

    const dailyArr: DailyForecast[] = (data.daily?.time || []).slice(0, 7).map((d: string, idx: number) => {
      const dateObj = new Date(d);
      const dayName = idx === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const code = data.daily.weathercode?.[idx] ?? data.daily.weather_code?.[idx] ?? 0;
      const prob = data.daily.precipitation_probability_max?.[idx] || 0;
      const et0Val = data.daily.et0_fao_evapotranspiration?.[idx] ?? 4.8;
      return {
        date: d,
        dayName,
        maxTemp: Math.round(data.daily.temperature_2m_max?.[idx] || 30),
        minTemp: Math.round(data.daily.temperature_2m_min?.[idx] || 20),
        precipitationProb: prob,
        weatherCode: code,
        isRain: prob > 40 || code >= 51,
        et0: Number(et0Val.toFixed(1)),
      };
    });

    const sprayTimeline: SprayHour[] = [6, 8, 10, 12, 14, 16, 18, 20].map((hour) => {
      const wSpeed = Math.round(data.hourly?.windspeed_10m?.[hour] ?? data.hourly?.wind_speed_10m?.[hour] ?? 10);
      const rProb = Math.round(data.hourly?.precipitation_probability?.[hour] ?? 10);
      const tVal = Math.round(data.hourly?.temperature_2m?.[hour] ?? 28);
      const vpdVal = data.hourly?.vapour_pressure_deficit?.[hour] ?? 1.2;

      let status: 'Optimal' | 'Caution' | 'Prohibited' = 'Optimal';
      let reason = 'Ideal wind (<12 km/h) & low VPD for optimal foliar deposition.';

      if (wSpeed > 18 || rProb > 50) {
        status = 'Prohibited';
        reason = wSpeed > 18 ? 'High drift danger (winds > 18 km/h)' : 'Rain imminent: wash-off guaranteed';
      } else if (wSpeed > 12 || tVal > 33 || rProb > 30 || vpdVal > 2.0) {
        status = 'Caution';
        reason = tVal > 33 ? 'Droplet volatilization risk in high heat' : 'Moderate drift risk (winds 12-18 km/h)';
      }

      const label = hour < 12 ? `${hour.toString().padStart(2, '0')} AM` : hour === 12 ? '12 PM' : `${(hour - 12).toString().padStart(2, '0')} PM`;
      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        timeLabel: label,
        status,
        windSpeed: wSpeed,
        rainProb: rProb,
        temp: tVal,
        reason,
      };
    });

    const currTemp = Math.round(data.current?.temperature_2m ?? 29);
    const currRh = Math.round(data.current?.relative_humidity_2m ?? 62);
    const dewPt = data.hourly?.dewpoint_2m?.[currentHourIndex] ?? data.hourly?.dew_point_2m?.[currentHourIndex] ?? 20.5;
    const vpdVal = data.hourly?.vapour_pressure_deficit?.[currentHourIndex] ?? 1.35;
    const soilT0 = data.hourly?.soil_temperature_0_to_7cm?.[currentHourIndex] ?? 26.5;
    const soilT7 = data.hourly?.soil_temperature_7_to_28cm?.[currentHourIndex] ?? 25.0;
    const soilM0 = Math.round((data.hourly?.soil_moisture_0_to_7cm?.[currentHourIndex] ?? 0.28) * 100);
    const soilM7 = Math.round((data.hourly?.soil_moisture_7_to_28cm?.[currentHourIndex] ?? 0.32) * 100);
    const uv = data.hourly?.uv_index?.[currentHourIndex] ?? 6.8;

    const windSpd = Math.round(data.current?.windspeed_10m ?? data.current?.wind_speed_10m ?? 12);
    const windGst = Math.round(data.current?.windgusts_10m ?? data.current?.wind_gusts_10m ?? windSpd * 1.35);
    const windDir = Math.round(data.current?.winddirection_10m ?? data.current?.wind_direction_10m ?? 140);

    const dewPointDepression = currTemp - dewPt;
    let leafWetnessState: 'Dry' | 'Intermittent' | 'Saturated' = 'Dry';
    if (currentRain || (currRh > 80 && dewPointDepression < 1.5)) {
      leafWetnessState = 'Saturated';
    } else if (currRh > 70 || dewPointDepression < 3.0) {
      leafWetnessState = 'Intermittent';
    }

    const rainProbability = dailyArr[0]?.precipitationProb || 0;
    let advisory = 'Optimal conditions for intercultural field operations, fertigation, and bio-sprays.';
    if (currentRain || rainProbability >= 60) {
      advisory = 'Rain imminent or occurring. Halt foliar sprays and nitrogen fertilization immediately.';
    } else if (windSpd > 18) {
      advisory = 'High wind velocity (>18 km/h). Avoid drone or knapsack spraying to prevent hazardous drift.';
    } else if (currTemp > 35) {
      advisory = 'Extreme daytime heat stress. Irrigate during twilight hours to reduce rapid evaporation.';
    }

    return {
      locationName: locationTitle,
      elevation: Math.round(data.elevation || 500),
      temp: currTemp,
      apparentTemp: Math.round(data.current?.apparent_temperature || currTemp),
      humidity: currRh,
      dewPoint: Number(dewPt.toFixed(1)),
      pressure: Math.round(data.current?.surface_pressure || data.current?.pressure_msl || 1012),
      uvIndex: Number(uv.toFixed(1)),
      cloudCover: Math.round(data.hourly?.cloudcover?.[currentHourIndex] ?? 30),
      windSpeed: windSpd,
      windGust: windGst,
      windDirection: windDir,
      isRainingNow: currentRain,
      rainAmount: currentRainAmt,
      rainProb: rainProbability,
      hailRisk: rainProbability > 70 && windSpd > 25 ? 'Moderate' : 'Low',
      thunderstormAlert: (data.current?.weathercode ?? data.current?.weather_code ?? 0) >= 95 ? 'Severe Warning' : 'None',
      weatherCode: data.current?.weathercode ?? data.current?.weather_code ?? 0,
      et0: dailyArr[0]?.et0 ?? 4.8,
      vpd: Number(vpdVal.toFixed(2)),
      leafWetness: leafWetnessState,
      soilTempSurface: Number(soilT0.toFixed(1)),
      soilTempDeep: Number(soilT7.toFixed(1)),
      soilMoistureSurface: soilM0,
      soilMoistureDeep: soilM7,
      soilMoisture: soilM0,
      advisory,
      sprayTimeline,
      daily: dailyArr,
      timestamp: Date.now(),
      source: 'open-meteo',
    };
  };

  // Fetch Weather by direct Lat/Long coordinates
  const fetchWeatherByCoords = useCallback(async (lat: number, lon: number, locationTitle: string) => {
    setIsWeatherLoading(true);
    setWeatherError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,dewpoint_2m,apparent_temperature,precipitation_probability,precipitation,weathercode,pressure_msl,surface_pressure,cloudcover,visibility,evapotranspiration,et0_fao_evapotranspiration,vapour_pressure_deficit,windspeed_10m,winddirection_10m,windgusts_10m,soil_temperature_0_to_7cm,soil_temperature_7_to_28cm,soil_moisture_0_to_7cm,soil_moisture_7_to_28cm,uv_index&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,et0_fao_evapotranspiration&timezone=auto`;
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        throw new Error(`Open-Meteo returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.current && data.daily) {
        const parsed = parseOpenMeteoResponse(data, locationTitle);
        setWeatherData(parsed);
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(parsed));
        if (user?.id && selectedFarmId) void recordFarmEvent({ userId: user.id, farmId: selectedFarmId, cropCycleId: selectedCropCycleId || undefined, type: 'WEATHER_OBSERVATION', source: 'open-meteo', data: { locationName: parsed.locationName, temp: parsed.temp, humidity: parsed.humidity, windSpeed: parsed.windSpeed, rainProb: parsed.rainProb, et0: parsed.et0, vpd: parsed.vpd, timestamp: parsed.timestamp } });
      } else {
        throw new Error('Open-Meteo returned an incomplete forecast.');
      }
    } catch {
      setWeatherError('Network error connecting to Open-Meteo telemetry. Reverting to cached sensor data.');
    } finally {
      setIsWeatherLoading(false);
    }
  }, [user?.id, selectedFarmId, selectedCropCycleId]);

  // Fetch Weather by Name search (e.g., "Pune", "Nashik", "Latur")
  const fetchWeather = useCallback(async (cityName: string) => {
    setIsWeatherLoading(true);
    setWeatherError(null);
    setGpsNotice(null);
    try {
      const geoRes = await fetchWithTimeout(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          cityName.trim()
        )}&count=1&language=en&format=json`
      );
      if (!geoRes.ok) {
        throw new Error(`Open-Meteo geocoding returned HTTP ${geoRes.status}`);
      }
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        setWeatherError(`Could not find "${cityName}". Please try a nearby taluka, district, or state.`);
        setIsWeatherLoading(false);
        return;
      }

      const place = geoData.results[0];
      const lat = place.latitude;
      const lon = place.longitude;
      const fullName = `${place.name}${place.admin1 ? `, ${place.admin1}` : ''}${
        place.country ? `, ${place.country}` : ''
      }`;

      await fetchWeatherByCoords(lat, lon, fullName);
    } catch {
      setWeatherError('Network error connecting to Open-Meteo telemetry. Reverting to cached sensor data.');
      setIsWeatherLoading(false);
    }
  }, [fetchWeatherByCoords]);

  // Sync Device GPS with proactive two-tier geolocation (GPS -> IP Geocoding -> Fallback Hub)
  const syncDeviceGPS = useCallback(async (_isAutoPrompt = false): Promise<{ success: boolean; locationName?: string; message?: string }> => {
    const runIpGeocodingFallback = async (reasonMsg: string): Promise<{ success: boolean; locationName?: string; message?: string }> => {
      try {
        let ipData: any = null;
        const res = await fetchWithTimeout('https://ipapi.co/json/').catch(() => null);
        if (res && res.ok) {
          ipData = await res.json().catch(() => null);
        }
        if (!ipData || !ipData.latitude) {
          const res2 = await fetchWithTimeout('https://ipwho.is/').catch(() => null);
          if (res2 && res2.ok) {
            ipData = await res2.json().catch(() => null);
          }
        }

        if (ipData && (ipData.latitude || ipData.lat)) {
          const lat = ipData.latitude || ipData.lat;
          const lon = ipData.longitude || ipData.lon;
          const city = ipData.city || ipData.region || 'Regional Hub';
          const region = ipData.region || ipData.region_name || ipData.country_name || 'India';
          const postal = ipData.postal || ipData.postal_code || '';
          const locationTitle = `${city}, ${region}`;

          setGpsNotice(null);
          setWeatherError(null);
          await fetchWeatherByCoords(lat, lon, locationTitle);
          return { success: true, locationName: locationTitle, message: postal ? `Auto-synced: ${city} (${postal})` : 'Auto-synced via precision IP geocoding' };
        }
      } catch (ipErr) {
        console.warn('IP geocoding fallback warning:', ipErr);
      }

      // Default hub if offline or IP lookup fails
      setGpsNotice(null);
      setWeatherError(null);
      if (!weatherData.locationName || weatherData.locationName === 'Pune, Maharashtra') {
        await fetchWeather('Pune, Maharashtra');
      }
      return { success: false, message: reasonMsg };
    };

    if (typeof window === 'undefined' || !navigator.geolocation) {
      return runIpGeocodingFallback('Geolocation not supported');
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          let locationTitle = `GPS (${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E)`;

          // Reverse geocode to find village/taluka/district
          try {
            const revRes = await fetchWithTimeout(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
            );
            if (revRes.ok) {
              const revData = await revRes.json();
              const locality = revData.locality || revData.city || revData.principalSubdivision;
              const state = revData.principalSubdivision;
              if (locality && state) {
                locationTitle = `${locality}, ${state}`;
              } else if (state) {
                locationTitle = `${state}, India`;
              }
            }
          } catch {
            // Keep coordinates if reverse geocoding is unavailable
          }

          setGpsNotice(null);
          await fetchWeatherByCoords(lat, lon, locationTitle);
          resolve({ success: true, locationName: locationTitle });
        },
        async (error) => {
          // If GPS fails, times out, or permission denied in iframe:
          // Immediately execute automatic IP-Geolocator fallback silently
          const result = await runIpGeocodingFallback(error.message || 'GPS permission blocked');
          resolve(result);
        },
        { timeout: 3500, enableHighAccuracy: true, maximumAge: 60000 }
      );
    });
  }, [fetchWeather, fetchWeatherByCoords, weatherData.locationName]);

  const refreshWeather = useCallback(async () => {
    if (selectedFarm && typeof selectedFarm.latitude === 'number' && typeof selectedFarm.longitude === 'number') {
      await fetchWeatherByCoords(
        selectedFarm.latitude,
        selectedFarm.longitude,
        `${selectedFarm.village || selectedFarm.name}${selectedFarm.district ? `, ${selectedFarm.district}` : ''}`
      );
      return;
    }
    await fetchWeather(weatherData.locationName || 'Pune');
  }, [fetchWeather, fetchWeatherByCoords, selectedFarm, weatherData.locationName]);

  // Refresh Market Data & Arbitrage Calculation
  const refreshMarketData = useCallback(async () => {
    setIsMarketLoading(true);
    try {
      const res = await fetchWithTimeout('/api/market-prices');
      if (res.ok) {
        const json = await res.json();
        if (json.prices && Array.isArray(json.prices) && json.prices.length > 0) {
          const sourced: MarketPrice[] = json.prices.filter((item: unknown): item is MarketPrice => isSourcedQuote(item));
          const fresh = sourced.filter((item) => isFreshQuote(item));
          if (fresh.length === 0) throw new Error(`No mandi quotes within ${QUOTE_MAX_AGE_DAYS} days.`);
          const observed = mergeObservedHistory(withComparableSpreads(fresh), marketData);
          setMarketData(observed);
          localStorage.setItem(MARKET_CACHE_KEY, JSON.stringify(observed));
          if (user?.id && selectedFarmId) void recordFarmEvent({ userId: user.id, farmId: selectedFarmId, cropCycleId: selectedCropCycleId || undefined, type: 'MARKET_PRICE', source: json.sourceType || 'market-api', data: { prices: observed.slice(0, 20), timestamp: Date.now(), source: json.source } });
          const sourceLabel = String(json.source || 'Live mandi feed');
          setLastMarketUpdate(`${sourceLabel} • observed ${new Date(json.observedAt || Date.now()).toLocaleString('en-IN')}`);
          setIsMarketLoading(false);
          return;
        }
      }
    } catch {
      // Keep the last successful observed quotes, but never manufacture a new quote.
    }

    setMarketData((current) => current.length > 0 ? current : getReferenceMarketData());
    setLastMarketUpdate(marketData.length > 0
      ? 'Live mandi refresh unavailable; showing the last successful observed quotes.'
      : 'Live mandi feed unavailable; showing the earlier reference mandi listings. Configure DATA_GOV_IN_API_KEY or MANDI_FEED_URL for current prices.');
    setIsMarketLoading(false);
  }, [marketData, user?.id, selectedFarmId, selectedCropCycleId]);

  // Rotating commodity index that shifts every 10 seconds across all commodities
  const [rotatingIndex, setRotatingIndex] = useState(0);

  useEffect(() => {
    if (!marketData || marketData.length === 0) return;
    const interval = setInterval(() => {
      setRotatingIndex((prev) => (prev + 1) % marketData.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [marketData]);

  // Current Rotating Highlight Commodity for Top Pill & Tickers
  const rotatingMarketItem = useMemo<MarketPrice | null>(() => {
    if (!marketData || marketData.length === 0) return null;
    return marketData[rotatingIndex % marketData.length] || marketData[0];
  }, [marketData, rotatingIndex]);

  // Market values remain exactly as returned by the API/cache; no client-side random mutation.

  // Top Arbitrage Spread Commodity (Balanced by percentage & opportunity)
  const activeArbitrageTopSpread = useMemo(() => {
    if (!marketData || marketData.length === 0) return null;
    return [...marketData].sort((a, b) => {
      const spreadPctA = (a.arbitrageSpread || 0) / (a.modalPrice || 1);
      const spreadPctB = (b.arbitrageSpread || 0) / (b.modalPrice || 1);
      return spreadPctB - spreadPctA;
    })[0] || null;
  }, [marketData]);

  // Farm-scoped weather is authoritative whenever a farm is selected.
  useEffect(() => {
    if (!selectedFarm) return;
    if (typeof selectedFarm.latitude === 'number' && typeof selectedFarm.longitude === 'number') {
      void fetchWeatherByCoords(selectedFarm.latitude, selectedFarm.longitude, `${selectedFarm.village || selectedFarm.name}${selectedFarm.district ? `, ${selectedFarm.district}` : ''}`);
      return;
    }
    const place = [selectedFarm.village, selectedFarm.district, selectedFarm.state].filter(Boolean).join(', ');
    if (place) void fetchWeather(place);
  }, [selectedFarm?.id, selectedFarm?.latitude, selectedFarm?.longitude, selectedFarm?.village, selectedFarm?.district, selectedFarm?.state, fetchWeather, fetchWeatherByCoords]);

  // Auto-prompt GPS on app mount once with non-blocking fallback
  useEffect(() => {
    if (!selectedFarm && !hasAutoPromptedGpsRef.current) {
      hasAutoPromptedGpsRef.current = true;
      syncDeviceGPS(true);
    }
  }, [syncDeviceGPS, selectedFarm]);

  // Auto-refresh market telemetry every 5 minutes
  useEffect(() => {
    refreshMarketData();
    const interval = setInterval(() => {
      refreshMarketData();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshMarketData]);

  // Keep weather-driven simulators current while the app remains open. The
  // selected-farm effect performs the immediate fetch; this interval handles
  // changed conditions during a long dashboard or simulator session.
  useEffect(() => {
    const interval = setInterval(() => {
      void refreshWeather();
    }, WEATHER_TTL_MS);
    return () => clearInterval(interval);
  }, [refreshWeather]);

  return (
    <TelemetryContext.Provider
      value={{
        weatherData,
        isWeatherLoading,
        weatherError,
        gpsNotice,
        setGpsNotice,
        fetchWeather,
        syncDeviceGPS,
        refreshWeather,
        sprayStatusForNow,
        outbreakData,
        marketData,
        isMarketLoading,
        lastMarketUpdate,
        refreshMarketData,
        activeArbitrageTopSpread,
        rotatingMarketItem,
        isMarketOpen,
        marketStatusText,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
}
