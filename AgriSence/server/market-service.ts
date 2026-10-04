import { createHash } from 'node:crypto';
import type { MarketPrice, PriceHistoryPoint } from '../src/types/index.js';
import { withComparableSpreads } from '../src/lib/mandi-quotes.js';

type Row = Record<string, unknown>;
export const MARKET_CACHE_MS = 5 * 60_000;
const MAX_ROWS = 10_000;
const MAX_BYTES = 8 * 1024 * 1024;
const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';

export class MarketFeedError extends Error {
  constructor(message: string, public code = 'FEED_UNAVAILABLE') { super(message); }
}

function field(row: Row, ...keys: string[]) {
  const normalize = (key: string) => key.toLowerCase().replace(/x0020/g, '').replace(/[^a-z0-9]/g, '');
  const entries = new Map(Object.entries(row).map(([key, value]) => [normalize(key), value]));
  for (const key of keys) {
    const value = entries.get(normalize(key));
    if (value != null && String(value).trim()) return String(value).trim().slice(0, 200);
  }
  return '';
}

function positiveNumber(value: string) {
  if (!value || !/^[\d,.]+$/.test(value)) return NaN;
  const number = Number(value.replace(/,/g, ''));
  return Number.isFinite(number) && number > 0 ? number : NaN;
}

export function parseReportingDate(raw: string): string | null {
  // Agmarknet uses DD/MM/YYYY. Never reinterpret invalid/missing dates as today.
  const dmy = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(raw);
  const iso = dmy ? `${dmy[3]}-${dmy[2]}-${dmy[1]}` : /^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/.test(raw) ? raw.slice(0, 10) : '';
  const ms = Date.parse(iso);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === iso ? iso : null;
}

function categoryFor(name: string) {
  if (/wheat|paddy|rice|maize|corn|bajra|barley|millet|jowar|ragi|oat/i.test(name)) return 'Cereals & Millets';
  if (/gram|chana|lentil|masur|moong|mung|urad|pea|pulses|\btur\b|arhar|rajma/i.test(name)) return 'Pulses';
  if (/soy|groundnut|mustard|sesame|sunflower|safflower|castor|linseed/i.test(name)) return 'Oilseeds';
  if (/tomato|onion|potato|cabbage|cauliflower|brinjal|okra|vegetable/i.test(name)) return 'Vegetables';
  if (/apple|banana|mango|orange|grape|pomegranate|fruit/i.test(name)) return 'Fruits';
  return 'Other commodities';
}

export function normalizeMandiPayload(payload: unknown, source: string, sourceUrl: string, observedAt = new Date().toISOString()) {
  const object = payload as Row | null;
  const rows = Array.isArray(payload) ? payload : object && ['records', 'data', 'prices', 'results'].map((key) => object[key]).find(Array.isArray);
  if (!Array.isArray(rows)) throw new MarketFeedError('Mandi source returned an unsupported response.', 'INVALID_FEED');
  const grouped = new Map<string, { quote: MarketPrice; points: Map<number, PriceHistoryPoint> }>();
  const today = new Date(Date.parse(observedAt) + 330 * 60_000).toISOString().slice(0, 10);
  let rejectedRows = 0;
  for (const row of rows.slice(0, MAX_ROWS)) {
    if (!row || typeof row !== 'object') { rejectedRows++; continue; }
    const commodity = field(row, 'commodity', 'commodity_name');
    const market = field(row, 'market', 'apmc', 'mandi');
    const variety = field(row, 'variety') || 'Not specified';
    const grade = field(row, 'grade') || 'Not specified';
    const district = field(row, 'district');
    const state = field(row, 'state');
    const arrivalDate = parseReportingDate(field(row, 'arrival_date', 'date', 'trn_date', 'updated_at'));
    const unit = field(row, 'unit', 'price_unit').toLowerCase();
    const minPrice = positiveNumber(field(row, 'min_price', 'minrate'));
    const maxPrice = positiveNumber(field(row, 'max_price', 'maxrate'));
    const modalPrice = positiveNumber(field(row, 'modal_price', 'modelprice'));
    // Agmarknet prices are INR/quintal. Reject explicitly incompatible units.
    if (!commodity || !market || !state || !arrivalDate || arrivalDate > today ||
        (unit && !['quintal', 'quintals', 'qtl', 'rs/quintal', 'inr/quintal', '₹/quintal', '₹/qtl', 'inr/qtl', 'rs/qtl'].includes(unit)) ||
        ![minPrice, maxPrice, modalPrice].every(Number.isFinite) || minPrice > modalPrice || modalPrice > maxPrice) {
      rejectedRows++; continue;
    }
    const identity = [source, state, district, market, commodity, variety, grade].map((s) => s.toLowerCase()).join('|');
    const id = createHash('sha256').update(identity).digest('hex').slice(0, 24);
    const point = { date: arrivalDate, timestamp: Date.parse(arrivalDate), minPrice, maxPrice, modalPrice, arrivalVolume: 0 };
    const quote: MarketPrice = { id, commodity, variety, grade, market, district, state, minPrice, maxPrice, modalPrice,
      changePercent: null, category: categoryFor(commodity), unit: 'quintal', arrivalDate,
      updatedAt: arrivalDate, observedAt, source, sourceUrl };
    const existing = grouped.get(id);
    if (!existing) grouped.set(id, { quote, points: new Map([[point.timestamp, point]]) });
    else {
      existing.points.set(point.timestamp, point);
      if (arrivalDate >= existing.quote.arrivalDate!) existing.quote = quote;
    }
  }
  const prices = withComparableSpreads(Array.from(grouped.values()).map(({ quote, points }) => {
    const history = Array.from(points.values()).sort((a, b) => a.timestamp - b.timestamp).slice(-90);
    const previous = history.at(-2);
    return { ...quote, history, changePercent: previous ? Number(((quote.modalPrice / previous.modalPrice - 1) * 100).toFixed(2)) : null };
  })).sort((a, b) => b.arrivalDate!.localeCompare(a.arrivalDate!) || a.commodity.localeCompare(b.commodity));
  if (!prices.length) throw new MarketFeedError('The mandi source returned no valid dated INR/quintal quotes.', 'EMPTY_FEED');
  return { prices, rejectedRows, truncated: rows.length > MAX_ROWS, fetchedRecords: rows.length };
}

