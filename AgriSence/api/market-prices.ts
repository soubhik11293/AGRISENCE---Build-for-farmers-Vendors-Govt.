import type { Request, Response } from 'express';
import { fetchLiveMandiPrices, MarketFeedError } from '../server/market-service.js';

export default async function handler(_req: Request, res: Response) {
  if (_req.method !== 'GET') return res.setHeader('Allow', 'GET').status(405).json({ error: 'Method not allowed.' });
  res.setHeader('Cache-Control', 'no-store');
  try {
    const result = await fetchLiveMandiPrices();
    return res.json({ success: true, timestamp: Date.now(), sourceType: 'live-mandi-feed', ...result });
  } catch (error) {
    return res.status(503).json({ success: false, sourceType: 'live-mandi-feed',
      error: error instanceof MarketFeedError ? error.message : 'Live mandi feed unavailable.',
      code: error instanceof MarketFeedError ? error.code : 'FEED_UNAVAILABLE' });
  }
}
