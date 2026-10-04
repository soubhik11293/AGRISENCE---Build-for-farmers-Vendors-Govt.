import type { MarketPrice } from '@/src/types';

export interface MarketWatchRecommendation {
  quote: MarketPrice;
  score: number;
  label: 'Best buy watch' | 'Watch' | 'Avoid';
  reasons: string[];
}

function volumeValue(value?: string) {
  if (!value) return 0;
  const parsed = Number(value.replace(/,/g, '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function quoteKey(quote: MarketPrice) {
  return `${quote.commodity.toLowerCase()}|${quote.market.toLowerCase()}|${quote.state.toLowerCase()}`;
}

/**
 * Operational buying watchlist, not a promise of financial return. It ranks
 * observed mandi quotes by relative entry price, cross-mandi spread, recent
 * observed movement, and arrival liquidity.
 */
export function rankMarketWatch(quotes: MarketPrice[], limit = 8): MarketWatchRecommendation[] {
  if (quotes.length === 0) return [];
  const maxVolume = Math.max(...quotes.map((quote) => volumeValue(quote.arrivalVolume)), 1);
  const ranked = quotes.map((quote) => {
    const range = Math.max(1, quote.maxPrice - quote.minPrice);
    const lowerInDayRange = Math.max(0, Math.min(1, (quote.maxPrice - quote.modalPrice) / range));
    const spreadSignal = Math.max(0, Math.min(1, (quote.arbitrageSpread || 0) / Math.max(quote.modalPrice, 1) / 0.1));
    const changePercent = quote.changePercent ?? 0;
    const trendSignal = changePercent <= 0 ? 1 : Math.max(0, 1 - changePercent / 10);
    const liquiditySignal = Math.min(1, volumeValue(quote.arrivalVolume) / maxVolume);
    const score = Math.round(lowerInDayRange * 40 + spreadSignal * 30 + trendSignal * 20 + liquiditySignal * 10);
    const reasons: string[] = [];
    if (lowerInDayRange >= 0.55) reasons.push('modal quote is toward the lower end of today’s observed range');
    if ((quote.arbitrageSpread || 0) > 0) reasons.push(`₹${(quote.arbitrageSpread || 0).toLocaleString('en-IN')}/qtl cross-mandi spread is visible`);
    if (changePercent <= 0) reasons.push('recent observed movement is flat or lower');
    if (liquiditySignal >= 0.5) reasons.push('arrival volume supports a more liquid mandi entry');
    return {
      quote,
      score,
      label: (score >= 65 ? 'Best buy watch' : score >= 45 ? 'Watch' : 'Avoid') as MarketWatchRecommendation['label'],
      reasons: reasons.slice(0, 3),
    };
  });
  return ranked.sort((a, b) => b.score - a.score || quoteKey(a.quote).localeCompare(quoteKey(b.quote))).slice(0, limit);
}

export function rankMarketAvoid(quotes: MarketPrice[], limit = 6) {
  const ranked = rankMarketWatch(quotes, quotes.length);
  return ranked.filter((item) => item.label === 'Avoid').sort((a, b) => a.score - b.score).slice(0, limit);
}
