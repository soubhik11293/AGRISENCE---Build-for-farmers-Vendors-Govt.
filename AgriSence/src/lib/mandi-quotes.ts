import type { MarketPrice } from '../types/index';

export const QUOTE_MAX_AGE_DAYS = 3;
export const normalizeMarketText = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

/** Same product, grade, unit AND reporting date; different commodities are not arbitrage. */
export function comparableQuoteKey(quote: MarketPrice) {
  return [quote.commodity, quote.variety, quote.grade || '', quote.unit || '', quote.arrivalDate || ''].map(normalizeMarketText).join('|');
}

export function quoteAgeDays(quote: MarketPrice, now = Date.now()) {
  if (!quote.arrivalDate) return Infinity;
  const date = Date.parse(quote.arrivalDate);
  if (!Number.isFinite(date)) return Infinity;
  // A reporting day is interpreted in IST, rather than the browser's timezone.
  const today = new Date(now + 330 * 60_000).toISOString().slice(0, 10);
  return Math.floor((Date.parse(today) - date) / 86_400_000);
}

export function isFreshQuote(quote: MarketPrice, now = Date.now()) {
  const age = quoteAgeDays(quote, now);
  return age >= 0 && age <= QUOTE_MAX_AGE_DAYS;
}

export function isSourcedQuote(value: unknown): value is MarketPrice {
  if (!value || typeof value !== 'object') return false;
  const q = value as MarketPrice;
  return [q.id, q.commodity, q.market, q.state, q.variety, q.source, q.observedAt, q.arrivalDate].every((v) => typeof v === 'string' && Boolean(v)) &&
    q.unit === 'quintal' && Number.isFinite(q.modalPrice) && q.modalPrice > 0 &&
    Number.isFinite(q.minPrice) && q.minPrice > 0 && Number.isFinite(q.maxPrice) &&
    q.minPrice <= q.modalPrice && q.modalPrice <= q.maxPrice && Number.isFinite(Date.parse(q.arrivalDate!));
}

export function withComparableSpreads(quotes: MarketPrice[]): MarketPrice[] {
  const groups = new Map<string, MarketPrice[]>();
  for (const quote of quotes) {
    const key = comparableQuoteKey(quote);
    groups.set(key, [...(groups.get(key) || []), quote]);
  }
  return quotes.map((quote) => {
    const peers = groups.get(comparableQuoteKey(quote))!;
    const highest = peers.reduce((best, row) => row.modalPrice > best.modalPrice ? row : best);
    return { ...quote, comparisonCount: peers.length, highestMandi: peers.length > 1 ? `${highest.market}, ${highest.state}` : undefined,
      highestMandiPrice: peers.length > 1 ? highest.modalPrice : undefined,
      arbitrageSpread: peers.length > 1 ? highest.modalPrice - quote.modalPrice : undefined };
  });
}

export function mergeObservedHistory(current: MarketPrice[], previous: MarketPrice[]): MarketPrice[] {
  const byId = new Map(previous.map((q) => [q.id, q]));
  return current.map((quote) => {
    const old = byId.get(quote.id);
    const points = new Map<number, NonNullable<MarketPrice['history']>[number]>();
    // Different feeds may have different units/reporting semantics; do not merge them.
    if (old && old.source === quote.source) old.history?.forEach((p) => points.set(p.timestamp, p));
    quote.history?.forEach((p) => points.set(p.timestamp, p));
    const history = Array.from(points.values()).sort((a, b) => a.timestamp - b.timestamp).slice(-90);
    const previousDay = history.at(-2);
    const changePercent = previousDay ? Number(((quote.modalPrice / previousDay.modalPrice - 1) * 100).toFixed(2)) : null;
    return { ...quote, history, changePercent };
  });
}