async function fetchJson(url: string, headers: Record<string, string>) {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new MarketFeedError(`Mandi source returned HTTP ${response.status}.`);
    if (Number(response.headers.get('content-length')) > MAX_BYTES) throw new MarketFeedError('Mandi response exceeds the size limit.');
    const reader = response.body!.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES) { await reader.cancel(); throw new MarketFeedError('Mandi response exceeds the size limit.'); }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    if (error instanceof MarketFeedError) throw error;
    // Do not expose a token-bearing feed URL in a fetch/JSON error.
    throw new MarketFeedError('Could not reach or parse the live mandi provider. Retry shortly.');
  }
}

async function fetchProvider() {
  const custom = process.env.MANDI_FEED_URL?.trim();
  const key = process.env.DATA_GOV_IN_API_KEY?.trim();
  if (!custom && !key) throw new MarketFeedError('Set DATA_GOV_IN_API_KEY or MANDI_FEED_URL on the server to load mandi prices.', 'FEED_NOT_CONFIGURED');
  const source = custom ? process.env.MANDI_FEED_SOURCE_NAME || 'External mandi feed' : 'AGMARKNET / data.gov.in';
  const url = new URL(custom || `https://api.data.gov.in/resource/${process.env.DATA_GOV_IN_RESOURCE_ID || RESOURCE_ID}`);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname))) throw new MarketFeedError('Mandi feed must use HTTPS.', 'INVALID_CONFIGURATION');
  const sourceUrl = custom ? url.origin : `https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (custom && process.env.MANDI_FEED_API_KEY) headers.Authorization = `Bearer ${process.env.MANDI_FEED_API_KEY}`;
  if (!custom) {
    url.searchParams.set('api-key', key!);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', String(MAX_ROWS));
    url.searchParams.set('offset', '0');
  }
  const payload = await fetchJson(url.toString(), headers);
  const observedAt = new Date().toISOString();
  const normalized = normalizeMandiPayload(payload, source, sourceUrl, observedAt);
  return { ...normalized, source, sourceUrl, observedAt,
    truncated: normalized.truncated || Number(payload.total) > normalized.fetchedRecords };
}

let cache: Awaited<ReturnType<typeof fetchProvider>> | null = null;
let pending: Promise<Awaited<ReturnType<typeof fetchProvider>>> | null = null;
let retryAfter = 0;
let lastError: MarketFeedError | null = null;

export async function fetchLiveMandiPrices() {
  if (cache && Date.now() - Date.parse(cache.observedAt) < MARKET_CACHE_MS) return { ...cache, stale: false };
  try {
    if (Date.now() < retryAfter && lastError) throw lastError;
    if (!pending) pending = fetchProvider().then((data) => { cache = data; lastError = null; return data; }).catch((error) => {
      lastError = error instanceof MarketFeedError ? error : new MarketFeedError('Mandi source configuration is invalid.');
      retryAfter = Date.now() + 30_000;
      throw lastError;
    }).finally(() => { pending = null; });
    return { ...await pending, stale: false };
  } catch (error) {
    if (cache) return { ...cache, stale: true, warning: 'Refresh failed. Showing the last successful provider response.' };
    throw error;
  }
}
