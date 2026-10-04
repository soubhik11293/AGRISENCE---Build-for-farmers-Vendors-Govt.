import type { Request, Response } from 'express';

const buckets = new Map<string, { count: number; resetAt: number }>();

function address(req: Request) {
  const forwarded = req.headers['x-forwarded-for'];
  return (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.ip || req.socket.remoteAddress || 'unknown').trim();
}

export function enforceRateLimit(req: Request, res: Response, namespace: string, limit: number, windowMs = 60_000) {
  const now = Date.now();
  if (buckets.size > 10_000) for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  const key = `${namespace}:${address(req)}`;
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  if (bucket.count <= limit) return true;
  res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
  res.status(429).json({ error: 'Too many requests. Please try again shortly.', code: 'RATE_LIMITED' });
  return false;
}
